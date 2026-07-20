from worker_core import WorkerApp

from email_parser.handler import handle


def main() -> None:
    WorkerApp(name="email-parser", handler=handle).run()


if __name__ == "__main__":
    main()
