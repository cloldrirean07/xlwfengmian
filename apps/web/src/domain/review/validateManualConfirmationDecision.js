const decisionStatusLabels = {
  pending: "待确认",
  "adopt-recommended": "采用推荐确认块",
  "reject-recommended": "暂不采用推荐确认块",
};

function extractListValue(markdown = "", label = "") {
  const pattern = new RegExp(`^-\\s*${label}：\\s*(.*)$`, "mu");
  const match = String(markdown || "").match(pattern);
  return match?.[1]?.trim() || "";
}

function hasRequiredConfirmationLines(markdown = "") {
  const requiredLines = [
    "- 人工复盘结论：",
    "- 哪几行确认可以正式写回：",
    "- 哪几行仍需手改：",
    "- 是否已经可以进入正式写回：可以",
  ];

  return requiredLines.every((line) => markdown.includes(line));
}

export function buildManualConfirmationDecisionTemplate({ handoffPacket = null, sourcePaths = {} } = {}) {
  const targetBatchLabel = handoffPacket?.targetBatchLabel || "";
  const confirmationBlock = handoffPacket?.confirmationBlock || "";
  const handoffPath = sourcePaths.manualConfirmationHandoffPacket || "";

  return [
    "# 人工确认决策记录",
    "",
    "- 决策状态：pending",
    `- 目标批次：${targetBatchLabel || "待补充"}`,
    `- 推荐确认块来源：${handoffPath || "待补充"}`,
    "- 决策说明：待确认",
    "",
    "## 1. 可选状态",
    "",
    "- pending：继续等待人工决策，不进入安全预览写入。",
    "- adopt-recommended：采用推荐确认块，进入安全预览写入前复查。",
    "- reject-recommended：暂不采用推荐确认块，保持正式写回锁定。",
    "",
    "## 2. 推荐确认块",
    "",
    "```markdown",
    confirmationBlock.trim(),
    "```",
    "",
    "## 3. 安全边界",
    "",
    "- 本记录只表达是否采用推荐确认块。",
    "- 本记录不会写入 Obsidian。",
    "- 正式写回仍需在安全预览写入后重新检查门禁。",
  ].join("\n");
}

export function validateManualConfirmationDecision(decisionMarkdown = "", { handoffPacket = null } = {}) {
  const status = extractListValue(decisionMarkdown, "决策状态");
  const targetBatchLabel = extractListValue(decisionMarkdown, "目标批次");
  const sourcePath = extractListValue(decisionMarkdown, "推荐确认块来源");
  const decisionNote = extractListValue(decisionMarkdown, "决策说明");
  const confirmationBlock = handoffPacket?.confirmationBlock || "";
  const statusIsKnown = Object.hasOwn(decisionStatusLabels, status);
  const targetMatches =
    !handoffPacket?.targetBatchLabel ||
    !targetBatchLabel ||
    targetBatchLabel === "待补充" ||
    targetBatchLabel === handoffPacket.targetBatchLabel;
  const handoffReady = Boolean(handoffPacket?.ok && hasRequiredConfirmationLines(confirmationBlock));
  const adopting = status === "adopt-recommended";
  const rejecting = status === "reject-recommended";
  const pending = status === "pending";
  const ok = Boolean(statusIsKnown && targetMatches && (adopting ? handoffReady : true));

  return {
    ok,
    status: ok
      ? adopting
        ? "ready-for-safe-preview-write"
        : rejecting
          ? "decision-rejected"
          : "awaiting-decision"
      : "decision-invalid",
    decisionStatus: status,
    decisionLabel: decisionStatusLabels[status] || "未知状态",
    targetBatchLabel,
    sourcePath,
    decisionNote,
    canProceedToSafePreviewWrite: Boolean(ok && adopting),
    handoffReady,
    targetMatches,
    safetyBoundary: "仅校验项目内决策记录，不写入 Obsidian，不执行正式写回。",
    summary: ok
      ? adopting
        ? "已采用推荐确认块，可进入安全预览写入前复查。"
        : rejecting
          ? "已暂不采用推荐确认块，正式写回保持锁定。"
          : "决策仍待确认，正式写回保持锁定。"
      : "决策记录未通过校验，请先修正状态、目标批次或交接包内容。",
  };
}

export function buildManualConfirmationDecisionValidationMarkdown(result) {
  return [
    "# 人工确认决策校验报告",
    "",
    `- 校验结论：${result.ok ? "通过" : "需修正"}`,
    `- 状态码：${result.status}`,
    `- 决策状态：${result.decisionLabel}`,
    `- 目标批次：${result.targetBatchLabel || "暂无"}`,
    `- 推荐确认块来源：${result.sourcePath || "暂无"}`,
    `- 决策说明：${result.decisionNote || "暂无"}`,
    `- 交接包是否就绪：${result.handoffReady ? "是" : "否"}`,
    `- 目标批次是否匹配：${result.targetMatches ? "是" : "否"}`,
    `- 是否可进入安全预览写入前复查：${result.canProceedToSafePreviewWrite ? "是" : "否"}`,
    `- 安全边界：${result.safetyBoundary}`,
    "",
    "## 1. 结论",
    "",
    result.summary,
  ].join("\n");
}
