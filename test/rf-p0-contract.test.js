import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import test from "node:test";

function read(relativePath) {
	return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const channelRoom = read("../worker/src/do/ChannelRoom.js");
const userInbox = read("../worker/src/do/UserInbox.js");
const workerEntry = read("../worker/src/index.js");
const uploadSource = read("../worker/src/api/upload.js");
const packageJson = JSON.parse(read("../package.json"));
const rrangler = JSON.parse(read("../rrangler.json"));
const readme = read("../README.md");
const exampleToml = read("../wrangler.example.toml");

function walkFiles(directory, files = []) {
	if (statSync(directory).isFile()) {
		files.push(directory);
		return files;
	}
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		if (entry.name === "node_modules" || entry.name === ".git") continue;
		const path = `${directory}/${entry.name}`;
		if (entry.isDirectory()) {
			walkFiles(path, files);
		} else {
			files.push(path);
		}
	}
	return files;
}

test("三 DO 类从 Worker 入口导出，且只用普通 DO WebSocket", () => {
	assert.match(workerEntry, /export \{ ChannelRoom, Scheduler, UserInbox \}/);
	for (const source of [channelRoom, userInbox]) {
		assert.match(source, /new WebSocketPair/);
		assert.match(source, /server\.accept\(\)/);
		assert.doesNotMatch(source, /acceptWebSocket\(/);
		assert.doesNotMatch(source, /getWebSockets\(/);
		assert.doesNotMatch(source, /serializeAttachment\(/);
		assert.doesNotMatch(source, /deserializeAttachment\(/);
		assert.doesNotMatch(source, /async webSocketMessage/);
	}
});

test("rrangler.json 冻结绑定名与 TPM 锁", () => {
	assert.equal(rrangler.name, "edgechat");
	assert.equal(rrangler.main, "dist-rf/worker.js");
	assert.deepEqual(
		rrangler.durable_objects.bindings.map((item) => [item.name, item.class_name]),
		[
			["CHANNEL_ROOM", "ChannelRoom"],
			["USER_INBOX", "UserInbox"],
			["SCHEDULER", "Scheduler"],
		],
	);
	assert.equal(rrangler.d1_databases[0].binding, "DB");
	assert.equal(rrangler.kv_namespaces[0].binding, "SESSIONS");
	assert.equal(rrangler.r2_buckets[0].binding, "FILES");
	assert.deepEqual(rrangler.triggers.crons, ["0 19 * * *"]);
	assert.equal(rrangler.locks.websocket, "ordinary-do-websocket");
	assert.equal(rrangler.locks.static, "worker-embedded");
	assert.equal(rrangler.locks.officialWranglerToCloudflare, false);
	assert.equal(rrangler.locks.release, false);
	assert.equal(rrangler.locks.hibernation, false);
	assert.equal(rrangler.locks.pages, false);
});

test("交付脚本走 rrangler，不走官方 wrangler", () => {
	assert.match(packageJson.scripts.deploy, /rrangler deploy/);
	assert.doesNotMatch(packageJson.scripts.deploy, /\bwrangler\b/);
	assert.match(packageJson.scripts["d1:apply"], /rrangler d1 execute/);
	assert.equal(packageJson.devDependencies["@bigrandall/rrangler"], "0.4.0");
	assert.equal(packageJson.devDependencies.wrangler, undefined);
	assert.match(exampleToml, /NOT a RandallFlare delivery path/);
	assert.match(readme, /Worker-embedded/);
	assert.match(readme, /ordinary DO WebSocket/i);
	assert.match(readme, /@bigrandall\/rrangler/);
	assert.doesNotMatch(readme, /wrangler deploy/);
});

test("R2 失败语义是 503，禁止 200+ok:false", () => {
	assert.match(uploadSource, /R2 put\/get mismatch/);
	assert.match(uploadSource, /status = 503/);
	assert.doesNotMatch(uploadSource, /ok:\s*false/);
});

test("Telegram 路由不挂在全量 Worker 入口", () => {
	assert.doesNotMatch(workerEntry, /registerTelegram/);
	assert.match(workerEntry, /Telegram Bridge 未配置/);
	assert.match(workerEntry, /app\.post\('\/api\/auth\/register'/);
});

test("对外文案不出现朱安杰，署名 Randall", () => {
	const roots = ["../README.md", "../README.en.md", "../README.ja.md", "../frontend", "../worker/src"];
	for (const root of roots) {
		const absolute = new URL(root, import.meta.url).pathname;
		if (!existsSync(absolute)) continue;
		const files = walkFiles(absolute);
		for (const file of files) {
			if (/\.(png|jpg|jpeg|gif|webp|woff2?|ttf)$/i.test(file)) continue;
			const text = readFileSync(file, "utf8");
			assert.doesNotMatch(text, /朱安杰/, file);
		}
	}
	assert.match(readme, /Randall/);
});

test("上游 D1 migrations 全部保留并可被 rrangler 目录引用", () => {
	assert.ok(existsSync(new URL("../worker/schema.sql", import.meta.url)));
	const migrations = readdirSync(new URL("../worker/migrations", import.meta.url)).filter((name) =>
		name.endsWith(".sql"),
	);
	assert.ok(migrations.length >= 19);
	assert.match(packageJson.scripts["d1:migrate"], /worker\/migrations/);
});
