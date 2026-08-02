# API collections

Request collections for the **[`@minerva/api`](../apps/backend/api) backend** — the NestJS service the
frontends talk to. They exist so you can exercise an endpoint without a UI: check a route still
answers after a refactor, reproduce a bad request, or see the exact shape a handler returns.

We use [Bruno](https://www.usebruno.com), an open-source API client. The distinguishing feature is
that collections are **plain `.bru` text files in this repository** rather than a proprietary blob
living in some account. They diff, review, and branch like any other source file, so a request
changes in the same commit as the handler it calls.

```
minerva-api/
  bruno.json                    collection manifest — makes this folder a Bruno collection
  collection.bru                settings inherited by every request (auth mode, Accept header)
  environments/
    local.bru                   baseUrl for a locally running api
  health/
    get-health.bru              GET  /health
  jobs/
    create-parse-job.bru        POST /jobs — kind: parse
    create-screenshot-job.bru   POST /jobs — kind: screenshot
    create-job-invalid-kind.bru POST /jobs — rejected, expects 400
```

Each request carries a `docs` block explaining what it covers and why. Read those rather than
duplicating the detail here.

## Using it in VS Code

Install the official **[Bruno extension](https://marketplace.visualstudio.com/items?itemName=bruno-api-client.bruno)**
(`bruno-api-client.bruno`) — it is in this repo's
[recommended extensions](../.vscode/extensions.json), so VS Code offers it on first open. It runs
requests in an editor tab, next to the controller you are working on.

1. Start the API — `make dev` from the repo root, or `pnpm --filter @minerva/api start:dev`.
2. Open the Bruno panel; it picks up `minerva-api/` automatically.
3. **Select the `local` environment.** `{{baseUrl}}` is undefined without it and requests fail on a
   malformed URL.
4. Open a request and send it.

The [desktop app](https://www.usebruno.com/downloads) works the same way — *Open Collection* →
point it at `bruno/minerva-api`.

## Using it from the terminal

The CLI runs a whole folder and reports pass/fail, which is what makes these collections useful in
CI later. No install needed:

```sh
cd bruno/minerva-api
pnpm dlx @usebruno/cli run --env local -r     # -r = recurse into subfolders
pnpm dlx @usebruno/cli run health --env local # one folder only
```

It exits non-zero if any assertion fails. Against a locally running api, the current set reports
4 requests, 8 assertions, 2 tests — all passing.

## Environments

Only `local` exists so far, pointing at `http://localhost:3000` — matching `API_PORT` in the
repo-root `.env` (see [`.env.template`](../.env.template)). Plain HTTP is deliberate: the mkcert
pair in `infra/cert/` is wired into the Vite dev servers and Storybook, not into the NestJS
bootstrap in [`apps/backend/api/src/main.ts`](../apps/backend/api/src/main.ts). If TLS is added there, switch
the variable to `https://` — Bruno trusts the certificate because mkcert installs its CA into the
system trust store.

Add further environments as `environments/<name>.bru` with the same `vars` block. **Never put a
secret in one** — these files are committed. Bruno reads a gitignored `.env` from the collection
root for that, referenced as `{{process.env.NAME}}`.

## Adding a request

Create the `.bru` file through the extension or the desktop app rather than by hand — the format is
strict about block syntax, and the editors keep `seq` numbering consistent. Then:

- Point the URL at `{{baseUrl}}`, never a hardcoded host.
- Leave `auth: inherit` so authentication can be configured once in `collection.bru` when it lands.
- Add an `assert` block. A request with no assertion passes in CI no matter what the server said.
- Fill in the `docs` block — that is where the reasoning goes.

One caveat learned the hard way: `docs` blocks are valid in requests, folders, and `collection.bru`,
but **not** in `environments/*.bru`. The CLI aborts with a parse error on the whole collection if
you add one there.

## Not covered yet

[`@minerva/queue-coordinator`](../apps/backend/queue-coordinator) (`:3001`) has its own `GET /health`,
`GET /jobs`, and `POST /jobs`. It deserves a sibling `queue-coordinator/` collection here — the
`create-parse-job` request already captures the generated job id into a `lastJobId` variable so the
two can be chained once it exists.
