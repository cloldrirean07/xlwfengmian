export function buildObsidianRealCaseBatchFillWorksheetRecord({
  generatedDate,
  sourceMarkdownPath,
  worksheetMarkdown,
}) {
  return [
    `# 批量真实案例回填工作单_${generatedDate}`,
    "",
    "> 生成方式：代码侧批量真实案例预览 + `export:obsidian-batch-fill-sheet` 自动生成草稿",
    `> 生成日期：${generatedDate}`,
    `> 对应代码底稿：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这是一份把批量真实案例缺口转成回填动作的工作单。",
    "- 上半部分看整批案例优先动作，下半部分看逐条案例下一步。",
    "- 你后续可以直接在每条任务下继续填写，再同步回代码和 Obsidian 笔记。",
    "",
    "## 1. 代码侧批量工作单底稿",
    "",
    worksheetMarkdown.trim(),
    "",
    "## 2. 人工补充",
    "- 本批次最该先补完的 1-3 条案例：",
    "- 本批次最适合先沉淀成模板的字段：",
    "- 哪些任务需要回头调整输入模板：",
    "",
  ].join("\n");
}
