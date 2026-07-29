export function buildPlatformCaseApplyLogMarkdown({
  platformCaseId,
  notePath,
  updatedFields,
}) {
  const lines = [
    `# 平台案例回填记录｜${platformCaseId}`,
    "",
    `- 原始案例路径：${notePath}`,
    `- 更新字段数：${updatedFields.length}`,
    "",
    "## 字段变更",
  ];

  if (!updatedFields.length) {
    lines.push("- 本次没有字段变化。", "");
    return lines.join("\n");
  }

  for (const item of updatedFields) {
    lines.push(`- ${item.fieldKey}`);
    lines.push(`  变更前：${item.before || "空"}`);
    lines.push(`  变更后：${item.after || "空"}`);
  }

  lines.push("");
  return lines.join("\n");
}
