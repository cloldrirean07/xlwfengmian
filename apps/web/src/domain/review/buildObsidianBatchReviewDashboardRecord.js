export function buildObsidianBatchReviewDashboardRecord({
  generatedDate,
  sourceMarkdownPath,
  dashboardMarkdown,
}) {
  return [
    `# 批次复盘看板_${generatedDate}`,
    "",
    "> 生成方式：代码侧批次复盘看板自动生成草稿",
    `> 生成日期：${generatedDate}`,
    `> 对应代码底稿：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这份看板用于把当前最该补的批次、人工复盘趋势和 UI 时机判断收成一个日常推进入口。",
    "- 它不是替代跨批次汇总或 UI readiness，而是帮助你决定下一步先补哪一批。",
    "- 你后续应继续补：最卡环节、最该前置模块、以及是否已经到 UI 讨论时机。",
    "",
    "## 1. 代码侧看板底稿",
    "",
    dashboardMarkdown.trim(),
    "",
    "## 2. 人工补充",
    "- 当前最该先补的批次：",
    "- 这一批补完后最想验证的点：",
    "- 是否开始进入 UI 交互层优化讨论：",
    "",
  ].join("\n");
}
