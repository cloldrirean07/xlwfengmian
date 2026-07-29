export function buildUiOptimizationReadinessMarkdown(report) {
  const lines = [
    "# UI优化进入条件报告",
    "",
    "## 1. 当前判断",
    `- 当前状态：${report.readinessLabel}`,
    `- readiness_level：${report.readinessLevel}`,
    "",
    "## 2. 汇总",
    `- 批量工作单批次数：${report.summary.batchFillWorksheetBatchCount}`,
    `- 批量工作单读回确认数：${report.summary.batchFillReadbackConfirmedCount}`,
    `- 批次试跑记录批次数：${report.summary.batchRunRecordBatchCount}`,
    `- 批次试跑记录读回确认数：${report.summary.batchRunReadbackConfirmedCount}`,
    `- 已写人工结论批次数：${report.summary.manualReviewReviewedBatchCount}`,
    `- 人工关键字段完整覆盖批次数：${report.summary.manualReviewFullyCoveredBatchCount}`,
    `- 人工关键字段未补齐批次数：${report.summary.manualReviewPartiallyCoveredBatchCount}`,
    `- 跨批次信号：${report.crossBatchSignal.label}`,
    `- 重复摩擦点类别数：${report.crossBatchSignal.repeatedCategories}`,
    "",
    "## 3. 检查项",
  ];

  for (const item of report.passedChecks) {
    lines.push(`- [${item.passed ? "x" : " "}] ${item.label}`);
  }

  lines.push("", "## 4. 当前风险");
  if (report.risks.length) {
    for (const risk of report.risks) {
      lines.push(`- ${risk}`);
    }
  } else {
    lines.push("- 当前没有明显阻碍 UI 讨论的结构性风险。");
  }

  lines.push("", "## 5. 下一步动作");
  for (const action of report.nextActions) {
    lines.push(`- ${action}`);
  }

  lines.push("", "## 6. 跨批次重复信号");
  lines.push(`- 当前状态：${report.crossBatchSignal.label}`);
  lines.push(`- 判断原因：${report.crossBatchSignal.reason}`);
  lines.push(`- 汇总批次数：${report.crossBatchSignal.totalBatches}`);
  lines.push(`- 最强重复类别：${report.crossBatchSignal.topRepeatedCategoryLabel || "待补充"}`);
  lines.push(`- 人工完整覆盖批次数：${report.summary.manualReviewFullyCoveredBatchCount}`);
  lines.push(`- 人工仍未补齐批次数：${report.summary.manualReviewPartiallyCoveredBatchCount}`);

  lines.push("", "## 7. 当前证据");
  for (const item of report.evidence.batchFillWorksheetStatuses) {
    lines.push(`- 工作单 / ${item.batchLabel || item.normalizedLabel}：${item.readbackOk ? "读回已确认" : "读回待确认"} / ${item.exportedAt || "待补时间"}`);
  }
  for (const item of report.evidence.batchRunRecordStatuses) {
    lines.push(`- 试跑记录 / ${item.batchLabel || item.normalizedLabel}：${item.readbackOk ? "读回已确认" : "读回待确认"} / ${item.exportedAt || "待补时间"}`);
  }
  lines.push("");

  return lines.join("\n");
}
