export function buildObsidianRealCaseMaintenanceBoardRecord({
  generatedDate,
  sourceMarkdownPath,
  boardMarkdown,
}) {
  return [
    `# 真实案例维护优先级看板_${generatedDate}`,
    "",
    "> 生成方式：代码侧 `report:real-case-maintenance-board` + `export:obsidian-real-case-maintenance-board` 自动生成草稿",
    `> 生成日期：${generatedDate}`,
    `> 对应代码报告：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这份看板用来判断当前哪些真实案例最值得优先维护。",
    "- 它同时参考了案例维护优先级与字段就绪度。",
    "- 你后续主要补的是：是否要调整优先级、哪些案例应进入下一批重点维护。",
    "",
    "## 1. 代码侧看板底稿",
    "",
    boardMarkdown.trim(),
    "",
    "## 2. 人工判断",
    "- 当前最值得先推进的 1-3 条案例：",
    "- 哪些优先级需要上调：",
    "- 哪些案例暂时可以留在 Backlog：",
    "",
  ].join("\n");
}
