export function buildObsidianPlatformCaseCompletenessRecord({
  generatedAt,
  sourceMarkdownPath,
  completenessMarkdown,
}) {
  return [
    `# 平台案例完整度_${generatedAt}`,
    "",
    "> 生成方式：代码侧 `report:platform-case-completeness` + `export:obsidian-platform-completeness` 自动生成草稿",
    `> 生成时间：${generatedAt}`,
    `> 对应代码底稿：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这是一份平台案例笔记完整度检查草稿，用来判断当前平台案例还缺哪些关键字段。",
    "- 下面的“代码侧完整度底稿”来自当前平台案例笔记解析结果。",
    "- 你后续可以在这里判断是否继续补笔记，还是已经可以进入 sync。",
    "",
    "## 1. 代码侧完整度底稿",
    "",
    completenessMarkdown.trim(),
    "",
    "## 2. 人工补充",
    "- 当前最该先补的字段：",
    "- 当前是否已经适合进入 sync：",
    "- 模板还缺不缺别的必要字段：",
    "",
  ].join("\n");
}
