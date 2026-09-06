#!/usr/bin/env node
/**
 * DevOps helper for T-20260906-01. Prints the rrangler-only provision sequence.
 * Does not talk to Cloudflare. Does not deploy unless you run the printed commands.
 */
const worker = "edgechat";
const d1 = "edgechat-db";
const kv = "edgechat-sessions";
const r2 = "edgechat-files";

const commands = [
	"# T-20260906-01 RandallFlare provision (rrangler only, no official wrangler, no RELEASE)",
	"npx @bigrandall/rrangler@0.4.0 whoami",
	`npx @bigrandall/rrangler@0.4.0 d1 create ${d1}`,
	`npx @bigrandall/rrangler@0.4.0 kv namespace create ${kv}`,
	`npx @bigrandall/rrangler@0.4.0 r2 bucket create ${r2}`,
	`npx @bigrandall/rrangler@0.4.0 d1 execute ${d1} --file ./worker/schema.sql`,
	`# Incremental upgrades (do not replay on a fresh schema.sql install):`,
	`# npx @bigrandall/rrangler@0.4.0 d1 migrations apply ${d1} --dir worker/migrations`,
	`npx @bigrandall/rrangler@0.4.0 worker env set ${worker} ADMIN_USERNAMES=admin MESSAGE_RETENTION_DAYS=7 SOFT_DELETE_RETENTION_DAYS=60 GC_BATCH_SIZE=500 GC_MAX_BATCHES_PER_RUN=20 R2_DELETE_MAX_RETRY=8 'ALLOWED_FILE_TYPES=image/,video/,audio/,application/pdf,text/' MAX_FILE_SIZE=20971520`,
	"# Bind DB / SESSIONS / FILES / CHANNEL_ROOM / USER_INBOX / SCHEDULER on the worker",
	`#   rrangler worker get ${worker}  (inspect d1Bindings / kvBindings / r2Bindings / doBindings)`,
	"#   rrangler api PATCH /api/edge/v1/workers/<id> --data '<bindings json>'",
	"# Cron 0 19 * * * UTC if the platform accepts worker crons; otherwise Scheduler DO alarm is the fallback.",
	"npm run build:rf",
	"npx @bigrandall/rrangler@0.4.0 deploy",
];

process.stdout.write(`${commands.join("\n")}\n`);
