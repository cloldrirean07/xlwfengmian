import { runPlatformCaseReview } from "./runPlatformCaseReview.js";
import { buildPlatformCaseFillDraft } from "../domain/cases/buildPlatformCaseFillDraft.js";
import { buildPlatformCaseCandidateSuggestions } from "../domain/cases/buildPlatformCaseCandidateSuggestions.js";

export async function runPlatformCaseFillDraft({
  platformCaseId,
  obsidianRoot = "",
  notePath = "",
}) {
  if (!platformCaseId) {
    throw new Error('runPlatformCaseFillDraft requires "platformCaseId".');
  }

  const review = await runPlatformCaseReview({
    platformCaseId,
    obsidianRoot,
    notePath,
  });
  const candidateSuggestions = buildPlatformCaseCandidateSuggestions(review);
  const fillDraftMarkdown = buildPlatformCaseFillDraft({
    ...review,
    candidateSuggestions,
  });

  return {
    platformCaseId,
    review,
    candidateSuggestions,
    fillDraftMarkdown,
  };
}
