export function buildManualConfirmationDecisionOptionsIndex({
  decision = null,
  adoptionPreview = null,
  adoptionPacket = null,
  adoptionPacketPath = "",
  rejectionPreview = null,
  rejectionPacket = null,
  rejectionPacketPath = "",
  outputPaths = {},
} = {}) {
  const adoptionReady = Boolean(
    adoptionPreview?.ok &&
      adoptionPacket?.ok &&
      adoptionPreview?.canProceedToSafePreviewWriteAfterAdoption,
  );
  const rejectionReady = Boolean(
    rejectionPreview?.ok &&
      rejectionPacket?.ok &&
      !rejectionPreview?.canProceedToSafePreviewWriteAfterRejection,
  );

  return {
    ok: Boolean(decision?.ok && adoptionReady && rejectionReady),
    status: decision?.decisionStatus === "pending" ? "awaiting-manual-choice" : "decision-already-set",
    decisionStatus: decision?.decisionStatus || "unknown",
    decisionLabel: decision?.decisionLabel || "未知状态",
    adoption: {
      ok: adoptionReady,
      label: "采用推荐确认块",
      result: adoptionReady ? "进入安全预览写入前复查" : "等待采用预演或操作包",
      previewStatus: adoptionPreview?.status || "missing",
      packetStatus: adoptionPacket?.status || "missing",
      canProceedToSafePreviewWrite: Boolean(adoptionPreview?.canProceedToSafePreviewWriteAfterAdoption),
      packetPath: adoptionPacketPath || adoptionPacket?.outputPaths?.markdown || "",
    },
    rejection: {
      ok: rejectionReady,
      label: "暂不采用推荐确认块",
      result: rejectionReady ? "正式写回保持锁定" : "等待暂不采用预演或操作包",
      previewStatus: rejectionPreview?.status || "missing",
      packetStatus: rejectionPacket?.status || "missing",
      canProceedToSafePreviewWrite: Boolean(rejectionPreview?.canProceedToSafePreviewWriteAfterRejection),
      packetPath: rejectionPacketPath || rejectionPacket?.outputPaths?.markdown || "",
    },
    outputPaths,
    safetyBoundary: "仅汇总项目内人工决策证据，不修改决策记录，不写入 Obsidian，不执行正式写回。",
    summary:
      decision?.decisionStatus === "pending"
        ? "人工决策两条路径已汇总，等待人工选择采用或暂不采用。"
        : "人工决策记录已不处于待确认状态，请按当前决策继续复查。",
  };
}

export function buildManualConfirmationDecisionOptionsIndexMarkdown(index) {
  return [
    "# 人工确认决策选择索引",
    "",
    `- 索引状态：${index.ok ? "可使用" : "需补齐"}`,
    `- 状态码：${index.status}`,
    `- 当前决策：${index.decisionLabel}`,
    `- 摘要：${index.summary}`,
    `- 安全边界：${index.safetyBoundary}`,
    "",
    "## 1. 选择对照",
    "",
    "| 选择 | 预演状态 | 操作包状态 | 是否进入安全预览写入前复查 | 结果 |",
    "| --- | --- | --- | --- | --- |",
    `| ${index.adoption.label} | ${index.adoption.previewStatus} | ${index.adoption.packetStatus} | ${index.adoption.canProceedToSafePreviewWrite ? "是" : "否"} | ${index.adoption.result} |`,
    `| ${index.rejection.label} | ${index.rejection.previewStatus} | ${index.rejection.packetStatus} | ${index.rejection.canProceedToSafePreviewWrite ? "是" : "否"} | ${index.rejection.result} |`,
    "",
    "## 2. 操作包位置",
    "",
    `- 采用操作包：${index.adoption.packetPath || "暂无"}`,
    `- 暂不采用操作包：${index.rejection.packetPath || "暂无"}`,
    "",
    "## 3. 下一步",
    "",
    "- 若采用推荐确认块，按采用操作包更新项目内决策记录后重新检查门禁。",
    "- 若暂不采用推荐确认块，按暂不采用操作包更新项目内决策记录后保持正式写回锁定。",
    "- 本索引不会替代人工决策。",
  ].join("\n");
}
