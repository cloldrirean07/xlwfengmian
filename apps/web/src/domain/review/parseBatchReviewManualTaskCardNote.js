const fieldMap = {
  "目标批次": "targetBatchLabel",
  "最卡环节": "bottleneckStep",
  "问题类型判断": "issueType",
  "最该前置模块": "prioritizedModule",
  "UI 时机判断": "uiOptimizationTiming",
  "这一批最重要的一句判断": "keyConclusion",
  "补完后最想重跑验证的点": "rerunFocus",
  "是否更接近进入首页系统 UI 讨论": "uiDiscussionProgress",
};

function normalizeFieldLabel(label = "") {
  return label.replace(/^[\-\s]+/u, "").replace(/：$/u, "").trim();
}

export function parseBatchReviewManualTaskCardNote(markdown = "") {
  const parsed = {};
  const lines = String(markdown || "").split("\n");

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed.startsWith("- ")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("：");
    if (separatorIndex < 0) {
      continue;
    }

    const label = normalizeFieldLabel(trimmed.slice(0, separatorIndex));
    const value = trimmed.slice(separatorIndex + 1).trim();
    const fieldKey = fieldMap[label];

    if (!fieldKey) {
      continue;
    }

    parsed[fieldKey] = value;
  }

  const filledFields = Object.entries(parsed)
    .filter(([key, value]) => key !== "targetBatchLabel" && String(value || "").trim().length > 0)
    .map(([key]) => key);

  return {
    parsed,
    filledFields,
    filledFieldCount: filledFields.length,
    hasManualInput: filledFields.length > 0,
    targetBatchLabel: parsed.targetBatchLabel || "",
  };
}
