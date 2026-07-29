function normalizeCaseSnapshot(result, outputDir = "") {
  if (!result) {
    return null;
  }

  const topCard = result.analysis?.cards?.[0];
  const selectedCard = result.analysis?.cards?.find(
    (card) => card.cardId === result.refinement?.adjustment?.selectedCardId,
  );

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
    selectedDirectionLabel: selectedCard?.directionLabelUserFacing || "",
    refinementMappingId: result.refinement?.adjustment?.feedbackMappingId || "",
    outputDir,
  };
}

function arrayChanged(before = [], after = []) {
  return JSON.stringify(before) !== JSON.stringify(after);
}

function fieldChanged(before, after) {
  return (before || "") !== (after || "");
}

function buildCaseDiffRow(caseId, beforeResult, afterResult, outputDir) {
  const before = normalizeCaseSnapshot(beforeResult, outputDir);
  const after = normalizeCaseSnapshot(afterResult, outputDir);

  if (!before && !after) {
    return null;
  }

  const changes = [];

  if (fieldChanged(before?.ruleVersion, after?.ruleVersion)) {
    changes.push({
      field: "ruleVersion",
      label: "规则版本",
      before: before?.ruleVersion || "无",
      after: after?.ruleVersion || "无",
    });
  }

  if (fieldChanged(before?.topDirectionLabel, after?.topDirectionLabel)) {
    changes.push({
      field: "topDirectionLabel",
      label: "首轮主方向",
      before: before?.topDirectionLabel || "无",
      after: after?.topDirectionLabel || "无",
    });
  }

  if (arrayChanged(before?.topMatchedSignals, after?.topMatchedSignals)) {
    changes.push({
      field: "topMatchedSignals",
      label: "首轮命中信号",
      before: before?.topMatchedSignals?.join(" / ") || "无",
      after: after?.topMatchedSignals?.join(" / ") || "无",
    });
  }

  if (fieldChanged(before?.selectedDirectionLabel, after?.selectedDirectionLabel)) {
    changes.push({
      field: "selectedDirectionLabel",
      label: "二轮选中方向",
      before: before?.selectedDirectionLabel || "无",
      after: after?.selectedDirectionLabel || "无",
    });
  }

  if (fieldChanged(before?.refinementMappingId, after?.refinementMappingId)) {
    changes.push({
      field: "refinementMappingId",
      label: "当前负向映射",
      before: before?.refinementMappingId || "无",
      after: after?.refinementMappingId || "无",
    });
  }

  return {
    caseId,
    title: after?.title || before?.title || "未知标题",
    sourceType: after?.sourceType || before?.sourceType || "",
    platform: after?.platform || before?.platform || "",
    outputDir,
    before,
    after,
    changeCount: changes.length,
    changes,
  };
}

function buildDownstreamDiff(beforeReport, afterReport, field, label) {
  const beforeValue = beforeReport?.summary?.[field] ?? 0;
  const afterValue = afterReport?.summary?.[field] ?? 0;

  return {
    field,
    label,
    before: beforeValue,
    after: afterValue,
    changed: beforeValue !== afterValue,
  };
}

export function buildKeyCaseRerunDiffReport({
  generatedAt,
  plan,
  beforeResultsByCaseId,
  afterResultsByCaseId,
  outputDirsByCaseId,
  downstreamBefore,
  downstreamAfter,
}) {
  const caseDiffRows = (plan.caseIds || [])
    .map((caseId) =>
      buildCaseDiffRow(
        caseId,
        beforeResultsByCaseId[caseId] || null,
        afterResultsByCaseId[caseId] || null,
        outputDirsByCaseId[caseId] || "",
      ),
    )
    .filter(Boolean);

  const downstreamDiffs = [
    buildDownstreamDiff(
      downstreamBefore.reviewedMisclassified,
      downstreamAfter.reviewedMisclassified,
      "eligibleExportCount",
      "可导出误判样本数",
    ),
    buildDownstreamDiff(
      downstreamBefore.ruleRevisionTaskSheet,
      downstreamAfter.ruleRevisionTaskSheet,
      "taskCount",
      "规则修订任务数",
    ),
  ];

  return {
    meta: {
      generatedAt,
      planId: plan.planId || "unknown",
      caseIds: plan.caseIds || [],
    },
    summary: {
      comparedCaseCount: caseDiffRows.length,
      changedCaseCount: caseDiffRows.filter((row) => row.changeCount > 0).length,
      unchangedCaseCount: caseDiffRows.filter((row) => row.changeCount === 0).length,
      downstreamChangedCount: downstreamDiffs.filter((item) => item.changed).length,
    },
    caseDiffRows,
    downstreamDiffs,
  };
}
