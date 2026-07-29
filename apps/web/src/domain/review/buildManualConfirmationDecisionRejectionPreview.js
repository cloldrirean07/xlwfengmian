import {
  buildManualConfirmationDecisionValidationMarkdown,
  validateManualConfirmationDecision,
} from "./validateManualConfirmationDecision.js";

function replaceDecisionLine(markdown = "", label = "", value = "") {
  const pattern = new RegExp(`^-\\s*${label}：.*$`, "mu");

  if (pattern.test(markdown)) {
    return markdown.replace(pattern, `- ${label}：${value}`);
  }

  return `${markdown.trimEnd()}\n- ${label}：${value}`;
}

export function buildManualConfirmationDecisionRejectionPreview({
  decisionMarkdown = "",
  handoffPacket = null,
} = {}) {
  const currentDecision = validateManualConfirmationDecision(decisionMarkdown, { handoffPacket });
  const rejectedDecisionMarkdown = replaceDecisionLine(
    replaceDecisionLine(decisionMarkdown, "决策状态", "reject-recommended"),
    "决策说明",
    "预演暂不采用推荐确认块",
  );
  const rejectedDecision = validateManualConfirmationDecision(rejectedDecisionMarkdown, {
    handoffPacket,
  });
  const rejectionKeepsLocked = Boolean(rejectedDecision.ok && !rejectedDecision.canProceedToSafePreviewWrite);

  return {
    ok: Boolean(currentDecision.ok && rejectionKeepsLocked),
    status: currentDecision.ok && rejectionKeepsLocked ? "rejection-preview-ready" : "rejection-preview-blocked",
    currentDecision,
    rejectedDecision,
    rejectedDecisionMarkdown,
    validationMarkdown: buildManualConfirmationDecisionValidationMarkdown(rejectedDecision),
    canProceedToSafePreviewWriteAfterRejection: Boolean(rejectedDecision.canProceedToSafePreviewWrite),
    safetyBoundary: "仅生成暂不采用推荐确认块后的项目内预演，不修改决策记录，不写入 Obsidian，不执行正式写回。",
    summary:
      currentDecision.ok && rejectionKeepsLocked
        ? "暂不采用推荐确认块后的决策预演通过，正式写回保持锁定。"
        : "暂不采用推荐确认块后的决策预演未通过，请先修正决策记录或交接包。",
  };
}

export function buildManualConfirmationDecisionRejectionPreviewMarkdown(preview) {
  return [
    "# 人工确认暂不采用预演报告",
    "",
    `- 预演结论：${preview.ok ? "通过" : "需修正"}`,
    `- 状态码：${preview.status}`,
    `- 当前决策：${preview.currentDecision?.decisionLabel || "暂无"}`,
    `- 预演决策：${preview.rejectedDecision?.decisionLabel || "暂无"}`,
    `- 暂不采用后是否进入安全预览写入前复查：${preview.canProceedToSafePreviewWriteAfterRejection ? "是" : "否"}`,
    `- 安全边界：${preview.safetyBoundary}`,
    "",
    "## 1. 结论",
    "",
    preview.summary,
    "",
    "## 2. 预演暂不采用记录",
    "",
    "````markdown",
    preview.rejectedDecisionMarkdown || "",
    "````",
  ].join("\n");
}
