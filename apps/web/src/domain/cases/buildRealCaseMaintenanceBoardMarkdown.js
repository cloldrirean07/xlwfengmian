export function buildRealCaseMaintenanceBoardMarkdown(report) {
  const lines = [
    "# 真实案例维护优先级看板",
    "",
    "## 汇总",
    `- real-case 总数：${report.summary.totalRealCases}`,
    `- P1：${report.summary.p1Count}`,
    `- P2：${report.summary.p2Count}`,
    `- P3：${report.summary.p3Count}`,
    `- Backlog：${report.summary.backlogCount}`,
    `- 已可进入验证的高优先案例：${report.summary.readyHighPriorityCount}`,
    "",
    "## 按案例查看",
  ];

  if (!report.rows.length) {
    lines.push("- 当前还没有 real-case");
    lines.push("");
    return lines.join("\n");
  }

  for (const row of report.rows) {
    lines.push(`### ${row.caseId}`);
    lines.push(`- 标题：${row.title}`);
    lines.push(`- 平台案例：${row.platformCaseId || "未映射"}`);
    lines.push(`- 优先级：${row.priorityBand} / ${row.rerunPriority}`);
    lines.push(`- 就绪度：${row.readinessStatus}（${row.completedChecks}/${row.totalChecks}）`);
    lines.push(`- 维护标签：${row.maintenanceTags.join(" / ") || "暂无"}`);
    lines.push(`- 维护原因：${row.reasonNotes.join(" / ") || "暂无"}`);
    lines.push(`- 当前建议动作：${row.actionRecommendation}`);
    if (row.missingFields.length) {
      lines.push(`- 主要缺失项：${row.missingFields.join(" / ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
