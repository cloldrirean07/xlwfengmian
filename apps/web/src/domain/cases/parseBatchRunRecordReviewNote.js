const fieldMap = {
  "这批案例最卡的环节": "bottleneckStep",
  "哪些字段最难补": "hardestFields",
  "哪个输出最有价值": "mostValuableOutput",
  "和通用 AI 相比更有帮助的点": "strongerThanGenericAi",
  "和通用 AI 相比仍然不够好的点": "weakerThanGenericAi",
  "哪个按钮或模块最该前置": "prioritizedModule",
  "哪段说明文字太多": "tooMuchCopy",
  "哪个步骤最值得做成更强引导": "strongGuideStep",
  "当前更像功能问题，还是界面问题": "issueType",
  "这批试跑最关键的结论": "batchCriticalConclusion",
  "下一批还要不要继续同样赛道": "nextBatchSameTrack",
  "UI 优化是否已经到时机": "uiOptimizationTiming",
};

function normalizeFieldLabel(label = "") {
  return label.replace(/^[\-\s]+/u, "").replace(/：$/u, "").trim();
}

export function parseBatchRunRecordReviewNote(markdown = "") {
  const review = {};
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

    if (!value) {
      review[fieldKey] = "";
      continue;
    }

    review[fieldKey] = value;
  }

  const filledFields = Object.entries(review)
    .filter(([, value]) => String(value || "").trim().length > 0)
    .map(([key]) => key);

  return {
    review,
    filledFields,
    hasManualConclusion: filledFields.length > 0,
  };
}
