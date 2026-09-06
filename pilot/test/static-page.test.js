import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { INDEX_HTML } from "../src/static-html.js";

test("public/index.html stays the Worker-served echo page", () => {
	const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
	assert.equal(html, INDEX_HTML);
	assert.match(html, /new WebSocket/);
	assert.match(html, /\/ws/);
	assert.match(html, /\/api\/health/);
	assert.match(html, /hold 0s \/ 30s/);
	assert.match(html, /\[edgechat-pilot\] rtt=/);
	assert.match(html, /p95/);
	assert.doesNotMatch(html, /朱安杰/);
});
