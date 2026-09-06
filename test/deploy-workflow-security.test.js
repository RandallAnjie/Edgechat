import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
	new URL("../.github/workflows/deploy-worker.yml", import.meta.url),
	"utf8",
).replaceAll("\r\n", "\n");
const demoWorkflow = readFileSync(
	new URL("../.github/workflows/deploy-demo.yml", import.meta.url),
	"utf8",
).replaceAll("\r\n", "\n");
const packageJson = JSON.parse(
	readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

test("CI 不把 Cloudflare 凭据注入部署，也不调用官方 wrangler deploy", () => {
	assert.doesNotMatch(workflow, /CLOUDFLARE_(?:API_TOKEN|ACCOUNT_ID)/);
	assert.doesNotMatch(workflow, /npx wrangler|wrangler deploy/);
	assert.match(workflow, /npm test/);
	assert.match(workflow, /npm run build:rf/);
});

test("demo 工作流不再向 Cloudflare 发布", () => {
	assert.doesNotMatch(demoWorkflow, /npx wrangler|wrangler deploy/);
	assert.match(packageJson.scripts.deploy, /rrangler deploy/);
	assert.doesNotMatch(packageJson.scripts.deploy, /\bwrangler\b/);
	assert.match(packageJson.scripts["deploy:demo"], /Disabled/);
});

test("资源确认脚本仅复用配置的 KV 标题，避免隐式共享会话存储", () => {
	const script = readFileSync(
		new URL("../.github/scripts/ensure-cloudflare-resources.mjs", import.meta.url),
		"utf8",
	).replaceAll("\r\n", "\n");

	assert.doesNotMatch(script, /PRODUCTION_KV_NAMESPACE_TITLE/);
	assert.match(
		script,
		/namespace\.title === kvNamespaceTitle && namespace\.id/,
	);
	assert.match(script, /setOutput\("kv_namespace_title", kv\.title\);/);
});
