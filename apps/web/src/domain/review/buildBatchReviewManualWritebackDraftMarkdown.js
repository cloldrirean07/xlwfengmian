function renderValue(value = "", emptyText = "待补充") {
  return String(value || "").trim() || emptyText;
}

export function buildBatchReviewManualWritebackDraftMarkdown({
  backfillPreview = null,
  latestTaskCardStatus = null,
  latestRunRecordStatus = null,
} = {}) {
  const targetBatchLabel = backfillPreview?.targetBatchLabel || "";
  const reviewPatch = backfillPreview?.reviewPatch || {};
  const statusLabel = backfillPreview?.statusLabel || "待补充";
  const summary = backfillPreview?.summary || "当前还没有可写回的人工复盘内容。";
  const filledFieldLabels = backfillPreview?.filledFieldLabels || [];
  const missingFieldLabels = backfillPreview?.missingFieldLabels || [];

  return [
    "# 真实批次试跑结论写回草稿",
    "",
    "## 0. 当前状态",
    `- 当前状态：${statusLabel}`,
    `- 目标批次：${renderValue(targetBatchLabel, "暂无")}`,
    `- 当前摘要：${summary}`,
    `- 已填写字段：${filledFieldLabels.length ? filledFieldLabels.join(" / ") : "暂无"}`,
    `- 仍缺字段：${missingFieldLabels.length ? missingFieldLabels.join(" / ") : "无"}`,
    `- 最近任务草稿：${latestTaskCardStatus?.targetPath || "暂无"}`,
    `- 目标批次试跑记录：${latestRunRecordStatus?.targetPath || "暂无"}`,
    "",
    "## 1. 建议写回方式",
    "- 当前先生成对齐真实批次试跑记录结构的写回草稿。",
    "- 这一步仍然不直接覆盖真实批次试跑记录，先让你人工确认措辞和方向。",
    "- 确认无误后，再决定是否进入正式写回或后续重跑 UI readiness。",
    "",
    "## 2. 对齐真实记录的写回块",
    "",
    "### 6. 人工试跑结论",
    `- 这批案例最卡的环节：${renderValue(reviewPatch.bottleneckStep)}`,
    "- 哪些字段最难补：",
    "- 哪个输出最有价值：",
    "- 和通用 AI 相比更有帮助的点：",
    "- 和通用 AI 相比仍然不够好的点：",
    "",
    "### 7. 对产品的影响",
    `- 哪个按钮或模块最该前置：${renderValue(reviewPatch.prioritizedModule)}`,
    "- 哪段说明文字太多：",
    "- 哪个步骤最值得做成更强引导：",
    `- 当前更像功能问题，还是界面问题：${renderValue(reviewPatch.issueType)}`,
    "",
    "### 8. 下一步判断补充",
    `- 这批试跑最关键的结论：${renderValue(reviewPatch.bottleneckStep, "待结合完整复盘补充")}`,
    "- 下一批还要不要继续同样赛道：",
    `- UI 优化是否已经到时机：${renderValue(reviewPatch.uiOptimizationTiming)}`,
    "",
    "## 3. 人工确认备注",
    "- 哪些句子现在可以直接写回：",
    "- 哪些句子还需要你自己改口径：",
    "- 如果暂不写回，原因是什么：",
    "",
  ].join("\n");
}
