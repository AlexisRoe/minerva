from email_parser.handler import parse_event
from worker_core import Event


def test_parse_event_normalizes_message():
    event = Event(id="1-0", payload={"type": "hello", "message": "  Hello World  ", "source": "api"})

    result = parse_event(event)

    assert result == {"event_id": "1-0", "normalized_message": "hello world", "source": "api"}


def test_parse_event_handles_missing_fields():
    result = parse_event(Event(id="2-0", payload={}))

    assert result["normalized_message"] == ""
    assert result["source"] == "unknown"
