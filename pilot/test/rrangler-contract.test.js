import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const repoRoot = new URL("../../", import.meta.url);

function read(rel) {
	return readFileSync(new URL(rel, root), "utf8");
}

test("rrangler.json names the pilot worker and SQLite EchoRoom binding", () => {
	const cfg = JSON.parse(read("rrangler.json"));
	assert.equal(cfg.name, "edgechat-pilot");
	assert.equal(cfg.main, "src/index.js");
	assert.equal(cfg.d1_databases[0].binding, "DB");
	assert.equal(cfg.r2_buckets[0].binding, "FILES");
	assert.equal(cfg.durable_objects.bindings[0].name, "ECHO_ROOM");
	assert.equal(cfg.durable_objects.bindings[0].class_name, "EchoRoom");
	assert.equal(cfg.migrations[0].tag, "v1");
	assert.deepEqual(cfg.migrations[0].new_sqlite_classes, ["EchoRoom"]);
	assert.ok(cfg.files.includes("src/index.js"));
	assert.ok(cfg.files.includes("src/echo-room.js"));
});

test("worker entry exports EchoRoom", () => {
	const entry = read("src/index.js");
	assert.match(entry, /export \{ EchoRoom \}/);
	assert.match(entry, /from "\.\/echo-room\.js"/);
});

test("pilot deploy scripts use rrangler, not official wrangler", () => {
	const pkg = JSON.parse(read("package.json"));
	for (const [name, script] of Object.entries(pkg.scripts)) {
		assert.match(script, /rrangler|node --test/, `${name} should be rrangler or local tests`);
		assert.doesNotMatch(script, /(?<!r)wrangler/, `${name} must not call official wrangler`);
	}
	assert.equal(pkg.scripts.deploy, "npx --yes @bigrandall/rrangler@0.4.0 deploy");
});

test("D1 migration creates the probe table", () => {
	const sql = read("migrations/0001_pilot_probe.sql");
	assert.match(sql, /CREATE TABLE IF NOT EXISTS pilot_probe/);
	assert.match(sql, /id INTEGER PRIMARY KEY/);
});

test("pilot tree does not implement Telegram or delete the repo GPL license", () => {
	const files = [
		"src/index.js",
		"src/echo-room.js",
		"src/handlers.js",
		"src/echo-protocol.js",
		"package.json",
	];
	for (const file of files) {
		assert.doesNotMatch(read(file), /telegram/i, file);
	}
	const license = readFileSync(new URL("LICENSE", repoRoot), "utf8");
	assert.match(license, /GNU GENERAL PUBLIC LICENSE/);
});

test("full Edgechat deploy path is unchanged (pilot only)", () => {
	const rootPkg = JSON.parse(readFileSync(new URL("package.json", repoRoot), "utf8"));
	assert.equal(rootPkg.scripts.deploy, "npm run build && wrangler deploy");
	assert.equal(rootPkg.scripts["d1:apply"], "wrangler d1 execute cfchat-db --file ./worker/schema.sql");
});
