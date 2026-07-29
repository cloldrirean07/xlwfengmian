export function buildObsidianBatchReviewManualBackfillRecord({
  generatedDate,
  sourceMarkdownPath,
  backfillMarkdown,
}) {
  return [
    `# 人工复盘回流预览_${generatedDate}`,
    "",
    "> 生成方式：代码侧人工复盘回流预览自动生成草稿",
    `> 生成日期：${generatedDate}`,
    `> 对应代码底稿：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这份草稿用于把已填写的人工复盘待补任务整理成可写回的批次试跑结论预览。",
    "- 当前先是预览，不直接覆盖真实批次试跑记录。",
    "- 你后续可基于这份草稿确认回流逻辑是否合理，再决定是否正式写回。",
    "",
    "## 1. 代码侧回流底稿",
    "",
    backfillMarkdown.trim(),
    "",
    "## 2. 人工补充",
    "- 这份回流预览是否可以直接写回：",
    "- 写回前还想补哪一项：",
    "- 写回后最想重跑验证的点：",
    "",
  ].join("\n");
}
