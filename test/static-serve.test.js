import assert from "node:assert/strict";
import test from "node:test";
import { serveEmbeddedStatic } from "../worker/src/static-serve.js";

const assets = {
	"/index.html": {
		contentType: "text/html; charset=utf-8",
		encoding: "utf8",
		body: "<html>Randall</html>",
	},
	"/": {
		contentType: "text/html; charset=utf-8",
		encoding: "utf8",
		body: "<html>Randall</html>",
	},
	"/assets/app.js": {
		contentType: "text/javascript; charset=utf-8",
		encoding: "utf8",
		body: "console.log(1)",
	},
};

test("Worker 内嵌静态：首页、资源、SPA fallback，缺失文件 404", async () => {
	const home = serveEmbeddedStatic("/", assets);
	assert.equal(await home.text(), "<html>Randall</html>");
	assert.match(home.headers.get("content-type"), /text\/html/);

	const script = serveEmbeddedStatic("/assets/app.js", assets);
	assert.equal(await script.text(), "console.log(1)");

	const spa = serveEmbeddedStatic("/login", assets);
	assert.equal(await spa.text(), "<html>Randall</html>");

	assert.equal(serveEmbeddedStatic("/missing.js", assets), null);
	assert.equal(serveEmbeddedStatic("/login", {}), null);
});
