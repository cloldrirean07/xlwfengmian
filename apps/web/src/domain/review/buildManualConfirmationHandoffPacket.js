import { extractManualConfirmationDraftBlocks } from "./validateManualConfirmationDraft.js";

function findSuggestedBlock(draftMarkdown = "") {
  return extractManualConfirmationDraftBlocks(draftMarkdown).find((block) => block.key === "suggested") || null;
}

export function buildManualConfirmationHandoffPacket({
  applyPreview = null,
  draftMarkdown = "",
  sourcePaths = {},
} = {}) {
  const suggestedVariant = applyPreview?.variants?.find((variant) => variant.key === "suggested") || null;
  const conservativeVariant = applyPreview?.variants?.find((variant) => variant.key === "conservative") || null;
  const suggestedBlock = findSuggestedBlock(draftMarkdown);
  const canUseSuggestedBlock = Boolean(
    applyPreview?.ok &&
      suggestedVariant?.canProceedToFormalWrite &&
      suggestedBlock?.markdown,
  );

  return {
    ok: canUseSuggestedBlock,
    status: canUseSuggestedBlock ? "ready-for-manual-transfer" : "blocked-before-manual-transfer",
    summary: canUseSuggestedBlock
      ? "人工确认交接包已生成，可用于人工写入安全预览记录。"
      : "人工确认交接包未就绪，请先修正草稿或预演结果。",
    safetyBoundary: "仅生成项目内交接包，不写入 Obsidian，不执行正式写回。",
    targetBatchLabel: suggestedVariant?.targetBatchLabel || "",
    targetPath: suggestedVariant?.targetPath || "",
    patchSourceLabel: suggestedVariant?.patchSourceLabel || "",
    confirmationBlock: suggestedBlock?.markdown || "",
    suggestedGateResult: {
      canProceedToFormalWrite: Boolean(suggestedVariant?.canProceedToFormalWrite),
      stillNeedsEdit: suggestedVariant?.stillNeedsEdit || "",
      readyDecision: suggestedVariant?.readyDecision || "",
      confirmedLines: suggestedVariant?.confirmedLines || "",
      manualReviewConclusion: suggestedVariant?.manualReviewConclusion || "",
    },
    conservativeGateResult: {
      canProceedToFormalWrite: Boolean(conservativeVariant?.canProceedToFormalWrite),
      stillNeedsEdit: conservativeVariant?.stillNeedsEdit || "",
      readyDecision: conservativeVariant?.readyDecision || "",
    },
    sourcePaths,
    nextChecks: [
      "将推荐确认块写入 Obsidian 安全预览记录底部。",
      "重新检查正式写回门禁。",
      "门禁进入 ready-to-formal-write 后，再人工确认是否执行正式写回。",
    ],
  };
}

export function buildManualConfirmationHandoffPacketMarkdown(packet) {
  const lines = [
    "# 人工确认交接包",
    "",
    `- 交接状态：${packet.ok ? "可交接" : "需修正"}`,
    `- 状态码：${packet.status}`,
    `- 摘要：${packet.summary}`,
    `- 安全边界：${packet.safetyBoundary}`,
    "",
    "## 1. 目标记录",
    "",
    `- 目标批次：${packet.targetBatchLabel || "暂无"}`,
    `- 目标记录：${packet.targetPath || "暂无"}`,
    `- 当前改写来源：${packet.patchSourceLabel || "暂无"}`,
    "",
    "## 2. 推荐确认块",
    "",
    "```markdown",
    packet.confirmationBlock || "",
    "```",
    "",
    "## 3. 门禁预期",
    "",
    `- 推荐版本写入后：${packet.suggestedGateResult.canProceedToFormalWrite ? "可打开门禁" : "保持锁定"}`,
    `- 推荐版本仍需手改：${packet.suggestedGateResult.stillNeedsEdit || "无"}`,
    `- 推荐版本写回许可：${packet.suggestedGateResult.readyDecision || "未填写"}`,
    `- 保守版本写入后：${packet.conservativeGateResult.canProceedToFormalWrite ? "可打开门禁" : "保持锁定"}`,
    "",
    "## 4. 写入后复查",
    "",
    "```bash",
    "curl -s http://127.0.0.1:3201/api/batch-review-manual-formal-write-readiness",
    "```",
    "",
    "## 5. 下一步",
    "",
    ...packet.nextChecks.map((item) => `- ${item}`),
  ];

  return lines.join("\n");
}
