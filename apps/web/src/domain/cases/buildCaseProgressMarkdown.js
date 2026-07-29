export function buildCaseProgressMarkdown(report) {
  const lines = [
    "# 案例进度报告",
    "",
    "## 汇总",
    `- 待补平台案例占位数：${report.summary.placeholderOpenCount}`,
    `- 计划中的 real-case 数：${report.summary.plannedRealCaseCount}`,
    `- 已进入 real-case 索引数：${report.summary.indexedRealCaseCount}`,
    `- 已生成 real-case 文件数：${report.summary.realCaseItemCount}`,
    `- 已运行 case 导出数：${report.summary.runExportCount}`,
    `- 已生成 Obsidian 草稿数：${report.summary.obsidianDraftCount}`,
    `- 已形成代码到文档闭环数：${report.summary.fullyBridgedCount}`,
    `- sample 运行导出数：${report.summary.sampleRunExportCount}`,
    `- sample Obsidian 草稿数：${report.summary.sampleObsidianDraftCount}`,
    `- 映射异常数：${report.summary.mappingWarningCount}`,
    "",
    "## 按案例状态",
  ];

  if (!report.rows.length) {
    lines.push("- 当前还没有进入代码层的真实案例");
  } else {
    for (const row of report.rows) {
      lines.push(`- ${row.platformCaseId || "未映射"} / ${row.caseId}：${row.status}`);
    }
  }

  if (report.mappingWarnings.length) {
    lines.push("", "## 映射异常");
    for (const warning of report.mappingWarnings) {
      lines.push(`- ${warning.platformCaseId || "未映射"} / ${warning.caseId}：索引与单文件映射不一致`);
    }
  }

  lines.push("", "## 待补平台案例占位", ...report.placeholders.map((file) => `- ${file}`));
  lines.push("");

  return lines.join("\n");
}
