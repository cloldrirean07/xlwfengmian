export function buildObsidianBatchReviewManualTaskCardRecord({
  generatedDate,
  sourceMarkdownPath,
  taskCardMarkdown,
}) {
  return [
    `# 人工复盘待补任务_${generatedDate}`,
    "",
    "> 生成方式：代码侧人工复盘待补任务自动生成草稿",
    `> 生成日期：${generatedDate}`,
    `> 对应代码底稿：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这份任务单用于把当前最该补的人工复盘字段收成一个可直接填写的草稿。",
    "- 建议先补完这里的关键字段，再回到 UI readiness 和批次复盘看板重跑判断。",
    "- 你后续可以把这里的结论回填进真实批次试跑记录。",
    "",
    "## 1. 代码侧任务底稿",
    "",
    taskCardMarkdown.trim(),
    "",
    "## 2. 人工补充",
    "- 这一批最重要的一句判断：",
    "- 补完后最想重跑验证的点：",
    "- 是否更接近进入首页系统 UI 讨论：",
    "",
  ].join("\n");
}
