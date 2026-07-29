import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BATCH_REVIEW_MANUAL_FORMAL_WRITE_PHRASE,
} from "./exportBatchReviewManualFormalWriteToObsidian.js";
import { runBatchReviewManualFormalWriteReadinessPreview } from "./runBatchReviewManualFormalWriteReadinessPreview.js";
import {
  buildManualFormalWriteExecutionPrecheck,
  buildManualFormalWriteExecutionPrecheckMarkdown,
} from "../domain/review/buildManualFormalWriteExecutionPrecheck.js";

const __filename = fileURLToPath(import.meta.url);
const appRoot = join(dirname(__filename), "..", "..");
const outputDir = join(
  appRoot,
  "outputs",
  "batch-review-manual-formal-write",
  "manual-formal-write-execution-precheck",
);
const jsonPath = join(outputDir, "manual-formal-write-execution-precheck.json");
const markdownPath = join(outputDir, "manual-formal-write-execution-precheck.md");

export async function runManualFormalWriteExecutionPrecheckStatus() {
  const readiness = await runBatchReviewManualFormalWriteReadinessPreview();
  const precheck = buildManualFormalWriteExecutionPrecheck({
    readiness,
    confirmationPhrase: BATCH_REVIEW_MANUAL_FORMAL_WRITE_PHRASE,
    sourcePaths: {
      json: jsonPath,
      markdown: markdownPath,
      safePreview: readiness.latestSafeWriteStatus?.targetPath || "",
      targetRecord: readiness.latestSafeWriteStatus?.parsed?.targetPath || "",
    },
  });
  const markdown = buildManualFormalWriteExecutionPrecheckMarkdown(precheck);

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(precheck, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, `${markdown}\n`, "utf-8");

  return precheck;
}
