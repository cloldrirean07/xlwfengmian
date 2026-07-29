export function buildManualConfirmationSafePreviewWriteProjection({
  writePrecheck = null,
  manualDecision = null,
  sourcePaths = {},
} = {}) {
  const decisionAdopted = Boolean(
    manualDecision?.decisionStatus === "adopt-recommended" &&
      manualDecision?.canProceedToSafePreviewWrite,
  );
  const projectedReady = Boolean(
    writePrecheck?.ok &&
      writePrecheck?.after?.hasManualConfirmation &&
      writePrecheck?.after?.canProceedToFormalWrite &&
      decisionAdopted,
  );
  const blockers = [
    !writePrecheck?.ok
      ? {
          code: "write-precheck-blocked",
          label: "写入预检未通过",
          detail: writePrecheck?.summary || "安全预览确认写入预检仍需修正。",
        }
      : null,
    writePrecheck?.ok && !writePrecheck?.after?.hasManualConfirmation
      ? {
          code: "projected-manual-confirmation-missing",
          label: "写入后人工确认仍缺失",
          detail: "建议版本写入后仍无法形成完整人工确认。",
        }
      : null,
    writePrecheck?.ok && !writePrecheck?.after?.canProceedToFormalWrite
      ? {
          code: "projected-formal-permission-missing",
          label: "写入后许可仍未开放",
          detail: "建议版本写入后仍不能进入正式写回复查。",
        }
      : null,
    !decisionAdopted
      ? {
          code: "manual-decision-not-adopted",
          label: "人工决策未采用",
          detail: "需要先采用推荐确认块，才可把写入后状态投影为正式写回 ready。",
        }
      : null,
  ].filter(Boolean);

  return {
    ok: projectedReady,
    status: projectedReady
      ? "safe-preview-write-projection-ready-to-formal-write"
      : "safe-preview-write-projection-blocked",
    summary: projectedReady
      ? "投影验证通过：安全预览确认块写入后，正式写回门禁预计会进入 ready-to-formal-write。"
      : "投影验证未通过：安全预览确认块写入后，正式写回门禁仍可能保持锁定。",
    projectedReadiness: {
      status: projectedReady ? "ready-to-formal-write" : "awaiting-safe-write-confirmation",
      statusLabel: projectedReady ? "预计可以进入正式写回" : "预计仍需补确认",
    },
    writePrecheck: {
      status: writePrecheck?.status || "unknown",
      ok: Boolean(writePrecheck?.ok),
      targetBatchLabel: writePrecheck?.targetBatchLabel || "",
      targetSafePreviewPath: writePrecheck?.targetSafePreviewPath || "",
      suggestedPreviewPath: writePrecheck?.suggestedPreviewPath || "",
      changedFieldCount: writePrecheck?.changedFieldCount || 0,
      canProceedToFormalWriteAfterApply: Boolean(writePrecheck?.after?.canProceedToFormalWrite),
      hasManualConfirmationAfterApply: Boolean(writePrecheck?.after?.hasManualConfirmation),
    },
    manualDecision: {
      decisionStatus: manualDecision?.decisionStatus || "unknown",
      decisionLabel: manualDecision?.decisionLabel || "待读取",
      adopted: decisionAdopted,
    },
    blockers,
    nextAction: projectedReady
      ? {
          actionId: "apply-manual-confirmation-safe-preview-write",
          label: "写入安全预览确认块",
          requiredPhrase: writePrecheck?.confirmation?.requiredPhrase || "确认写入安全预览确认块",
          summary: "写入成功后重新检查正式写回门禁。",
        }
      : {
          actionId: "check-manual-review-formal-write-readiness",
          label: "重新检查写回门禁",
          requiredPhrase: "",
          summary: "补齐阻塞项后再刷新正式写回状态。",
        },
    sourcePaths,
    safetyBoundary: "仅生成安全预览确认写入后的门禁投影，不写入 Obsidian，不执行正式写回。",
    nextChecks: [
      "执行安全预览确认块写入前，核对写入目标与建议来源。",
      "写入后重新检查正式写回门禁。",
      "正式写回仍需单独确认短语后执行。",
    ],
  };
}

export function buildManualConfirmationSafePreviewWriteProjectionMarkdown(projection) {
  const lines = [
    "# 安全预览确认写入后门禁投影",
    "",
    `- 投影状态：${projection.ok ? "通过" : "需修正"}`,
    `- 状态码：${projection.status}`,
    `- 摘要：${projection.summary}`,
    `- 预计 readiness：${projection.projectedReadiness.status}`,
    `- 目标批次：${projection.writePrecheck.targetBatchLabel || "暂无"}`,
    `- 当前安全预览：${projection.writePrecheck.targetSafePreviewPath || "暂无"}`,
    `- 建议版本预演：${projection.writePrecheck.suggestedPreviewPath || "暂无"}`,
    `- 变更字段数：${projection.writePrecheck.changedFieldCount}`,
    `- 写入后人工确认：${projection.writePrecheck.hasManualConfirmationAfterApply ? "已具备" : "仍缺失"}`,
    `- 写入后正式写回复查：${projection.writePrecheck.canProceedToFormalWriteAfterApply ? "可进入" : "仍锁定"}`,
    `- 人工决策：${projection.manualDecision.decisionLabel}`,
    `- 推荐动作：${projection.nextAction.label}`,
    `- 安全边界：${projection.safetyBoundary}`,
    "",
    "## 1. 当前阻塞点",
    "",
  ];

  if (projection.blockers.length) {
    projection.blockers.forEach((item) => {
      lines.push(`- ${item.label}：${item.detail}`);
    });
  } else {
    lines.push("- 当前没有投影阻塞点。");
  }

  lines.push("", "## 2. 下一步", "");
  projection.nextChecks.forEach((item) => {
    lines.push(`- ${item}`);
  });

  return lines.join("\n");
}
