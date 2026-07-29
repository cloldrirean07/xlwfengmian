export function buildKeyCaseRerunDiffMarkdown(report) {
  const lines = [
    "# 关键样例复跑前后差异报告",
    "",
    "## 汇总",
    `- 生成时间：${report.meta.generatedAt}`,
    `- 复跑计划：${report.meta.planId}`,
    `- 对比样例数：${report.summary.comparedCaseCount}`,
    `- 发生变化的样例数：${report.summary.changedCaseCount}`,
    `- 未变化样例数：${report.summary.unchangedCaseCount}`,
    `- 下游变化项数：${report.summary.downstreamChangedCount}`,
    "",
    "## 样例差异",
  ];

  if (!report.caseDiffRows.length) {
    lines.push("- 当前没有可对比样例");
  } else {
    for (const row of report.caseDiffRows) {
      lines.push(`### ${row.caseId}`);
      lines.push(`- 标题：${row.title}`);
      lines.push(`- 来源类型：${row.sourceType}`);
      lines.push(`- 平台：${row.platform}`);
      lines.push(`- 变化项数：${row.changeCount}`);
      lines.push(`- 输出目录：${row.outputDir || "无"}`);

      if (!row.changes.length) {
        lines.push("- 本次复跑未发现关键字段变化");
      } else {
        for (const change of row.changes) {
          lines.push(`- ${change.label}：${change.before} -> ${change.after}`);
        }
      }

      lines.push("");
    }
  }

  lines.push("## 下游报告差异");
  for (const item of report.downstreamDiffs) {
    lines.push(`- ${item.label}：${item.before} -> ${item.after}${item.changed ? "（有变化）" : "（无变化）"}`);
  }
  lines.push("");

  return lines.join("\n");
}
