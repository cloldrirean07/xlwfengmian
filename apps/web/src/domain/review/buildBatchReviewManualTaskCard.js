const manualReviewFieldCatalog = {
  bottleneckStep: {
    label: "最卡环节",
    prompt: "这一批真实试跑里，最容易停住的步骤是哪一步？",
    answerHint: "尽量写成具体动作，例如“看完结果不知道先选哪条”。",
  },
  issueType: {
    label: "问题类型判断",
    prompt: "这批问题现在更像功能问题、流程问题，还是界面问题？",
    answerHint: "先做一级归因，例如“更像功能问题”或“更像界面问题”。",
  },
  prioritizedModule: {
    label: "最该前置模块",
    prompt: "如果只能先把一个模块前置或强调，优先选择哪块？",
    answerHint: "优先写模块名，例如“输入准备区”“结果区”“导出后下一步”。",
  },
  uiOptimizationTiming: {
    label: "UI 时机判断",
    prompt: "基于这批真实试跑，现在讨论 UI 会不会太早？",
    answerHint: "先给阶段性判断，例如“先别急着做 UI”或“接近可以讨论 UI”。",
  },
};

function resolveLikelyModule(topCategoryLabels = [], topActionLabels = []) {
  const categoryText = topCategoryLabels.join(" / ");
  const actionText = topActionLabels.join(" / ");

  if (categoryText.includes("输入准备") || actionText.includes("内容主题") || actionText.includes("素材描述")) {
    return "输入准备区";
  }

  if (categoryText.includes("结果阅读") || categoryText.includes("补写建议")) {
    return "结果区";
  }

  if (categoryText.includes("导出沉淀")) {
    return "导出后下一步";
  }

  if (categoryText.includes("是否进入 UI")) {
    return "UI 时机判断区";
  }

  return "结果区";
}

function buildStartSuggestion(fieldKey, topCategoryLabels = [], topActionLabels = [], hasManualConclusion = false) {
  const topCategory = topCategoryLabels[0] || "当前这批最强摩擦点";
  const topAction = topActionLabels[0] || "当前最该先补的信息";

  if (fieldKey === "bottleneckStep") {
    return `可以先从“${topCategory}”下手，写成一句具体动作，例如：看到结果后不知道先改哪一步。`;
  }

  if (fieldKey === "issueType") {
    return `先在“功能问题 / 流程问题 / 界面问题”里选一个最像的，再补一句原因，例如：更像流程问题，因为关键补写顺序还不明确。`;
  }

  if (fieldKey === "prioritizedModule") {
    return `先写一个最该前置的模块名即可，例如：${resolveLikelyModule(topCategoryLabels, topActionLabels)}。它通常和“${topAction}”最相关。`;
  }

  if (fieldKey === "uiOptimizationTiming") {
    return hasManualConclusion
      ? "可以先写成阶段性判断，例如：接近可以讨论 UI，但应先补齐剩余人工判断。"
      : "可以先写成阶段性判断，例如：先别急着做 UI，先补齐关键人工判断再重跑。";
  }

  return "先写一句最短判断，再补一句原因。";
}

function buildSuggestedDraft(fieldKey, topCategoryLabels = [], topActionLabels = [], hasManualConclusion = false) {
  const topCategory = topCategoryLabels[0] || "当前流程";
  const topAction = topActionLabels[0] || "关键信息";
  const likelyModule = resolveLikelyModule(topCategoryLabels, topActionLabels);

  if (fieldKey === "bottleneckStep") {
    return topCategory.includes("输入准备")
      ? "最卡在准备输入信息时，不知道先补哪项。"
      : "最卡在看完结果后，不知道先改哪一步。";
  }

  if (fieldKey === "issueType") {
    return topCategory.includes("输入准备") || topCategory.includes("补写建议")
      ? "更像流程问题，因为关键补写顺序还不明确，容易停在中间。"
      : "更像界面问题，因为结果虽然给出来了，但第一眼还不够容易判断下一步。";
  }

  if (fieldKey === "prioritizedModule") {
    return `建议先把${likelyModule}前置，因为它和“${topAction}”最直接相关。`;
  }

  if (fieldKey === "uiOptimizationTiming") {
    return hasManualConclusion
      ? "接近可以讨论 UI，但最好先把剩余人工判断补齐再定。"
      : "先别急着做 UI，先补齐关键人工判断再重跑更稳。";
  }

  return "先给一句最短判断，再补一句原因。";
}

function buildFieldTask(field = {}, context = {}) {
  const meta = manualReviewFieldCatalog[field.key] || {};
  const topCategoryLabels = context.topCategoryLabels || [];
  const topActionLabels = context.topActionLabels || [];
  const hasManualConclusion = Boolean(context.hasManualConclusion);

  return {
    key: field.key || "",
    label: field.label || meta.label || "待补字段",
    prompt: meta.prompt || "请补充这一项人工判断。",
    answerHint: meta.answerHint || "请尽量写成一句可直接复用的判断。",
    startSuggestion: buildStartSuggestion(
      field.key || "",
      topCategoryLabels,
      topActionLabels,
      hasManualConclusion,
    ),
    suggestedDraft: buildSuggestedDraft(
      field.key || "",
      topCategoryLabels,
      topActionLabels,
      hasManualConclusion,
    ),
  };
}

export function buildBatchReviewManualTaskCard(priorityRows = []) {
  const topRow = priorityRows[0] || null;

  if (!topRow) {
    return {
      title: "人工复盘待补任务",
      status: "no-pending-batch",
      statusLabel: "当前没有待补批次",
      summary: "当前没有明确的待补人工复盘批次，可以转向新增真实样本或重跑判断报告。",
      targetBatchLabel: "",
      topCategoryLabels: [],
      topActionLabels: [],
      fieldTasks: [],
    };
  }

  const fieldTasks = (topRow.missingKeyFields || []).map((field) =>
    buildFieldTask(field, {
      topCategoryLabels: topRow.topCategoryLabels || [],
      topActionLabels: topRow.topActionLabels || [],
      hasManualConclusion: topRow.hasManualConclusion,
    }),
  );

  return {
    title: "人工复盘待补任务",
    status: topRow.hasManualConclusion ? "fill-missing-fields" : "start-manual-review",
    statusLabel: topRow.hasManualConclusion ? "继续补齐关键判断" : "先写第一轮人工复盘",
    summary: topRow.hasManualConclusion
      ? `先把 ${topRow.batchLabel} 这批剩余关键字段补齐，再重新判断 UI 时机。`
      : `先为 ${topRow.batchLabel} 补第一轮人工复盘，不要直接跳进 UI 方案讨论。`,
    targetBatchLabel: topRow.batchLabel,
    topCategoryLabels: topRow.topCategoryLabels || [],
    topActionLabels: topRow.topActionLabels || [],
    fieldTasks,
  };
}
