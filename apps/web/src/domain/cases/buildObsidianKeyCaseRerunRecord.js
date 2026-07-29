export function buildObsidianKeyCaseRerunRecord({
  generatedDate,
  sourceMarkdownPath,
  summaryMarkdown,
}) {
  return [
    `# 关键样例复跑报告_${generatedDate}`,
    "",
    "> 生成方式：代码侧 `rerun:key-cases` 自动生成",
    `> 生成日期：${generatedDate}`,
    `> 对应代码结果：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 1. 代码侧复跑底稿",
    "",
    summaryMarkdown.trim(),
    "",
    "## 2. 人工补充观察",
    "- 本轮规则升级主要改了什么：",
    "- 哪些样例结果变化最明显：",
    "- 哪些误判仍未解决：",
    "- 下轮优先要修什么：",
    "",
  ].join("\n");
}
