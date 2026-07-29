import { createAnalysisSession } from "./createAnalysisSession.js";
import { createRefinementSession } from "./createRefinementSession.js";
import { buildPromptPreview } from "../domain/prompt/buildPromptPreview.js";

export function createPromptPreview(payload) {
  const analysis = payload.analysis || createAnalysisSession(payload);

  if (!payload.selectedCardId || !payload.feedback) {
    return buildPromptPreview({ analysis });
  }

  const refinement = createRefinementSession({
    analysis,
    selectedCardId: payload.selectedCardId,
    feedback: payload.feedback,
    preserveElement: payload.preserveElement,
    workspaceResult: payload.workspaceResult,
  });

  return buildPromptPreview({ analysis, refinement });
}
