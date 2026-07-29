export function buildManualConfirmationSafePreviewAdoptionPacket({
  applyPreview = null,
  decision = null,
  sourcePaths = {},
} = {}) {
  const suggestedVariant = (applyPreview?.variants || []).find((variant) => variant.key === "suggested");
  const decisionAdopted = Boolean(
    decision?.decisionStatus === "adopt-recommended" &&
      decision?.canProceedToSafePreviewWrite,
  );
  const ready = Boolean(
    applyPreview?.ok &&
      suggestedVariant?.ok &&
      suggestedVariant.canProceedToFormalWrite &&
      decisionAdopted,
  );

  return {
    ok: ready,
    status: ready ? "safe-preview-adoption-packet-ready" : "safe-preview-adoption-packet-blocked",
    summary: ready
      ? "安全预览确认采用包已就绪，可在人工确认后写入安全预览记录。"
      : "安全预览确认采用包未就绪，请先完成建议填写块预演和人工决策采用。",
    targetBatchLabel: suggestedVariant?.targetBatchLabel || decision?.targetBatchLabel || "",
    targetSafePreviewPath: sourcePaths.latestSafeWritePreview || "",
    suggestedPreviewPath: suggestedVariant?.outputPath || "",
    decisionStatus: decision?.decisionStatus || "unknown",
    decisionLabel: decision?.decisionLabel || "未知状态",
    canProceedToFormalWriteAfterApply: Boolean(suggestedVariant?.canProceedToFormalWrite),
    manualReviewConclusion: suggestedVariant?.manualReviewConclusion || "",
    confirmedLines: suggestedVariant?.confirmedLines || "",
    stillNeedsEdit: suggestedVariant?.stillNeedsEdit || "",
    readyDecision: suggestedVariant?.readyDecision || "",
    sourcePaths,
    safetyBoundary: "仅生成项目内采用包，不写入 Obsidian，不执行正式写回。",
    nextChecks: [
      "人工确认采用建议填写块后，将建议版本写入安全预览记录。",
      "重新检查正式写回 readiness，确认状态进入 ready-to-formal-write。",
      "正式写回仍需再次人工确认后才可执行。",
    ],
  };
}

export function buildManualConfirmationSafePreviewAdoptionPacketMarkdown(packet) {
  const lines = [
    "# 安全预览确认采用包",
    "",
    `- 采用包状态：${packet.ok ? "可使用" : "需修正"}`,
    `- 状态码：${packet.status}`,
    `- 摘要：${packet.summary}`,
    `- 目标批次：${packet.targetBatchLabel || "暂无"}`,
    `- 人工决策：${packet.decisionLabel}`,
    `- 应用后是否可进入正式写回：${packet.canProceedToFormalWriteAfterApply ? "是" : "否"}`,
    `- 安全边界：${packet.safetyBoundary}`,
    "",
    "## 1. 写入目标",
    "",
    `- 安全预览记录：${packet.targetSafePreviewPath || "暂无"}`,
    `- 建议版本预演：${packet.suggestedPreviewPath || "暂无"}`,
    "",
    "## 2. 建议确认块",
    "",
    "```markdown",
    "## 4. 人工补充",
    `- 人工复盘结论：${packet.manualReviewConclusion}`,
    `- 哪几行确认可以正式写回：${packet.confirmedLines}`,
    `- 哪几行仍需手改：${packet.stillNeedsEdit}`,
    `- 是否已经可以进入正式写回：${packet.readyDecision}`,
    "```",
    "",
    "## 3. 后续复查",
    "",
  ];

  packet.nextChecks.forEach((item) => {
    lines.push(`- ${item}`);
  });

  return lines.join("\n");
}
