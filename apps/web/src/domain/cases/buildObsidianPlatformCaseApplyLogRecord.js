export function buildObsidianPlatformCaseApplyLogRecord({
  generatedAt,
  sourceMarkdownPath,
  applyLogMarkdown,
}) {
  return [
    `# 平台案例回填记录_${generatedAt}`,
    "",
    "> 生成方式：代码侧 `apply:platform-case-priority-drafts` 自动写回后同步生成",
    `> 生成时间：${generatedAt}`,
    `> 对应代码底稿：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这是一份平台案例回填记录草稿，用来追踪本次系统向原始案例笔记写回了哪些字段。",
    "- 下面的“代码侧回填底稿”来自实际写回后的变更记录。",
    "",
    "## 1. 代码侧回填底稿",
    "",
    applyLogMarkdown.trim(),
    "",
    "## 2. 人工补充",
    "- 本次哪些字段需要优先人工确认：",
    "- 是否要保留这次草稿写回：",
    "- 回填后有哪些字段还不够准确：",
    "",
  ].join("\n");
}
