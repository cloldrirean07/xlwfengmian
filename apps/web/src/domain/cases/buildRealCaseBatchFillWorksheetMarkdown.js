export function buildRealCaseBatchFillWorksheetMarkdown({
  batchLabel,
  validationSummary,
}) {
  const lines = [
    `# 批量真实案例回填工作单｜${batchLabel}`,
    "",
    "## 批次概览",
    `- 案例数：${validationSummary.summary.totalRealCases}`,
    `- 可进入手动验证：${validationSummary.summary.readyCount}`,
    `- 部分回填：${validationSummary.summary.partialCount}`,
    `- 待回填：${validationSummary.summary.pendingCount}`,
    `- 缺失字段总数：${validationSummary.summary.totalMissingFields}`,
    `- 平均每条缺失字段：${validationSummary.summary.avgMissingFields}`,
    "",
    "## 建议先补的批量动作",
  ];

  if (validationSummary.recommendedBatchActions?.length) {
    for (const item of validationSummary.recommendedBatchActions) {
      lines.push(`- ${item.label}（${item.priority}，影响 ${item.affectedCaseCount} 条）`);
      lines.push(`  - 代码字段：${item.codeField || "待补"}`);
      lines.push(`  - Obsidian 对应位置：${item.obsidianField || "待补"}`);
      lines.push(`  - 优先原因：${item.priorityReason || "待补说明"}`);
      lines.push(`  - 回填说明：${item.prompt || "待补说明"}`);
      lines.push(`  - 涉及案例：${item.affectedCaseIds.join(" / ")}`);
    }
  } else {
    lines.push("- 当前没有明确的批量优先动作。");
  }

  lines.push("", "## 逐条案例下一步");

  for (const row of validationSummary.rows || []) {
    lines.push(`### ${row.caseId}｜${row.title}`);
    lines.push(`- 平台案例编号：${row.platformCaseId || "未映射"}`);
    lines.push(`- 当前状态：${row.status}`);
    lines.push(`- 当前缺失项：${row.missingCount}`);
    lines.push(`- 主要缺失：${(row.topMissingFields || []).join(" / ") || "暂无"}`);
    lines.push(`- 下一步任务：${row.nextTask?.label || "待补"}`);
    lines.push(`- 下一步优先级：${row.nextTask?.priority || "待补"}`);
    lines.push(`- 代码字段：${row.nextTask?.codeField || "待补"}`);
    lines.push(`- Obsidian 对应位置：${row.nextTask?.obsidianField || "待补"}`);
    lines.push(`- 回填说明：${row.nextTask?.prompt || "待补说明"}`);
    lines.push(`- 为什么先补：${row.nextTask?.priorityReason || "待补说明"}`);
    lines.push("- 当前填写：");
    lines.push("");
  }

  lines.push("## 批量回填后动作");
  lines.push("- [ ] 回填本批次涉及的 real-case JSON");
  lines.push("- [ ] 补齐对应 Obsidian 案例/平台笔记");
  lines.push("- [ ] 重新跑一次批量预览，确认缺失项下降");
  lines.push("- [ ] 运行 `npm run validate:cases`");
  lines.push("- [ ] 判断是否进入真实案例写入/复跑/规则修订");
  lines.push("");

  return lines.join("\n");
}
