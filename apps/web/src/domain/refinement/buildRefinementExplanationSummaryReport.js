function groupCount(items, key) {
  const map = new Map();

  for (const item of items) {
    const value = item[key] || "unknown";
    map.set(value, (map.get(value) || 0) + 1);
  }

  return [...map.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((left, right) => right.count - left.count || left.id.localeCompare(right.id, "zh-CN"));
}

function normalizeRow(result) {
  const refinement = result.refinement;
  const explanation = refinement?.mappingExplanation;

  return {
    caseId: result.caseMeta?.id || "unknown",
    title: result.caseMeta?.title || "未知标题",
    platform: result.caseMeta?.platform || "",
    sourceType: result.caseMeta?.sourceType || "",
    ruleVersion:
      refinement?.ruleMeta?.version || result.analysis?.ruleMeta?.version || "unknown",
    negativeMappingId: refinement?.adjustment?.feedbackMappingId || "unknown",
    positiveMappingId: refinement?.adjustment?.feedbackPositiveMappingId || "",
    usedFallback: Boolean(refinement?.adjustment?.feedbackUsedFallback),
    workspaceInjected: Boolean(refinement?.adjustment?.workspaceContext),
    matchedKeywords: refinement?.adjustment?.feedbackMatchedKeywords || [],
    summary: explanation?.summary || "",
    selectedCardId: refinement?.adjustment?.selectedCardId || "",
    reviewStatus: "pending",
    explanationStatus: "pending",
    misclassified: "pending",
    shouldExportToMisclassified: "pending",
    actualIssue: "",
    suggestedKeyword: "",
    suggestedMappingId: "",
    suggestedPositiveSignalId: "",
    fallbackAdjustment: "",
  };
}

export function buildRefinementExplanationSummaryReport(results, reviewRows = []) {
  const reviewMap = new Map(
    reviewRows
      .filter((item) => item.caseId)
      .map((item) => [item.caseId, item]),
  );
  const rows = results
    .filter((result) => result?.refinement?.adjustment && result?.refinement?.mappingExplanation)
    .map((result) => {
      const row = normalizeRow(result);
      const review = reviewMap.get(row.caseId);

      return review
        ? {
            ...row,
            reviewStatus: review.reviewStatus,
            explanationStatus: review.explanationStatus,
            misclassified: review.misclassified,
            shouldExportToMisclassified: review.shouldExportToMisclassified,
            actualIssue: review.actualIssue,
            suggestedKeyword: review.suggestedKeyword,
            suggestedMappingId: review.suggestedMappingId,
            suggestedPositiveSignalId: review.suggestedPositiveSignalId,
            fallbackAdjustment: review.fallbackAdjustment,
          }
        : row;
    })
    .sort((left, right) => left.caseId.localeCompare(right.caseId, "zh-CN"));

  const topNegativeMappings = groupCount(rows, "negativeMappingId");
  const topPositiveMappings = groupCount(
    rows.filter((row) => row.positiveMappingId),
    "positiveMappingId",
  );
  const fallbackRows = rows.filter((row) => row.usedFallback);
  const noPositiveSignalRows = rows.filter((row) => !row.positiveMappingId);
  const workspaceInjectedRows = rows.filter((row) => row.workspaceInjected);
  const reasonableRows = rows.filter((row) => row.reviewStatus === "reasonable");
  const misclassifiedRows = rows.filter((row) => row.reviewStatus === "misclassified");
  const exportToMisclassifiedRows = rows.filter(
    (row) => row.shouldExportToMisclassified === "yes",
  );
  const topMisclassifiedMappings = groupCount(misclassifiedRows, "negativeMappingId");

  return {
    summary: {
      totalRows: rows.length,
      uniqueNegativeMappingCount: topNegativeMappings.length,
      uniquePositiveMappingCount: topPositiveMappings.length,
      fallbackCount: fallbackRows.length,
      noPositiveSignalCount: noPositiveSignalRows.length,
      workspaceInjectedCount: workspaceInjectedRows.length,
      reviewedCount: rows.filter((row) => row.reviewStatus !== "pending").length,
      reasonableCount: reasonableRows.length,
      misclassifiedCount: misclassifiedRows.length,
      exportToMisclassifiedCount: exportToMisclassifiedRows.length,
    },
    topNegativeMappings,
    topPositiveMappings,
    topMisclassifiedMappings,
    fallbackRows: fallbackRows.map((row) => ({
      caseId: row.caseId,
      negativeMappingId: row.negativeMappingId,
      title: row.title,
    })),
    noPositiveSignalRows: noPositiveSignalRows.map((row) => ({
      caseId: row.caseId,
      negativeMappingId: row.negativeMappingId,
      title: row.title,
    })),
    workspaceInjectedRows: workspaceInjectedRows.map((row) => ({
      caseId: row.caseId,
      negativeMappingId: row.negativeMappingId,
      title: row.title,
    })),
    misclassifiedRows: misclassifiedRows.map((row) => ({
      caseId: row.caseId,
      negativeMappingId: row.negativeMappingId,
      title: row.title,
      actualIssue: row.actualIssue,
      suggestedMappingId: row.suggestedMappingId,
    })),
    exportToMisclassifiedRows: exportToMisclassifiedRows.map((row) => ({
      caseId: row.caseId,
      negativeMappingId: row.negativeMappingId,
      title: row.title,
    })),
    rows,
  };
}
