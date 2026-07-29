import { access, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const appRoot = join(dirname(__filename), "..");
const publicDir = join(appRoot, "public");
const distDir = join(appRoot, "dist");

const requiredPublicFiles = [
  "index.html",
  "main.js",
  "styles.css",
  "app/api.js",
  "app/createApp.js",
  "app/dom.js",
  "app/renderers.js",
  "app/state.js",
];

async function assertRequiredPublicFiles() {
  await Promise.all(requiredPublicFiles.map((filePath) => access(join(publicDir, filePath))));
}

async function buildStaticDist() {
  await assertRequiredPublicFiles();
  await mkdir(distDir, { recursive: true });
  await cp(publicDir, distDir, { recursive: true });

  const indexHtml = await readFile(join(distDir, "index.html"), "utf-8");
  if (!indexHtml.includes('href="/styles.css"') || !indexHtml.includes('src="/main.js"')) {
    throw new Error("dist/index.html must keep root-level static asset references for the local server contract.");
  }

  const manifest = {
    app: "AI封面创意助手",
    mode: "static-public-copy",
    source: relative(appRoot, publicDir),
    output: relative(appRoot, distDir),
    requiredFiles: requiredPublicFiles,
    generatedAt: new Date().toISOString(),
  };

  await writeFile(join(distDir, "build-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");

  return manifest;
}

try {
  const manifest = await buildStaticDist();
  console.log(`Built ${manifest.app} static bundle: ${manifest.source} -> ${manifest.output}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
