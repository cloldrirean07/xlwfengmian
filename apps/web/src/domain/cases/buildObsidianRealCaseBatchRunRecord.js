export function buildObsidianRealCaseBatchRunRecord({
  generatedDate,
  sourceMarkdownPath,
  runRecordMarkdown,
}) {
  return [
    `# 批次试跑记录_${generatedDate}`,
    "",
    "> 生成方式：代码侧批量真实案例试跑记录导出",
    `> 生成日期：${generatedDate}`,
    `> 对应代码底稿：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这是一份帮助你记录一整批真实案例试跑观察的底稿。",
    "- 它会带出当前批次结构质量、工作单状态和逐条下一步。",
    "- 你后续应重点补：真实使用摩擦、和通用 AI 的差异、是否进入 UI 优化讨论。",
    "",
    "## 1. 代码侧试跑底稿",
    "",
    runRecordMarkdown.trim(),
    "",
    "## 2. 补充结论",
    "- 这批试跑最关键的结论：",
    "- 下一批还要不要继续同样赛道：",
    "- UI 优化是否已经到时机：",
    "",
  ].join("\n");
}
