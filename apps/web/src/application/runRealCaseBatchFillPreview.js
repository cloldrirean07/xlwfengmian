import { prepareRealCaseBatchScaffold } from "./prepareRealCaseBatchScaffold.js";
import { loadRealCaseIndex } from "../infrastructure/cases/loadRealCaseIndex.js";
import { buildRealCaseBatchValidationSummary } from "../domain/cases/buildRealCaseBatchValidationSummary.js";
import { buildRealCaseBatchFillWorksheetMarkdown } from "../domain/cases/buildRealCaseBatchFillWorksheetMarkdown.js";
import { createRealCaseBatchFillObsidianPreview } from "./createRealCaseBatchFillObsidianPreview.js";

function buildDefaultBatchLabel(preparedBatch) {
  const ids = (preparedBatch.created || []).map((item) => item.id);

  if (!ids.length) {
    return "real-case-batch";
  }

  if (ids.length === 1) {
    return ids[0];
  }

  return `${ids[0]}_to_${ids.at(-1)}`;
}

export async function runRealCaseBatchFillPreview({
  batchItems,
  batchLabel = "",
  obsidianRoot = "",
}) {
  const currentIndex = await loadRealCaseIndex();
  const preparedBatch = prepareRealCaseBatchScaffold({
    currentIndex,
    batchItems,
  });
  const validationSummary = buildRealCaseBatchValidationSummary(preparedBatch);
  const resolvedBatchLabel = batchLabel || buildDefaultBatchLabel(preparedBatch);
  const worksheetMarkdown = buildRealCaseBatchFillWorksheetMarkdown({
    batchLabel: resolvedBatchLabel,
    validationSummary,
  });
  const obsidianDraft = createRealCaseBatchFillObsidianPreview({
    batchLabel: resolvedBatchLabel,
    worksheetMarkdown,
    obsidianRoot,
  });

  return {
    batchLabel: resolvedBatchLabel,
    createdCount: preparedBatch.created.length,
    created: preparedBatch.created.map((item) => ({
      id: item.id,
      title: item.record.title,
      platformCaseId: item.indexEntry.platformCaseId,
    })),
    validationSummary,
    worksheetMarkdown,
    obsidianDraft,
  };
}
