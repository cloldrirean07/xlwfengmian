function query(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Missing DOM element: ${selector}`);
  }

  return element;
}

function queryAll(selector) {
  const elements = Array.from(document.querySelectorAll(selector));
  if (elements.length === 0) {
    throw new Error(`Missing DOM elements: ${selector}`);
  }

  return elements;
}

export function getDomRefs() {
  return {
    productViewSwitch: query("#product-view-switch"),
    productViewPanels: queryAll("[data-product-view]"),
    analyzeForm: query("#analyze-form"),
    refineForm: query("#refine-form"),
    loadSampleButton: query("#load-sample-button"),
    runSampleButton: query("#run-sample-button"),
    realCaseQuickStartResult: query("#real-case-quick-start-result"),
    analysisPanel: query("#analysis-panel"),
    refinePanel: query("#refine-panel"),
    secondRoundPanel: query("#second-round-panel"),
    promptPanel: query("#prompt-panel"),
    samplePanel: query("#sample-panel"),
    promptPreviewButton: query("#prompt-preview-button"),
    llmDraftButton: query("#llm-draft-button"),
    realCaseForm: query("#real-case-intake-form"),
    realCaseBatchForm: query("#real-case-batch-form"),
    loadRealCaseTemplateButton: query("#load-real-case-template-button"),
    loadRealCaseBatchTemplateButton: query("#load-real-case-batch-template-button"),
    previewRealCaseButton: query("#preview-real-case-button"),
    previewRealCaseBatchButton: query("#preview-real-case-batch-button"),
    previewRealCaseBatchWorksheetButton: query("#preview-real-case-batch-worksheet-button"),
    loadRealCaseBatchWorksheetHistoryButton: query("#load-real-case-batch-worksheet-history-button"),
    previewRealCaseBatchRunRecordButton: query("#preview-real-case-batch-run-record-button"),
    exportRealCaseBatchRunRecordButton: query("#export-real-case-batch-run-record-button"),
    previewUiOptimizationReadinessButton: query("#preview-ui-optimization-readiness-button"),
    exportUiOptimizationReadinessButton: query("#export-ui-optimization-readiness-button"),
    previewBatchRunFrictionSummaryButton: query("#preview-batch-run-friction-summary-button"),
    exportBatchRunFrictionSummaryButton: query("#export-batch-run-friction-summary-button"),
    previewBatchReviewDashboardButton: query("#preview-batch-review-dashboard-button"),
    exportBatchReviewDashboardButton: query("#export-batch-review-dashboard-button"),
    exportBatchReviewSuiteButton: query("#export-batch-review-suite-button"),
    refreshWritebackGateStatusButton: query("#refresh-writeback-gate-status-button"),
    commitRealCaseButton: query("#commit-real-case-button"),
    commitRealCaseBatchButton: query("#commit-real-case-batch-button"),
    exportRealCaseBatchWorksheetButton: query("#export-real-case-batch-worksheet-button"),
    refreshRealCaseLibraryButton: query("#refresh-real-case-library-button"),
    realCaseLaneFilterBar: query("#real-case-lane-filter-bar"),
    realCaseStatus: query("#real-case-status"),
    realCaseBatchStatus: query("#real-case-batch-status"),
    realCasePreviewResult: query("#real-case-preview-result"),
    realCaseBatchPreviewResult: query("#real-case-batch-preview-result"),
    realCaseCommitResult: query("#real-case-commit-result"),
    realCaseBatchCommitResult: query("#real-case-batch-commit-result"),
    realCaseBatchWorksheetResult: query("#real-case-batch-worksheet-result"),
    realCaseBatchRunRecordResult: query("#real-case-batch-run-record-result"),
    uiOptimizationReadinessResult: query("#ui-optimization-readiness-result"),
    batchRunFrictionSummaryResult: query("#batch-run-friction-summary-result"),
    batchReviewDashboardResult: query("#batch-review-dashboard-result"),
    writebackGateStatusResult: query("#writeback-gate-status-result"),
    realCaseLibraryResult: query("#real-case-library-result"),
    realCaseMaintenanceResult: query("#real-case-maintenance-result"),
    realCaseExportResult: query("#real-case-export-result"),
    platformCaseIdInput: query("#platform-case-id-input"),
    loadPlatformReviewButton: query("#load-platform-review-button"),
    loadPlatformBatchButton: query("#load-platform-batch-button"),
    loadPlatformSyncPreviewButton: query("#load-platform-sync-preview-button"),
    assetUploadInput: query("#asset-upload-input"),
    clearAssetButton: query("#clear-asset-button"),
    assetPreviewPanel: query("#asset-preview-panel"),
    assetPreviewContent: query("#asset-preview-content"),
    cardsContainer: query("#cards"),
    analysisSummary: query("#analysis-summary"),
    analysisMeta: query("#analysis-meta"),
    actionWorkspacePanel: query("#action-workspace-panel"),
    actionWorkspaceContent: query("#action-workspace-content"),
    actionWorkspaceForm: query("#action-workspace-form"),
    actionWorkspacePaths: query("#action-workspace-paths"),
    actionWorkspaceFields: query("#action-workspace-fields"),
    actionWorkspaceRunButton: query("#action-workspace-run-button"),
    actionWorkspaceResult: query("#action-workspace-result"),
    workspaceDecisionRow: query("#workspace-decision-row"),
    workspaceAcceptButton: query("#workspace-accept-button"),
    workspaceRejectButton: query("#workspace-reject-button"),
    workspaceDecisionStatus: query("#workspace-decision-status"),
    firstRoundStatus: query("#first-round-status"),
    refineWorkspaceHint: query("#refine-workspace-hint"),
    selectedCardSummary: query("#selected-card-summary"),
    secondRoundResult: query("#second-round-result"),
    promptResult: query("#prompt-result"),
    sampleResult: query("#sample-result"),
    platformReviewSummary: query("#platform-review-summary"),
    platformBatchSummary: query("#platform-batch-summary"),
    platformSyncSummary: query("#platform-sync-summary"),
  };
}
