import { createAnalysisSession } from "./createAnalysisSession.js";
import { createLlmDraft } from "./createLlmDraft.js";
import { createPromptPreview } from "./createPromptPreview.js";
import { createRefinementSession } from "./createRefinementSession.js";
import { loadCaseById } from "../infrastructure/cases/loadCases.js";

export async function runCaseFlow(caseId) {
  const selectedCase = await loadCaseById(caseId);

  if (!selectedCase) {
    throw new Error(`Case not found: ${caseId}`);
  }

  const analysis = createAnalysisSession(selectedCase);
  const promptPreviewFirstRound = createPromptPreview({ analysis });
  const llmDraftFirstRound = await createLlmDraft({ analysis });

  const refinement = createRefinementSession({
    analysis,
    ...selectedCase.mockUserSelection,
  });

  const promptPreviewSecondRound = createPromptPreview({
    analysis,
    ...selectedCase.mockUserSelection,
  });

  const llmDraftSecondRound = await createLlmDraft({
    analysis,
    ...selectedCase.mockUserSelection,
  });

  return {
    caseMeta: {
      id: selectedCase.id,
      title: selectedCase.title,
      platform: selectedCase.platform,
      sourceType: selectedCase.sourceType,
    },
    analysis,
    promptPreviewFirstRound,
    llmDraftFirstRound,
    refinement,
    promptPreviewSecondRound,
    llmDraftSecondRound,
  };
}
