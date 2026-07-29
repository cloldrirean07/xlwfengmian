export function buildRuleRevisionTaskSheetMarkdown(report) {
  const lines = [
    "# 规则修订任务单",
    "",
    "## 汇总",
    `- 误判样本数：${report.summary.sourceSampleCount}`,
    `- 任务数：${report.summary.taskCount}`,
    `- P1：${report.summary.p1Count}`,
    `- P2：${report.summary.p2Count}`,
    `- P3：${report.summary.p3Count}`,
    "",
    "## 任务列表",
  ];

  if (!report.tasks.length) {
    lines.push("- 当前没有可生成的规则修订任务");
    lines.push("");
    return lines.join("\n");
  }

  for (const task of report.tasks) {
    lines.push(`### ${task.taskId}｜${task.priority}｜${task.taskTitle}`);
    lines.push(`- 关联样本数：${task.sampleCount}`);
    lines.push(`- 关联 case：${task.caseIds.join(" / ")}`);
    lines.push(`- 原系统映射：${task.sourceNegativeMappingIds.join(" / ") || "暂无"}`);
    lines.push(`- 原命中方向：${task.sourceDirectionLabels.join(" / ") || "暂无"}`);
    lines.push(`- 原方向命中信号：${task.sourceMatchedSignals.join(" / ") || "暂无"}`);
    lines.push(`- 原方向边界提醒：${task.sourceBoundaryRules.join(" / ") || "暂无"}`);
    lines.push(`- 建议映射：${task.suggestedMappingId || "待补充"}`);
    lines.push(`- 建议关键词：${task.suggestedKeyword || "待补充"}`);
    lines.push(`- 兜底策略建议：${task.fallbackAdjustment || "待补充"}`);
    lines.push(`- 实际问题归纳：${task.actualIssues.join(" / ") || "待补充"}`);
    lines.push(`- 关联标题：${task.titles.join(" / ") || "待补充"}`);
    lines.push("- [ ] 更新 feedback-catalog.json");
    lines.push("- [ ] 复跑相关 case");
    lines.push("- [ ] 更新验证结论");
    lines.push("");
  }

  return lines.join("\n");
}
