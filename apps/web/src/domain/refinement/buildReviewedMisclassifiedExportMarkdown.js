export function buildReviewedMisclassifiedExportMarkdown(report) {
  const lines = [
    "# 二轮误判样本导出",
    "",
    "## 汇总",
    `- 已读取人工复核记录数：${report.summary.totalReviewedRows}`,
    `- 满足自动导出条件数：${report.summary.eligibleExportCount}`,
    `- 缺少 case-run 底稿数：${report.summary.missingCaseRunCount}`,
    "",
    "## 导出样本",
  ];

  if (!report.rows.length) {
    lines.push("- 当前没有 `review_status=misclassified` 且 `should_export_to_misclassified=yes` 的记录");
    lines.push("");
    return lines.join("\n");
  }

  for (const row of report.rows) {
    lines.push(`### ${row.caseId}`);
    lines.push(`- 标题：${row.title || "未知标题"}`);
    lines.push(`- 平台：${row.platform || "未知平台"}`);
    lines.push(`- 规则版本：${row.ruleVersion || "unknown"}`);
    lines.push(`- 系统原映射：${row.negativeMappingId || "unknown"}`);
    lines.push(`- 系统原问题：${row.systemIssue || "未知"}`);
    lines.push(`- 系统原动作：${row.systemAction || "未知"}`);
    lines.push(`- 系统原方向：${row.sourceDirectionLabel || row.sourceDirectionType || "待补充"}`);
    lines.push(
      `- 原命中关键词：${
        row.matchedKeywords?.length ? row.matchedKeywords.join(" / ") : "未命中明确关键词"
      }`,
    );
    lines.push(
      `- 原方向命中信号：${
        row.sourceMatchedSignals?.length ? row.sourceMatchedSignals.join(" / ") : "待补充"
      }`,
    );
    lines.push(
      `- 原方向边界提醒：${
        row.sourceBoundaryRules?.length ? row.sourceBoundaryRules.join(" / ") : "待补充"
      }`,
    );
    lines.push(`- 实际问题判断：${row.actualIssue || "待补充"}`);
    lines.push(`- 建议映射 ID：${row.suggestedMappingId || "待补充"}`);
    lines.push(`- 建议正向保留信号：${row.suggestedPositiveSignalId || "待补充"}`);
    lines.push(`- 建议新增关键词：${row.suggestedKeyword || "待补充"}`);
    lines.push(`- 兜底策略建议：${row.fallbackAdjustment || "待补充"}`);
    lines.push(`- 解释状态：${row.explanationStatus || "pending"}`);
    lines.push(`- 原解释摘要：${row.explanationSummary || "暂无"}`);
    if (row.missingCaseRun) {
      lines.push("- 警告：缺少对应 case-run 底稿");
    }
    lines.push("");
  }

  return lines.join("\n");
}
