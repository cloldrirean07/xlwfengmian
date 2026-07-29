import { prepareRealCaseBatchScaffold } from "./prepareRealCaseBatchScaffold.js";
import { buildRealCaseBatchValidationSummary } from "../domain/cases/buildRealCaseBatchValidationSummary.js";
import { loadRealCaseIndex } from "../infrastructure/cases/loadRealCaseIndex.js";
import { savePreparedRealCaseBatchScaffold } from "../infrastructure/cases/savePreparedRealCaseBatchScaffold.js";
import { resetCaseCache } from "../infrastructure/cases/loadCases.js";

export async function commitRealCaseBatchScaffold(
  payload,
  {
    loadIndex = loadRealCaseIndex,
    savePrepared = savePreparedRealCaseBatchScaffold,
    onCommitted = resetCaseCache,
  } = {},
) {
  const currentIndex = await loadIndex();
  const preparedBatch = prepareRealCaseBatchScaffold({
    currentIndex,
    batchItems: payload?.batchItems,
  });

  const persisted = await savePrepared({
    currentIndex,
    preparedBatch,
  });

  if (typeof onCommitted === "function") {
    onCommitted();
  }

  return {
    ok: true,
    committedAt: new Date().toISOString(),
    createdCount: preparedBatch.created.length,
    created: preparedBatch.created,
    validationSummary: buildRealCaseBatchValidationSummary(preparedBatch),
    ...persisted,
    nextSteps: [
      "优先补齐高优先级案例的内容与素材字段",
      "运行 npm run validate:cases 确认案例结构稳定",
      "从真实案例列表继续进入回填、同步和 Obsidian 导出链路",
    ],
  };
}
