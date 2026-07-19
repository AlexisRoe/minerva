# syntax=docker/dockerfile:1
# Build from the repository root:  docker build -f apps/email-parser/Dockerfile .

FROM ghcr.io/astral-sh/uv:python3.14-bookworm-slim AS build
WORKDIR /workspace
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
# The whole uv workspace definition is needed to resolve the lockfile; only this
# worker and its library dependency need sources.
COPY pyproject.toml uv.lock ruff.toml ./
COPY libs/worker-core libs/worker-core
COPY apps/email-parser apps/email-parser
COPY apps/email-screenshot/pyproject.toml apps/email-screenshot/pyproject.toml
RUN uv sync --frozen --no-dev --package email-parser

FROM python:3.14-slim-bookworm AS runtime
ENV PYTHONUNBUFFERED=1 PATH="/workspace/.venv/bin:$PATH"
WORKDIR /workspace
RUN groupadd --system minerva && useradd --system --gid minerva minerva
COPY --from=build --chown=minerva:minerva /workspace/.venv .venv
COPY --from=build --chown=minerva:minerva /workspace/libs/worker-core libs/worker-core
COPY --from=build --chown=minerva:minerva /workspace/apps/email-parser apps/email-parser
USER minerva
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["python", "-c", "import os, redis; redis.Redis.from_url(os.environ['VALKEY_URL']).ping()"]
CMD ["python", "-m", "email_parser"]
