export function buildRealCaseFillSheetMarkdown(fillSheet) {
  const lines = [
    `# 真实案例回填工作单｜${fillSheet.caseId}`,
    "",
    "## 基本信息",
    `- 标题：${fillSheet.title}`,
    `- 平台：${fillSheet.platform}`,
    `- 平台案例编号：${fillSheet.platformCaseId || "未映射"}`,
    `- Obsidian 案例路径：${fillSheet.obsidianCasePath || "未映射"}`,
    `- 当前就绪度状态：${fillSheet.readinessStatus}`,
    `- 当前缺失项数量：${fillSheet.missingCount}`,
    "",
    "## 优先补这 3 项",
  ];

  if (fillSheet.topPriorityItems?.length) {
    for (const item of fillSheet.topPriorityItems) {
      lines.push(`- ${item.label}（${item.priority}）`);
      lines.push(`  优先原因：${item.priorityReason}`);
    }
  } else {
    lines.push("- 当前没有明确的高优先级缺失项。");
  }

  lines.push(
    "",
    "## 回填任务",
  );

  if (!fillSheet.missingItems.length) {
    lines.push("- 当前没有缺失项，这条案例可以进入手动验证。");
    lines.push("");
    return lines.join("\n");
  }

  for (const item of fillSheet.missingItems) {
    lines.push(`### ${item.order}. ${item.label}`);
    lines.push(`- 优先级：${item.priority}（分数 ${item.priorityScore}）`);
    lines.push(`- 代码字段：${item.codeField}`);
    lines.push(`- Obsidian 对应位置：${item.obsidianField}`);
    lines.push(`- 回填说明：${item.prompt}`);
    lines.push(`- 为什么现在补它：${item.priorityReason}`);
    lines.push("- 当前填写：");
    lines.push("");
  }

  lines.push("## 回填后动作");
  lines.push("- [ ] 更新 real-case JSON");
  lines.push("- [ ] 更新对应 Obsidian 平台案例");
  lines.push("- [ ] 运行 `npm run validate:cases`");
  lines.push("- [ ] 运行 `npm run report:real-case-readiness`");
  lines.push("- [ ] 判断是否进入 `run:case` 或规则修订");
  lines.push("");

  return lines.join("\n");
}
