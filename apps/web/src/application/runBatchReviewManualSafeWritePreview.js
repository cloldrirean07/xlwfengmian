import { readTextFile } from "../shared/fileSystem.js";
import { applyBatchReviewManualWritebackPatch, buildBatchReviewManualWritebackPatch } from "../domain/review/buildBatchReviewManualWritebackPatch.js";
import { buildBatchReviewManualSafeWritePreviewMarkdown } from "../domain/review/buildBatchReviewManualSafeWritePreviewMarkdown.js";
import { runBatchReviewManualWritebackDraftPreview } from "./runBatchReviewManualWritebackDraftPreview.js";

export async function runBatchReviewManualSafeWritePreview({ obsidianRoot = "" } = {}) {
  const writebackDraftPreview = await runBatchReviewManualWritebackDraftPreview({ obsidianRoot });
  const targetPath = writebackDraftPreview.latestRunRecordStatus?.targetPath || "";
  const currentMarkdown = targetPath ? await readTextFile(targetPath) : "";
  const patch = buildBatchReviewManualWritebackPatch({
    backfillPreview: writebackDraftPreview.report,
    latestTaskCardStatus: writebackDraftPreview.latestTaskCardStatus,
    taskCardReport: writebackDraftPreview.manualTaskPreview?.report,
  });
  const patchedMarkdown = applyBatchReviewManualWritebackPatch(currentMarkdown, patch);
  const safeWritePreviewMarkdown = buildBatchReviewManualSafeWritePreviewMarkdown({
    targetBatchLabel: writebackDraftPreview.report?.targetBatchLabel || "",
    targetPath,
    patch,
    currentMarkdown,
    patchedMarkdown,
  });

  return {
    report: writebackDraftPreview.report,
    patch,
    targetPath,
    currentMarkdown,
    patchedMarkdown,
    safeWritePreviewMarkdown,
    latestTaskCardStatus: writebackDraftPreview.latestTaskCardStatus,
    latestRunRecordStatus: writebackDraftPreview.latestRunRecordStatus,
    writebackDraftMarkdown: writebackDraftPreview.writebackDraftMarkdown,
  };
}
