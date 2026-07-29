export function buildObsidianWorkspaceDecisionRecord({
  decisionId,
  generatedDate,
  sourceJsonPath,
  markdownBody,
}) {
  return [
    `# 工作区建议记录_${generatedDate}_${decisionId}`,
    "",
    "> 生成方式：代码侧工作区建议保存 + export 脚本自动生成草稿",
    `> 记录编号：${decisionId}`,
    `> 生成日期：${generatedDate}`,
    `> 对应代码结果：${sourceJsonPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这是一份工作区建议的中间状态记录草稿。",
    "- 以下内容来自当时的工作区建议保存结果。",
    "- 后续应补充：采纳或不采纳理由、后续是否进入二轮、是否要回写规则。",
    "",
    markdownBody.trim(),
    "",
  ].join("\n");
}
