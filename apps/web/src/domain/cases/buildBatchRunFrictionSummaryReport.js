import { batchRunManualReviewKeyFields } from "./batchRunManualReviewKeyFields.js";

function rankCategoryRows(categoryStats) {
  return Object.values(categoryStats)
    .sort((left, right) => {
      if (right.batchCount !== left.batchCount) {
        return right.batchCount - left.batchCount;
      }

      return right.averagePriorityScore - left.averagePriorityScore;
    })
    .map((item, index) => ({
      rank: index + 1,
      categoryId: item.categoryId,
      label: item.label,
      batchCount: item.batchCount,
      averagePriorityScore: Number((item.totalPriorityScore / item.batchCount).toFixed(1)),
      whyItMatters: item.whyItMatters,
      latestPriorityReason: item.latestPriorityReason,
    }));
}

function rankActionRows(actionStats) {
  return Object.values(actionStats)
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return right.maxPriorityScore - left.maxPriorityScore;
    })
    .map((item, index) => ({
      rank: index + 1,
      label: item.label,
      count: item.count,
      maxPriorityScore: item.maxPriorityScore,
      latestPriorityReason: item.latestPriorityReason,
    }));
}

function resolveUiDiscussionSignal({ totalBatches, repeatedCategories }) {
  if (totalBatches >= 3 && repeatedCategories >= 2) {
    return {
      status: "strong-signal",
      label: "可以开始系统讨论 UI 优化",
      reason: "已经有多批次重复摩擦点，UI 讨论更可能建立在稳定证据上。",
    };
  }

  if (totalBatches >= 2 && repeatedCategories >= 1) {
    return {
      status: "emerging-signal",
      label: "接近可以讨论 UI 优化",
      reason: "已经开始出现跨批次重复摩擦点，但证据还不算非常稳。",
    };
  }

  return {
    status: "insufficient-signal",
    label: "暂不建议正式讨论 UI 优化",
    reason: "当前批次还太少，或重复摩擦点还不够明显。",
  };
}

