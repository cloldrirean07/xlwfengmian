import { runPlatformCaseFillDraft } from "./runPlatformCaseFillDraft.js";
import { buildPlatformCasePriorityDrafts } from "../domain/cases/buildPlatformCasePriorityDrafts.js";
import { buildPlatformCasePriorityDraftsMarkdown } from "../domain/cases/buildPlatformCasePriorityDraftsMarkdown.js";

export async function runPlatformCasePriorityDrafts({
  platformCaseId,
  obsidianRoot = "",
  notePath = "",
}) {
  if (!platformCaseId) {
    throw new Error('runPlatformCasePriorityDrafts requires "platformCaseId".');
  }

  const fillDraft = await runPlatformCaseFillDraft({
    platformCaseId,
    obsidianRoot,
    notePath,
  });
  const review = {
    ...fillDraft.review,
    candidateSuggestions: fillDraft.candidateSuggestions,
    actionPlan: {
      ...fillDraft.review.actionPlan,
      tasks: fillDraft.review.actionPlan.tasks.map((task) => ({
        ...task,
        candidateSuggestion: fillDraft.candidateSuggestions.tasks.find(
          (item) => item.label === task.label,
        )?.suggestion,
      })),
    },
  };
  const drafts = buildPlatformCasePriorityDrafts(review);
  const draftsMarkdown = buildPlatformCasePriorityDraftsMarkdown({
    platformCaseId,
    drafts,
    notePath: fillDraft.review.notePath,
  });

  return {
    platformCaseId,
    review: fillDraft.review,
    drafts,
    draftsMarkdown,
  };
}
