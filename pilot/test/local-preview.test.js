import assert from "node:assert/strict";
import test from "node:test";

import { createPreviewServer } from "../scripts/local-preview.mjs";

function listen(server) {
	return new Promise((resolve) => {
		server.listen(0, "127.0.0.1", () => {
			const { port } = server.address();
			resolve(`http://127.0.0.1:${port}`);
		});
	});
}

test("local preview serves health, D1, R2, and WebSocket echo", async () => {
	const server = createPreviewServer();
	const origin = await listen(server);
	try {
		const home = await fetch(`${origin}/`);
		assert.equal(home.status, 200);
		assert.match(await home.text(), /edgechat-pilot/);

		const health = await fetch(`${origin}/api/health`);
		assert.equal(health.status, 200);
		assert.equal((await health.json()).d1.result, 1);

		const d1 = await fetch(`${origin}/api/d1`);
		assert.equal(d1.status, 200);

		const r2 = await fetch(`${origin}/api/r2`);
		assert.equal(r2.status, 200);
		assert.equal((await r2.json()).key, "pilot/probe.txt");

		const ws = new WebSocket(origin.replace("http", "ws") + "/ws");
		const messages = [];
		await new Promise((resolve, reject) => {
			const timer = setTimeout(() => reject(new Error("ws timeout")), 3000);
			ws.addEventListener("error", reject);
			ws.addEventListener("message", (event) => {
				messages.push(String(event.data));
				if (messages.length === 1) {
					ws.send(JSON.stringify({ type: "ping", id: "local1", clientSentAt: Date.now() }));
				}
				if (messages.length >= 2) {
					clearTimeout(timer);
					resolve();
				}
			});
		});
		ws.close();
		assert.match(messages[0], /"type":"ready"/);
		assert.match(messages[0], /"hibernationVerified":false/);
		const pong = JSON.parse(messages[1]);
		assert.equal(pong.type, "pong");
		assert.equal(pong.id, "local1");
		assert.ok(typeof pong.serverReceivedAt === "number");
	} finally {
		await server.closePreview();
	}
});

test("local preview R2 probe is 503 when FILES is unbound", async () => {
	const server = createPreviewServer({ files: null });
	const origin = await listen(server);
	try {
		const r2 = await fetch(`${origin}/api/r2`);
		assert.equal(r2.status, 503);
		assert.match((await r2.json()).error, /FILES R2 binding is not configured/);
		const health = await fetch(`${origin}/api/health`);
		assert.equal(health.status, 200);
	} finally {
		await server.closePreview();
	}
});
