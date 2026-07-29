function renderValue(value = "", emptyText = "待补充") {
  return String(value || "").trim() || emptyText;
}

export function buildBatchReviewManualSafeWritePreviewMarkdown({
  targetBatchLabel = "",
  targetPath = "",
  patch = {},
  currentMarkdown = "",
  patchedMarkdown = "",
} = {}) {
  return [
    "# 真实批次试跑记录安全写回预览",
    "",
    "## 0. 当前状态",
    `- 目标批次：${renderValue(targetBatchLabel, "暂无")}`,
    `- 目标记录：${renderValue(targetPath, "暂无")}`,
    "- 当前模式：仅生成安全写回预览，不直接覆盖真实批次试跑记录。",
    `- 当前改写来源：${renderValue(
      patch.patchSource === "suggested-draft"
        ? "系统建议初稿"
        : patch.patchSource === "manual-or-mixed"
          ? "人工填写或人工+建议混合"
          : "",
      "暂无",
    )}`,
    "",
    "## 1. 本次拟写回字段",
    `- 这批案例最卡的环节：${renderValue(patch.bottleneckStep)}`,
    `- 哪个按钮或模块最该前置：${renderValue(patch.prioritizedModule)}`,
    `- 当前更像功能问题，还是界面问题：${renderValue(patch.issueType)}`,
    `- 这批试跑最关键的结论：${renderValue(patch.batchCriticalConclusion)}`,
    `- 下一批还要不要继续同样赛道：${renderValue(patch.nextBatchSameTrack)}`,
    `- UI 优化是否已经到时机：${renderValue(patch.uiOptimizationTiming)}`,
    "",
    "## 2. 当前记录原文",
    "",
    "<!-- SAFE_WRITE_CURRENT_START -->",
    currentMarkdown.trim(),
    "<!-- SAFE_WRITE_CURRENT_END -->",
    "",
    "## 3. 写回后预览",
    "",
    "<!-- SAFE_WRITE_PATCHED_START -->",
    patchedMarkdown.trim(),
    "<!-- SAFE_WRITE_PATCHED_END -->",
    "",
  ].join("\n");
}
