export function buildWorkspaceRefinementContext(workspaceResult) {
  const suggestion = workspaceResult?.suggestion;

  if (!suggestion) {
    return null;
  }

  return {
    workspaceId: workspaceResult.workspace?.workspaceId || suggestion.workspaceId || "unknown",
    summary: suggestion.summary,
    refinedTask: suggestion.refinedTask,
    nextSuggestion: suggestion.nextSuggestion,
    draftPromptLine: suggestion.draftPromptLine,
    recommendedFollowUp: suggestion.recommendedFollowUp,
  };
}
