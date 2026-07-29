export function buildObsidianRealCaseFillSheetRecord({
  generatedDate,
  sourceMarkdownPath,
  fillSheetMarkdown,
}) {
  return [
    `# 真实案例回填工作单_${generatedDate}`,
    "",
    "> 生成方式：代码侧 `generate:real-case-fill-sheet` + `export:obsidian-fill-sheet` 自动生成草稿",
    `> 生成日期：${generatedDate}`,
    `> 对应代码底稿：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这是一份把 real-case 缺失项转成回填任务的工作单。",
    "- 下面的“代码侧回填底稿”来自当前 real-case 与 readiness 检查。",
    "- 你后续应直接在每个任务下面填写，再同步回代码与平台案例文档。",
    "",
    "## 1. 代码侧回填底稿",
    "",
    fillSheetMarkdown.trim(),
    "",
    "## 2. 人工补充",
    "- 当前最容易先补的项：",
    "- 当前最难补的项：",
    "- 是否需要回头改模板：",
    "",
  ].join("\n");
}
