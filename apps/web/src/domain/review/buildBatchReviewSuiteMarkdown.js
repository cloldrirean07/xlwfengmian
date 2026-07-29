export function buildBatchReviewSuiteMarkdown({
  frictionSummaryExport,
  uiReadinessExport,
  dashboardExport,
}) {
  const lines = [
    "# 批次复盘套件",
    "",
    "## 1. 当前导出概览",
    `- 跨批次摩擦点汇总：${frictionSummaryExport?.readback?.ok ? "已导出并读回确认" : "待确认"}`,
    `- UI 优化进入条件报告：${uiReadinessExport?.readback?.ok ? "已导出并读回确认" : "待确认"}`,
    `- 批次复盘看板：${dashboardExport?.readback?.ok ? "已导出并读回确认" : "待确认"}`,
    "",
    "## 2. 产物路径",
    `- 跨批次摩擦点汇总：${frictionSummaryExport?.targetPath || "待补"}`,
    `- UI 优化进入条件报告：${uiReadinessExport?.targetPath || "待补"}`,
    `- 批次复盘看板：${dashboardExport?.targetPath || "待补"}`,
    "",
    "## 3. 当前最关键判断",
    `- 跨批次信号：${dashboardExport?.report?.crossBatchSignal?.label || "待补"}`,
    `- UI 时机：${dashboardExport?.report?.uiReadiness?.readinessLabel || "待补"}`,
    `- 人工复盘趋势：${dashboardExport?.report?.coverageTrend?.label || "待补"}`,
    "",
    "## 4. 当前最该补的批次",
  ];

  const priorityRows = dashboardExport?.report?.priorityRows || [];
  if (priorityRows.length) {
    for (const item of priorityRows.slice(0, 5)) {
      lines.push(`- ${item.batchLabel}：${item.urgencyLabel}`);
      lines.push(`  - 缺口：${item.missingFieldLabels.join(" / ") || "待确认"}`);
      lines.push(`  - 摩擦点：${item.topCategoryLabels.join(" / ") || "暂无"}`);
    }
  } else {
    lines.push("- 当前没有待补批次。");
  }

  lines.push("", "## 5. 下一步动作");
  for (const item of dashboardExport?.report?.nextActions || []) {
    lines.push(`- ${item}`);
  }

  const checklist = dashboardExport?.report?.followUpChecklist;
  if (checklist?.phases?.length) {
    lines.push("", "## 6. 复盘后操作清单");
    for (const phase of checklist.phases) {
      lines.push(`- ${phase.label}`);
      for (const item of phase.items) {
        lines.push(`  - ${item.label}`);
        if (item.actionLabel) {
          lines.push(`    - 页面入口：${item.actionLabel}`);
        }
      }
    }
  }
  lines.push("");

  return lines.join("\n");
}
