from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class WorkerSettings(BaseSettings):
    """Validated worker configuration; every value can be overridden via environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    valkey_url: str = "redis://localhost:6379/0"
    event_stream: str = "minerva:events"
    event_dlq_stream: str = "minerva:events:dlq"
    consumer_group: str
    consumer_name: str = "consumer-1"
    max_retries: int = 3
    block_ms: int = 5000
    batch_size: int = 10
    sentry_dsn: str | None = Field(default=None, validation_alias="WORKER_SENTRY_DSN")
    environment: str = Field(default="development", validation_alias="NODE_ENV")
