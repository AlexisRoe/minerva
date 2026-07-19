import structlog
from worker_core import Event

logger = structlog.get_logger(worker="email-parser")


def parse_event(event: Event) -> dict[str, str]:
    """Hello-world handler: 'parses' the event message. Real parsing logic replaces this later."""
    message = str(event.payload.get("message", ""))
    parsed = {
        "event_id": event.id,
        "normalized_message": message.strip().lower(),
        "source": str(event.payload.get("source", "unknown")),
    }
    logger.info("email parsed", **parsed)
    return parsed


def handle(event: Event) -> None:
    parse_event(event)
