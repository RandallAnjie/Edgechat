import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

import { buildEchoReply, buildReadyMessage } from "../src/echo-protocol.js";
import { handleRequest } from "../src/handlers.js";

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

export function createFakeD1() {
	return {
		prepare(sql) {
			return {
				async first() {
					if (!/SELECT 1/i.test(sql)) {
						throw new Error(`unexpected sql: ${sql}`);
					}
					return { ok: 1 };
				},
			};
		},
	};
}

export function createFakeR2() {
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

function encodeTextFrame(text) {
	const payload = Buffer.from(text);
	if (payload.length < 126) {
		return Buffer.concat([Buffer.from([0x81, payload.length]), payload]);
	}
	if (payload.length < 65536) {
		const header = Buffer.alloc(4);
		header[0] = 0x81;
		header[1] = 126;
		header.writeUInt16BE(payload.length, 2);
		return Buffer.concat([header, payload]);
	}
	const header = Buffer.alloc(10);
	header[0] = 0x81;
	header[1] = 127;
	header.writeBigUInt64BE(BigInt(payload.length), 2);
	return Buffer.concat([header, payload]);
}

function decodeClientFrames(buffer, onText) {
	let offset = 0;
	while (offset + 2 <= buffer.length) {
		const first = buffer[offset];
		const second = buffer[offset + 1];
		const opcode = first & 0x0f;
		const masked = Boolean(second & 0x80);
		let length = second & 0x7f;
		let cursor = offset + 2;
		if (length === 126) {
			if (cursor + 2 > buffer.length) {
				break;
			}
			length = buffer.readUInt16BE(cursor);
			cursor += 2;
		} else if (length === 127) {
			if (cursor + 8 > buffer.length) {
				break;
			}
			length = Number(buffer.readBigUInt64BE(cursor));
			cursor += 8;
		}
		const maskBytes = masked ? 4 : 0;
		if (cursor + maskBytes + length > buffer.length) {
			break;
		}
		let payload = buffer.subarray(cursor + maskBytes, cursor + maskBytes + length);
		if (masked) {
			const mask = buffer.subarray(cursor, cursor + 4);
			payload = Buffer.from(payload);
			for (let i = 0; i < payload.length; i += 1) {
				payload[i] ^= mask[i % 4];
			}
		}
		if (opcode === 1) {
			onText(payload.toString("utf8"));
		}
		offset = cursor + maskBytes + length;
	}
	return buffer.subarray(offset);
}

export function createPreviewServer(options = {}) {
	const env = {
		DB: options.db === undefined ? createFakeD1() : options.db,
		FILES: options.files === undefined ? createFakeR2() : options.files,
	};

	const sockets = new Set();
	const server = createServer(async (req, res) => {
		const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
		const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req);
		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (value !== undefined) {
				headers.set(key, Array.isArray(value) ? value.join(", ") : String(value));
			}
		}
		const request = new Request(url, { method: req.method, headers, body });
		const response = await handleRequest(request, env);
		res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
		res.end(Buffer.from(await response.arrayBuffer()));
	});

	server.on("connection", (socket) => {
		sockets.add(socket);
		socket.on("close", () => sockets.delete(socket));
	});

	server.closePreview = () =>
		new Promise((resolve) => {
			for (const socket of sockets) {
				socket.destroy();
			}
			if (typeof server.closeAllConnections === "function") {
				server.closeAllConnections();
			}
			server.close(() => resolve());
		});

	server.on("upgrade", (req, socket) => {
		sockets.add(socket);
		socket.on("close", () => sockets.delete(socket));
		const path = (req.url || "/").split("?")[0];
		if (path !== "/ws") {
			socket.destroy();
			return;
		}
		const key = req.headers["sec-websocket-key"];
		if (!key) {
			socket.destroy();
			return;
		}
		const accept = createHash("sha1").update(String(key) + GUID).digest("base64");
		socket.write(
			"HTTP/1.1 101 Switching Protocols\r\n" +
				"Upgrade: websocket\r\n" +
				"Connection: Upgrade\r\n" +
				`Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
		);
		socket.write(encodeTextFrame(buildReadyMessage(false)));
		let leftover = Buffer.alloc(0);
		socket.on("data", (chunk) => {
			leftover = decodeClientFrames(Buffer.concat([leftover, chunk]), (text) => {
				socket.write(encodeTextFrame(buildEchoReply(text)));
			});
		});
	});

	return server;
}

function readBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		req.on("data", (c) => chunks.push(c));
		req.on("end", () => resolve(Buffer.concat(chunks)));
		req.on("error", reject);
	});
}

export function listenPreview(port = Number(process.env.PORT || 8788)) {
	const server = createPreviewServer({
		files: process.env.UNBIND_FILES === "1" ? null : undefined,
	});
	return new Promise((resolve) => {
		server.listen(port, "127.0.0.1", () => {
			process.stdout.write(`edgechat-pilot local preview http://127.0.0.1:${port}/\n`);
			resolve(server);
		});
	});
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
	await listenPreview();
}
