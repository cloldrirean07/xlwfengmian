export function buildPlatformCasePriorityDraftsMarkdown({ platformCaseId, drafts, notePath }) {
  const lines = [
    `# ${platformCaseId} 前三优先字段初稿卡`,
    "",
    "## 使用说明",
    "- 这不是最终事实版本，而是便于你快速改写的首版草稿。",
    "- 建议先改这 3 张卡，再回填到原始平台案例笔记。",
    `- 原始案例路径：${notePath}`,
    "",
  ];

  if ((drafts.cards || []).length === 0) {
    lines.push("- 当前没有可生成的初稿卡。", "");
    return lines.join("\n");
  }

  for (const card of drafts.cards) {
    lines.push(`## ${card.order}. ${card.label}`);
    lines.push(`- 优先级：${card.priority}`);
    lines.push(`- 对应位置：${card.obsidianField || "待补映射"}`);
    lines.push(`- 为什么先补：${card.reason}`);
    lines.push(`- 修改提醒：${card.editHint}`);
    if (card.candidateText) {
      lines.push(`- 候选提示：${card.candidateText}`);
      lines.push(`- 候选来源：${card.candidateSource || "未标注"}`);
    }
    if (card.example) {
      lines.push(`- 参考写法：${card.example}`);
    }
    lines.push(`- 可编辑初稿：${card.draftText}`);
    lines.push("");
  }

  return lines.join("\n");
}
