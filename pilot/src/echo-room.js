import { buildEchoReply, buildReadyMessage } from "./echo-protocol.js";

function canUseHibernation(state) {
	return typeof state?.acceptWebSocket === "function";
}

export class EchoRoom {
	constructor(state, env) {
		this.state = state;
		this.env = env;
		this.sockets = new Set();
		this.hibernationUsed = canUseHibernation(state);

		if (typeof state?.getWebSockets === "function") {
			for (const socket of state.getWebSockets()) {
				this.sockets.add(socket);
			}
		}
	}

	async fetch(request) {
		const upgrade = request.headers.get("Upgrade") || request.headers.get("upgrade");
		if (!upgrade || upgrade.toLowerCase() !== "websocket") {
			return new Response("Expected WebSocket upgrade", { status: 426 });
		}
		if (typeof WebSocketPair !== "function") {
			return new Response("WebSocketPair is not available in this runtime", {
				status: 501,
			});
		}

		const pair = new WebSocketPair();
		const [client, server] = Object.values(pair);
		this.attachSocket(server);
		return new Response(null, { status: 101, webSocket: client });
	}

	attachSocket(server) {
		if (this.hibernationUsed) {
			this.state.acceptWebSocket(server);
		} else if (typeof server.accept === "function") {
			server.accept();
			server.addEventListener("message", (event) => {
				this.webSocketMessage(server, event.data);
			});
			server.addEventListener("close", () => this.webSocketClose(server));
			server.addEventListener("error", () => this.webSocketError(server));
		}

		this.sockets.add(server);
		try {
			server.send(buildReadyMessage(this.hibernationUsed));
		} catch {
			// Socket may already be closing.
		}
	}

	webSocketMessage(ws, message) {
		try {
			ws.send(buildEchoReply(message));
		} catch {
			this.sockets.delete(ws);
		}
	}

	webSocketClose(ws) {
		this.sockets.delete(ws);
	}

	webSocketError(ws) {
		this.sockets.delete(ws);
	}
}