export function buildBatchRunFrictionSummaryReport({ batchRunRecords }) {
  const rows = (batchRunRecords || []).filter(Boolean);
  const categoryStats = {};
  const actionStats = {};
  const manualReviewStats = {
    reviewedBatchCount: 0,
    missingManualReviewCount: 0,
    fullyCoveredBatchCount: 0,
    partiallyCoveredBatchCount: 0,
    issueTypeCounts: {},
    uiTimingCounts: {},
    prioritizedModuleCounts: {},
    keyFieldCoverage: {},
    pendingBatchRows: [],
    latestManualConclusions: [],
  };
  let totalCases = 0;
  let worksheetMissingCount = 0;

  for (const record of rows) {
    totalCases += Number(record.createdCount || 0);

    if (!record.latestWorksheetHistory?.latestExportStatus) {
      worksheetMissingCount += 1;
    }

    const review = record.manualReview?.review || {};
    const hasManualConclusion = Boolean(record.manualReview?.hasManualConclusion);
    const missingKeyFields = batchRunManualReviewKeyFields
      .filter(({ key }) => !String(review[key] || "").trim())
      .map(({ key, label }) => ({ key, label }));

    if (hasManualConclusion) {
      manualReviewStats.reviewedBatchCount += 1;
      if (missingKeyFields.length === 0) {
        manualReviewStats.fullyCoveredBatchCount += 1;
      } else {
        manualReviewStats.partiallyCoveredBatchCount += 1;
      }

      const issueType = review.issueType || "";
      const uiTiming = review.uiOptimizationTiming || "";
      const prioritizedModule = review.prioritizedModule || "";

      if (issueType) {
        manualReviewStats.issueTypeCounts[issueType] =
          (manualReviewStats.issueTypeCounts[issueType] || 0) + 1;
      }
      if (uiTiming) {
        manualReviewStats.uiTimingCounts[uiTiming] =
          (manualReviewStats.uiTimingCounts[uiTiming] || 0) + 1;
      }
      if (prioritizedModule) {
        manualReviewStats.prioritizedModuleCounts[prioritizedModule] =
          (manualReviewStats.prioritizedModuleCounts[prioritizedModule] || 0) + 1;
      }

      for (const { key, label } of batchRunManualReviewKeyFields) {
        if (!String(review[key] || "").trim()) {
          continue;
        }

        if (!manualReviewStats.keyFieldCoverage[key]) {
          manualReviewStats.keyFieldCoverage[key] = { key, label, count: 0 };
        }

        manualReviewStats.keyFieldCoverage[key].count += 1;
      }

      manualReviewStats.latestManualConclusions.push({
        batchLabel: record.batchLabel,
        bottleneckStep: review.bottleneckStep || "",
        issueType,
        uiOptimizationTiming: uiTiming,
        prioritizedModule,
      });
    }

    if (!hasManualConclusion || missingKeyFields.length) {
      manualReviewStats.pendingBatchRows.push({
        batchLabel: record.batchLabel,
        hasManualConclusion,
        missingKeyFields,
      });
    }

    if (!hasManualConclusion) {
      manualReviewStats.missingManualReviewCount += 1;
    }

    for (const category of record.frictionTemplate || []) {
      if (!categoryStats[category.id]) {
        categoryStats[category.id] = {
          categoryId: category.id,
          label: category.label,
          batchCount: 0,
          totalPriorityScore: 0,
          whyItMatters: category.whyItMatters,
          latestPriorityReason: category.priorityReason,
        };
      }

      categoryStats[category.id].batchCount += 1;
      categoryStats[category.id].totalPriorityScore += Number(category.priorityScore || 0);
      categoryStats[category.id].latestPriorityReason = category.priorityReason;
    }

    for (const action of record.validationSummary?.recommendedBatchActions || []) {
      if (!actionStats[action.label]) {
        actionStats[action.label] = {
          label: action.label,
          count: 0,
          maxPriorityScore: 0,
          latestPriorityReason: action.priorityReason,
        };
      }

      actionStats[action.label].count += 1;
      actionStats[action.label].maxPriorityScore = Math.max(
        actionStats[action.label].maxPriorityScore,
        Number(action.priorityScore || 0),
      );
      actionStats[action.label].latestPriorityReason = action.priorityReason;
    }
  }

  const topCategories = rankCategoryRows(categoryStats);
  const repeatedCategories = topCategories.filter((item) => item.batchCount >= 2).length;

  return {
    summary: {
      totalBatches: rows.length,
      totalCases,
      worksheetMissingCount,
      repeatedCategories,
      reviewedBatchCount: manualReviewStats.reviewedBatchCount,
      missingManualReviewCount: manualReviewStats.missingManualReviewCount,
      fullyCoveredBatchCount: manualReviewStats.fullyCoveredBatchCount,
      partiallyCoveredBatchCount: manualReviewStats.partiallyCoveredBatchCount,
    },
    uiDiscussionSignal: resolveUiDiscussionSignal({
      totalBatches: rows.length,
      repeatedCategories,
    }),
    manualReview: manualReviewStats,
    topCategories,
    topRecommendedActions: rankActionRows(actionStats),
    batchRows: rows.map((record) => ({
      batchLabel: record.batchLabel,
      createdCount: record.createdCount,
      topCategoryLabels: (record.frictionTemplate || []).slice(0, 3).map((item) => item.label),
      topActionLabels: (record.validationSummary?.recommendedBatchActions || [])
        .slice(0, 3)
        .map((item) => item.label),
      hasWorksheetExport: Boolean(record.latestWorksheetHistory?.latestExportStatus),
      worksheetReadbackOk: Boolean(record.latestWorksheetHistory?.latestExportStatus?.readbackOk),
      hasManualConclusion: Boolean(record.manualReview?.hasManualConclusion),
      manualReviewFilledFields: record.manualReview?.filledFields || [],
    })),
  };
}
