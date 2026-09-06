# edgechat-pilot

RandallFlare **pilot only** for task `T-20260906-01`. This is not the full Edgechat chat app.

The worker name / slug is `edgechat-pilot`. Full Edgechat remains on HOLD. Do not migrate `worker/` here. Do not deploy this with official Cloudflare `wrangler`. Do not touch helloworld, gomoku, T-16, T-18, or other live sites. Telegram is out of scope. The repo `LICENSE` (GPL-3.0-or-later) stays as-is.

## What it is

A single Worker that:

1. Serves `public/index.html` from the Worker (no Pages, no CF `[assets]`).
2. Upgrades `GET /ws` to a WebSocket on one SQLite Durable Object class, `EchoRoom`, bound as `ECHO_ROOM`.
3. Probes D1 on `GET /api/health` and `GET /api/d1` (`SELECT 1`).
4. Probes R2 on `GET /api/r2` (`put` then `get` key `pilot/probe.txt`). Unbound `FILES` returns **503** and never a fake 200.

The browser page opens `/ws`, keeps the socket, echoes, shows a ≥30s hold timer, logs RTT (including p95), and hits `/api/health`.

## Endpoints

| Method | Path | Success | Failure |
| --- | --- | --- | --- |
| `GET` | `/` or `/index.html` | 200 HTML echo page | — |
| `GET` | `/api/health` | 200 JSON `{ ok: true, service, d1 }` | Worker crash only. Unbound DB still 200 with `d1.ok=false`. |
| `GET` | `/api/d1` | 200 JSON `{ ok: true, result: 1 }` when `DB` is bound and `SELECT 1` works | 503 if `DB` is missing or the query fails |
| `GET` | `/api/r2` | 200 JSON `{ ok: true, key, bytes }` after put+get of `pilot/probe.txt` | **503** if `FILES` is unbound or put/get fails. Never fake success. |
| `GET` | `/ws` | 101 WebSocket via `EchoRoom` | 503 if `ECHO_ROOM` is unbound; 426 if the request is not a WebSocket upgrade |

`/api/health` always runs `SELECT 1` when `DB` is bound.

## WebSocket echo

Connect to `ws(s)://<host>/ws`. First frame:

```json
{
  "type": "ready",
  "service": "edgechat-pilot",
  "hibernationUsed": true,
  "hibernationVerified": false
}
```

Send either:

```json
{ "type": "ping", "id": "p1", "clientSentAt": 1710000000000 }
```

or

```json
{ "type": "echo", "id": "e1", "payload": "hello", "clientSentAt": 1710000000000 }
```

or raw text. JSON ping/echo come back as `pong` / `echo` with `serverReceivedAt`. RTT on the client is `Date.now() - clientSentAt`.

## Hibernation result (not verified)

The Durable Object **prefers** the hibernation API when it exists:

- `state.acceptWebSocket(server)`
- `webSocketMessage` / `webSocketClose` / `webSocketError`
- restore via `state.getWebSockets()`

If `state.acceptWebSocket` is missing, it uses a **normal** Durable Object WebSocket (`server.accept()` + event listeners).

**Hibernation was not verified** on RandallFlare in this repository. Reasons:

- `@bigrandall/rrangler@0.4.0` `dev` only embeds the Worker modules. It does not attach D1, R2, or Durable Object bindings, so local workerd cannot prove hibernation.
- This change was not exercised against a live RF DO hibernation runtime from this tree.
- Research for T-20260906-01 already marked RF hibernation compatibility as UNKNOWN.

Do **not** treat hibernation as proven. The `ready` frame always sets `hibernationVerified: false`. `hibernationUsed` only means “this process called `acceptWebSocket`”. After a live RF deploy, read that frame and runtime logs; if the socket dies on idle or `acceptWebSocket` is missing, this is still a normal DO WebSocket.

## Deploy with rrangler (DevOps)

Official `wrangler` talking to Cloudflare is forbidden for this pilot. Use `@bigrandall/rrangler` only.

```bash
# once per machine
npm i -g @bigrandall/rrangler@0.4.0
# or: npx --yes @bigrandall/rrangler@0.4.0 …
rrangler login --token rft_xxx
# if the API base is not the default:
# export RRANGLER_API=https://bigrandall.io

cd pilot
```

