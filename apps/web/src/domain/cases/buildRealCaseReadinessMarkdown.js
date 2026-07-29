export function buildRealCaseReadinessMarkdown(report) {
  const lines = [
    "# 真实案例就绪度报告",
    "",
    "## 汇总",
    `- real-case 总数：${report.summary.totalRealCases}`,
    `- 可进入手动验证：${report.summary.readyCount}`,
    `- 部分回填：${report.summary.partialCount}`,
    `- 待回填：${report.summary.pendingCount}`,
    "",
    "## 按案例查看",
  ];

  if (!report.rows.length) {
    lines.push("- 当前还没有 real-case");
    lines.push("");
    return lines.join("\n");
  }

  for (const row of report.rows) {
    lines.push(`- ${row.platformCaseId || "未映射"} / ${row.caseId}：${row.status}（${row.completedChecks}/${row.totalChecks}）`);
    if (row.missingFields.length) {
      lines.push(`  缺失项：${row.missingFields.join("、")}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}
