import { prepareRealCaseBatchScaffold } from "./prepareRealCaseBatchScaffold.js";
import { loadRealCaseIndex } from "../infrastructure/cases/loadRealCaseIndex.js";
import { buildRealCaseBatchValidationSummary } from "../domain/cases/buildRealCaseBatchValidationSummary.js";

export async function createRealCaseBatchScaffoldPreview(payload) {
  const currentIndex = await loadRealCaseIndex();
  const preparedBatch = prepareRealCaseBatchScaffold({
    currentIndex,
    batchItems: payload?.batchItems,
  });

  return {
    ...preparedBatch,
    validationSummary: buildRealCaseBatchValidationSummary(preparedBatch),
  };
}
