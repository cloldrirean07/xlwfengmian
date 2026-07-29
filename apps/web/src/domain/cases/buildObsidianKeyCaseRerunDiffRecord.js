export function buildObsidianKeyCaseRerunDiffRecord({
  generatedDate,
  sourceMarkdownPath,
  summaryMarkdown,
}) {
  return [
    `# 关键样例复跑前后差异报告_${generatedDate}`,
    "",
    "> 生成方式：代码侧 `rerun:key-cases` 自动生成",
    `> 生成日期：${generatedDate}`,
    `> 对应代码结果：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 1. 代码侧差异底稿",
    "",
    summaryMarkdown.trim(),
    "",
    "## 2. 人工补充观察",
    "- 哪些样例变化最值得关注：",
    "- 哪些变化符合预期：",
    "- 哪些变化不符合预期：",
    "- 下轮要继续验证什么：",
    "",
  ].join("\n");
}
