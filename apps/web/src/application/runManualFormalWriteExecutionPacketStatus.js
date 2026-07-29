import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildManualFormalWriteExecutionPacket,
  buildManualFormalWriteExecutionPacketMarkdown,
} from "../domain/review/buildManualFormalWriteExecutionPacket.js";
import { readTextFile } from "../shared/fileSystem.js";
import { runBatchReviewManualFormalWriteReadinessPreview } from "./runBatchReviewManualFormalWriteReadinessPreview.js";
import { runManualFormalWriteExecutionPrecheckStatus } from "./runManualFormalWriteExecutionPrecheckStatus.js";

const __filename = fileURLToPath(import.meta.url);
const appRoot = join(dirname(__filename), "..", "..");
const formalWriteDir = join(appRoot, "outputs", "batch-review-manual-formal-write");
const outputDir = join(formalWriteDir, "manual-formal-write-execution-packet");
const jsonPath = join(outputDir, "manual-formal-write-execution-packet.json");
const markdownPath = join(outputDir, "manual-formal-write-execution-packet.md");
const sourceMarkdownPath = join(formalWriteDir, "batch-review-manual-formal-write.md");
const sourceJsonPath = join(formalWriteDir, "batch-review-manual-formal-write.json");
const sourcePreviousMarkdownPath = join(
  formalWriteDir,
  "batch-review-manual-formal-write.previous.md",
);

async function readPersistedFormalWriteExport() {
  try {
    return JSON.parse(await readFile(sourceJsonPath, "utf-8"));
  } catch {
    return null;
  }
}

async function resolveComparisonMarkdown({ targetRecordPath = "" } = {}) {
  const persistedExport = await readPersistedFormalWriteExport();

  if (persistedExport?.exportId && persistedExport?.targetPath) {
    try {
      const [previousMarkdown, finalMarkdown, targetMarkdown] = await Promise.all([
        readFile(persistedExport.sourcePreviousMarkdownPath || sourcePreviousMarkdownPath, "utf-8"),
        readFile(persistedExport.sourceMarkdownPath || sourceMarkdownPath, "utf-8"),
        readFile(persistedExport.targetPath, "utf-8"),
      ]);

      if (finalMarkdown === targetMarkdown) {
        return {
          currentTargetMarkdown: previousMarkdown,
          patchedMarkdown: finalMarkdown,
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

export async function runManualFormalWriteExecutionPacketStatus() {
  const readiness = await runBatchReviewManualFormalWriteReadinessPreview();
  const precheck = await runManualFormalWriteExecutionPrecheckStatus();
  const targetRecordPath = readiness.latestSafeWriteStatus?.parsed?.targetPath || "";
  const persistedComparison = await resolveComparisonMarkdown({ targetRecordPath });
  const patchedMarkdown = persistedComparison?.patchedMarkdown ||
    readiness.latestSafeWriteStatus?.parsed?.patchedMarkdown ||
    "";
  const currentTargetMarkdown = persistedComparison?.currentTargetMarkdown ||
    (targetRecordPath ? await readTextFile(targetRecordPath) : "");
  const packet = buildManualFormalWriteExecutionPacket({
    precheck,
    readiness,
    currentTargetMarkdown,
    patchedMarkdown,
    outputPaths: {
      json: jsonPath,
      markdown: markdownPath,
      sourceMarkdownPath,
      sourceJsonPath,
      sourcePreviousMarkdownPath,
      logDirectory: join(appRoot, "outputs", "obsidian-export-logs", "batch-review-manual-formal-write"),
    },
  });
  const markdown = buildManualFormalWriteExecutionPacketMarkdown(packet);

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(packet, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, `${markdown}\n`, "utf-8");

  return packet;
}
