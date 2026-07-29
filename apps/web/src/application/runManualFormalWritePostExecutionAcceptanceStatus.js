import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildManualFormalWritePostExecutionAcceptance,
  buildManualFormalWritePostExecutionAcceptanceMarkdown,
} from "../domain/review/buildManualFormalWritePostExecutionAcceptance.js";
import { runManualFormalWriteExecutionPacketStatus } from "./runManualFormalWriteExecutionPacketStatus.js";

const __filename = fileURLToPath(import.meta.url);
const appRoot = join(dirname(__filename), "..", "..");
const outputDir = join(
  appRoot,
  "outputs",
  "batch-review-manual-formal-write",
  "manual-formal-write-post-execution-acceptance",
);
const formalWriteDir = join(appRoot, "outputs", "batch-review-manual-formal-write");
const formalWriteJsonPath = join(formalWriteDir, "batch-review-manual-formal-write.json");
const formalWriteMarkdownPath = join(formalWriteDir, "batch-review-manual-formal-write.md");
const formalWritePreviousMarkdownPath = join(
  formalWriteDir,
  "batch-review-manual-formal-write.previous.md",
);
const jsonPath = join(outputDir, "manual-formal-write-post-execution-acceptance.json");
const markdownPath = join(outputDir, "manual-formal-write-post-execution-acceptance.md");

async function readJsonFile(path) {
  try {
    return JSON.parse(await readFile(path, "utf-8"));
  } catch {
    return null;
  }
}

async function loadPersistedFormalWriteExport() {
  const persistedExport = await readJsonFile(formalWriteJsonPath);

  if (!persistedExport?.exportId || !persistedExport?.targetPath) {
    return null;
  }

  let matchedExpectedContent = Boolean(persistedExport.readback?.matchedExpectedContent);
  try {
    const [finalMarkdown, targetMarkdown] = await Promise.all([
      readFile(persistedExport.sourceMarkdownPath || formalWriteMarkdownPath, "utf-8"),
      readFile(persistedExport.targetPath, "utf-8"),
    ]);
    matchedExpectedContent = finalMarkdown === targetMarkdown;
  } catch {
    matchedExpectedContent = false;
  }

  return {
    ...persistedExport,
    ok: Boolean(persistedExport.ok ?? matchedExpectedContent),
    sourceMarkdownPath: persistedExport.sourceMarkdownPath || formalWriteMarkdownPath,
    sourcePreviousMarkdownPath:
      persistedExport.sourcePreviousMarkdownPath || formalWritePreviousMarkdownPath,
    sourceJsonPath: persistedExport.sourceJsonPath || formalWriteJsonPath,
    readback: {
      ...(persistedExport.readback || {}),
      ok: matchedExpectedContent,
      matchedExpectedContent,
    },
  };
}

export async function runManualFormalWritePostExecutionAcceptanceStatus({
  executionPacket = null,
  formalWriteExport = null,
} = {}) {
  const effectiveExecutionPacket = executionPacket || await runManualFormalWriteExecutionPacketStatus();
  const effectiveFormalWriteExport = formalWriteExport || await loadPersistedFormalWriteExport();
  const acceptance = buildManualFormalWritePostExecutionAcceptance({
    executionPacket: effectiveExecutionPacket,
    formalWriteExport: effectiveFormalWriteExport,
    outputPaths: {
      json: jsonPath,
      markdown: markdownPath,
    },
  });
  const markdown = buildManualFormalWritePostExecutionAcceptanceMarkdown(acceptance);

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(acceptance, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, `${markdown}\n`, "utf-8");

  return acceptance;
}
