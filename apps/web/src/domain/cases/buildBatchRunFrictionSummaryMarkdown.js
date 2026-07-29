export function buildBatchRunFrictionSummaryMarkdown(report) {
  const lines = [
    "# 跨批次摩擦点汇总",
    "",
    "## 1. 当前判断",
    `- 当前状态：${report.uiDiscussionSignal.label}`,
    `- signal_status：${report.uiDiscussionSignal.status}`,
    `- 判断原因：${report.uiDiscussionSignal.reason}`,
    "",
    "## 2. 汇总",
    `- 批次数：${report.summary.totalBatches}`,
    `- 案例总数：${report.summary.totalCases}`,
    `- 重复摩擦点类别数：${report.summary.repeatedCategories}`,
    `- 缺少工作单导出记录的批次数：${report.summary.worksheetMissingCount}`,
    `- 已填写人工结论的批次数：${report.summary.reviewedBatchCount}`,
    `- 完全未写人工结论的批次数：${report.summary.missingManualReviewCount || 0}`,
    `- 关键人工字段已完整覆盖批次数：${report.summary.fullyCoveredBatchCount || 0}`,
    `- 关键人工字段仍未补齐批次数：${report.summary.partiallyCoveredBatchCount || 0}`,
    "",
    "## 3. 最常重复的摩擦点类别",
  ];

  for (const item of report.topCategories.slice(0, 5)) {
    lines.push(`- ${item.label}：出现在 ${item.batchCount} 批 / 平均优先分 ${item.averagePriorityScore}`);
    lines.push(`  - 为什么重要：${item.whyItMatters}`);
    lines.push(`  - 最近优先原因：${item.latestPriorityReason}`);
  }

  lines.push("", "## 4. 最常重复的推荐动作");
  for (const item of report.topRecommendedActions.slice(0, 5)) {
    lines.push(`- ${item.label}：出现 ${item.count} 次 / 最高优先分 ${item.maxPriorityScore}`);
    lines.push(`  - 最近原因：${item.latestPriorityReason}`);
  }

  lines.push("", "## 5. 各批次对照");
  for (const row of report.batchRows) {
    lines.push(`- ${row.batchLabel}：${row.createdCount} 条案例 / 工作单导出${row.hasWorksheetExport ? (row.worksheetReadbackOk ? "已确认" : "待确认") : "缺失"}`);
    lines.push(`  - 摩擦点前 3：${row.topCategoryLabels.join(" / ") || "暂无"}`);
    lines.push(`  - 推荐动作前 3：${row.topActionLabels.join(" / ") || "暂无"}`);
  }

  lines.push("", "## 6. 人工试跑结论回看");
  if (report.manualReview?.reviewedBatchCount) {
    lines.push(`- 已填写人工结论批次数：${report.manualReview.reviewedBatchCount}`);
    for (const item of report.manualReview.latestManualConclusions.slice(0, 5)) {
      lines.push(`- ${item.batchLabel}：最卡环节 ${item.bottleneckStep || "待补"} / 问题类型 ${item.issueType || "待补"} / UI 时机 ${item.uiOptimizationTiming || "待补"}`);
    }
  } else {
    lines.push("- 当前还没有已填写的人工试跑结论。");
  }

  lines.push("", "## 7. 人工补充优先级");
  if (report.manualReview?.keyFieldCoverage && Object.keys(report.manualReview.keyFieldCoverage).length) {
    lines.push("- 关键判断字段覆盖度：");
    for (const item of Object.values(report.manualReview.keyFieldCoverage)) {
      lines.push(`  - ${item.label}：${item.count} 批已填写`);
    }
  } else {
    lines.push("- 关键判断字段覆盖度：当前还没有可统计的人工字段。");
  }

  if (report.manualReview?.pendingBatchRows?.length) {
    lines.push("- 建议优先补的批次：");
    for (const item of report.manualReview.pendingBatchRows.slice(0, 5)) {
      const missingLabels = item.missingKeyFields.map((field) => field.label).join(" / ") || "待确认";
      lines.push(`  - ${item.batchLabel}：${item.hasManualConclusion ? `还缺 ${missingLabels}` : "整批还没写人工结论"}`);
    }
  } else {
    lines.push("- 当前所有批次都已覆盖关键人工判断字段。");
  }

  lines.push("");
  return lines.join("\n");
}
