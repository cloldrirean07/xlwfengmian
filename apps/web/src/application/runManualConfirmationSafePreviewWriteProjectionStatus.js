import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildManualConfirmationSafePreviewWriteProjection,
  buildManualConfirmationSafePreviewWriteProjectionMarkdown,
} from "../domain/review/buildManualConfirmationSafePreviewWriteProjection.js";
import { runManualConfirmationDecisionStatus } from "./runManualConfirmationDecisionStatus.js";
import { runManualConfirmationSafePreviewWritePrecheckStatus } from "./runManualConfirmationSafePreviewWritePrecheckStatus.js";

const __filename = fileURLToPath(import.meta.url);
const appRoot = join(dirname(__filename), "..", "..");
const outputDir = join(
  appRoot,
  "outputs",
  "batch-review-manual-safe-write-preview",
  "manual-confirmation-safe-preview-write-projection",
);
const jsonPath = join(outputDir, "manual-confirmation-safe-preview-write-projection.json");
const markdownPath = join(outputDir, "manual-confirmation-safe-preview-write-projection.md");

export async function runManualConfirmationSafePreviewWriteProjectionStatus() {
  const [writePrecheck, manualDecision] = await Promise.all([
    runManualConfirmationSafePreviewWritePrecheckStatus(),
    runManualConfirmationDecisionStatus(),
  ]);
  const projection = buildManualConfirmationSafePreviewWriteProjection({
    writePrecheck,
    manualDecision,
    sourcePaths: {
      writePrecheck: writePrecheck.sourcePaths?.markdown || "",
      manualDecision: manualDecision.sourcePath || manualDecision.outputPaths?.decision || "",
      json: jsonPath,
      markdown: markdownPath,
    },
  });
  const markdown = buildManualConfirmationSafePreviewWriteProjectionMarkdown(projection);

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(projection, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, `${markdown}\n`, "utf-8");

  return projection;
}
