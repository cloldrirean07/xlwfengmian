import { mapFeedbackToAdjustment } from "../domain/refinement/mapFeedbackToAdjustment.js";
import { buildSecondRoundCard } from "../domain/refinement/buildSecondRoundCard.js";
import { buildFeedbackMappingExplanation } from "../domain/refinement/buildFeedbackMappingExplanation.js";
import { buildWorkspaceRefinementContext } from "../domain/refinement/buildWorkspaceRefinementContext.js";
import { getRuleCatalogMeta } from "../infrastructure/rules/loadRuleCatalog.js";

export function createRefinementSession(payload) {
  const selectedCard = payload.analysis?.cards?.find((card) => card.cardId === payload.selectedCardId);

  if (!selectedCard) {
    throw new Error("Selected card was not found in the first-round analysis.");
  }

  const adjustment = mapFeedbackToAdjustment({
    selectedCard,
    feedback: payload.feedback,
    preserveElement: payload.preserveElement,
    workspaceContext: buildWorkspaceRefinementContext(payload.workspaceResult),
  });

  const secondRound = buildSecondRoundCard({
    selectedCard,
    adjustment,
  });
  const ruleMeta = getRuleCatalogMeta();
  const mappingExplanation = buildFeedbackMappingExplanation({
    adjustment,
    ruleMeta,
  });

  return {
    ruleMeta,
    adjustment,
    mappingExplanation,
    sourceCard: selectedCard,
    secondRound,
  };
}
