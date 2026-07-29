export function buildObsidianBatchReviewSuiteRecord({
  generatedDate,
  sourceMarkdownPath,
  suiteMarkdown,
}) {
  return [
    `# 批次复盘套件_${generatedDate}`,
    "",
    "> 生成方式：代码侧批次复盘套件自动生成草稿",
    `> 生成日期：${generatedDate}`,
    `> 对应代码底稿：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这份套件用于把同一轮复盘里最重要的 3 份正式产物收成一次性导出结果。",
    "- 它不会替代单份报告，而是帮助你在 Obsidian 中快速进入同一轮复盘。",
    "- 你后续应继续补：最该补的批次、当前是否进入 UI 讨论，以及下一轮最想验证的点。",
    "",
    "## 1. 代码侧套件底稿",
    "",
    suiteMarkdown.trim(),
    "",
    "## 2. 人工补充",
    "- 这轮最值得优先回看的报告：",
    "- 当前最该补的批次：",
    "- 是否进入下一轮 UI 优化讨论：",
    "",
  ].join("\n");
}
