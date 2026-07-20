from email_screenshot.handler import screenshot_event
from worker_core import Event


def test_screenshot_event_builds_key_from_event_id():
    event = Event(id="5-0", payload={"type": "hello", "message": "hello world", "source": "api"})

    result = screenshot_event(event)

    assert result == {"event_id": "5-0", "screenshot_key": "screenshots/5-0.png", "caption": "hello world"}


def test_screenshot_event_truncates_long_captions():
    result = screenshot_event(Event(id="6-0", payload={"message": "x" * 200}))

    assert len(result["caption"]) == 80
