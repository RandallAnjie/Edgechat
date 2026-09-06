import assert from "node:assert/strict";
import test from "node:test";

import {
	PILOT_R2_KEY,
	PILOT_SERVICE,
	buildEchoReply,
	buildReadyMessage,
	decodeSocketMessage,
} from "../src/echo-protocol.js";

test("ready frame never claims hibernation was verified", () => {
	const ready = JSON.parse(buildReadyMessage(true));
	assert.equal(ready.type, "ready");
	assert.equal(ready.service, PILOT_SERVICE);
	assert.equal(ready.hibernationUsed, true);
	assert.equal(ready.hibernationVerified, false);
	assert.equal(JSON.parse(buildReadyMessage(false)).hibernationUsed, false);
});

test("ping becomes pong with client timestamp and server time", () => {
	const reply = JSON.parse(
		buildEchoReply(
			JSON.stringify({ type: "ping", id: "p1", clientSentAt: 100 }),
			250,
		),
	);
	assert.equal(reply.type, "pong");
	assert.equal(reply.id, "p1");
	assert.equal(reply.clientSentAt, 100);
	assert.equal(reply.serverReceivedAt, 250);
});

test("echo JSON and raw text come back so the client can measure RTT", () => {
	const echo = JSON.parse(
		buildEchoReply(
			JSON.stringify({ type: "echo", id: "e1", payload: "hello", clientSentAt: 10 }),
			11,
		),
	);
	assert.equal(echo.type, "echo");
	assert.equal(echo.payload, "hello");
	assert.equal(echo.clientSentAt, 10);
	assert.equal(buildEchoReply("plain-text"), "plain-text");
	assert.equal(decodeSocketMessage(new TextEncoder().encode("bin").buffer), "bin");
	assert.equal(PILOT_R2_KEY, "pilot/probe.txt");
});
