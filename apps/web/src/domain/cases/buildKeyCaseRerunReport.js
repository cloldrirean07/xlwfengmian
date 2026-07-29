function buildRerunRow(result, outputDir) {
  const topCard = result.analysis?.cards?.[0];

  return {
    caseId: result.caseMeta?.id || "unknown",
    title: result.caseMeta?.title || "未知标题",
    sourceType: result.caseMeta?.sourceType || "",
    platform: result.caseMeta?.platform || "",
    ruleVersion: result.analysis?.ruleMeta?.version || "unknown",
    topDirectionLabel: topCard?.directionLabelUserFacing || "",
    topDirectionType: topCard?.directionTypeInternal || "",
    topMatchedSignals: topCard?.directionSignalChecklist?.matchedSignals || topCard?.signalMatches || [],
    selectedCardId: result.refinement?.adjustment?.selectedCardId || "",
    selectedDirectionLabel:
      result.analysis?.cards?.find(
        (card) => card.cardId === result.refinement?.adjustment?.selectedCardId,
      )?.directionLabelUserFacing || "",
    refinementMappingId: result.refinement?.adjustment?.feedbackMappingId || "",
    outputDir,
  };
}

export function buildKeyCaseRerunReport({
  generatedAt,
  plan,
  rerunResults,
  downstreamReports,
}) {
  const rows = rerunResults.map((item) => buildRerunRow(item.result, item.outputDir));

  return {
    meta: {
      generatedAt,
      planId: plan.planId || "unknown",
      description: plan.description || "",
      caseIds: plan.caseIds || [],
      downstreamRefreshTargets: plan.downstreamRefreshTargets || [],
    },
    summary: {
      plannedCaseCount: plan.caseIds?.length || 0,
      rerunCaseCount: rows.length,
      sampleCaseCount: rows.filter((row) => row.sourceType === "sample").length,
      realCaseCount: rows.filter((row) => row.sourceType === "real").length,
    },
    rows,
    downstreamReports,
  };
}
