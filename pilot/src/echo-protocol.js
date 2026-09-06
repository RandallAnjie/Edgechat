export const PILOT_SERVICE = "edgechat-pilot";
export const PILOT_R2_KEY = "pilot/probe.txt";
export const ECHO_ROOM_NAME = "pilot";

export function decodeSocketMessage(message) {
	if (typeof message === "string") {
		return message;
	}
	if (message instanceof ArrayBuffer) {
		return new TextDecoder().decode(message);
	}
	if (ArrayBuffer.isView(message)) {
		return new TextDecoder().decode(message);
	}
	return String(message ?? "");
}

export function buildReadyMessage(hibernationUsed) {
	return JSON.stringify({
		type: "ready",
		service: PILOT_SERVICE,
		hibernationUsed: Boolean(hibernationUsed),
		hibernationVerified: false,
	});
}

export function buildEchoReply(rawMessage, now = Date.now()) {
	const text = decodeSocketMessage(rawMessage);
	try {
		const parsed = JSON.parse(text);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			if (parsed.type === "ping") {
				return JSON.stringify({
					type: "pong",
					id: parsed.id ?? null,
					clientSentAt: parsed.clientSentAt,
					serverReceivedAt: now,
				});
			}
			if (parsed.type === "echo") {
				return JSON.stringify({
					type: "echo",
					id: parsed.id ?? null,
					payload: parsed.payload,
					clientSentAt: parsed.clientSentAt,
					serverReceivedAt: now,
				});
			}
		}
	} catch {
		// Raw text echo.
	}
	return text;
}

export function jsonResponse(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
		},
	});
}
