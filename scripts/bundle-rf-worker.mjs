#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const generatedAssets = join(repositoryRoot, "worker/src/generated/embedded-static.js");
const fallbackAssets = join(repositoryRoot, "worker/src/embedded-static.js");
const outfile = join(repositoryRoot, "dist-rf/worker.js");

if (!existsSync(generatedAssets)) {
	mkdirSync(dirname(generatedAssets), { recursive: true });
	writeFileSync(generatedAssets, "export const EMBEDDED_ASSETS = {};\n", "utf8");
}

await esbuild.build({
	absWorkingDir: repositoryRoot,
	entryPoints: ["worker/src/index.js"],
	bundle: true,
	format: "esm",
	outfile,
	platform: "neutral",
	target: "es2022",
	legalComments: "none",
	plugins: [
		{
			name: "rf-embedded-static",
			setup(build) {
				build.onResolve({ filter: /embedded-static\.js$/ }, () => ({
					path: existsSync(generatedAssets) ? generatedAssets : fallbackAssets,
				}));
			},
		},
	],
});

console.log(`bundled RandallFlare worker → dist-rf/worker.js`);
