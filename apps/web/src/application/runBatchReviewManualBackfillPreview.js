import { buildBatchReviewManualBackfillMarkdown } from "../domain/review/buildBatchReviewManualBackfillMarkdown.js";
import { loadLatestBatchReviewManualTaskCardStatus } from "./loadLatestBatchReviewManualTaskCardStatus.js";
import { loadLatestRealCaseBatchRunManualReviewStatus } from "./loadLatestRealCaseBatchRunManualReviewStatus.js";
import { runBatchReviewManualTaskCardPreview } from "./runBatchReviewManualTaskCardPreview.js";

export async function runBatchReviewManualBackfillPreview({ obsidianRoot = "" } = {}) {
  const manualTaskPreview = await runBatchReviewManualTaskCardPreview({ obsidianRoot });
  const latestTaskCardStatus =
    manualTaskPreview.latestTaskCardStatus || (await loadLatestBatchReviewManualTaskCardStatus());
  const targetBatchLabel = manualTaskPreview.backfillPreview?.targetBatchLabel || "";
  const latestRunRecordStatus = targetBatchLabel
    ? await loadLatestRealCaseBatchRunManualReviewStatus(targetBatchLabel)
    : null;
  const backfillMarkdown = buildBatchReviewManualBackfillMarkdown({
    backfillPreview: manualTaskPreview.backfillPreview,
    latestTaskCardStatus,
    latestRunRecordStatus,
  });

  return {
    report: manualTaskPreview.backfillPreview,
    backfillMarkdown,
    latestTaskCardStatus,
    latestRunRecordStatus,
    manualTaskPreview,
  };
}
