function buildDraftBlock(task) {
  const candidate = task.candidateSuggestion;
  return [
    `### ${task.order}. ${task.label}`,
    `- 优先级：${task.priority}`,
    `- 对应位置：${task.obsidianField || "待补映射"}`,
    `- 为什么先补：${task.reason}`,
    `- 补写提示：${task.prompt}`,
    task.example ? `- 参考写法：${task.example}` : "- 参考写法：",
    candidate
      ? `- 候选填写：${candidate.text}`
      : "- 候选填写：待人工确认",
    candidate ? `- 候选来源：${candidate.source}` : "- 候选来源：",
    `- 建议填写：`,
    "",
  ].join("\n");
}

export function buildPlatformCaseFillDraft(review) {
  const lines = [
    `# ${review.platformCaseId} 补写草稿`,
    "",
    "## 使用说明",
    "- 这是一份根据当前复核结果自动生成的补写草稿。",
    "- 建议优先从 P0 字段开始填写，再补 P1，最后补 P2。",
    "- 你可以把这里的“建议填写”直接改成自己的真实判断，再回填到原始平台案例笔记。",
    "",
    "## 当前状态",
    `- 完整度状态：${review.summary.completenessStatus}（${review.summary.completedChecks}/${review.summary.totalChecks}）`,
    `- 质量状态：${review.summary.qualityStatus}（可用 ${review.quality.usableCount}/${review.quality.totalChecks}）`,
    `- 当前是否建议进入 sync：${review.summary.readyToSync ? "是" : "否"}`,
    `- 原始案例路径：${review.notePath}`,
    "",
    "## 优先补写任务",
    "",
  ];

  if ((review.actionPlan?.tasks || []).length === 0) {
    lines.push("- 当前没有待补任务。", "");
    return lines.join("\n");
  }

  for (const task of review.actionPlan.tasks) {
    const candidateSuggestion = review.candidateSuggestions?.tasks?.find(
      (item) => item.label === task.label,
    )?.suggestion;
    lines.push(buildDraftBlock({ ...task, candidateSuggestion }));
  }

  lines.push("## 备注", "- 这份草稿为自动生成内容，可继续修改补充。", "");
  return lines.join("\n");
}
