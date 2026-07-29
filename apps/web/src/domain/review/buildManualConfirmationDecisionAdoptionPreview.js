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

export function buildManualConfirmationDecisionAdoptionPreview({
  decisionMarkdown = "",
  handoffPacket = null,
} = {}) {
  const currentDecision = validateManualConfirmationDecision(decisionMarkdown, { handoffPacket });
  const adoptedDecisionMarkdown = replaceDecisionLine(
    replaceDecisionLine(decisionMarkdown, "决策状态", "adopt-recommended"),
    "决策说明",
    "预演采用推荐确认块",
  );
  const adoptedDecision = validateManualConfirmationDecision(adoptedDecisionMarkdown, {
    handoffPacket,
  });

  return {
    ok: Boolean(currentDecision.ok && adoptedDecision.ok && adoptedDecision.canProceedToSafePreviewWrite),
    status:
      currentDecision.ok && adoptedDecision.ok && adoptedDecision.canProceedToSafePreviewWrite
        ? "adoption-preview-ready"
        : "adoption-preview-blocked",
    currentDecision,
    adoptedDecision,
    adoptedDecisionMarkdown,
    validationMarkdown: buildManualConfirmationDecisionValidationMarkdown(adoptedDecision),
    canProceedToSafePreviewWriteAfterAdoption: Boolean(adoptedDecision.canProceedToSafePreviewWrite),
    safetyBoundary: "仅生成采用推荐确认块后的项目内预演，不修改决策记录，不写入 Obsidian，不执行正式写回。",
    summary:
      currentDecision.ok && adoptedDecision.ok && adoptedDecision.canProceedToSafePreviewWrite
        ? "采用推荐确认块后的决策预演通过，可作为进入安全预览写入前复查的依据。"
        : "采用推荐确认块后的决策预演未通过，请先修正决策记录或交接包。",
  };
}

export function buildManualConfirmationDecisionAdoptionPreviewMarkdown(preview) {
  return [
    "# 人工确认采用预演报告",
    "",
    `- 预演结论：${preview.ok ? "通过" : "需修正"}`,
    `- 状态码：${preview.status}`,
    `- 当前决策：${preview.currentDecision?.decisionLabel || "暂无"}`,
    `- 预演决策：${preview.adoptedDecision?.decisionLabel || "暂无"}`,
    `- 采用后是否进入安全预览写入前复查：${preview.canProceedToSafePreviewWriteAfterAdoption ? "是" : "否"}`,
    `- 安全边界：${preview.safetyBoundary}`,
    "",
    "## 1. 结论",
    "",
    preview.summary,
    "",
    "## 2. 预演采用记录",
    "",
    "````markdown",
    preview.adoptedDecisionMarkdown || "",
    "````",
  ].join("\n");
}
