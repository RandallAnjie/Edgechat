#!/usr/bin/env node
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const distDir = join(repositoryRoot, "frontend/dist");
const outputDir = join(repositoryRoot, "worker/src/generated");
const outputFile = join(outputDir, "embedded-static.js");

const CONTENT_TYPES = {
	".css": "text/css; charset=utf-8",
	".gif": "image/gif",
	".htm": "text/html; charset=utf-8",
	".html": "text/html; charset=utf-8",
	".ico": "image/x-icon",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".map": "application/json; charset=utf-8",
	".png": "image/png",
	".svg": "image/svg+xml",
	".txt": "text/plain; charset=utf-8",
	".ttf": "font/ttf",
	".webmanifest": "application/manifest+json",
	".webp": "image/webp",
	".woff": "font/woff",
	".woff2": "font/woff2",
};

const TEXT_EXTENSIONS = new Set([
	".css",
	".htm",
	".html",
	".js",
	".json",
	".map",
	".svg",
	".txt",
	".webmanifest",
]);

function walk(directory, files = []) {
	for (const entry of readdirSync(directory)) {
		const fullPath = join(directory, entry);
		if (statSync(fullPath).isDirectory()) {
			walk(fullPath, files);
		} else {
			files.push(fullPath);
		}
	}
	return files;
}

function toAssetPath(filePath) {
	const relativePath = relative(distDir, filePath).split("\\").join("/");
	return `/${relativePath}`;
}

export function buildEmbeddedAssets(rootDir = distDir) {
	const assets = {};
	for (const filePath of walk(rootDir)) {
		const pathname = toAssetPath(filePath);
		const extension = extname(filePath).toLowerCase();
		const contentType = CONTENT_TYPES[extension] || "application/octet-stream";
		if (TEXT_EXTENSIONS.has(extension)) {
			assets[pathname] = {
				contentType,
				encoding: "utf8",
				body: readFileSync(filePath, "utf8"),
			};
		} else {
			assets[pathname] = {
				contentType,
				encoding: "base64",
				body: readFileSync(filePath).toString("base64"),
			};
		}
	}
	if (assets["/index.html"]) {
		assets["/"] = assets["/index.html"];
	}
	return assets;
}

function main() {
	const assets = buildEmbeddedAssets();
	if (!assets["/index.html"]) {
		throw new Error(`frontend/dist/index.html is missing; run npm run build:frontend first`);
	}
	mkdirSync(outputDir, { recursive: true });
	writeFileSync(
		outputFile,
		`export const EMBEDDED_ASSETS = ${JSON.stringify(assets)};\n`,
		"utf8",
	);
	console.log(`embedded ${Object.keys(assets).length} static paths → ${relative(repositoryRoot, outputFile)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main();
}
