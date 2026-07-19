import json
from unittest.mock import MagicMock

import structlog
from worker_core.consumer import Event, StreamConsumer


def build_consumer(handler, client=None, max_retries=2):
    client = client or MagicMock()
    return (
        StreamConsumer(
            client,
            stream="s",
            dlq_stream="dlq",
            group="g",
            consumer="c",
            handler=handler,
            logger=structlog.get_logger(),
            max_retries=max_retries,
            retry_backoff_seconds=0,
        ),
        client,
    )


def test_successful_event_is_acked():
    seen: list[Event] = []
    consumer, client = build_consumer(seen.append)

    consumer._process(Event(id="1-0", payload={"type": "hello"}))

    assert [event.id for event in seen] == ["1-0"]
    client.xack.assert_called_once_with("s", "g", "1-0")
    client.xadd.assert_not_called()


def test_failing_event_is_retried_then_dead_lettered():
    calls: list[str] = []

    def failing_handler(event: Event) -> None:
        calls.append(event.id)
        raise RuntimeError("boom")

    consumer, client = build_consumer(failing_handler, max_retries=3)
    consumer._process(Event(id="2-0", payload={"type": "hello"}))

    assert calls == ["2-0", "2-0", "2-0"]
    client.xadd.assert_called_once()
    dlq_args = client.xadd.call_args.args
    assert dlq_args[0] == "dlq"
    assert json.loads(dlq_args[1]["payload"]) == {"type": "hello"}
    client.xack.assert_called_once_with("s", "g", "2-0")


def test_to_event_decodes_bytes_and_json():
    consumer, _ = build_consumer(lambda event: None)

    event = consumer._to_event(b"3-0", {b"payload": json.dumps({"type": "hello", "message": "hi"}).encode()})

    assert event.id == "3-0"
    assert event.payload == {"type": "hello", "message": "hi"}


def test_to_event_tolerates_malformed_json():
    consumer, _ = build_consumer(lambda event: None)

    event = consumer._to_event("4-0", {"payload": "not-json{"})

    assert event.payload == {"malformed": "not-json{"}
