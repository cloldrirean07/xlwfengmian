export function buildObsidianBatchReviewManualSafeWritePreviewRecord({
  generatedDate,
  sourceMarkdownPath,
  safeWritePreviewMarkdown,
  confirmationHints = null,
}) {
  const manualConclusionHint =
    confirmationHints?.manualConclusionHint || "用一句话说明本次安全预览是否可作为正式写回依据";
  const confirmedLinesHint = confirmationHints?.confirmedLinesHint || "待人工确认后填写";
  const stillNeedsEditHint =
    confirmationHints?.stillNeedsEditHint || "如果当前没问题可留空；如需改动，写出字段名或原因";
  const readyDecisionHint =
    confirmationHints?.readyDecisionHint || "只有当“仍需手改”为空时，再填写“可以”";

  return [
    `# 真实批次试跑记录安全写回预览_${generatedDate}`,
    "",
    "> 生成方式：代码侧人工复盘安全写回预览自动生成",
    `> 生成日期：${generatedDate}`,
    `> 对应代码底稿：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这是一份正式写回前的安全预览稿。",
    "- 它会展示真实批次试跑记录当前原文，以及按人工复盘拟写回后的预览版本。",
    "- 当前仍然不直接覆盖真实批次试跑记录，请先人工确认。",
    "",
    "## 1. 代码侧安全写回预览",
    "",
    safeWritePreviewMarkdown.trim(),
    "",
    "## 2. 人工补充",
    "- 人工复盘结论：",
    `- 建议起笔（人工复盘结论）：${manualConclusionHint}`,
    "- 哪几行确认可以正式写回：",
    `- 建议起笔（确认写回行）：${confirmedLinesHint}`,
    "- 哪几行仍需手改：",
    `- 建议起笔（仍需手改）：${stillNeedsEditHint}`,
    "- 是否已经可以进入正式写回：",
    `- 建议起笔（进入正式写回）：${readyDecisionHint}`,
    "",
    "## 3. 填写参考",
    "- 人工复盘结论建议：确认本次改写是否能代表真实试跑观察，并说明最关键原因。",
    "- 确认字段建议：只填写已核对无误、可覆盖到真实批次试跑记录的字段名。",
    "- 仍需手改建议：如某个字段不准确，填写字段名或原因；没有问题时保持为空。",
    "- 正式写回判断：人工结论已填写、确认字段已列出、仍需手改为空后，再填写“可以”。",
    "",
  ].join("\n");
}
