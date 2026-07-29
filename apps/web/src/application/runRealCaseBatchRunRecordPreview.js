import { runRealCaseBatchFillPreview } from "./runRealCaseBatchFillPreview.js";
import { loadRealCaseBatchFillWorksheetHistory } from "./loadRealCaseBatchFillWorksheetHistory.js";
import { loadLatestRealCaseBatchRunManualReviewStatus } from "./loadLatestRealCaseBatchRunManualReviewStatus.js";
import { buildBatchRunFrictionTemplate } from "../domain/cases/buildBatchRunFrictionTemplate.js";
import { buildBatchRunManualReviewGuide } from "../domain/cases/buildBatchRunManualReviewGuide.js";
import { buildRealCaseBatchRunRecordMarkdown } from "../domain/cases/buildRealCaseBatchRunRecordMarkdown.js";
import { createRealCaseBatchRunRecordObsidianPreview } from "./createRealCaseBatchRunRecordObsidianPreview.js";

export async function runRealCaseBatchRunRecordPreview({
  batchItems,
  batchLabel = "",
  obsidianRoot = "",
}) {
  const batchPreview = await runRealCaseBatchFillPreview({
    batchItems,
    batchLabel,
    obsidianRoot,
  });
  const history = await loadRealCaseBatchFillWorksheetHistory({
    batchItems,
    batchLabel: batchPreview.batchLabel,
  });
  const frictionTemplate = buildBatchRunFrictionTemplate({
    validationSummary: batchPreview.validationSummary,
    latestWorksheetHistory: history,
  });
  const manualReviewGuide = buildBatchRunManualReviewGuide({
    frictionTemplate,
    validationSummary: batchPreview.validationSummary,
    latestWorksheetHistory: history,
  });
  const latestManualReviewStatus = await loadLatestRealCaseBatchRunManualReviewStatus(
    history.normalizedLabel,
  );
  const runRecordMarkdown = buildRealCaseBatchRunRecordMarkdown({
    batchLabel: batchPreview.batchLabel,
    created: batchPreview.created,
    validationSummary: batchPreview.validationSummary,
    latestWorksheetHistory: history,
    frictionTemplate,
    manualReviewGuide,
    latestManualReviewStatus,
  });
  const obsidianDraft = createRealCaseBatchRunRecordObsidianPreview({
    batchLabel: batchPreview.batchLabel,
    runRecordMarkdown,
    obsidianRoot,
  });

  return {
    batchLabel: batchPreview.batchLabel,
    createdCount: batchPreview.createdCount,
    created: batchPreview.created,
    validationSummary: batchPreview.validationSummary,
    latestWorksheetHistory: history,
    frictionTemplate,
    manualReviewGuide,
    latestManualReviewStatus,
    runRecordMarkdown,
    obsidianDraft,
  };
}
