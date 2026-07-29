function valueOrEmpty(value = "") {
  return String(value || "").trim();
}

function replaceLine(markdown, label, value) {
  const pattern = new RegExp(`^- ${label}：.*$`, "m");
  return markdown.replace(pattern, `- ${label}：${value}`);
}

export function buildBatchReviewManualWritebackPatch({
  backfillPreview = null,
  latestTaskCardStatus = null,
  taskCardReport = null,
} = {}) {
  const taskCardFields = latestTaskCardStatus?.parsed?.parsed || {};
  const reviewPatch = backfillPreview?.reviewPatch || {};
  const taskFieldMap = Object.fromEntries(
    (taskCardReport?.fieldTasks || []).map((item) => [item.key, item]),
  );

  const fallback = (fieldKey, directValue = "") =>
    valueOrEmpty(directValue) || valueOrEmpty(taskFieldMap[fieldKey]?.suggestedDraft);

  return {
    bottleneckStep: fallback("bottleneckStep", reviewPatch.bottleneckStep),
    issueType: fallback("issueType", reviewPatch.issueType),
    prioritizedModule: fallback("prioritizedModule", reviewPatch.prioritizedModule),
    uiOptimizationTiming:
      valueOrEmpty(taskCardFields.uiDiscussionProgress) ||
      fallback("uiOptimizationTiming", reviewPatch.uiOptimizationTiming),
    batchCriticalConclusion:
      valueOrEmpty(taskCardFields.keyConclusion) || fallback("bottleneckStep", reviewPatch.bottleneckStep),
    nextBatchSameTrack:
      valueOrEmpty(taskCardFields.rerunFocus) || "先基于当前建议态改写草稿做一轮人工确认。",
    patchSource:
      backfillPreview?.filledFieldLabels?.length
        ? "manual-or-mixed"
        : taskCardReport?.fieldTasks?.length
          ? "suggested-draft"
          : "empty",
  };
}

export function applyBatchReviewManualWritebackPatch(currentMarkdown = "", patch = {}) {
  let nextMarkdown = String(currentMarkdown || "");

  nextMarkdown = replaceLine(nextMarkdown, "这批案例最卡的环节", patch.bottleneckStep || "");
  nextMarkdown = replaceLine(nextMarkdown, "哪个按钮或模块最该前置", patch.prioritizedModule || "");
  nextMarkdown = replaceLine(
    nextMarkdown,
    "当前更像功能问题，还是界面问题",
    patch.issueType || "",
  );
  nextMarkdown = replaceLine(
    nextMarkdown,
    "这批试跑最关键的结论",
    patch.batchCriticalConclusion || "",
  );
  nextMarkdown = replaceLine(
    nextMarkdown,
    "下一批还要不要继续同样赛道",
    patch.nextBatchSameTrack || "",
  );
  nextMarkdown = replaceLine(
    nextMarkdown,
    "UI 优化是否已经到时机",
    patch.uiOptimizationTiming || "",
  );

  return nextMarkdown;
}
