export function buildBatchReviewManualTaskCardMarkdown(taskCard = {}) {
  const lines = [
    "# 人工复盘待补任务",
    "",
    "## 1. 当前判断",
    `- 当前状态：${taskCard.statusLabel || "待补"}`,
    `- 目标批次：${taskCard.targetBatchLabel || "暂无"}`,
    `- 当前结论：${taskCard.summary || "当前没有待补人工复盘任务。"}`,
  ];

  if (taskCard.topCategoryLabels?.length) {
    lines.push(`- 当前最强摩擦点：${taskCard.topCategoryLabels.join(" / ")}`);
  }

  if (taskCard.topActionLabels?.length) {
    lines.push(`- 当前最该先补的信息：${taskCard.topActionLabels.join(" / ")}`);
  }

  lines.push("", "## 2. 待补字段");

  if (taskCard.fieldTasks?.length) {
    for (const field of taskCard.fieldTasks) {
      lines.push(`- ${field.label}：${field.prompt}`);
      lines.push(`  - 填写提示：${field.answerHint}`);
      if (field.startSuggestion) {
        lines.push(`  - 起笔建议：${field.startSuggestion}`);
      }
      if (field.suggestedDraft) {
        lines.push(`  - 建议初稿：${field.suggestedDraft}`);
      }
    }
  } else {
    lines.push("- 当前没有待补字段，可转向新增样本或重跑判断。");
  }

  lines.push("", "## 3. 人工填写区");
  if (taskCard.fieldTasks?.length) {
    for (const field of taskCard.fieldTasks) {
      lines.push(`- ${field.label}：`);
      if (field.startSuggestion) {
        lines.push(`  - 可直接改写起笔句：${field.startSuggestion}`);
      }
      if (field.suggestedDraft) {
        lines.push(`  - 可直接修改初稿：${field.suggestedDraft}`);
      }
    }
  } else {
    lines.push("- 当前无需填写。");
  }

  return lines.join("\n");
}
