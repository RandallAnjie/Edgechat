import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import initSqlJs from "sql.js";
import { createD1Adapter, createKvAdapter } from "./support/d1.js";
import worker from "../worker/src/index.js";
import { saveUploadedFile } from "../worker/src/api/upload.js";
import { submitRoomMessage } from "../worker/src/message-submission.js";
import { listMessages } from "../worker/src/data/messages.js";
import { encryptMessageContent } from "../worker/src/encryption.js";

const SQL = await initSqlJs();
const schema = readFileSync(new URL("../worker/schema.sql", import.meta.url), "utf8");

function createEnv(files = null) {
	const database = new SQL.Database();
	database.exec(schema);
	return {
		database,
		env: {
			DB: createD1Adapter(database),
			SESSIONS: createKvAdapter(),
			FILES: files,
			ADMIN_USERNAMES: "admin",
		},
	};
}

async function jsonFetch(env, path, { method = "GET", body, token } = {}) {
	const headers = { "content-type": "application/json" };
	if (token) headers.authorization = `Bearer ${token}`;
	const response = await worker.fetch(
		new Request(`https://edgechat.test${path}`, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		}),
		env,
	);
	const contentType = response.headers.get("content-type") || "";
	const payload = contentType.includes("application/json")
		? await response.json()
		: await response.text();
	return { response, payload };
}

test("AC-CHAT 路径：公开注册/登录 → general 频道 → 消息可写回读", async () => {
	const { env } = createEnv();
	const register = await jsonFetch(env, "/api/auth/register", {
		method: "POST",
		body: { username: "alice", password: "secret1", displayName: "Alice" },
	});
	assert.equal(register.response.status, 200, JSON.stringify(register.payload));
	assert.equal(register.payload.ok, true);
	assert.ok(register.payload.token);
	assert.equal(register.payload.session.isAdmin, true);

	const login = await jsonFetch(env, "/api/auth/login", {
		method: "POST",
		body: { username: "alice", password: "secret1" },
	});
	assert.equal(login.response.status, 200);
	const token = login.payload.token;

	const bootstrap = await jsonFetch(env, "/api/bootstrap", { token });
	assert.equal(bootstrap.response.status, 200);
	const general = bootstrap.payload.channels.find((channel) => channel.name === "general");
	assert.ok(general, "general channel missing");

	const second = await jsonFetch(env, "/api/auth/register", {
		method: "POST",
		body: { username: "bob", password: "secret2", displayName: "Bob" },
	});
	assert.equal(second.response.status, 200);
	assert.equal(second.payload.session.isAdmin, false);

	const submitted = await submitRoomMessage(
		env,
		{
			room: { id: Number(general.id), kind: "public", name: "general" },
			principal: { userId: register.payload.session.userId, isAdmin: true },
		},
		{ content: "hello from alice" },
	);
	assert.equal(submitted.message.content, "hello from alice");

	const history = await listMessages(env, Number(general.id));
	assert.equal(history.some((message) => message.content === "hello from alice"), true);
});

function fakeFile(name, type, text) {
	const bytes = new TextEncoder().encode(text);
	return {
		name,
		type,
		size: bytes.byteLength,
		arrayBuffer: async () => bytes.buffer.slice(0),
	};
}

test("R2 未绑定或 put/get 不一致返回 503，不返回 200", async () => {
	const { env } = createEnv(null);
	await assert.rejects(
		saveUploadedFile(env, { userId: 1 }, fakeFile("a.txt", "text/plain", "x")),
		(error) => error.status === 503 && error.message === "R2 put/get mismatch",
	);

	const mismatch = {
		async put() {},
		async get() {
			return null;
		},
		async delete() {},
	};
	const { env: mismatchEnv } = createEnv(mismatch);
	await assert.rejects(
		saveUploadedFile(mismatchEnv, { userId: 1 }, fakeFile("a.txt", "text/plain", "hello")),
		(error) => error.status === 503 && error.message === "R2 put/get mismatch",
	);
});

test("无加密钥匙串时消息按明文写入，保证 AC-CHAT 不堵", async () => {
	const plaintext = await encryptMessageContent({}, "visible", {
		channelId: 1,
		senderId: 2,
	});
	assert.equal(plaintext, "visible");
});
