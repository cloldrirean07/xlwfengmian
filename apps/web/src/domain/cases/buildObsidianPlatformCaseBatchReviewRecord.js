export function buildObsidianPlatformCaseBatchReviewRecord({
  generatedAt,
  sourceMarkdownPath,
  reviewMarkdown,
}) {
  return [
    `# 平台案例批量复核看板_${generatedAt}`,
    "",
    "> 生成方式：代码侧 `report:platform-case-batch-review` + `export:obsidian-platform-batch-review` 自动生成草稿",
    `> 生成时间：${generatedAt}`,
    `> 对应代码底稿：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这是一份平台案例批量复核看板草稿，用来判断当前一批平台案例的完整度状态和优先级。",
    "- 下面的“代码侧批量复核底稿”来自当前已映射平台案例的自动汇总结果。",
    "- 你后续可以在这里判断先补哪些案例、哪些案例可以进入 sync。",
    "",
    "## 1. 代码侧批量复核底稿",
    "",
    reviewMarkdown.trim(),
    "",
    "## 2. 人工补充",
    "- 本周最优先补的 3 个平台案例：",
    "- 哪些案例已经接近可同步：",
    "- 当前模板还缺哪些批量管理字段：",
    "",
  ].join("\n");
}
