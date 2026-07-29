export function buildPlatformCaseCompletenessMarkdown(result) {
  const lines = [
    `# 平台案例完整度报告｜${result.platformCaseId}`,
    "",
    "## 汇总",
    `- 当前状态：${result.status}`,
    `- 已完成：${result.completedChecks}/${result.totalChecks}`,
  ];

  if (result.missingFields.length) {
    lines.push(`- 缺失项：${result.missingFields.join("、")}`);
  } else {
    lines.push("- 缺失项：无");
  }

  lines.push("", "## 字段检查");

  for (const item of result.checks) {
    lines.push(`- ${item.label}：${item.complete ? "已填" : "待填"}`);
  }

  lines.push("");
  return lines.join("\n");
}
