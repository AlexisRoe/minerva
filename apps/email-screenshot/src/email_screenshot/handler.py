import structlog
from worker_core import Event

logger = structlog.get_logger(worker="email-screenshot")


def screenshot_event(event: Event) -> dict[str, str]:
    """Hello-world handler: pretends to render a screenshot. Real rendering logic replaces this later."""
    message = str(event.payload.get("message", ""))
    result = {
        "event_id": event.id,
        "screenshot_key": f"screenshots/{event.id}.png",
        "caption": message[:80],
    }
    logger.info("screenshot rendered", **result)
    return result


def handle(event: Event) -> None:
    screenshot_event(event)
