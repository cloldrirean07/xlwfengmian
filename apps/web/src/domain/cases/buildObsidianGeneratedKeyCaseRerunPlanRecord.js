export function buildObsidianGeneratedKeyCaseRerunPlanRecord({
  generatedDate,
  sourceMarkdownPath,
  summaryMarkdown,
}) {
  return [
    `# 自动生成的关键样例复跑计划_${generatedDate}`,
    "",
    "> 生成方式：代码侧 `generate:key-case-rerun-plan` 自动生成",
    `> 生成日期：${generatedDate}`,
    `> 对应代码结果：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 1. 代码侧计划底稿",
    "",
    summaryMarkdown.trim(),
    "",
    "## 2. 人工补充观察",
    "- 哪些案例应该继续提高优先级：",
    "- 哪些案例可以降级或移出：",
    "- 还缺哪些真实高频误判案例：",
    "",
  ].join("\n");
}
