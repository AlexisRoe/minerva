import sentry_sdk

from worker_core.config import WorkerSettings


def configure_sentry(settings: WorkerSettings) -> None:
    """Initializes Sentry when a DSN is configured; a silent no-op otherwise."""
    if not settings.sentry_dsn:
        return
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        send_default_pii=False,
    )
