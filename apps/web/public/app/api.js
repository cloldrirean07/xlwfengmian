export function classifyRequestError(error) {
  if (error?.name === "TypeError") {
    return {
      type: "network",
      message: "网络异常，请稍后重试",
    };
  }

  if (error?.isApiError) {
    return {
      type: "server",
      message: error.message || "生成失败，请重试",
    };
  }

  return {
    type: "unknown",
    message: "生成失败，请重试",
  };
}

async function requestJson(url, options = {}) {
  let response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    error.requestFailureType = "network";
    throw error;
  }

  let payload;

  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const error = new Error(payload.message || "Request failed");
    error.isApiError = true;
    error.status = response.status;
    throw error;
  }

  return payload;
}

export function loadSampleCases() {
  return requestJson("/api/sample-cases");
}

export function loadAvailableCases() {
  return requestJson("/api/cases");
}

export function loadPlatformReview(platformCaseId) {
  return requestJson(`/api/platform-review?platformCaseId=${encodeURIComponent(platformCaseId)}`);
}

export function loadPlatformBatchReview() {
  return requestJson("/api/platform-batch-review");
}

export function loadPlatformSyncPreview(caseId) {
  return requestJson(`/api/platform-sync-preview?caseId=${encodeURIComponent(caseId)}`);
}

export function loadRealCaseFillPreview(caseId) {
  return requestJson(`/api/real-case-fill-preview?caseId=${encodeURIComponent(caseId)}`);
}

export function exportRealCaseFillToObsidian(caseId, exportMode = "overwrite") {
  return requestJson("/api/real-case-fill-export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseId, exportMode }),
  });
}

