export function buildObsidianUiOptimizationReadinessRecord({
  generatedDate,
  sourceMarkdownPath,
  readinessMarkdown,
}) {
  return [
    `# UI优化进入条件报告_${generatedDate}`,
    "",
    "> 生成方式：代码侧 UI readiness report 自动生成草稿",
    `> 生成日期：${generatedDate}`,
    `> 对应代码底稿：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这份报告用于判断当前是否已经适合正式进入 UI 优化讨论。",
    "- 它会汇总真实批次工作单、试跑记录和读回确认状态。",
    "- 你后续应继续补：真实摩擦点、模块优先级和改版目标。",
    "",
    "## 1. 代码侧判断底稿",
    "",
    readinessMarkdown.trim(),
    "",
    "## 2. 人工判断",
    "- 当前最值得优先改的模块：",
    "- 当前最应该后置讨论的视觉项：",
    "- 是否正式进入 UI 讨论：",
    "",
  ].join("\n");
}
