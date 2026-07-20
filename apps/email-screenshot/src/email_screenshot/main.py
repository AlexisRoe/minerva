from worker_core import WorkerApp

from email_screenshot.handler import handle


def main() -> None:
    WorkerApp(name="email-screenshot", handler=handle).run()


if __name__ == "__main__":
    main()
