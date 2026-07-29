import { batchRunManualReviewKeyFields } from "../cases/batchRunManualReviewKeyFields.js";

const reviewFieldLabelMap = {
  bottleneckStep: "最卡环节",
  issueType: "问题类型判断",
  prioritizedModule: "最该前置模块",
  uiOptimizationTiming: "UI 时机判断",
};

function buildReviewPatch(parsedFields = {}) {
  return {
    bottleneckStep: parsedFields.bottleneckStep || "",
    issueType: parsedFields.issueType || "",
    prioritizedModule: parsedFields.prioritizedModule || "",
    uiOptimizationTiming: parsedFields.uiOptimizationTiming || "",
  };
}

export function buildBatchReviewManualTaskBackfillPreview(latestTaskCardStatus = null) {
  if (!latestTaskCardStatus) {
    return {
      status: "no-task-card",
      statusLabel: "还没有人工待补任务草稿",
      targetBatchLabel: "",
      filledFieldLabels: [],
      missingFieldLabels: batchRunManualReviewKeyFields.map((item) => item.label),
      reviewPatch: buildReviewPatch(),
      summary: "当前还没有可回流的人工复盘待补任务草稿。",
    };
  }

  const parsedFields = latestTaskCardStatus.parsed?.parsed || {};
  const reviewPatch = buildReviewPatch(parsedFields);
  const filledFieldLabels = Object.entries(reviewPatch)
    .filter(([, value]) => String(value || "").trim().length > 0)
    .map(([key]) => reviewFieldLabelMap[key] || key);
  const missingFieldLabels = batchRunManualReviewKeyFields
    .filter(({ key }) => !String(reviewPatch[key] || "").trim())
    .map((item) => item.label);

  if (!filledFieldLabels.length) {
    return {
      status: "no-manual-input",
      statusLabel: "草稿已导出但还没填写",
      targetBatchLabel: latestTaskCardStatus.targetBatchLabel || "",
      filledFieldLabels,
      missingFieldLabels,
      reviewPatch,
      summary: "当前任务草稿还没有可回流的人工判断，先填写关键字段再重跑判断。",
    };
  }

  return {
    status: missingFieldLabels.length ? "partial-ready" : "ready-to-backfill",
    statusLabel: missingFieldLabels.length ? "已可预览回流，但还没填完整" : "可回流到批次试跑结论",
    targetBatchLabel: latestTaskCardStatus.targetBatchLabel || "",
    filledFieldLabels,
    missingFieldLabels,
    reviewPatch,
    summary: missingFieldLabels.length
      ? `当前已经能回流 ${filledFieldLabels.join(" / ")}，但还缺 ${missingFieldLabels.join(" / ")}。`
      : "当前 4 个关键人工判断字段都已填写，可以作为真实批次试跑结论预览输入。",
  };
}
