import { buildBatchReviewManualWritebackDraftMarkdown } from "../domain/review/buildBatchReviewManualWritebackDraftMarkdown.js";
import { runBatchReviewManualBackfillPreview } from "./runBatchReviewManualBackfillPreview.js";

export async function runBatchReviewManualWritebackDraftPreview({ obsidianRoot = "" } = {}) {
  const backfillPreviewResult = await runBatchReviewManualBackfillPreview({ obsidianRoot });
  const writebackDraftMarkdown = buildBatchReviewManualWritebackDraftMarkdown({
    backfillPreview: backfillPreviewResult.report,
    latestTaskCardStatus: backfillPreviewResult.latestTaskCardStatus,
    latestRunRecordStatus: backfillPreviewResult.latestRunRecordStatus,
  });

  return {
    report: backfillPreviewResult.report,
    writebackDraftMarkdown,
    latestTaskCardStatus: backfillPreviewResult.latestTaskCardStatus,
    latestRunRecordStatus: backfillPreviewResult.latestRunRecordStatus,
    manualTaskPreview: backfillPreviewResult.manualTaskPreview,
    backfillMarkdown: backfillPreviewResult.backfillMarkdown,
  };
}
