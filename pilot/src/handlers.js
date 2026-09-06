import { ECHO_ROOM_NAME, PILOT_R2_KEY, PILOT_SERVICE, jsonResponse } from "./echo-protocol.js";
import { INDEX_HTML } from "./static-html.js";

export function isFilesBound(env) {
	return Boolean(env?.FILES && typeof env.FILES.put === "function" && typeof env.FILES.get === "function");
}

export function isDbBound(env) {
	return Boolean(env?.DB && typeof env.DB.prepare === "function");
}

export function isEchoRoomBound(env) {
	return Boolean(
		env?.ECHO_ROOM &&
			typeof env.ECHO_ROOM.idFromName === "function" &&
			typeof env.ECHO_ROOM.get === "function",
	);
}

export async function probeD1(env) {
	if (!isDbBound(env)) {
		return {
			ok: false,
			bound: false,
			error: "DB D1 binding is not configured",
		};
	}

	try {
		const row = await env.DB.prepare("SELECT 1 AS ok").first();
		const value = row?.ok;
		if (value !== 1 && value !== 1n) {
			return {
				ok: false,
				bound: true,
				error: `unexpected SELECT 1 result: ${JSON.stringify(row)}`,
			};
		}
		return { ok: true, bound: true, result: 1 };
	} catch (error) {
		return {
			ok: false,
			bound: true,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

export async function probeR2(env) {
	if (!isFilesBound(env)) {
		return {
			ok: false,
			status: 503,
			body: {
				ok: false,
				error: "FILES R2 binding is not configured",
			},
		};
	}

	const key = PILOT_R2_KEY;
	const payload = `${PILOT_SERVICE} ${new Date().toISOString()}`;

	try {
		await env.FILES.put(key, payload);
		const object = await env.FILES.get(key);
		if (!object) {
			return {
				ok: false,
				status: 503,
				body: {
					ok: false,
					error: `R2 get missed key ${key} after put`,
				},
			};
		}
		const text = typeof object.text === "function" ? await object.text() : String(object);
		if (text !== payload) {
			return {
				ok: false,
				status: 503,
				body: {
					ok: false,
					error: "R2 get payload mismatch after put",
				},
			};
		}
		return {
			ok: true,
			status: 200,
			body: {
				ok: true,
				key,
				bytes: payload.length,
			},
		};
	} catch (error) {
		return {
			ok: false,
			status: 503,
			body: {
				ok: false,
				error: error instanceof Error ? error.message : String(error),
			},
		};
	}
}

function htmlResponse() {
	return new Response(INDEX_HTML, {
		status: 200,
		headers: {
			"content-type": "text/html; charset=utf-8",
			"cache-control": "no-store",
		},
	});
}

export async function handleRequest(request, env) {
	const url = new URL(request.url);
	const path = url.pathname;

	if (request.method === "GET" && (path === "/" || path === "/index.html")) {
		return htmlResponse();
	}

	if (request.method === "GET" && path === "/favicon.ico") {
		return new Response(null, { status: 204 });
	}

	if (request.method === "GET" && path === "/api/health") {
		const d1 = await probeD1(env);
		return jsonResponse({
			ok: true,
			service: PILOT_SERVICE,
			d1,
		});
	}

	if (request.method === "GET" && path === "/api/d1") {
		const d1 = await probeD1(env);
		return jsonResponse(d1, d1.ok ? 200 : 503);
	}

	if (request.method === "GET" && path === "/api/r2") {
		const r2 = await probeR2(env);
		return jsonResponse(r2.body, r2.status);
	}

	if (path === "/ws") {
		if (!isEchoRoomBound(env)) {
			return jsonResponse(
				{
					ok: false,
					error: "ECHO_ROOM Durable Object binding is not configured",
				},
				503,
			);
		}
		const id = env.ECHO_ROOM.idFromName(ECHO_ROOM_NAME);
		return env.ECHO_ROOM.get(id).fetch(request);
	}

	return jsonResponse({ ok: false, error: "not found" }, 404);
}
