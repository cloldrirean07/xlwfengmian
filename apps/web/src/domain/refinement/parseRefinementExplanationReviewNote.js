function getValue(markdown, label) {
  const match = markdown.match(new RegExp(`-\\s+${label}:\\s*(.*)`));
  return (match?.[1] || "").trim();
}

export function parseRefinementExplanationReviewNote(markdown) {
  return {
    caseId: getValue(markdown, "review_case_id"),
    reviewStatus: getValue(markdown, "review_status") || "pending",
    explanationStatus: getValue(markdown, "explanation_status") || "pending",
    misclassified: getValue(markdown, "misclassified") || "pending",
    shouldExportToMisclassified:
      getValue(markdown, "should_export_to_misclassified") || "pending",
    actualIssue: getValue(markdown, "actual_issue"),
    suggestedKeyword: getValue(markdown, "suggested_keyword"),
    suggestedMappingId: getValue(markdown, "suggested_mapping_id"),
    suggestedPositiveSignalId: getValue(markdown, "suggested_positive_signal_id"),
    fallbackAdjustment: getValue(markdown, "fallback_adjustment"),
  };
}
