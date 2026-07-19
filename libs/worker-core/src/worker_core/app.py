import signal
from types import FrameType

from redis import Redis

from worker_core.config import WorkerSettings
from worker_core.consumer import Handler, StreamConsumer
from worker_core.logging import configure_logging
from worker_core.sentry import configure_sentry


class WorkerApp:
    """The shared application frame: workers differ only in name and handler.

    Owns configuration, logging, Sentry, the consumer loop and graceful shutdown.
    """

    def __init__(self, name: str, handler: Handler, settings: WorkerSettings | None = None) -> None:
        self.name = name
        self.settings = settings or WorkerSettings(consumer_group=name)
        self.logger = configure_logging(name)
        # redis-py 8 defaults socket_timeout to 5s; it must exceed the XREADGROUP block
        # window or every idle blocking read raises TimeoutError and kills the worker.
        self._client = Redis.from_url(self.settings.valkey_url, socket_timeout=self.settings.block_ms / 1000 + 5)
        self._consumer = StreamConsumer(
            self._client,
            stream=self.settings.event_stream,
            dlq_stream=self.settings.event_dlq_stream,
            group=self.settings.consumer_group,
            consumer=self.settings.consumer_name,
            handler=handler,
            logger=self.logger,
            max_retries=self.settings.max_retries,
            block_ms=self.settings.block_ms,
            batch_size=self.settings.batch_size,
        )

    def run(self) -> None:
        configure_sentry(self.settings)
        signal.signal(signal.SIGTERM, self._shutdown)
        signal.signal(signal.SIGINT, self._shutdown)
        self.logger.info("worker starting", name=self.name)
        try:
            self._consumer.run()
        finally:
            self._client.close()

    def _shutdown(self, signum: int, _frame: FrameType | None) -> None:
        self.logger.info("shutdown signal received", signal=signal.Signals(signum).name)
        self._consumer.stop()
