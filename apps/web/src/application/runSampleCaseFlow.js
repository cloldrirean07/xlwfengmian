import { runCaseFlow } from "./runCaseFlow.js";

export async function runSampleCaseFlow(sampleCaseId) {
  const result = await runCaseFlow(sampleCaseId);
  return {
    sampleCase: result.caseMeta,
    analysis: result.analysis,
    promptPreviewFirstRound: result.promptPreviewFirstRound,
    llmDraftFirstRound: result.llmDraftFirstRound,
    refinement: result.refinement,
    promptPreviewSecondRound: result.promptPreviewSecondRound,
    llmDraftSecondRound: result.llmDraftSecondRound,
  };
}
