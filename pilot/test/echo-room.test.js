import assert from "node:assert/strict";
import test from "node:test";

import { EchoRoom } from "../src/echo-room.js";

function fakeSocket() {
	const listeners = new Map();
	return {
		sent: [],
		accepted: false,
		send(data) {
			this.sent.push(data);
		},
		accept() {
			this.accepted = true;
		},
		addEventListener(type, fn) {
			const list = listeners.get(type) || [];
			list.push(fn);
			listeners.set(type, list);
		},
		emit(type, event) {
			for (const fn of listeners.get(type) || []) {
				fn(event);
			}
		},
	};
}

test("EchoRoom uses acceptWebSocket when the hibernation API exists", () => {
	const accepted = [];
	const state = {
		acceptWebSocket(ws) {
			accepted.push(ws);
		},
		getWebSockets() {
			return [];
		},
	};
	const room = new EchoRoom(state, {});
	const socket = fakeSocket();
	room.attachSocket(socket);

	assert.equal(room.hibernationUsed, true);
	assert.equal(accepted[0], socket);
	assert.equal(socket.accepted, false);
	assert.match(socket.sent[0], /"hibernationUsed":true/);
	assert.match(socket.sent[0], /"hibernationVerified":false/);
});

test("EchoRoom falls back to normal WebSocket.accept when hibernation is missing", () => {
	const room = new EchoRoom({}, {});
	const socket = fakeSocket();
	room.attachSocket(socket);

	assert.equal(room.hibernationUsed, false);
	assert.equal(socket.accepted, true);
	socket.emit("message", { data: JSON.stringify({ type: "ping", id: "n1", clientSentAt: 1 }) });
	assert.match(socket.sent[1], /"type":"pong"/);
	assert.match(socket.sent[1], /"id":"n1"/);
});

test("GET without Upgrade is 426", async () => {
	const room = new EchoRoom({}, {});
	const response = await room.fetch(new Request("https://pilot.test/ws"));
	assert.equal(response.status, 426);
});
