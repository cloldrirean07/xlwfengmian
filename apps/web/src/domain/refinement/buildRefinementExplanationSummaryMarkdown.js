export function buildRefinementExplanationSummaryMarkdown(report) {
  const lines = [
    "# 二轮解释验证汇总",
    "",
    "## 汇总",
    `- 已纳入汇总的记录数：${report.summary.totalRows}`,
    `- 负向映射 ID 数：${report.summary.uniqueNegativeMappingCount}`,
    `- 正向保留映射 ID 数：${report.summary.uniquePositiveMappingCount}`,
    `- 走兜底规则数：${report.summary.fallbackCount}`,
    `- 未命中正向保留信号数：${report.summary.noPositiveSignalCount}`,
    `- 接入工作区上下文数：${report.summary.workspaceInjectedCount}`,
    `- 已人工复核数：${report.summary.reviewedCount}`,
    `- 复核为合理数：${report.summary.reasonableCount}`,
    `- 复核为误判数：${report.summary.misclassifiedCount}`,
    `- 标记需导出误判样本数：${report.summary.exportToMisclassifiedCount}`,
    "",
    "## 高频负向映射",
  ];

  if (!report.topNegativeMappings.length) {
    lines.push("- 暂无");
  } else {
    for (const item of report.topNegativeMappings) {
      lines.push(`- ${item.id}：${item.count}`);
    }
  }

  lines.push("", "## 高频正向保留映射");

  if (!report.topPositiveMappings.length) {
    lines.push("- 暂无");
  } else {
    for (const item of report.topPositiveMappings) {
      lines.push(`- ${item.id}：${item.count}`);
    }
  }

  lines.push("", "## 高频误判映射");

  if (!report.topMisclassifiedMappings.length) {
    lines.push("- 暂无");
  } else {
    for (const item of report.topMisclassifiedMappings) {
      lines.push(`- ${item.id}：${item.count}`);
    }
  }

  lines.push("", "## 优先复核：走兜底规则");

  if (!report.fallbackRows.length) {
    lines.push("- 暂无");
  } else {
    for (const row of report.fallbackRows) {
      lines.push(`- ${row.caseId} / ${row.negativeMappingId}：${row.title}`);
    }
  }

  lines.push("", "## 优先复核：未命中正向保留信号");

  if (!report.noPositiveSignalRows.length) {
    lines.push("- 暂无");
  } else {
    for (const row of report.noPositiveSignalRows) {
      lines.push(`- ${row.caseId} / ${row.negativeMappingId}：${row.title}`);
    }
  }

  lines.push("", "## 已判为误判");

  if (!report.misclassifiedRows.length) {
    lines.push("- 暂无");
  } else {
    for (const row of report.misclassifiedRows) {
      lines.push(
        `- ${row.caseId} / ${row.negativeMappingId}：${row.title}${
          row.actualIssue ? `｜实际问题=${row.actualIssue}` : ""
        }${row.suggestedMappingId ? `｜建议映射=${row.suggestedMappingId}` : ""}`,
      );
    }
  }

  lines.push("", "## 待导出到误判样本");

  if (!report.exportToMisclassifiedRows.length) {
    lines.push("- 暂无");
  } else {
    for (const row of report.exportToMisclassifiedRows) {
      lines.push(`- ${row.caseId} / ${row.negativeMappingId}：${row.title}`);
    }
  }

  lines.push("", "## 明细");

  if (!report.rows.length) {
    lines.push("- 暂无可用记录");
  } else {
    for (const row of report.rows) {
      lines.push(`- ${row.caseId}｜${row.negativeMappingId}｜${row.positiveMappingId || "无正向"}｜兜底=${row.usedFallback ? "是" : "否"}｜工作区=${row.workspaceInjected ? "是" : "否"}｜复核=${row.reviewStatus}`);
      lines.push(`  标题：${row.title}`);
      lines.push(`  关键词：${row.matchedKeywords.length ? row.matchedKeywords.join(" / ") : "未命中明确关键词"}`);
      lines.push(`  解释：${row.summary || "暂无"}`);
    }
  }

  lines.push("");

  return lines.join("\n");
}
