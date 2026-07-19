import json
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any, cast

import structlog
from redis import Redis
from redis.exceptions import ResponseError

Handler = Callable[["Event"], None]

# redis-py types most command results as loose unions; these reflect the actual sync-client shapes.
RawFields = dict[bytes | str, bytes | str]
RawEntry = tuple[bytes | str, RawFields]


@dataclass(frozen=True)
class Event:
    """A single entry consumed from the event stream."""

    id: str
    payload: dict[str, Any] = field(default_factory=dict)


class StreamConsumer:
    """Redis-Streams consumer-group loop: read → handle → ack, with bounded retries and a dead-letter stream.

    Messages that were delivered but never acknowledged (e.g. a crashed worker) are
    reclaimed on startup via XAUTOCLAIM, so nothing is silently lost.
    """

    def __init__(
        self,
        client: Redis,
        *,
        stream: str,
        dlq_stream: str,
        group: str,
        consumer: str,
        handler: Handler,
        logger: structlog.stdlib.BoundLogger,
        max_retries: int = 3,
        block_ms: int = 5000,
        batch_size: int = 10,
        retry_backoff_seconds: float = 0.5,
    ) -> None:
        self._client = client
        self._stream = stream
        self._dlq_stream = dlq_stream
        self._group = group
        self._consumer = consumer
        self._handler = handler
        self._logger = logger
        self._max_retries = max_retries
        self._block_ms = block_ms
        self._batch_size = batch_size
        self._retry_backoff_seconds = retry_backoff_seconds
        self._running = False

    def stop(self) -> None:
        self._running = False

    def run(self) -> None:
        self._ensure_group()
        self._reclaim_pending()
        self._running = True
        self._logger.info("consumer started", stream=self._stream, group=self._group)
        while self._running:
            self._consume_batch()
        self._logger.info("consumer stopped")

    def _ensure_group(self) -> None:
        try:
            self._client.xgroup_create(self._stream, self._group, id="0", mkstream=True)
        except ResponseError as error:
            if "BUSYGROUP" not in str(error):
                raise

    def _reclaim_pending(self) -> None:
        """Claims messages left pending by dead consumers of this group and processes them."""
        response = cast(
            tuple[bytes | str, list[RawEntry], list[bytes | str]],
            self._client.xautoclaim(self._stream, self._group, self._consumer, min_idle_time=0, start_id="0"),
        )
        for entry_id, fields in response[1]:
            self._process(self._to_event(entry_id, fields))

    def _consume_batch(self) -> None:
        response = cast(
            list[tuple[bytes | str, list[RawEntry]]] | None,
            self._client.xreadgroup(
                self._group,
                self._consumer,
                {self._stream: ">"},
                count=self._batch_size,
                block=self._block_ms,
            ),
        )
        for _stream_name, entries in response or []:
            for entry_id, fields in entries:
                self._process(self._to_event(entry_id, fields))

    def _to_event(self, entry_id: bytes | str, fields: RawFields) -> Event:
        decoded_id = entry_id.decode() if isinstance(entry_id, bytes) else entry_id
        decoded = {
            (key.decode() if isinstance(key, bytes) else key): (value.decode() if isinstance(value, bytes) else value)
            for key, value in fields.items()
        }
        raw_payload = decoded.get("payload", "{}")
        try:
            payload = json.loads(raw_payload)
        except json.JSONDecodeError:
            payload = {"malformed": raw_payload}
        return Event(id=decoded_id, payload=payload if isinstance(payload, dict) else {"value": payload})

    def _process(self, event: Event) -> None:
        for attempt in range(1, self._max_retries + 1):
            try:
                self._handler(event)
                self._client.xack(self._stream, self._group, event.id)
                return
            except Exception:
                self._logger.exception("handler failed", event_id=event.id, attempt=attempt)
                if attempt < self._max_retries:
                    time.sleep(self._retry_backoff_seconds * attempt)
        self._dead_letter(event)

    def _dead_letter(self, event: Event) -> None:
        self._client.xadd(
            self._dlq_stream,
            {"payload": json.dumps(event.payload), "origin_id": event.id, "group": self._group},
        )
        self._client.xack(self._stream, self._group, event.id)
        self._logger.error("event moved to dead-letter stream", event_id=event.id, dlq=self._dlq_stream)
