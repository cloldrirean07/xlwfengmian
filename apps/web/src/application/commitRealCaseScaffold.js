import { prepareRealCaseScaffold } from "./prepareRealCaseScaffold.js";
import { loadRealCaseIndex } from "../infrastructure/cases/loadRealCaseIndex.js";
import { savePreparedRealCaseScaffold } from "../infrastructure/cases/savePreparedRealCaseScaffold.js";
import { resetCaseCache } from "../infrastructure/cases/loadCases.js";

export async function commitRealCaseScaffold(
  payload,
  {
    loadIndex = loadRealCaseIndex,
    savePrepared = savePreparedRealCaseScaffold,
    onCommitted = resetCaseCache,
  } = {},
) {
  const currentIndex = await loadIndex();
  const prepared = prepareRealCaseScaffold({
    currentIndex,
    ...payload,
  });

  const persisted = await savePrepared({
    currentIndex,
    prepared,
  });

  if (typeof onCommitted === "function") {
    onCommitted();
  }

  return {
    ok: true,
    committedAt: new Date().toISOString(),
    ...prepared,
    ...persisted,
    nextSteps: [
      "补全生成出的 JSON 内容字段",
      "运行 npm run validate:cases",
      "把这条案例纳入真实案例维护链继续回填",
    ],
  };
}