export function previewRealCaseBatchFillWorksheet(payload) {
  return requestJson("/api/real-case-batch-fill-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function exportRealCaseBatchFillWorksheet(payload) {
  return requestJson("/api/real-case-batch-fill-export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function loadRealCaseBatchFillWorksheetHistory(payload) {
  return requestJson("/api/real-case-batch-fill-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function previewRealCaseBatchRunRecord(payload) {
  return requestJson("/api/real-case-batch-run-record-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function exportRealCaseBatchRunRecord(payload) {
  return requestJson("/api/real-case-batch-run-record-export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function previewBatchRunFrictionSummary(payload = {}) {
  return requestJson("/api/batch-run-friction-summary-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function previewBatchReviewDashboard(payload = {}) {
  return requestJson("/api/batch-review-dashboard-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function exportBatchReviewDashboard(payload = {}) {
  return requestJson("/api/batch-review-dashboard-export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function previewBatchReviewManualTaskCard(payload = {}) {
  return requestJson("/api/batch-review-manual-task-card-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function exportBatchReviewManualTaskCard(payload = {}) {
  return requestJson("/api/batch-review-manual-task-card-export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function previewBatchReviewManualBackfill(payload = {}) {
  return requestJson("/api/batch-review-manual-backfill-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function exportBatchReviewManualBackfill(payload = {}) {
  return requestJson("/api/batch-review-manual-backfill-export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function previewBatchReviewManualWritebackDraft(payload = {}) {
  return requestJson("/api/batch-review-manual-writeback-draft-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function exportBatchReviewManualWritebackDraft(payload = {}) {
  return requestJson("/api/batch-review-manual-writeback-draft-export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function previewBatchReviewManualSafeWrite(payload = {}) {
  return requestJson("/api/batch-review-manual-safe-write-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function exportBatchReviewManualSafeWrite(payload = {}) {
  return requestJson("/api/batch-review-manual-safe-write-export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function previewBatchReviewManualFormalWriteReadiness() {
  return requestJson("/api/batch-review-manual-formal-write-readiness");
}

export function previewBatchReviewManualConfirmationDraftValidation() {
  return requestJson("/api/batch-review-manual-confirmation-draft-validation");
}

export function previewBatchReviewManualConfirmationApplyPreview() {
  return requestJson("/api/batch-review-manual-confirmation-apply-preview");
}

export function previewBatchReviewManualConfirmationHandoffPacket() {
  return requestJson("/api/batch-review-manual-confirmation-handoff-packet");
}

export function previewBatchReviewManualConfirmationDecision() {
  return requestJson("/api/batch-review-manual-confirmation-decision");
}

export function previewBatchReviewManualConfirmationDecisionAdoptionPreview() {
  return requestJson("/api/batch-review-manual-confirmation-decision-adoption-preview");
}

export function previewBatchReviewManualConfirmationDecisionAdoptionPacket() {
  return requestJson("/api/batch-review-manual-confirmation-decision-adoption-packet");
}

export function previewBatchReviewManualConfirmationSafePreviewAdoptionPacket() {
  return requestJson("/api/batch-review-manual-confirmation-safe-preview-adoption-packet");
}

export function previewBatchReviewManualConfirmationSafePreviewWritePrecheck() {
  return requestJson("/api/batch-review-manual-confirmation-safe-preview-write-precheck");
}

export function previewBatchReviewManualConfirmationSafePreviewWriteProjection() {
  return requestJson("/api/batch-review-manual-confirmation-safe-preview-write-projection");
}

export function applyBatchReviewManualConfirmationSafePreviewWrite(confirmationPhrase = "") {
  return requestJson("/api/batch-review-manual-confirmation-safe-preview-write-apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmationPhrase }),
  });
}

export function applyTitleSelectionWriteback(payload = {}) {
  return requestJson("/api/title-selection-writeback-apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function exportBatchReviewManualFormalWrite(confirmationPhrase = "") {
  return requestJson("/api/batch-review-manual-formal-write-export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmationPhrase }),
  });
}

export function previewBatchReviewManualFormalWriteExecutionPrecheck() {
  return requestJson("/api/batch-review-manual-formal-write-execution-precheck");
}

export function previewBatchReviewManualFormalWriteExecutionPacket() {
  return requestJson("/api/batch-review-manual-formal-write-execution-packet");
}

export function previewBatchReviewManualFormalWritePostExecutionAcceptance() {
  return requestJson("/api/batch-review-manual-formal-write-post-execution-acceptance");
}

export function previewPiEngineExecutionPositionAudit() {
  return requestJson("/api/pi-engine-execution-position-audit");
}

export function previewFormalWriteFollowUpPlan() {
  return requestJson("/api/formal-write-follow-up-plan");
}

export function exportBatchReviewSuite(payload = {}) {
  return requestJson("/api/batch-review-suite-export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function exportBatchRunFrictionSummary(payload = {}) {
  return requestJson("/api/batch-run-friction-summary-export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function previewUiOptimizationReadiness(payload = {}) {
  return requestJson("/api/ui-optimization-readiness-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function exportUiOptimizationReadiness(payload = {}) {
  return requestJson("/api/ui-optimization-readiness-export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function previewRealCaseScaffold(payload) {
  return requestJson("/api/real-case-scaffold-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function commitRealCaseScaffold(payload) {
  return requestJson("/api/real-case-scaffold-commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function previewRealCaseBatchScaffold(payload) {
  return requestJson("/api/real-case-batch-scaffold-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function commitRealCaseBatchScaffold(payload) {
  return requestJson("/api/real-case-batch-scaffold-commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function analyzeCoverDirection(payload) {
  return requestJson("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function refineDirection(payload) {
  return requestJson("/api/refine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function runActionWorkspace(payload) {
  return requestJson("/api/action-workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function saveWorkspaceDecision(payload) {
  return requestJson("/api/workspace-decision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function buildPromptPreview(payload) {
  return requestJson("/api/prompt-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function generateLlmDraft(payload) {
  return requestJson("/api/llm-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function runSampleCase(sampleCaseId) {
  return requestJson("/api/sample-run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sampleCaseId }),
  });
}

export function runAvailableCase(caseId) {
  return requestJson("/api/case-run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseId }),
  });
}
