# Edgechat on RandallFlare

Public fork of [aozorae/Edgechat](https://github.com/aozorae/Edgechat) operated by **Randall**. License remains [GPL-3.0-or-later](LICENSE).

Task: `T-20260906-01`. Acceptance: Architect + QA. No `[RELEASE]` until AC-CHAT is signed off.

## TPM locks (do not relax)

1. **Ordinary Durable Object WebSocket only.** `WebSocketPair` + `accept()`. Hibernation APIs (`acceptWebSocket`, `getWebSockets`, `serializeAttachment`) are unavailable on RandallFlare and must not be claimed.
2. **Static is Worker-embedded.** Pilot locked this path. Not RandallFlare Pages. Not Cloudflare `[assets]`. `rrangler` 0.4.0 uploads UTF-8 worker files (basenames only); the Vue SPA is compiled into `dist-rf/worker.js`.
3. **Delivery is `@bigrandall/rrangler` only.** Official Cloudflare Wrangler is not a delivery path. Do not publish this worker to Cloudflare. Do not touch T-16 / T-18 / gomoku / helloworld / multiagent.
4. **Telegram is OUT** for this slice. Invite-link registration remains; public `/register` is the AC-CHAT path.
5. **R2:** unbound or put/get mismatch → HTTP **503** with `R2 put/get mismatch`. Never HTTP 200 plus `ok: false`.

## Bindings (frozen names)

| Binding | Resource | Class / name | Purpose |
| --- | --- | --- | --- |
| `DB` | D1 | `edgechat-db` | Full `worker/schema.sql` + `worker/migrations/` |
| `SESSIONS` | KV | `edgechat-sessions` | Login sessions |
| `FILES` | R2 | `edgechat-files` | Attachments; missing binding is 503 |
| `CHANNEL_ROOM` | DO | `ChannelRoom` | Channel realtime WS |
| `USER_INBOX` | DO | `UserInbox` | DM / inbox WS |
| `SCHEDULER` | DO | `Scheduler` | Daily GC alarm fallback |

Vars whitelist (from `wrangler.example.toml`, documentation only — not a deploy file):

`ADMIN_USERNAMES`, `MESSAGE_RETENTION_DAYS`, `SOFT_DELETE_RETENTION_DAYS`, `GC_BATCH_SIZE`, `GC_MAX_BATCHES_PER_RUN`, `R2_DELETE_MAX_RETRY`, `ALLOWED_FILE_TYPES`, `MAX_FILE_SIZE`.

Optional secret: `EDGECHAT_ENCRYPTION_KEYRING`. If unset, new messages/attachments stay plaintext so AC-CHAT is not blocked.

Cron: `0 19 * * *` UTC if the platform accepts worker crons. If not, `Scheduler` sets a DO alarm (03:00 UTC). Document the chosen path when applying bindings.

## Deploy with rrangler

```bash
npm install
npx @bigrandall/rrangler@0.4.0 login --token "$RRANGLER_TOKEN"
npx @bigrandall/rrangler@0.4.0 whoami

# Print the provision sequence (create D1/KV/R2, schema, env, bind, deploy)
npm run rf:provision

# First-time D1 (full schema; do not also replay migrations on a fresh DB)
npm run d1:apply

# Incremental upgrades only
npm run d1:migrate

npm run build:rf
npm run deploy
```

`rrangler` 0.4.0 `deploy` uploads `dist-rf/worker.js` (`name` + `main` in `rrangler.json`). It does **not** apply D1/KV/R2/DO bindings from the JSON. After `rrangler worker get edgechat`, bind `DB`, `SESSIONS`, `FILES`, `CHANNEL_ROOM`, `USER_INBOX`, `SCHEDULER` on the worker (console or `rrangler api PATCH`). Set vars with `rrangler worker env set edgechat …`.

The three DO classes are exported from the worker entry: `ChannelRoom`, `UserInbox`, `Scheduler`.

Rollback: take this worker offline. Do not change other sites.

## Smoke-test AC-CHAT

After the public URL is live (DevOps writes it back to the PRD; this PR does not `[RELEASE]`):

1. Open `/` — Worker-embedded SPA, HTTP 200.
2. `GET /api/health` — `ok: true` and `hasDB` / `hasSESSIONS` / `hasCHANNEL_ROOM` / `hasUSER_INBOX` / `hasSCHEDULER` true. `hasFILES` true when R2 is bound.
3. Register at `/register` (`POST /api/auth/register` with `username`, `password` ≥ 6, optional `displayName`). First account is admin. Username: `^[A-Za-z0-9_]{2,32}$`.
4. Or login at `/login` (`POST /api/auth/login`).
5. `GET /api/bootstrap` with `Authorization: Bearer <token>` — `general` public channel is present (new users are members).
6. Open the channel (or start a DM). The client uses ordinary DO WebSockets: `/api/ws/{public|private|dm}/{id}?token=…` and `/api/inbox/ws?token=…`.
7. Send a message. The other socket (or a second browser) sees it in realtime.

Same-origin `/api/*` and `/files/*`. CORS is also enabled on `/api/*`.

## Scripts

| Script | Meaning |
| --- | --- |
| `npm test` | Unit / contract tests |
| `npm run build:rf` | Vite SPA + embed into worker + esbuild bundle |
| `npm run deploy` | `build:rf` then `rrangler deploy` |
| `npm run d1:apply` | Apply `worker/schema.sql` |
| `npm run d1:migrate` | Apply `worker/migrations` |
| `npm run rf:provision` | Print DevOps commands |

`wrangler.example.toml` is a vars/binding whitelist, not a publish config. `npm run deploy:demo` is disabled.

## Scope

IN: fork + RandallFlare worker + public chat loop + GPL kept + public copy signed Randall.

OUT: Telegram bridge, Android ship, WebMCP, official Cloudflare publish, cloning `bigrandall.io`, other live sites.

Upstream Chinese/English/Japanese marketing pages are historical. This file is the operator README for the RandallFlare fork.
