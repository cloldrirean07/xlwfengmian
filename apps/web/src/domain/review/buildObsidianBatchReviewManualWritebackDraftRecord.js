export function buildObsidianBatchReviewManualWritebackDraftRecord({
  generatedDate,
  sourceMarkdownPath,
  writebackDraftMarkdown,
}) {
  return [
    `# 真实批次试跑结论写回草稿_${generatedDate}`,
    "",
    "> 生成方式：代码侧人工复盘写回草稿自动生成",
    `> 生成日期：${generatedDate}`,
    `> 对应代码底稿：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这是一份对齐真实批次试跑记录结构的写回草稿。",
    "- 当前目的是先把人工复盘判断组织成可落笔的写回内容。",
    "- 这一步仍然不直接覆盖真实批次试跑记录，请先人工确认。",
    "",
    "## 1. 代码侧写回草稿",
    "",
    writebackDraftMarkdown.trim(),
    "",
    "## 2. 人工补充",
    "- 哪一句你准备正式写回真实批次试跑记录：",
    "- 哪一句你认为还需要继续试跑验证：",
    "- 写回后最想立刻重跑验证的模块：",
    "",
  ].join("\n");
}
