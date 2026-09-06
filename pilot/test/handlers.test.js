import assert from "node:assert/strict";
import test from "node:test";

import { handleRequest } from "../src/handlers.js";
import { INDEX_HTML } from "../src/static-html.js";

function createFakeD1(result = { ok: 1 }) {
	return {
		prepare(sql) {
			return {
				async first() {
					assert.match(sql, /SELECT 1/i);
					return result;
				},
			};
		},
	};
}

function createFakeR2() {
	const store = new Map();
	return {
		async put(key, value) {
			store.set(key, value);
		},
		async get(key) {
			if (!store.has(key)) {
				return null;
			}
			const body = store.get(key);
			return {
				async text() {
					return body;
				},
			};
		},
	};
}

function createFakeEchoRoom(captures) {
	return {
		idFromName(name) {
			captures.push({ type: "name", name });
			return `id:${name}`;
		},
		get(id) {
			captures.push({ type: "get", id });
			return {
				async fetch(request) {
					captures.push({ type: "fetch", url: request.url, upgrade: request.headers.get("Upgrade") });
					return new Response("forwarded", { status: 200, headers: { "x-pilot-do": "EchoRoom" } });
				},
			};
		},
	};
}

test("GET / and /index.html serve the echo page", async () => {
	const home = await handleRequest(new Request("https://pilot.test/"), {});
	const alias = await handleRequest(new Request("https://pilot.test/index.html"), {});
	assert.equal(home.status, 200);
	assert.match(home.headers.get("content-type"), /text\/html/);
	assert.equal(await home.text(), INDEX_HTML);
	assert.equal(alias.status, 200);
});

test("GET /api/health is 200 and runs SELECT 1 when DB is bound", async () => {
	const response = await handleRequest(new Request("https://pilot.test/api/health"), {
		DB: createFakeD1(),
	});
	assert.equal(response.status, 200);
	const body = await response.json();
	assert.equal(body.ok, true);
	assert.equal(body.service, "edgechat-pilot");
	assert.deepEqual(body.d1, { ok: true, bound: true, result: 1 });
});

test("GET /api/health stays 200 when DB is unbound", async () => {
	const response = await handleRequest(new Request("https://pilot.test/api/health"), {});
	assert.equal(response.status, 200);
	const body = await response.json();
	assert.equal(body.ok, true);
	assert.equal(body.d1.bound, false);
	assert.equal(body.d1.ok, false);
});

test("GET /api/d1 is 200 when DB is bound and 503 when not", async () => {
	const ok = await handleRequest(new Request("https://pilot.test/api/d1"), {
		DB: createFakeD1(),
	});
	const missing = await handleRequest(new Request("https://pilot.test/api/d1"), {});
	assert.equal(ok.status, 200);
	assert.equal((await ok.json()).result, 1);
	assert.equal(missing.status, 503);
	assert.equal((await missing.json()).ok, false);
});

test("GET /api/r2 put+get succeeds when FILES is bound", async () => {
	const response = await handleRequest(new Request("https://pilot.test/api/r2"), {
		FILES: createFakeR2(),
	});
	assert.equal(response.status, 200);
	const body = await response.json();
	assert.equal(body.ok, true);
	assert.equal(body.key, "pilot/probe.txt");
});

test("GET /api/r2 is 503 with a clear error when FILES is unbound", async () => {
	const response = await handleRequest(new Request("https://pilot.test/api/r2"), {});
	assert.equal(response.status, 503);
	const body = await response.json();
	assert.equal(body.ok, false);
	assert.match(body.error, /FILES R2 binding is not configured/);
});

test("GET /api/r2 never returns 200 on put/get failure", async () => {
	const response = await handleRequest(new Request("https://pilot.test/api/r2"), {
		FILES: {
			async put() {
				throw new Error("r2 unavailable");
			},
			async get() {
				return { async text() { return "nope"; } };
			},
		},
	});
	assert.equal(response.status, 503);
	assert.equal((await response.json()).ok, false);
});

test("GET /ws forwards to EchoRoom when bound and 503 when not", async () => {
	const captures = [];
	const missing = await handleRequest(new Request("https://pilot.test/ws"), {});
	assert.equal(missing.status, 503);
	assert.match((await missing.json()).error, /ECHO_ROOM/);

	const forwarded = await handleRequest(
		new Request("https://pilot.test/ws", { headers: { Upgrade: "websocket" } }),
		{ ECHO_ROOM: createFakeEchoRoom(captures) },
	);
	assert.equal(forwarded.status, 200);
	assert.equal(forwarded.headers.get("x-pilot-do"), "EchoRoom");
	assert.deepEqual(captures[0], { type: "name", name: "pilot" });
	assert.equal(captures[1].id, "id:pilot");
	assert.equal(captures[2].upgrade, "websocket");
});