`rrangler@0.4.0 deploy` uploads `name` / `main` / `files` only. It does **not** create D1, R2, or Durable Object bindings from JSON. Bindings in `rrangler.json` are the contract DevOps must attach on RandallFlare (console or edge API). `rrangler types` reads live `d1Bindings` / `r2Bindings` / `doBindings`.

Suggested resource names (change only if already taken; keep **binding** names):

| Binding | Class / resource | Suggested RF name |
| --- | --- | --- |
| Worker slug | — | `edgechat-pilot` |
| `DB` | D1 | `edgechat-pilot-db` |
| `FILES` | R2 | `edgechat-pilot-files` |
| `ECHO_ROOM` | Durable Object class `EchoRoom`, SQLite | migration tag `v1` → `new_sqlite_classes: ["EchoRoom"]` |

```bash
# 1. Create the empty worker slug in /me/edge if it does not exist.

# 2. Create storage (idempotent if you already have them)
npm run d1:create
npm run r2:create

# 3. Bind on the worker (RF console / API). rrangler 0.4.0 has no `do` subcommand.
#    DB          → D1  edgechat-pilot-db
#    FILES       → R2  edgechat-pilot-files
#    ECHO_ROOM   → class EchoRoom (SQLite / sqlite migration tag v1)

# 4. Apply the one D1 migration
npm run d1:apply
# same as: rrangler d1 migrations apply edgechat-pilot-db --dir migrations

# 5. Deploy worker modules (from this directory so rrangler.json is found)
npm run deploy
# same as: rrangler deploy
```

`package.json` scripts call `npx --yes @bigrandall/rrangler@0.4.0 …`. There is no Cloudflare wrangler deploy script in `pilot/`.

After deploy, `rrangler worker get edgechat-pilot` (or the deploy output) is the only source for the public URL. Do not invent `*.workers.dev`. Hostname shape used by other RF workers has been `https://<slug>-randall.edge.bigrandall.io/`; confirm from CLI before publishing it.

`rrangler@0.4.0` flattens `files` to basenames. Keep each module’s import as `./echo-room.js` (same directory locally, same basename after upload).

### Local `rrangler dev`

```bash
npm run dev
```

This is Worker-only on workerd. Bindings are not injected. `/` and `/api/health` work; `/api/d1`, `/api/r2`, and `/ws` return 503 unless you mock bindings. It does **not** replace a live RF check.

### Rollback

Unpublish or delete **only** slug `edgechat-pilot`. Do not change helloworld, gomoku, docs, or any other site.

## Measure WebSocket p95

1. Open the deployed origin in a browser (same region as the worker if you can).
2. Leave the page open at least 30 seconds. The hold pill turns green when the socket has stayed up ≥30s.
3. The page pings once a second and logs:

   `[edgechat-pilot] rtt=<ms> kind=pong id=… p95=<ms> n=…`

4. After 30s it also logs `held>=30s` with the current p95.
5. Same-region gate from the frozen contract: echo RTT **p95 < 500ms**.

To compute p95 from a log dump: collect the `rtt=` integers, sort, take `sorted[ceil(n * 0.95) - 1]`.

```bash
# HTTP probes (replace URL with the CLI hostname)
curl -sS -D- "$URL/api/health"
curl -sS -D- "$URL/api/d1"
curl -sS -D- "$URL/api/r2"
```

- D1: 200 when `DB` is bound.
- R2: 200 when `FILES` is bound; 503 when not.
- `/` and `/api/health`: 200.

## Tests

From this directory or the repo root (`node --test` picks these files up):

```bash
cd pilot && npm test
# or from repo root: node --test pilot/test/*.test.js
npm run preview   # local HTTP + WS fakes on :8788 — not RF, not wrangler
```

Coverage is local only: health/D1/R2 handlers with memory fakes, echo protocol, hibernation feature-detect vs normal `accept()`, and the rrangler contract. There is no live RF in these tests.

## Layout

```
pilot/
  rrangler.json          # slug, files, DB, FILES, ECHO_ROOM, sqlite migration tag
  package.json           # rrangler scripts only
  migrations/0001_pilot_probe.sql
  public/index.html      # source of the Worker-served page
  src/index.js           # default fetch + export { EchoRoom }
  src/echo-room.js
  src/handlers.js
  test/
```

## Out of scope

- Full Edgechat worker, Vue app, KV `SESSIONS`, cron, Android, WebMCP
- Telegram bridge
- Official wrangler → Cloudflare
- Changing other RandallFlare sites
