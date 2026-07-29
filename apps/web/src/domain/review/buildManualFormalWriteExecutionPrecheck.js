export function buildManualFormalWriteExecutionPrecheck({
  readiness = null,
  confirmationPhrase = "确认执行正式写回",
  sourcePaths = {},
} = {}) {
  const safeWriteStatus = readiness?.latestSafeWriteStatus || null;
  const manualDecision = readiness?.manualConfirmationDecision || null;
  const ready = readiness?.status === "ready-to-formal-write";
  const hasTargetRecord = Boolean(safeWriteStatus?.parsed?.targetPath);
  const hasPatchedMarkdown = Boolean(String(safeWriteStatus?.parsed?.patchedMarkdown || "").trim());
  const readbackOk = Boolean(safeWriteStatus?.readbackOk && safeWriteStatus?.matchedExpectedContent);
  const hasManualConfirmation = Boolean(safeWriteStatus?.hasManualConfirmation);
  const manualDecisionAdopted = Boolean(
    manualDecision?.decisionStatus === "adopt-recommended" &&
      manualDecision?.canProceedToSafePreviewWrite,
  );
  const ok = Boolean(ready && hasTargetRecord && hasPatchedMarkdown);
  const blockers = [
    !safeWriteStatus
      ? {
          code: "missing-safe-preview",
          label: "安全预览待生成",
          detail: "先生成安全写回预览，再进入人工确认。",
        }
      : null,
    safeWriteStatus && !readbackOk
      ? {
          code: "safe-preview-readback",
          label: "安全预览待读回",
          detail: "重新生成或检查安全预览内容一致性。",
        }
      : null,
    safeWriteStatus && !hasManualConfirmation
      ? {
          code: "missing-manual-confirmation",
          label: "人工确认待写入",
          detail: "采用推荐确认块后，还需写入安全预览记录并重新检查门禁。",
        }
      : null,
    !manualDecisionAdopted
      ? {
          code: "manual-decision-pending",
          label: "人工决策待采用",
          detail: "先采用推荐确认块或记录暂不采用结论。",
        }
      : null,
    !hasTargetRecord
      ? {
          code: "missing-target-record",
          label: "目标记录待解析",
          detail: "安全预览中需要保留明确的目标记录路径。",
        }
      : null,
    !hasPatchedMarkdown
      ? {
          code: "missing-patched-content",
          label: "写回内容待解析",
          detail: "安全预览中需要保留可写回的完整内容。",
        }
      : null,
  ].filter(Boolean);
  const nextAction =
    !ok && manualDecisionAdopted && !hasManualConfirmation
      ? {
          actionId: "apply-manual-confirmation-safe-preview-write",
          label: "写入安全预览确认块",
          requiredPhrase: "确认写入安全预览确认块",
          summary: "写入后重新检查正式写回门禁。",
        }
      : ok
        ? {
            actionId: "export-manual-review-formal-write",
            label: "执行正式写回",
            requiredPhrase: confirmationPhrase,
            summary: "执行前会再次校验正式写回门禁。",
          }
        : {
            actionId: "check-manual-review-formal-write-readiness",
            label: "重新检查写回门禁",
            requiredPhrase: "",
            summary: "补齐阻塞项后刷新正式写回状态。",
          };

  return {
    ok,
    status: ok ? "formal-write-execution-precheck-ready" : "formal-write-execution-precheck-blocked",
    summary: ok
      ? "正式写回执行前预检通过，执行前仍需输入正式写回确认短语。"
      : "正式写回执行前预检未通过，请先完成安全预览确认、人工决策或写回内容复查。",
    confirmation: {
      requiredPhrase: confirmationPhrase,
      phraseRequiredBeforeWrite: true,
    },
    readiness: {
      status: readiness?.status || "unknown",
      statusLabel: readiness?.statusLabel || "待检查",
      summary: readiness?.summary || "",
    },
    target: {
      batchLabel: safeWriteStatus?.targetBatchLabel || "",
      safePreviewPath: safeWriteStatus?.targetPath || "",
      targetRecordPath: safeWriteStatus?.parsed?.targetPath || "",
      hasPatchedMarkdown,
      readbackOk,
      hasManualConfirmation,
      canProceedToFormalWrite: Boolean(safeWriteStatus?.canProceedToFormalWrite),
    },
    manualDecision: {
      decisionStatus: manualDecision?.decisionStatus || "unknown",
      decisionLabel: manualDecision?.decisionLabel || "待读取",
      canProceedToSafePreviewWrite: Boolean(manualDecision?.canProceedToSafePreviewWrite),
      adopted: manualDecisionAdopted,
    },
    blockers,
    nextAction,
    sourcePaths,
    safetyBoundary: "仅生成正式写回执行前只读预检，不写入 Obsidian，不执行正式写回。",
    nextChecks: [
      "确认目标记录路径和安全预览来源。",
      "输入正式写回确认短语。",
      "执行正式写回后检查读回结果和后续任务。",
    ],
  };
}

export function buildManualFormalWriteExecutionPrecheckMarkdown(precheck) {
  const lines = [
    "# 正式写回执行前预检",
    "",
    `- 预检状态：${precheck.ok ? "通过" : "需修正"}`,
    `- 状态码：${precheck.status}`,
    `- 摘要：${precheck.summary}`,
    `- 目标批次：${precheck.target.batchLabel || "暂无"}`,
    `- 目标记录：${precheck.target.targetRecordPath || "暂无"}`,
    `- 安全预览：${precheck.target.safePreviewPath || "暂无"}`,
    `- readiness：${precheck.readiness.status}`,
    `- 人工决策：${precheck.manualDecision.decisionLabel}`,
    `- 确认短语：${precheck.confirmation.requiredPhrase}`,
    `- 下一动作：${precheck.nextAction?.label || "待确认"}`,
    `- 安全边界：${precheck.safetyBoundary}`,
    "",
    "## 1. 执行前检查",
    "",
    `- 安全预览读回：${precheck.target.readbackOk ? "已确认" : "待确认"}`,
    `- 人工确认：${precheck.target.hasManualConfirmation ? "已填写" : "待补齐"}`,
    `- 写回许可：${precheck.target.canProceedToFormalWrite ? "已开放" : "待开放"}`,
    `- 写回内容：${precheck.target.hasPatchedMarkdown ? "已解析" : "待解析"}`,
    "",
    "## 2. 当前阻塞点",
    "",
  ];

  if (precheck.blockers.length) {
    precheck.blockers.forEach((item) => {
      lines.push(`- ${item.label}：${item.detail}`);
    });
  } else {
    lines.push("- 当前没有阻塞点。");
  }

  lines.push(
    "",
    "## 3. 下一步",
    "",
    `- 推荐动作：${precheck.nextAction?.label || "待确认"}`,
  );

  if (precheck.nextAction?.requiredPhrase) {
    lines.push(`- 动作短语：${precheck.nextAction.requiredPhrase}`);
  }

  lines.push(
    `- 动作说明：${precheck.nextAction?.summary || "待确认"}`,
    "",
    "## 4. 后续检查",
    "",
  );

  precheck.nextChecks.forEach((item) => {
    lines.push(`- ${item}`);
  });

  return lines.join("\n");
}
