import { loadLatestBatchReviewManualSafeWritePreviewStatus } from "./loadLatestBatchReviewManualSafeWritePreviewStatus.js";
import { runManualConfirmationDecisionStatus } from "./runManualConfirmationDecisionStatus.js";

async function loadManualConfirmationDecisionForReadiness(loader = runManualConfirmationDecisionStatus) {
  try {
    return await loader();
  } catch (error) {
    return {
      ok: false,
      status: "manual-decision-unavailable",
      decisionStatus: "unknown",
      decisionLabel: "决策记录不可用",
      canProceedToSafePreviewWrite: false,
      summary: error instanceof Error ? error.message : "人工确认决策记录读取失败。",
    };
  }
}

export async function runBatchReviewManualFormalWriteReadinessPreview({
  manualConfirmationDecisionLoader = runManualConfirmationDecisionStatus,
} = {}) {
  const latestSafeWriteStatus = await loadLatestBatchReviewManualSafeWritePreviewStatus();

  if (!latestSafeWriteStatus) {
    return {
      status: "no-safe-preview",
      statusLabel: "还没有安全写回预览",
      summary: "请先生成真实批次试跑记录安全写回预览，再判断是否进入正式写回。",
      latestSafeWriteStatus: null,
      manualConfirmationDecision: null,
    };
  }

  if (!latestSafeWriteStatus.readbackOk || !latestSafeWriteStatus.matchedExpectedContent) {
    return {
      status: "safe-preview-readback-mismatch",
      statusLabel: "安全预览读回待确认",
      summary: "最近一份安全写回预览未完成读回一致性确认，请重新生成写回预览并确认内容。",
      latestSafeWriteStatus,
      manualConfirmationDecision: null,
    };
  }

  const manualConfirmationDecision = await loadManualConfirmationDecisionForReadiness(
    manualConfirmationDecisionLoader,
  );

  if (
    manualConfirmationDecision.decisionStatus !== "adopt-recommended" ||
    !manualConfirmationDecision.canProceedToSafePreviewWrite
  ) {
    return {
      status: "awaiting-manual-decision-adoption",
      statusLabel: "先采用推荐确认块",
      summary: "安全写回预览已完成读回确认，仍需采用推荐确认块后再进入正式写回。",
      latestSafeWriteStatus,
      manualConfirmationDecision,
    };
  }

  if (latestSafeWriteStatus.canProceedToFormalWrite) {
    return {
      status: "ready-to-formal-write",
      statusLabel: "可以进入正式写回",
      summary: "最近一份安全写回预览已经有明确确认，可以继续设计正式写回模式。",
      latestSafeWriteStatus,
      manualConfirmationDecision,
    };
  }

  return {
    status: "awaiting-safe-write-confirmation",
    statusLabel: "先补安全写回确认",
    summary: !latestSafeWriteStatus.parsed?.manualReviewConclusionValidation?.ok
      ? latestSafeWriteStatus.parsed?.manualReviewConclusionValidation?.message ||
        "请输入人工复盘结论"
      : latestSafeWriteStatus.hasManualConfirmation
        ? "当前安全写回预览里仍有未完成确认，先补“仍需手改/是否可以进入正式写回”再继续。"
        : "当前安全写回预览还没有人工确认内容，先在预览底部补确认信息再继续。",
    latestSafeWriteStatus,
    manualConfirmationDecision,
  };
}
