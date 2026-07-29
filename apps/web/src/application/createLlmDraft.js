import { createAnalysisSession } from "./createAnalysisSession.js";
import { createPromptPreview } from "./createPromptPreview.js";
import { createRefinementSession } from "./createRefinementSession.js";
import {
  normalizeFirstRoundDraft,
  normalizeSecondRoundDraft,
} from "../domain/schema/normalizeLlmDraft.js";
import {
  validateFirstRoundDraftOutput,
  validateSecondRoundDraftOutput,
} from "../domain/schema/validateLlmDraftOutput.js";
import { buildLlmRequestContext } from "../infrastructure/llm/buildLlmRequestContext.js";
import { createLlmProvider } from "../infrastructure/llm/createLlmProvider.js";
import { validateLlmRequest } from "../infrastructure/llm/validateLlmRequest.js";

export async function createLlmDraft(payload) {
  const analysis = payload.analysis || createAnalysisSession(payload);
  const promptPreview = createPromptPreview(payload.analysis ? payload : { ...payload, analysis });
  const requestContext = buildLlmRequestContext(payload);

  validateLlmRequest({
    analysis,
    selectedCardId: payload.selectedCardId,
    feedback: payload.feedback,
    provider: requestContext.provider,
    model: requestContext.model,
  });

  const provider = createLlmProvider(requestContext);

  if (!payload.selectedCardId || !payload.feedback) {
    const firstRoundDraftRaw = await provider.generateFirstRoundDraft({
      prompt: promptPreview.firstRoundPrompt,
      analysis,
    });
    const firstRoundDraft = normalizeFirstRoundDraft(firstRoundDraftRaw);
    validateFirstRoundDraftOutput(firstRoundDraft);

    return {
      provider: provider.name,
      mode: "first-round",
      requestContext,
      promptPreview,
      analysis,
      llmDraft: firstRoundDraft,
    };
  }

  const refinement = createRefinementSession({
    analysis,
    selectedCardId: payload.selectedCardId,
    feedback: payload.feedback,
    preserveElement: payload.preserveElement,
    workspaceResult: payload.workspaceResult,
  });

  const secondRoundDraftRaw = await provider.generateSecondRoundDraft({
    prompt: promptPreview.secondRoundPrompt,
    refinement,
  });
  const secondRoundDraft = normalizeSecondRoundDraft(secondRoundDraftRaw);
  validateSecondRoundDraftOutput(secondRoundDraft);

  return {
    provider: provider.name,
    mode: "full",
    requestContext,
    promptPreview,
    analysis,
    refinement,
    llmDraft: secondRoundDraft,
  };
}
