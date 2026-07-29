import { prepareRealCaseScaffold } from "./prepareRealCaseScaffold.js";
import { loadRealCaseIndex } from "../infrastructure/cases/loadRealCaseIndex.js";

export async function createRealCaseScaffoldPreview(payload) {
  const currentIndex = await loadRealCaseIndex();
  return prepareRealCaseScaffold({
    currentIndex,
    ...payload,
  });
}
