function normalizeEligibleRow(result, review) {
  const selectedCard = result.analysis?.cards?.find(
    (card) => card.cardId === result.refinement?.adjustment?.selectedCardId,
  );

  return {
    caseId: result.caseMeta?.id || review.caseId || "unknown",
    title: result.caseMeta?.title || "未知标题",
    platform: result.caseMeta?.platform || "",
    sourceType: result.caseMeta?.sourceType || "",
    ruleVersion:
      result.refinement?.ruleMeta?.version || result.analysis?.ruleMeta?.version || "unknown",
    negativeMappingId: result.refinement?.adjustment?.feedbackMappingId || "unknown",
    positiveMappingId: result.refinement?.adjustment?.feedbackPositiveMappingId || "",
    matchedKeywords: result.refinement?.adjustment?.feedbackMatchedKeywords || [],
    systemIssue: result.refinement?.adjustment?.feedbackMappedIssuePrimary || "",
    systemAction: result.refinement?.adjustment?.feedbackAction || "",
    explanationSummary: result.refinement?.mappingExplanation?.summary || "",
    sourceDirectionLabel: selectedCard?.directionLabelUserFacing || "",
    sourceDirectionType: selectedCard?.directionTypeInternal || "",
    sourceMatchedSignals:
      selectedCard?.directionSignalChecklist?.matchedSignals?.length
        ? selectedCard.directionSignalChecklist.matchedSignals
        : selectedCard?.signalMatches || [],
    sourceBoundaryRules:
      selectedCard?.directionSignalChecklist?.boundaryRules?.length
        ? selectedCard.directionSignalChecklist.boundaryRules
        : selectedCard?.boundaryRule
          ? [selectedCard.boundaryRule]
          : [],
    actualIssue: review.actualIssue || "",
    suggestedKeyword: review.suggestedKeyword || "",
    suggestedMappingId: review.suggestedMappingId || "",
    suggestedPositiveSignalId: review.suggestedPositiveSignalId || "",
    fallbackAdjustment: review.fallbackAdjustment || "",
    reviewStatus: review.reviewStatus || "pending",
    explanationStatus: review.explanationStatus || "pending",
  };
}

export function buildReviewedMisclassifiedExportReport(results, reviewRows) {
  const resultMap = new Map(
    results
      .filter((result) => result?.caseMeta?.id)
      .map((result) => [result.caseMeta.id, result]),
  );

  const eligibleReviews = reviewRows.filter(
    (review) =>
      review.caseId &&
      review.reviewStatus === "misclassified" &&
      review.shouldExportToMisclassified === "yes",
  );

  const rows = eligibleReviews
    .map((review) => {
      const result = resultMap.get(review.caseId);

      if (!result) {
        return {
          caseId: review.caseId,
          title: "未知标题",
          platform: "",
          ruleVersion: "unknown",
          negativeMappingId: "unknown",
          positiveMappingId: "",
          matchedKeywords: [],
          systemIssue: "",
          systemAction: "",
          explanationSummary: "",
          sourceDirectionLabel: "",
          sourceDirectionType: "",
          sourceMatchedSignals: [],
          sourceBoundaryRules: [],
          actualIssue: review.actualIssue || "",
          suggestedKeyword: review.suggestedKeyword || "",
          suggestedMappingId: review.suggestedMappingId || "",
          suggestedPositiveSignalId: review.suggestedPositiveSignalId || "",
          fallbackAdjustment: review.fallbackAdjustment || "",
          reviewStatus: review.reviewStatus || "pending",
          explanationStatus: review.explanationStatus || "pending",
          missingCaseRun: true,
        };
      }

      return {
        ...normalizeEligibleRow(result, review),
        missingCaseRun: false,
      };
    })
    .sort((left, right) => left.caseId.localeCompare(right.caseId, "zh-CN"));

  return {
    summary: {
      totalReviewedRows: reviewRows.length,
      eligibleExportCount: rows.length,
      missingCaseRunCount: rows.filter((row) => row.missingCaseRun).length,
    },
    rows,
  };
}
