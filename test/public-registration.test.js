import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const loginPage = readFileSync(
	new URL("../frontend/src/pages/LoginPage.vue", import.meta.url),
	"utf8",
);
const registerPage = readFileSync(
	new URL("../frontend/src/pages/RegisterPage.vue", import.meta.url),
	"utf8",
);
const workerEntry = readFileSync(
	new URL("../worker/src/index.js", import.meta.url),
	"utf8",
);
const routerSource = readFileSync(
	new URL("../frontend/src/router.js", import.meta.url),
	"utf8",
);

test("公开注册对 AC-CHAT 开放：登录页可进入 /register，Worker 接受 /api/auth/register", () => {
	assert.match(loginPage, /to="\/register"/);
	assert.match(routerSource, /path: '\/register'/);
	assert.match(registerPage, /isPublicRegister/);
	assert.match(workerEntry, /app\.post\('\/api\/auth\/register'/);
	assert.match(workerEntry, /app\.get\('\/api\/register-links\/:token'/);
	assert.match(workerEntry, /app\.post\('\/api\/register-links\/:token\/register'/);
});
