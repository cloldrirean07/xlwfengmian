import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import { join } from "node:path";
import { classifyRequestError } from "../public/app/api.js";
import { buildAssetPreview } from "../public/app/assetPreview.js";
import { buildFollowUpProgressSummary } from "../public/app/followUpProgress.js";
import {
  shouldInvalidateRefinementForCardChange,
  shouldInvalidateWorkspaceForCardChange,
  buildTitleSelectionDraft,
  buildTitleWritebackPreview,
  syncWorkspaceDecisionActions,
  getCaseReviewActionFailureMessage,
  getFirstRoundGenerationFailureMessage,
  validateActionWorkspaceContext,
  validateActionWorkspacePayloadFields,
  validateAnalysisResultCompleteness,
  validateFormalWriteReadiness,
  validateExistingCaseSelection,
  validateAnalyzePayloadFields,
  validateRefinementContext,
  validateRefinementResultCompleteness,
  validateRefinePayloadFields,
} from "../public/app/createApp.js";
import {
  renderActionWorkspaceForm,
  renderActionWorkspacePathSelector,
  renderBatchReviewDashboardResult,
  renderCards,
  renderRefineWorkspaceHint,
  renderRefinementResult,
  renderWritebackGateOverviewStatus,
  renderWorkspaceDecisionStatus,
} from "../public/app/renderers.js";
import { createAnalysisSession } from "../src/application/createAnalysisSession.js";
import { createLlmDraft } from "../src/application/createLlmDraft.js";
import { createPromptPreview } from "../src/application/createPromptPreview.js";
import { createRefinementSession } from "../src/application/createRefinementSession.js";
import { createActionWorkspaceSession } from "../src/application/createActionWorkspaceSession.js";
import { buildActionWorkspace } from "../src/domain/workspace/buildActionWorkspace.js";
import { createBatchRunFrictionSummaryObsidianPreview } from "../src/application/createBatchRunFrictionSummaryObsidianPreview.js";
import { createBatchReviewDashboardObsidianPreview } from "../src/application/createBatchReviewDashboardObsidianPreview.js";
import { createBatchReviewManualTaskCardObsidianPreview } from "../src/application/createBatchReviewManualTaskCardObsidianPreview.js";
import { createBatchReviewManualBackfillObsidianPreview } from "../src/application/createBatchReviewManualBackfillObsidianPreview.js";
import { createBatchReviewManualWritebackDraftObsidianPreview } from "../src/application/createBatchReviewManualWritebackDraftObsidianPreview.js";
import { createBatchReviewManualSafeWritePreviewObsidianPreview } from "../src/application/createBatchReviewManualSafeWritePreviewObsidianPreview.js";
import { createBatchReviewSuiteObsidianPreview } from "../src/application/createBatchReviewSuiteObsidianPreview.js";
import { loadLatestBatchReviewManualSafeWritePreviewStatus } from "../src/application/loadLatestBatchReviewManualSafeWritePreviewStatus.js";
import { loadLatestBatchReviewManualTaskCardStatus } from "../src/application/loadLatestBatchReviewManualTaskCardStatus.js";
import {
  BATCH_REVIEW_MANUAL_FORMAL_WRITE_PHRASE,
  buildFormalWriteFollowUpTasks,
  exportBatchReviewManualFormalWriteToObsidian,
} from "../src/application/exportBatchReviewManualFormalWriteToObsidian.js";
import {
  MANUAL_CONFIRMATION_SAFE_PREVIEW_WRITE_PHRASE,
  applyManualConfirmationSafePreviewWrite,
} from "../src/application/applyManualConfirmationSafePreviewWrite.js";
import {
  TITLE_SELECTION_WRITEBACK_PHRASE,
  applyTitleSelectionWriteback,
  buildTitleSelectionWritebackPatch,
} from "../src/application/applyTitleSelectionWriteback.js";
import { runBatchReviewDashboardPreview } from "../src/application/runBatchReviewDashboardPreview.js";
import { runBatchReviewManualBackfillPreview } from "../src/application/runBatchReviewManualBackfillPreview.js";
import { runBatchReviewManualFormalWriteReadinessPreview } from "../src/application/runBatchReviewManualFormalWriteReadinessPreview.js";
import { runBatchReviewManualTaskCardPreview } from "../src/application/runBatchReviewManualTaskCardPreview.js";
import { runBatchReviewManualWritebackDraftPreview } from "../src/application/runBatchReviewManualWritebackDraftPreview.js";
import { runBatchReviewManualSafeWritePreview } from "../src/application/runBatchReviewManualSafeWritePreview.js";
import { createRealCaseBatchFillObsidianPreview } from "../src/application/createRealCaseBatchFillObsidianPreview.js";
import { createRealCaseBatchRunRecordObsidianPreview } from "../src/application/createRealCaseBatchRunRecordObsidianPreview.js";
import { createUiOptimizationReadinessObsidianPreview } from "../src/application/createUiOptimizationReadinessObsidianPreview.js";
import { commitRealCaseBatchScaffold } from "../src/application/commitRealCaseBatchScaffold.js";
import { commitRealCaseScaffold } from "../src/application/commitRealCaseScaffold.js";
import { createRealCaseBatchScaffoldPreview } from "../src/application/createRealCaseBatchScaffoldPreview.js";
import { exportRealCaseBatchFillWorksheetToObsidian } from "../src/application/exportRealCaseBatchFillWorksheetToObsidian.js";
import { exportBatchRunFrictionSummaryToObsidian } from "../src/application/exportBatchRunFrictionSummaryToObsidian.js";
import { exportBatchReviewDashboardToObsidian } from "../src/application/exportBatchReviewDashboardToObsidian.js";
import { exportBatchReviewManualTaskCardToObsidian } from "../src/application/exportBatchReviewManualTaskCardToObsidian.js";
import { exportBatchReviewManualBackfillToObsidian } from "../src/application/exportBatchReviewManualBackfillToObsidian.js";
import { exportBatchReviewManualWritebackDraftToObsidian } from "../src/application/exportBatchReviewManualWritebackDraftToObsidian.js";
import { exportBatchReviewManualSafeWritePreviewToObsidian } from "../src/application/exportBatchReviewManualSafeWritePreviewToObsidian.js";
import { exportBatchReviewSuiteToObsidian } from "../src/application/exportBatchReviewSuiteToObsidian.js";
import { exportRealCaseBatchRunRecordToObsidian } from "../src/application/exportRealCaseBatchRunRecordToObsidian.js";
import { createRealCaseScaffoldPreview } from "../src/application/createRealCaseScaffoldPreview.js";
import { createRealCaseFillObsidianPreview } from "../src/application/createRealCaseFillObsidianPreview.js";
import { exportRealCaseFillSheetToObsidian } from "../src/application/exportRealCaseFillSheetToObsidian.js";
import { exportUiOptimizationReadinessToObsidian } from "../src/application/exportUiOptimizationReadinessToObsidian.js";
import { runRealCaseFillPreview } from "../src/application/runRealCaseFillPreview.js";
import { runBatchRunFrictionSummaryPreview } from "../src/application/runBatchRunFrictionSummaryPreview.js";
import { loadLatestRealCaseBatchRunManualReviewStatus } from "../src/application/loadLatestRealCaseBatchRunManualReviewStatus.js";
import { runUiOptimizationReadinessPreview } from "../src/application/runUiOptimizationReadinessPreview.js";
import { saveWorkspaceDecisionSession } from "../src/application/saveWorkspaceDecisionSession.js";
import { listAvailableCases } from "../src/application/listAvailableCases.js";
import { listSampleCases } from "../src/application/listSampleCases.js";
import { loadRealCaseBatchFillWorksheetHistory } from "../src/application/loadRealCaseBatchFillWorksheetHistory.js";
import { prepareRealCaseScaffold } from "../src/application/prepareRealCaseScaffold.js";
import { prepareRealCaseBatchScaffold } from "../src/application/prepareRealCaseBatchScaffold.js";
import { runPlatformCaseBatchReview } from "../src/application/runPlatformCaseBatchReview.js";
import { runPlatformCaseReview } from "../src/application/runPlatformCaseReview.js";
import { runPlatformSyncPreview } from "../src/application/runPlatformSyncPreview.js";
import { runCaseFlow } from "../src/application/runCaseFlow.js";
import { runSampleCaseFlow } from "../src/application/runSampleCaseFlow.js";
import { createLlmProvider } from "../src/infrastructure/llm/createLlmProvider.js";
import {
  getRuleCatalogMeta,
  loadCoverEffectCatalog,
  loadCoverDirectionSignalCatalog,
  loadFeedbackCatalog,
} from "../src/infrastructure/rules/loadRuleCatalog.js";
import { validateCaseRecord } from "../src/domain/cases/validateCaseRecord.js";
import { buildRealCaseTemplate } from "../src/domain/cases/buildRealCaseTemplate.js";
import { buildPlatformCasePlaceholder } from "../src/domain/cases/buildPlatformCasePlaceholder.js";
import { isPlatformCasePlaceholder } from "../src/domain/cases/isPlatformCasePlaceholder.js";
import { buildCaseRunMarkdown } from "../src/domain/cases/buildCaseRunMarkdown.js";
import { buildKeyCaseRerunReport } from "../src/domain/cases/buildKeyCaseRerunReport.js";
import { buildKeyCaseRerunMarkdown } from "../src/domain/cases/buildKeyCaseRerunMarkdown.js";
import { buildObsidianKeyCaseRerunRecord } from "../src/domain/cases/buildObsidianKeyCaseRerunRecord.js";
import { buildKeyCaseRerunDiffReport } from "../src/domain/cases/buildKeyCaseRerunDiffReport.js";
import { buildKeyCaseRerunDiffMarkdown } from "../src/domain/cases/buildKeyCaseRerunDiffMarkdown.js";
import { buildObsidianKeyCaseRerunDiffRecord } from "../src/domain/cases/buildObsidianKeyCaseRerunDiffRecord.js";
import { buildKeyCaseRerunPlan } from "../src/domain/cases/buildKeyCaseRerunPlan.js";
import { buildGeneratedKeyCaseRerunPlanMarkdown } from "../src/domain/cases/buildGeneratedKeyCaseRerunPlanMarkdown.js";
import { buildObsidianGeneratedKeyCaseRerunPlanRecord } from "../src/domain/cases/buildObsidianGeneratedKeyCaseRerunPlanRecord.js";
import { buildObsidianCaseRunRecord } from "../src/domain/cases/buildObsidianCaseRunRecord.js";
import { buildObsidianCaseProgressRecord } from "../src/domain/cases/buildObsidianCaseProgressRecord.js";
import { buildCaseProgressMarkdown } from "../src/domain/cases/buildCaseProgressMarkdown.js";
import { buildCaseProgressReport } from "../src/domain/cases/buildCaseProgressReport.js";
import { inspectRealCaseReadiness } from "../src/domain/cases/inspectRealCaseReadiness.js";
import { buildRealCaseReadinessReport } from "../src/domain/cases/buildRealCaseReadinessReport.js";
import { buildRealCaseReadinessMarkdown } from "../src/domain/cases/buildRealCaseReadinessMarkdown.js";
import { buildObsidianRealCaseReadinessRecord } from "../src/domain/cases/buildObsidianRealCaseReadinessRecord.js";
import { buildRealCaseMaintenanceBoardReport } from "../src/domain/cases/buildRealCaseMaintenanceBoardReport.js";
import { buildRealCaseMaintenanceBoardMarkdown } from "../src/domain/cases/buildRealCaseMaintenanceBoardMarkdown.js";
import { buildObsidianRealCaseMaintenanceBoardRecord } from "../src/domain/cases/buildObsidianRealCaseMaintenanceBoardRecord.js";
import { buildBatchRunFrictionSummaryMarkdown } from "../src/domain/cases/buildBatchRunFrictionSummaryMarkdown.js";
import { buildBatchRunFrictionSummaryReport } from "../src/domain/cases/buildBatchRunFrictionSummaryReport.js";
import { buildBatchRunManualReviewGuide } from "../src/domain/cases/buildBatchRunManualReviewGuide.js";
import { buildRealCaseBatchFillWorksheetMarkdown } from "../src/domain/cases/buildRealCaseBatchFillWorksheetMarkdown.js";
import { buildBatchRunFrictionTemplate } from "../src/domain/cases/buildBatchRunFrictionTemplate.js";
import { buildObsidianBatchRunFrictionSummaryRecord } from "../src/domain/cases/buildObsidianBatchRunFrictionSummaryRecord.js";
import { parseBatchRunRecordReviewNote } from "../src/domain/cases/parseBatchRunRecordReviewNote.js";
import { buildRealCaseBatchRunRecordMarkdown } from "../src/domain/cases/buildRealCaseBatchRunRecordMarkdown.js";
import { buildRealCaseBatchValidationSummary } from "../src/domain/cases/buildRealCaseBatchValidationSummary.js";
import { buildObsidianRealCaseBatchFillWorksheetRecord } from "../src/domain/cases/buildObsidianRealCaseBatchFillWorksheetRecord.js";
import { buildObsidianRealCaseBatchRunRecord } from "../src/domain/cases/buildObsidianRealCaseBatchRunRecord.js";
import { buildRealCaseOverviewMeta } from "../src/domain/cases/buildRealCaseOverviewMeta.js";
import { buildRealCaseFillSheet } from "../src/domain/cases/buildRealCaseFillSheet.js";
import { buildRealCaseFillSheetMarkdown } from "../src/domain/cases/buildRealCaseFillSheetMarkdown.js";
import { buildObsidianRealCaseFillSheetRecord } from "../src/domain/cases/buildObsidianRealCaseFillSheetRecord.js";
import { buildObsidianUiOptimizationReadinessRecord } from "../src/domain/ui/buildObsidianUiOptimizationReadinessRecord.js";
import { buildUiOptimizationReadinessMarkdown } from "../src/domain/ui/buildUiOptimizationReadinessMarkdown.js";
import { buildUiOptimizationReadinessReport } from "../src/domain/ui/buildUiOptimizationReadinessReport.js";
import { buildBatchReviewDashboardMarkdown } from "../src/domain/review/buildBatchReviewDashboardMarkdown.js";
import { buildBatchReviewManualTaskCardMarkdown } from "../src/domain/review/buildBatchReviewManualTaskCardMarkdown.js";
import { buildBatchReviewManualTaskBackfillPreview } from "../src/domain/review/buildBatchReviewManualTaskBackfillPreview.js";
import { buildBatchReviewManualBackfillMarkdown } from "../src/domain/review/buildBatchReviewManualBackfillMarkdown.js";
import { buildBatchReviewManualWritebackDraftMarkdown } from "../src/domain/review/buildBatchReviewManualWritebackDraftMarkdown.js";
import { applyBatchReviewManualWritebackPatch, buildBatchReviewManualWritebackPatch } from "../src/domain/review/buildBatchReviewManualWritebackPatch.js";
import { buildBatchReviewManualSafeWritePreviewMarkdown } from "../src/domain/review/buildBatchReviewManualSafeWritePreviewMarkdown.js";
import { buildObsidianBatchReviewManualBackfillRecord } from "../src/domain/review/buildObsidianBatchReviewManualBackfillRecord.js";
import { buildObsidianBatchReviewManualSafeWritePreviewRecord } from "../src/domain/review/buildObsidianBatchReviewManualSafeWritePreviewRecord.js";
import { buildObsidianBatchReviewManualWritebackDraftRecord } from "../src/domain/review/buildObsidianBatchReviewManualWritebackDraftRecord.js";
import { buildObsidianBatchReviewManualTaskCardRecord } from "../src/domain/review/buildObsidianBatchReviewManualTaskCardRecord.js";
import {
  parseBatchReviewManualSafeWritePreviewNote,
  validateManualReviewConclusion,
} from "../src/domain/review/parseBatchReviewManualSafeWritePreviewNote.js";
import {
  buildManualConfirmationDraftValidationMarkdown,
  validateManualConfirmationDraft,
} from "../src/domain/review/validateManualConfirmationDraft.js";
import {
  buildManualConfirmationApplyPreview,
  buildManualConfirmationApplyPreviewMarkdown,
} from "../src/domain/review/buildManualConfirmationApplyPreview.js";
import {
  buildManualConfirmationHandoffPacket,
  buildManualConfirmationHandoffPacketMarkdown,
} from "../src/domain/review/buildManualConfirmationHandoffPacket.js";
import {
  buildManualConfirmationDecisionTemplate,
  buildManualConfirmationDecisionValidationMarkdown,
  validateManualConfirmationDecision,
} from "../src/domain/review/validateManualConfirmationDecision.js";
import {
  buildManualConfirmationDecisionAdoptionPreview,
  buildManualConfirmationDecisionAdoptionPreviewMarkdown,
} from "../src/domain/review/buildManualConfirmationDecisionAdoptionPreview.js";
import {
  buildManualConfirmationDecisionAdoptionPacket,
  buildManualConfirmationDecisionAdoptionPacketMarkdown,
} from "../src/domain/review/buildManualConfirmationDecisionAdoptionPacket.js";
import {
  buildManualConfirmationDecisionRejectionPreview,
  buildManualConfirmationDecisionRejectionPreviewMarkdown,
} from "../src/domain/review/buildManualConfirmationDecisionRejectionPreview.js";
import {
  buildManualConfirmationDecisionRejectionPacket,
  buildManualConfirmationDecisionRejectionPacketMarkdown,
} from "../src/domain/review/buildManualConfirmationDecisionRejectionPacket.js";
import {
  buildManualConfirmationDecisionOptionsIndex,
  buildManualConfirmationDecisionOptionsIndexMarkdown,
} from "../src/domain/review/buildManualConfirmationDecisionOptionsIndex.js";
import {
  buildManualConfirmationSafePreviewAdoptionPacket,
  buildManualConfirmationSafePreviewAdoptionPacketMarkdown,
} from "../src/domain/review/buildManualConfirmationSafePreviewAdoptionPacket.js";
import {
  buildManualConfirmationSafePreviewWritePrecheck,
  buildManualConfirmationSafePreviewWritePrecheckMarkdown,
} from "../src/domain/review/buildManualConfirmationSafePreviewWritePrecheck.js";
import {
  buildManualConfirmationSafePreviewWriteProjection,
  buildManualConfirmationSafePreviewWriteProjectionMarkdown,
} from "../src/domain/review/buildManualConfirmationSafePreviewWriteProjection.js";
import {
  buildManualFormalWriteExecutionPrecheck,
  buildManualFormalWriteExecutionPrecheckMarkdown,
} from "../src/domain/review/buildManualFormalWriteExecutionPrecheck.js";
import {
  buildManualFormalWriteLineDiff,
  buildManualFormalWriteExecutionPacket,
  buildManualFormalWriteExecutionPacketMarkdown,
} from "../src/domain/review/buildManualFormalWriteExecutionPacket.js";
import {
  buildManualFormalWritePostExecutionAcceptance,
  buildManualFormalWritePostExecutionAcceptanceMarkdown,
} from "../src/domain/review/buildManualFormalWritePostExecutionAcceptance.js";
import {
  buildPiEngineExecutionPositionAudit,
  buildPiEngineExecutionPositionAuditMarkdown,
} from "../src/domain/review/buildPiEngineExecutionPositionAudit.js";
import {
  buildFormalWriteFollowUpPlan,
  buildFormalWriteFollowUpPlanMarkdown,
} from "../src/domain/review/buildFormalWriteFollowUpPlan.js";
import { parseBatchReviewManualTaskCardNote } from "../src/domain/review/parseBatchReviewManualTaskCardNote.js";
import { buildObsidianBatchReviewDashboardRecord } from "../src/domain/review/buildObsidianBatchReviewDashboardRecord.js";
import { buildBatchReviewDashboardReport } from "../src/domain/review/buildBatchReviewDashboardReport.js";
import { buildBatchReviewFollowUpChecklist } from "../src/domain/review/buildBatchReviewFollowUpChecklist.js";
import { buildBatchReviewManualTaskCard } from "../src/domain/review/buildBatchReviewManualTaskCard.js";
import { buildUiOptimizationRecheckPlan } from "../src/domain/review/buildUiOptimizationRecheckPlan.js";
import { buildBatchReviewSuiteMarkdown } from "../src/domain/review/buildBatchReviewSuiteMarkdown.js";
import { buildObsidianBatchReviewSuiteRecord } from "../src/domain/review/buildObsidianBatchReviewSuiteRecord.js";
import { parsePlatformCaseNote } from "../src/domain/cases/parsePlatformCaseNote.js";
import { buildRealCaseUpdateFromPlatformNote } from "../src/domain/cases/buildRealCaseUpdateFromPlatformNote.js";
import { buildPlatformSyncActions } from "../src/domain/cases/buildPlatformSyncActions.js";
import { buildPlatformSyncSummary } from "../src/domain/cases/buildPlatformSyncSummary.js";
import { buildPlatformSyncLogMarkdown } from "../src/domain/cases/buildPlatformSyncLogMarkdown.js";
import { buildObsidianPlatformSyncLogRecord } from "../src/domain/cases/buildObsidianPlatformSyncLogRecord.js";
import { inspectPlatformCaseCompleteness } from "../src/domain/cases/inspectPlatformCaseCompleteness.js";
import { inspectPlatformCaseFieldQuality } from "../src/domain/cases/inspectPlatformCaseFieldQuality.js";
import { buildPlatformCaseActionPlan } from "../src/domain/cases/buildPlatformCaseActionPlan.js";
import { buildPlatformCaseCandidateSuggestions } from "../src/domain/cases/buildPlatformCaseCandidateSuggestions.js";
import { buildPlatformCaseFillDraft } from "../src/domain/cases/buildPlatformCaseFillDraft.js";
import { buildPlatformCasePriorityDrafts } from "../src/domain/cases/buildPlatformCasePriorityDrafts.js";
import { buildPlatformCasePriorityDraftsMarkdown } from "../src/domain/cases/buildPlatformCasePriorityDraftsMarkdown.js";
import { applyPlatformCaseDraftUpdates } from "../src/domain/cases/applyPlatformCaseDraftUpdates.js";
import { buildPlatformCaseApplyLogMarkdown } from "../src/domain/cases/buildPlatformCaseApplyLogMarkdown.js";
import { buildObsidianPlatformCaseApplyLogRecord } from "../src/domain/cases/buildObsidianPlatformCaseApplyLogRecord.js";
import { getPlatformCaseFieldKey } from "../src/domain/cases/platformCaseFieldKeyMap.js";
import { buildPlatformCaseCompletenessMarkdown } from "../src/domain/cases/buildPlatformCaseCompletenessMarkdown.js";
import { buildObsidianPlatformCaseCompletenessRecord } from "../src/domain/cases/buildObsidianPlatformCaseCompletenessRecord.js";
import { buildPlatformCaseReviewMarkdown } from "../src/domain/cases/buildPlatformCaseReviewMarkdown.js";
import { buildObsidianPlatformCaseReviewRecord } from "../src/domain/cases/buildObsidianPlatformCaseReviewRecord.js";
import { buildObsidianPlatformCaseFillDraftRecord } from "../src/domain/cases/buildObsidianPlatformCaseFillDraftRecord.js";
import { buildObsidianPlatformCasePriorityDraftsRecord } from "../src/domain/cases/buildObsidianPlatformCasePriorityDraftsRecord.js";
import { buildPlatformCaseBatchReviewMarkdown } from "../src/domain/cases/buildPlatformCaseBatchReviewMarkdown.js";
import { buildObsidianPlatformCaseBatchReviewRecord } from "../src/domain/cases/buildObsidianPlatformCaseBatchReviewRecord.js";
import { buildRefinementExplanationMarkdown } from "../src/domain/refinement/buildRefinementExplanationMarkdown.js";
import { buildObsidianRefinementExplanationRecord } from "../src/domain/refinement/buildObsidianRefinementExplanationRecord.js";
import { buildRefinementExplanationSummaryReport } from "../src/domain/refinement/buildRefinementExplanationSummaryReport.js";
import { buildRefinementExplanationSummaryMarkdown } from "../src/domain/refinement/buildRefinementExplanationSummaryMarkdown.js";
import { buildObsidianRefinementExplanationSummaryRecord } from "../src/domain/refinement/buildObsidianRefinementExplanationSummaryRecord.js";
import { applyRefinementExplanationReviewFields } from "../src/domain/refinement/applyRefinementExplanationReviewFields.js";
import { parseRefinementExplanationReviewNote } from "../src/domain/refinement/parseRefinementExplanationReviewNote.js";
import { buildReviewedMisclassifiedExportReport } from "../src/domain/refinement/buildReviewedMisclassifiedExportReport.js";
import { buildReviewedMisclassifiedExportMarkdown } from "../src/domain/refinement/buildReviewedMisclassifiedExportMarkdown.js";
import { buildObsidianReviewedMisclassifiedExportRecord } from "../src/domain/refinement/buildObsidianReviewedMisclassifiedExportRecord.js";
import { buildRuleRevisionTaskSheetReport } from "../src/domain/refinement/buildRuleRevisionTaskSheetReport.js";
import { buildRuleRevisionTaskSheetMarkdown } from "../src/domain/refinement/buildRuleRevisionTaskSheetMarkdown.js";
import { buildObsidianRuleRevisionTaskSheetRecord } from "../src/domain/refinement/buildObsidianRuleRevisionTaskSheetRecord.js";
import { resolveRealCaseEntries } from "../src/infrastructure/cases/resolveRealCaseEntries.js";
import { loadLatestRealCaseFillExportStatus } from "../src/infrastructure/exports/loadLatestRealCaseFillExportStatus.js";
import { runRealCaseBatchFillPreview } from "../src/application/runRealCaseBatchFillPreview.js";
import { runRealCaseBatchRunRecordPreview } from "../src/application/runRealCaseBatchRunRecordPreview.js";
import {
  normalizeFirstRoundDraft,
  normalizeSecondRoundDraft,
} from "../src/domain/schema/normalizeLlmDraft.js";
import {
  validateFirstRoundDraftOutput,
  validateSecondRoundDraftOutput,
} from "../src/domain/schema/validateLlmDraftOutput.js";

async function createTemporaryObsidianRoot() {
  const root = await mkdtemp(join(os.tmpdir(), "ai-cover-obsidian-"));
  const noteDir = join(
    root,
    "03_方法论与规则库",
    "案例库",
    "平台原生案例",
    "第一批案例",
  );
  await mkdir(noteDir, { recursive: true });
  const notePath = join(noteDir, "P-01_待补.md");
  await writeFile(
    notePath,
    [
      "- case_id: P-01",
      "- source_platform: 抖音",
      "- content_topic: 为什么你总觉得自己很忙但没结果",
      "- content_goal_guess: 让用户意识到忙不等于有效产出",
      "- link_or_asset_path: https://example.com/post/1",
      "- subject_description: 口播截图，人物在左侧",
      "- visual_focus: 大字聚焦忙和结果的反差",
      "- click_driver_primary: 风险损失",
      "- direction_type_primary: 风险损失型",
      "- likely_positive_feedback: 抓眼但别太营销号",
      "- possible_adjustment_direction: 图更贴内容一点",
      "- one_sentence_summary: 先用忙和没结果的反差制造点击。",
      "- composition_features: 左人右字",
      "- color_mood_features: 黑黄高反差",
      "- title_cover_relationship: 标题补充原因，封面负责点击",
      "",
    ].join("\n"),
    "utf-8",
  );

  return root;
}

test("createAnalysisSession returns three cards and extracted fields", () => {
  const result = createAnalysisSession({
    contentTopic: "为什么你总觉得自己很忙但没结果",
    contentGoal: "让用户意识到忙不等于有效产出",
    userAssetType: "截图",
    platform: "抖音",
    referencePreference: "更高级一点，但别太平",
    assetDescription: "当前是口播截图，人物在左侧，背景比较空",
    assetNotes: "当前只有口播截图",
    assetContext: {
      origin: "local-preview",
      fileName: "busy-cover.png",
      mimeType: "image/png",
      sizeLabel: "428 KB",
      dimensionsLabel: "1080 × 1920",
      hasLocalPreview: true,
    },
  });

  assert.equal(result.cards.length, 3);
  assert.equal(result.ruleMeta.source, "local-json");
  assert.equal(typeof result.ruleMeta.version, "string");
  assert.ok(result.ruleMeta.version.length > 0);
  assert.equal(result.fields.platform, "抖音");
  assert.equal(result.fields.minimumInputMode, "内容说明+素材描述+本地图片");
  assert.equal(result.fields.hasLocalAssetContext, "是");
  assert.equal(result.fields.assetContext.likelyOrientation, "竖图");
  assert.equal(result.fields.suggestedAssetType, "截图");
  assert.equal(result.fields.primaryAssetActionLabel, "先优化现有图");
  assert.equal(result.actionWorkspace.workspaceId, "optimize-current");
  assert.equal(result.actionWorkspace.workspaceTitle, "优化现有素材");
  assert.ok(result.actionWorkspace.nextSteps.length >= 3);
  assert.ok(result.cards[0].directionLabelUserFacing.length > 0);
  assert.ok(result.cards[0].effectId.length > 0);
  assert.ok(result.cards[0].suggestedAssetReason.length > 0);
  assert.equal(result.cards[0].primaryAssetActionLabel, "先优化现有图");
  assert.ok(Array.isArray(result.cards[0].signalMatches));
  assert.ok(Array.isArray(result.cards[0].directionSignalChecklist.signalGroups));
  assert.ok(result.cards[0].directionSignalChecklist.signalGroups.length >= 2);
  assert.ok(Array.isArray(result.cards[0].directionSignalChecklist.boundaryRules));
  assert.ok(Array.isArray(result.cards[0].directionSignalChecklist.matchedSignals));
  assert.ok(result.cards[0].boundaryRule.length > 0);
  assert.ok(result.cards[0].imageDirectionCandidates.length >= 2);
  assert.ok(result.cards[0].rankedImageStrategies.length >= 2);
  assert.ok(result.cards[0].rankedImageStrategies[0].executionTag.length > 0);
  assert.ok(
    result.cards[0].rankedImageStrategies[0].priorityScore >=
      result.cards[0].rankedImageStrategies[1].priorityScore,
  );
});

test("createAnalysisSession injects real material keywords into cover copy and titles", () => {
  const result = createAnalysisSession({
    contentTopic: "用 AI 工具快速做一张小红书封面，从标题到封面的构思选择",
    contentGoal: "让用户一眼知道这是一篇 AI 封面制作教程",
    userAssetType: "截图",
    platform: "小红书",
    assetDescription: "三张傍晚图片，画面包含晚霞、云层和落日。",
    referencePreference: "小红书风景封面方向，突出夏日晚霞的氛围感和标题辨识度。",
  });

  const copyPool = result.cards
    .flatMap((card) => [card.coverCopyMain, ...card.titleOptions])
    .join(" ");

  assert.ok(copyPool.includes("夏日晚霞"));
  assert.ok(copyPool.includes("落日") || copyPool.includes("云层"));
  assert.equal(copyPool.includes("夏日晚霞晚霞"), false);
});

test("createAnalysisSession promotes title style library options from real material keywords", () => {
  const food = createAnalysisSession({
    contentTopic: "用 AI 工具快速做一张小红书封面",
    contentGoal: "让用户愿意点开学习封面制作",
    userAssetType: "截图",
    platform: "小红书",
    assetDescription: "素材包含螃蟹、辣炒鱿鱼、红油和香菜。",
    referencePreference: "小红书美食封面方向，突出食欲和冲击力。",
  });
  const sunset = createAnalysisSession({
    contentTopic: "用 AI 工具快速做一张小红书封面",
    contentGoal: "让用户愿意点开学习封面制作",
    userAssetType: "截图",
    platform: "小红书",
    assetDescription: "素材包含夏日晚霞、云层和落日。",
    referencePreference: "小红书风景封面方向，突出氛围感。",
  });

  const foodTitles = food.cards.flatMap((card) => card.titleOptions);
  const sunsetTitles = sunset.cards.flatMap((card) => card.titleOptions);

  assert.ok(foodTitles.includes("在家复刻夜市香辣鱿鱼"));
  assert.ok(foodTitles.includes("香辣蟹新手零失败"));
  assert.ok(sunsetTitles.includes("AI把晚霞做成封面大片"));
  assert.ok(sunsetTitles.includes("适合晚霞封面的朋友圈文案"));
});

test("createAnalysisSession keeps manual preferred title ahead of title style library", () => {
  const food = createAnalysisSession({
    contentTopic: "用 AI 工具快速做一张小红书封面",
    contentGoal: "让用户愿意点开学习封面制作",
    userAssetType: "截图",
    platform: "小红书",
    assetDescription: "素材包含螃蟹、辣炒鱿鱼、红油和香菜。",
    referencePreference: "小红书美食封面方向，突出食欲和冲击力。",
    copyReview: {
      preferredTitle: "辣炒的味蕾",
    },
  });

  assert.equal(food.cards[0].titleOptions[0], "辣炒的味蕾");
  assert.equal(food.cards[0].titleOptions[1], "在家复刻夜市香辣鱿鱼");
  assert.equal(food.cards[0].titleOptionDetails[0].sourceLabel, "人工优选");
  assert.equal(food.cards[0].titleOptionDetails[1].sourceLabel, "风格库");
  assert.equal(food.cards[0].titleOptionDetails[1].styleLabel, "夜市复刻");
});

test("runCaseFlow preserves real case manual preferred title in first-round titles", async () => {
  const result = await runCaseFlow("real-003");

  assert.equal(result.analysis.fields.copyReview.preferredTitle, "AI把晚霞做成封面大片");
  assert.equal(result.analysis.cards[0].titleOptions[0], "AI把晚霞做成封面大片");
  assert.equal(result.analysis.cards[0].titleOptionDetails[0].sourceLabel, "人工优选");
});

test("renderCards shows title style source labels", () => {
  const result = createAnalysisSession({
    contentTopic: "用 AI 工具快速做一张小红书封面",
    contentGoal: "让用户愿意点开学习封面制作",
    userAssetType: "截图",
    platform: "小红书",
    assetDescription: "素材包含夏日晚霞、云层和落日。",
    referencePreference: "小红书风景封面方向，突出氛围感。",
  });
  const container = { innerHTML: "" };

  renderCards(container, result.cards, "");

  assert.ok(container.innerHTML.includes("标题风格来源"));
  assert.ok(container.innerHTML.includes("风格库"));
  assert.ok(container.innerHTML.includes("AI风景效果"));
  assert.ok(container.innerHTML.includes("AI把晚霞做成封面大片"));
});

test("buildTitleSelectionDraft creates copyReview preferred title draft", () => {
  const result = createAnalysisSession({
    contentTopic: "用 AI 工具快速做一张小红书封面",
    contentGoal: "让用户愿意点开学习封面制作",
    userAssetType: "截图",
    platform: "小红书",
    assetDescription: "素材包含螃蟹、辣炒鱿鱼、红油和香菜。",
    referencePreference: "小红书美食封面方向，突出食欲和冲击力。",
  });
  const card = result.cards[0];
  const draft = buildTitleSelectionDraft({
    card,
    titleOption: card.titleOptionDetails[0],
  });

  assert.equal(draft.preferredTitle, "在家复刻夜市香辣鱿鱼");
  assert.equal(draft.copyReviewDraft.preferredTitle, "在家复刻夜市香辣鱿鱼");
  assert.equal(draft.sourceLabel, "风格库");
  assert.equal(draft.styleLabel, "夜市复刻");
  assert.ok(draft.copyReviewDraft.titleSelectionReason.includes(card.directionLabelUserFacing));
  assert.equal(draft.writebackPreview.patchFields[0].fieldPath, "copyReview.preferredTitle");
  assert.equal(draft.writebackPreview.patchFields[0].nextValue, "在家复刻夜市香辣鱿鱼");
});

test("buildTitleWritebackPreview compares current and next copyReview fields", () => {
  const preview = buildTitleWritebackPreview({
    titleSelection: {
      copyReviewDraft: {
        preferredTitle: "AI把晚霞做成封面大片",
        titleSelectionReason: "风格库 / AI风景效果，来自「更让人想点开」方向候选。",
      },
    },
    currentCopyReview: {
      preferredTitle: "最后一抹霞光",
      titleRationale: "原人工判断。",
    },
  });

  assert.equal(preview.mode, "preview-only");
  assert.equal(preview.patchFields[0].currentValue, "最后一抹霞光");
  assert.equal(preview.patchFields[0].nextValue, "AI把晚霞做成封面大片");
  assert.equal(preview.nextCopyReview.titleRationale, "风格库 / AI风景效果，来自「更让人想点开」方向候选。");
});

test("renderCards exposes preferred title selection draft", () => {
  const result = createAnalysisSession({
    contentTopic: "用 AI 工具快速做一张小红书封面",
    contentGoal: "让用户愿意点开学习封面制作",
    userAssetType: "截图",
    platform: "小红书",
    assetDescription: "素材包含夏日晚霞、云层和落日。",
    referencePreference: "小红书风景封面方向，突出氛围感。",
  });
  const selection = buildTitleSelectionDraft({
    card: result.cards[0],
    titleOption: result.cards[0].titleOptionDetails[1],
  });
  const container = { innerHTML: "" };

  renderCards(container, result.cards, result.cards[0].cardId, selection);

  assert.ok(container.innerHTML.includes("data-title-card-id"));
  assert.ok(container.innerHTML.includes("设为优选"));
  assert.ok(container.innerHTML.includes("已设为优选"));
  assert.ok(container.innerHTML.includes("人工优选草稿"));
  assert.ok(container.innerHTML.includes("正式写回预览"));
  assert.ok(container.innerHTML.includes("确认写入优选标题"));
  assert.ok(container.innerHTML.includes("执行写回"));
  assert.ok(container.innerHTML.includes("copyReview.preferredTitle"));
  assert.ok(container.innerHTML.includes("拟写入"));
  assert.ok(container.innerHTML.includes("AI把晚霞做成封面大片"));
});

test("buildTitleSelectionWritebackPatch merges preferred title into copyReview", () => {
  const patch = buildTitleSelectionWritebackPatch({
    record: {
      id: "real-003",
      copyReview: {
        preferredTitle: "最后一抹霞光",
        titleRationale: "原人工判断。",
        reviewer: "human",
      },
    },
    copyReviewDraft: {
      preferredTitle: "AI把晚霞做成封面大片",
      titleSelectionReason: "风格库 / AI风景效果，来自「更让人想点开」方向候选。",
    },
  });

  assert.equal(patch.nextRecord.copyReview.preferredTitle, "AI把晚霞做成封面大片");
  assert.equal(
    patch.nextRecord.copyReview.titleRationale,
    "风格库 / AI风景效果，来自「更让人想点开」方向候选。",
  );
  assert.equal(patch.nextRecord.copyReview.reviewer, "human");
  assert.equal(patch.writtenFields[0].currentValue, "最后一抹霞光");
});

test("applyTitleSelectionWriteback writes a real case through injected storage and reads it back", async () => {
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-title-writeback-"));
  const realCasesDir = join(tempRoot, "data", "real-cases");
  const itemsDir = join(realCasesDir, "items");
  const indexPath = join(realCasesDir, "index.json");
  const itemPath = join(itemsDir, "real-003.json");

  await mkdir(itemsDir, { recursive: true });
  await writeFile(
    indexPath,
    `${JSON.stringify([{ id: "real-003", file: "items/real-003.json", status: "draft" }], null, 2)}\n`,
    "utf-8",
  );
  await writeFile(
    itemPath,
    `${JSON.stringify(
      {
        id: "real-003",
        title: "P-03 夏日晚霞封面制作真实案例",
        sourceType: "real",
        copyReview: {
          preferredTitle: "最后一抹霞光",
          titleRationale: "原人工判断。",
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  const result = await applyTitleSelectionWriteback(
    {
      caseId: "real-003",
      confirmationPhrase: TITLE_SELECTION_WRITEBACK_PHRASE,
      copyReviewDraft: {
        preferredTitle: "AI把晚霞做成封面大片",
        titleSelectionReason: "风格库 / AI风景效果，来自「更让人想点开」方向候选。",
      },
    },
    {
      storagePaths: {
        realCasesIndexPath: indexPath,
        realCasesItemsDir: itemsDir,
        realCasesDir,
      },
      onCommitted: null,
    },
  );

  const persisted = JSON.parse(await readFile(itemPath, "utf-8"));

  assert.equal(result.ok, true);
  assert.equal(result.statusLabel, "写回完成");
  assert.equal(result.readback.ok, true);
  assert.equal(persisted.copyReview.preferredTitle, "AI把晚霞做成封面大片");
  assert.equal(
    persisted.copyReview.titleRationale,
    "风格库 / AI风景效果，来自「更让人想点开」方向候选。",
  );
});

test("applyTitleSelectionWriteback rejects missing confirmation phrase", async () => {
  await assert.rejects(
    () =>
      applyTitleSelectionWriteback(
        {
          caseId: "real-003",
          confirmationPhrase: "",
          copyReviewDraft: {
            preferredTitle: "AI把晚霞做成封面大片",
            titleSelectionReason: "风格库标题。",
          },
        },
        {
          loadIndex: async () => [],
          onCommitted: null,
        },
      ),
    /确认写入优选标题/,
  );
});

test("renderCards adds first-round comparison rhythm before card details", () => {
  const result = createAnalysisSession({
    contentTopic: "为什么你总觉得自己很忙但没结果",
    contentGoal: "让用户意识到忙不等于有效产出",
    userAssetType: "截图",
    platform: "抖音",
    referencePreference: "更高级一点，但别太平",
    assetDescription: "当前是口播截图，人物在左侧，背景比较空",
  });
  const container = { innerHTML: "" };

  renderCards(container, result.cards, "");

  assert.ok(container.innerHTML.includes('class="direction-result-rhythm"'));
  assert.ok(container.innerHTML.includes('aria-label="首轮方向比较顺序"'));
  assert.ok(container.innerHTML.includes("先看主推荐机制"));
  assert.ok(container.innerHTML.includes("再比 2 个备选差异"));
  assert.ok(container.innerHTML.includes("选定一张进入深化"));
  assert.ok(container.innerHTML.indexOf("先看主推荐机制") < container.innerHTML.indexOf("推荐主方向"));
});

test("validateAnalyzePayloadFields enforces first-round required fields and limits", () => {
  assert.deepEqual(validateAnalyzePayloadFields({}), {
    ok: false,
    fieldName: "contentTopic",
    message: "请输入内容主题",
  });

  assert.deepEqual(
    validateAnalyzePayloadFields({
      contentTopic: "有效主题",
      contentGoal: "",
      platform: "抖音",
      userAssetType: "截图",
    }),
    {
      ok: false,
      fieldName: "contentGoal",
      message: "请输入内容目标",
    },
  );

  assert.deepEqual(
    validateAnalyzePayloadFields({
      contentTopic: "有效主题",
      contentGoal: "有效目标",
      platform: "未知平台",
      userAssetType: "截图",
    }),
    {
      ok: false,
      fieldName: "platform",
      message: "目标平台不可用，请重新选择",
    },
  );

  assert.deepEqual(
    validateAnalyzePayloadFields({
      contentTopic: "有效主题",
      contentGoal: "有效目标",
      platform: "抖音",
      userAssetType: "未知素材",
    }),
    {
      ok: false,
      fieldName: "userAssetType",
      message: "素材类型不可用，请重新选择",
    },
  );

  assert.deepEqual(
    validateAnalyzePayloadFields({
      contentTopic: "主".repeat(81),
      contentGoal: "有效目标",
      platform: "抖音",
      userAssetType: "截图",
    }),
    {
      ok: false,
      fieldName: "contentTopic",
      message: "内容主题最多输入 80 个字符",
    },
  );

  assert.deepEqual(
    validateAnalyzePayloadFields({
      contentTopic: "有效主题",
      contentGoal: "目".repeat(121),
      platform: "抖音",
      userAssetType: "截图",
    }),
    {
      ok: false,
      fieldName: "contentGoal",
      message: "内容目标最多输入 120 个字符",
    },
  );

  assert.deepEqual(
    validateAnalyzePayloadFields({
      contentTopic: "有效主题",
      contentGoal: "有效目标",
      platform: "抖音",
      userAssetType: "截图",
      assetDescription: "图".repeat(301),
    }),
    {
      ok: false,
      fieldName: "assetDescription",
      message: "素材描述最多输入 300 个字符",
    },
  );

  assert.deepEqual(
    validateAnalyzePayloadFields({
      contentTopic: "有效主题",
      contentGoal: "有效目标",
      platform: "抖音",
      userAssetType: "截图",
      referencePreference: "偏".repeat(121),
    }),
    {
      ok: false,
      fieldName: "referencePreference",
      message: "封面倾向最多输入 120 个字符",
    },
  );

  assert.deepEqual(
    validateAnalyzePayloadFields({
      contentTopic: "有效主题",
      contentGoal: "有效目标",
      platform: "抖音",
      userAssetType: "截图",
      assetNotes: "补".repeat(301),
    }),
    {
      ok: false,
      fieldName: "assetNotes",
      message: "补充说明最多输入 300 个字符",
    },
  );

  assert.deepEqual(
    validateAnalyzePayloadFields({
      contentTopic: "有效主题",
      contentGoal: "有效目标",
      platform: "抖音",
      userAssetType: "截图",
      assetDescription: "图".repeat(300),
      referencePreference: "高级但克制",
      assetNotes: "备注",
    }),
    {
      ok: true,
      fieldName: "",
      message: "",
    },
  );
});

test("input preparation form uses PRD field labels and placeholders", async () => {
  const indexHtml = await readFile(new URL("../public/index.html", import.meta.url), "utf-8");

  assert.match(indexHtml, /内容主题\s*<input name="contentTopic" placeholder="例如：为什么总觉得很忙却没有结果"/);
  assert.match(indexHtml, /内容目标\s*<input name="contentGoal" placeholder="例如：让用户意识到忙碌不等于有效产出"/);
  assert.match(indexHtml, /目标平台\s*<select name="platform">/);
  assert.match(indexHtml, /素材描述\s*<textarea[\s\S]*name="assetDescription"[\s\S]*placeholder="例如：口播截图，人物在左侧，背景比较空"/);
  assert.match(indexHtml, /封面倾向\s*<input name="referencePreference" placeholder="例如：更高级一点，但不要太平"/);
  assert.match(indexHtml, /补充说明\s*<textarea name="assetNotes" rows="3" maxlength="300" placeholder="例如：想更像热门内容，但不要太营销化"/);
});

test("public UI copy avoids conversational task phrasing", async () => {
  const files = [
    "../public/index.html",
    "../public/app/renderers.js",
    "../public/app/createApp.js",
    "../src/domain/workspace/buildActionWorkspace.js",
    "../src/domain/workspace/buildActionWorkspaceInputSchema.js",
    "../src/domain/workspace/buildObsidianWorkspaceDecisionRecord.js",
    "../src/domain/cards/buildFirstRoundCards.js",
    "../src/domain/cards/buildRankedImageStrategies.js",
    "../src/domain/analysis/inferAssetSuggestion.js",
  ];
  const forbiddenUiCopy = /你|我们|这里|这个|上面|下面|按你|根据你的|Codex|本次对话|模型处理|任务执行/u;

  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), "utf-8");
    assert.doesNotMatch(source, forbiddenUiCopy, file);
  }
});

test("web app exposes a static build script for PI Engine validation", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf-8"));
  const buildScript = await readFile(new URL("../scripts/build-static.mjs", import.meta.url), "utf-8");

  assert.equal(packageJson.scripts.build, "node scripts/build-static.mjs");
  assert.ok(buildScript.includes('const publicDir = join(appRoot, "public");'));
  assert.ok(buildScript.includes('const distDir = join(appRoot, "dist");'));
  assert.ok(buildScript.includes('"index.html"'));
  assert.ok(buildScript.includes('"app/createApp.js"'));
  assert.ok(buildScript.includes('"app/renderers.js"'));
  assert.ok(buildScript.includes("build-manifest.json"));
});

test("static build script preserves local root asset contract", async () => {
  const buildScript = await readFile(new URL("../scripts/build-static.mjs", import.meta.url), "utf-8");

  assert.ok(buildScript.includes('href="/styles.css"'));
  assert.ok(buildScript.includes('src="/main.js"'));
  assert.ok(buildScript.includes("root-level static asset references"));
});

test("load sample flow preserves local asset preview per PRD", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const loadSampleStart = createAppSource.indexOf('dom.loadSampleButton.addEventListener("click"');
  const assetUploadStart = createAppSource.indexOf("dom.assetUploadInput.addEventListener", loadSampleStart);
  const loadSampleFlow = createAppSource.slice(loadSampleStart, assetUploadStart);

  assert.ok(loadSampleFlow.includes("patchFormValues(dom.analyzeForm, payload.analysis.fields)"));
  assert.ok(!loadSampleFlow.includes("clearLocalAsset(dom, state)"));
});

test("sample case entry failures keep retry areas visible", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const loadSampleStart = createAppSource.indexOf('dom.loadSampleButton.addEventListener("click"');
  const assetUploadStart = createAppSource.indexOf("dom.assetUploadInput.addEventListener", loadSampleStart);
  const loadSampleFlow = createAppSource.slice(loadSampleStart, assetUploadStart);
  const runSampleStart = createAppSource.indexOf('dom.runSampleButton.addEventListener("click"');
  const analyzeSubmitStart = createAppSource.indexOf('dom.analyzeForm.addEventListener("submit"', runSampleStart);
  const runSampleFlow = createAppSource.slice(runSampleStart, analyzeSubmitStart);

  assert.ok(createAppSource.includes("function focusSampleResult(dom)"));
  assert.ok(loadSampleFlow.includes("案例读取失败，请重试"));
  assert.ok(loadSampleFlow.includes('focusAnalyzeField(dom, "");'));
  assert.ok(runSampleFlow.includes("案例读取失败，请重试"));
  assert.ok(runSampleFlow.includes("focusSampleResult(dom);"));
});

test("asset upload failure preserves existing local preview per PRD", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const assetUploadStart = createAppSource.indexOf("dom.assetUploadInput.addEventListener");
  const clearAssetStart = createAppSource.indexOf("dom.clearAssetButton.addEventListener", assetUploadStart);
  const assetUploadFlow = createAppSource.slice(assetUploadStart, clearAssetStart);
  const successStart = assetUploadFlow.indexOf("const nextPreview = await buildAssetPreview(file);");
  const catchStart = assetUploadFlow.indexOf("} catch (error) {");
  const successFlow = assetUploadFlow.slice(successStart, catchStart);
  const failureFlow = assetUploadFlow.slice(catchStart);

  assert.ok(successFlow.includes("revokeAssetPreview(state.assetPreview);"));
  assert.ok(successFlow.includes("state.assetPreview = nextPreview;"));
  assert.ok(!failureFlow.includes("clearLocalAsset(dom, state);"));
  assert.ok(failureFlow.includes('dom.assetUploadInput.value = "";'));
  assert.ok(failureFlow.includes("renderAssetPreview(dom.assetPreviewPanel, dom.assetPreviewContent, dom.clearAssetButton, state.assetPreview);"));
});

test("classifyRequestError separates network and server failures", () => {
  const networkError = new TypeError("Failed to fetch");
  const serverError = new Error("服务端处理失败");
  serverError.isApiError = true;
  serverError.status = 500;

  assert.deepEqual(classifyRequestError(networkError), {
    type: "network",
    message: "网络异常，请稍后重试",
  });

  assert.deepEqual(classifyRequestError(serverError), {
    type: "server",
    message: "服务端处理失败",
  });

  assert.deepEqual(classifyRequestError(new Error("Unexpected")), {
    type: "unknown",
    message: "生成失败，请重试",
  });
});

test("getFirstRoundGenerationFailureMessage maps PRD input and direction failures", () => {
  const serverError = new Error("服务端处理失败");
  serverError.isApiError = true;
  serverError.status = 500;

  assert.equal(
    getFirstRoundGenerationFailureMessage(new TypeError("Failed to fetch")),
    "网络异常，请稍后重试",
  );
  assert.equal(getFirstRoundGenerationFailureMessage(serverError), "生成失败，请重试");
  assert.equal(
    getFirstRoundGenerationFailureMessage(new Error("direction generation failed")),
    "方向结果生成失败，请重试",
  );
});

test("first-round input validation focuses the invalid field", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const helperStart = createAppSource.indexOf("function focusAnalyzeField(dom, fieldName)");
  const submitStart = createAppSource.indexOf('dom.analyzeForm.addEventListener("submit"');
  const submitEnd = createAppSource.indexOf('dom.cardsContainer.addEventListener("click"', submitStart);
  const submitFlow = createAppSource.slice(submitStart, submitEnd);

  assert.ok(helperStart > -1);
  assert.ok(createAppSource.includes("dom.analyzeForm.elements[fieldName]"));
  assert.ok(createAppSource.includes("field.scrollIntoView"));
  assert.ok(createAppSource.includes("field.focus();"));
  assert.ok(submitFlow.includes("setStatus(dom.firstRoundStatus, validation.message);"));
  assert.ok(submitFlow.includes("focusAnalyzeField(dom, validation.fieldName);"));
  assert.ok(!submitFlow.includes("focusActionWorkspaceInputs(dom);"));
});

test("first-round generation success and failure keep users on the right work area", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const submitStart = createAppSource.indexOf('dom.analyzeForm.addEventListener("submit"');
  const submitEnd = createAppSource.indexOf('dom.cardsContainer.addEventListener("click"', submitStart);
  const submitFlow = createAppSource.slice(submitStart, submitEnd);
  const successStart = submitFlow.indexOf("state.latestAnalysis = analysis;");
  const catchStart = submitFlow.indexOf("} catch (error) {");
  const successFlow = submitFlow.slice(successStart, catchStart);
  const failureFlow = submitFlow.slice(catchStart);

  assert.ok(successFlow.includes("reveal(dom.analysisPanel);"));
  assert.ok(successFlow.includes("focusDirectionCards(dom);"));
  assert.ok(failureFlow.includes("getFirstRoundGenerationFailureMessage(error)"));
  assert.ok(failureFlow.includes('focusAnalyzeField(dom, "");'));
});

test("buildAssetPreview rejects non-image files with PRD upload message", async () => {
  const textFile = new File(["plain text"], "note.txt", { type: "text/plain" });

  await assert.rejects(() => buildAssetPreview(textFile), /仅支持图片文件/);
});

test("validateAnalysisResultCompleteness enforces three usable direction cards", () => {
  const analysis = createAnalysisSession({
    contentTopic: "为什么你总觉得自己很忙但没结果",
    contentGoal: "让用户意识到忙不等于有效产出",
    userAssetType: "截图",
    platform: "抖音",
  });

  assert.deepEqual(validateAnalysisResultCompleteness(analysis), {
    ok: true,
    message: "",
  });

  assert.deepEqual(validateAnalysisResultCompleteness({ ...analysis, cards: analysis.cards.slice(0, 2) }), {
    ok: false,
    message: "方向结果不完整，请重新生成",
  });

  assert.deepEqual(
    validateAnalysisResultCompleteness({
      ...analysis,
      cards: [{ ...analysis.cards[0], coverCopyMain: "" }, analysis.cards[1], analysis.cards[2]],
    }),
    {
      ok: false,
      message: "方向结果不完整，请重新生成",
    },
  );

  assert.deepEqual(
    validateAnalysisResultCompleteness({
      ...analysis,
      cards: [{ ...analysis.cards[0], riskNote: "   " }, analysis.cards[1], analysis.cards[2]],
    }),
    {
      ok: false,
      message: "方向结果不完整，请重新生成",
    },
  );

  assert.deepEqual(
    validateAnalysisResultCompleteness({
      ...analysis,
      cards: [{ ...analysis.cards[0], titleOptions: ["   "] }, analysis.cards[1], analysis.cards[2]],
    }),
    {
      ok: false,
      message: "方向结果不完整，请重新生成",
    },
  );

  assert.deepEqual(
    validateAnalysisResultCompleteness({
      ...analysis,
      cards: [{ ...analysis.cards[0], signalMatches: [] }, analysis.cards[1], analysis.cards[2]],
    }),
    {
      ok: false,
      message: "方向结果不完整，请重新生成",
    },
  );

  assert.deepEqual(
    validateAnalysisResultCompleteness({
      ...analysis,
      cards: [{ ...analysis.cards[0], signalMatches: ["   "] }, analysis.cards[1], analysis.cards[2]],
    }),
    {
      ok: false,
      message: "方向结果不完整，请重新生成",
    },
  );
});

test("validateRefinePayloadFields enforces second-round feedback contract", () => {
  assert.deepEqual(validateRefinePayloadFields({ feedback: "   " }), {
    ok: false,
    fieldName: "feedback",
    message: "请输入修改意见",
  });

  assert.deepEqual(validateRefinePayloadFields({ feedback: "改".repeat(201) }), {
    ok: false,
    fieldName: "feedback",
    message: "修改意见最多输入 200 个字符",
  });

  assert.deepEqual(validateRefinePayloadFields({ feedback: " 更高级一点，但不要太平 " }), {
    ok: true,
    fieldName: "",
    message: "",
  });
});

test("validateRefinementContext blocks missing or stale selected direction", () => {
  const analysis = createAnalysisSession({
    contentTopic: "为什么你总觉得自己很忙但没结果",
    contentGoal: "让用户意识到忙不等于有效产出",
    userAssetType: "截图",
    platform: "抖音",
  });

  assert.deepEqual(validateRefinementContext({ analysis: null, selectedCardId: "" }), {
    ok: false,
    message: "请先选择一个封面方向",
  });

  assert.deepEqual(validateRefinementContext({ analysis, selectedCardId: "stale-card" }), {
    ok: false,
    message: "当前结果已失效，请重新生成方向",
  });

  assert.deepEqual(validateRefinementContext({ analysis, selectedCardId: analysis.cards[0].cardId }), {
    ok: true,
    message: "",
  });
});

test("validateRefinementResultCompleteness enforces usable second-round output", () => {
  const analysis = createAnalysisSession({
    contentTopic: "大学生存钱的3个误区",
    contentGoal: "让用户点开后知道哪些方法其实在亏钱",
    userAssetType: "场景图",
    platform: "抖音",
  });
  const refined = createRefinementSession({
    analysis,
    selectedCardId: analysis.cards[0].cardId,
    preserveElement: "保留当前的点击钩子",
    feedback: "降低营销感，但保留误区冲突",
  });

  assert.deepEqual(validateRefinementResultCompleteness(refined), {
    ok: true,
    message: "",
  });

  assert.deepEqual(
    validateRefinementResultCompleteness({
      ...refined,
      secondRound: {
        ...refined.secondRound,
        refinedCard: {
          ...refined.secondRound.refinedCard,
          titleOptions: ["   "],
        },
      },
    }),
    {
      ok: false,
      message: "修订失败，请重试",
    },
  );

  assert.deepEqual(
    validateRefinementResultCompleteness({
      ...refined,
      secondRound: {
        ...refined.secondRound,
        refinedCard: {
          ...refined.secondRound.refinedCard,
          imageDirection: "",
        },
      },
    }),
    {
      ok: false,
      message: "修订失败，请重试",
    },
  );

  assert.deepEqual(
    validateRefinementResultCompleteness({
      ...refined,
      mappingExplanation: {
        summary: "   ",
        explanationLines: ["   "],
      },
    }),
    {
      ok: false,
      message: "修订失败，请重试",
    },
  );
});

test("second-round refinement failures focus feedback input for retry", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const helperStart = createAppSource.indexOf("function focusRefineFeedbackInput(dom)");
  const submitStart = createAppSource.indexOf('dom.refineForm.addEventListener("submit"');
  const submitEnd = createAppSource.indexOf('dom.secondRoundResult.addEventListener("click"', submitStart);
  const submitFlow = createAppSource.slice(submitStart, submitEnd);

  assert.ok(helperStart > -1);
  assert.ok(createAppSource.includes("dom.refineForm.feedback.focus();"));
  assert.ok(submitFlow.includes("setStatus(dom.firstRoundStatus, validation.message);"));
  assert.ok(submitFlow.includes("setStatus(dom.firstRoundStatus, resultValidation.message);"));
  assert.ok(submitFlow.includes('error instanceof Error ? error.message : "修订失败，请重试"'));
  assert.ok(submitFlow.match(/focusRefineFeedbackInput\(dom\);/g)?.length >= 3);
});

test("validateActionWorkspaceContext blocks missing or stale selected direction", () => {
  const analysis = createAnalysisSession({
    contentTopic: "为什么你总觉得自己很忙但没结果",
    contentGoal: "让用户意识到忙不等于有效产出",
    userAssetType: "截图",
    platform: "抖音",
  });

  assert.deepEqual(validateActionWorkspaceContext({ analysis, selectedCardId: "" }), {
    ok: false,
    message: "请先选择一个封面方向",
  });

  assert.deepEqual(validateActionWorkspaceContext({ analysis, selectedCardId: "stale-card" }), {
    ok: false,
    message: "当前方向已失效，请重新选择",
  });

  assert.deepEqual(
    validateActionWorkspaceContext({ analysis, selectedCardId: analysis.cards[1].cardId }),
    {
      ok: true,
      message: "",
    },
  );
});

test("direction selection failures return users to direction cards", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const helperStart = createAppSource.indexOf("function focusDirectionCards(dom)");
  const analyzeSubmitStart = createAppSource.indexOf('dom.analyzeForm.addEventListener("submit"');
  const analyzeSubmitEnd = createAppSource.indexOf('dom.cardsContainer.addEventListener("click"', analyzeSubmitStart);
  const analyzeFlow = createAppSource.slice(analyzeSubmitStart, analyzeSubmitEnd);
  const refineSubmitStart = createAppSource.indexOf('dom.refineForm.addEventListener("submit"');
  const refineSubmitEnd = createAppSource.indexOf('dom.secondRoundResult.addEventListener("click"', refineSubmitStart);
  const refineFlow = createAppSource.slice(refineSubmitStart, refineSubmitEnd);
  const workspaceSubmitStart = createAppSource.indexOf('dom.actionWorkspaceForm.addEventListener("submit"');
  const workspaceSubmitEnd = createAppSource.indexOf("async function saveWorkspaceDecisionWith", workspaceSubmitStart);
  const workspaceFlow = createAppSource.slice(workspaceSubmitStart, workspaceSubmitEnd);

  assert.ok(helperStart > -1);
  assert.ok(createAppSource.includes("dom.cardsContainer.scrollIntoView"));
  assert.ok(analyzeFlow.includes("setStatus(dom.firstRoundStatus, resultValidation.message);"));
  assert.ok(analyzeFlow.includes("focusDirectionCards(dom);"));
  assert.ok(refineFlow.includes("validateRefinementContext"));
  assert.ok(refineFlow.includes("focusDirectionCards(dom);"));
  assert.ok(workspaceFlow.includes("validateActionWorkspaceContext"));
  assert.ok(workspaceFlow.includes("focusDirectionCards(dom);"));
});

test("workspace suggestion failures focus retained path inputs", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const helperStart = createAppSource.indexOf("function focusActionWorkspaceInputs(dom)");
  const workspaceSubmitStart = createAppSource.indexOf('dom.actionWorkspaceForm.addEventListener("submit"');
  const workspaceSubmitEnd = createAppSource.indexOf("async function saveWorkspaceDecisionWith", workspaceSubmitStart);
  const workspaceFlow = createAppSource.slice(workspaceSubmitStart, workspaceSubmitEnd);

  assert.ok(helperStart > -1);
  assert.ok(createAppSource.includes("dom.actionWorkspacePanel.scrollIntoView"));
  assert.ok(createAppSource.includes('dom.actionWorkspaceForm.querySelector("textarea, input")'));
  assert.ok(workspaceFlow.includes("setStatus(dom.firstRoundStatus, validation.message);"));
  assert.ok(workspaceFlow.includes('error instanceof Error ? error.message : "建议生成失败，请重试"'));
  assert.ok(workspaceFlow.match(/focusActionWorkspaceInputs\(dom\);/g)?.length >= 2);
});

test("workspace path switching focuses the updated path inputs", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const pathSwitchStart = createAppSource.indexOf('dom.actionWorkspacePaths.addEventListener("click"');
  const pathSwitchEnd = createAppSource.indexOf('dom.refineForm.addEventListener("submit"', pathSwitchStart);
  const pathSwitchFlow = createAppSource.slice(pathSwitchStart, pathSwitchEnd);

  assert.ok(pathSwitchFlow.includes("state.selectedWorkspaceId = nextWorkspaceId;"));
  assert.ok(pathSwitchFlow.includes("clearWorkspaceResultState(dom, state);"));
  assert.ok(pathSwitchFlow.includes("syncWorkspaceUi(dom, state);"));
  assert.ok(pathSwitchFlow.includes("已切换工作区路径，请补充当前路径信息后重新生成建议。"));
  assert.ok(pathSwitchFlow.includes("focusActionWorkspaceInputs(dom);"));
});

test("shouldInvalidateRefinementForCardChange only invalidates stale second-round results", () => {
  assert.equal(
    shouldInvalidateRefinementForCardChange({
      currentCardId: "card-a",
      nextCardId: "card-b",
      latestRefinement: { id: "second-round-1" },
    }),
    true,
  );

  assert.equal(
    shouldInvalidateRefinementForCardChange({
      currentCardId: "card-a",
      nextCardId: "card-a",
      latestRefinement: { id: "second-round-1" },
    }),
    false,
  );

  assert.equal(
    shouldInvalidateRefinementForCardChange({
      currentCardId: "card-a",
      nextCardId: "card-b",
      latestRefinement: null,
    }),
    false,
  );
});

test("shouldInvalidateWorkspaceForCardChange invalidates stale workspace context", () => {
  assert.equal(
    shouldInvalidateWorkspaceForCardChange({
      currentCardId: "card-a",
      nextCardId: "card-b",
      latestWorkspaceResult: { suggestion: { summary: "旧方向建议" } },
      latestWorkspaceDecisionSave: null,
    }),
    true,
  );

  assert.equal(
    shouldInvalidateWorkspaceForCardChange({
      currentCardId: "card-a",
      nextCardId: "card-b",
      latestWorkspaceResult: null,
      latestWorkspaceDecisionSave: { decision: "accept" },
    }),
    true,
  );

  assert.equal(
    shouldInvalidateWorkspaceForCardChange({
      currentCardId: "card-a",
      nextCardId: "card-a",
      latestWorkspaceResult: { suggestion: { summary: "当前方向建议" } },
      latestWorkspaceDecisionSave: { decision: "accept" },
    }),
    false,
  );

  assert.equal(
    shouldInvalidateWorkspaceForCardChange({
      currentCardId: "card-a",
      nextCardId: "card-b",
      latestWorkspaceResult: null,
      latestWorkspaceDecisionSave: null,
    }),
    false,
  );
});

test("validateActionWorkspacePayloadFields enforces workspace input contract", () => {
  assert.deepEqual(validateActionWorkspacePayloadFields({ keep_subject: "", remove_noise: " " }), {
    ok: false,
    fieldName: "keep_subject",
    message: "请补充至少一项路径信息",
  });

  assert.deepEqual(
    validateActionWorkspacePayloadFields({
      keep_subject: "人物表情",
      remove_noise: "杂".repeat(201),
    }),
    {
      ok: false,
      fieldName: "remove_noise",
      message: "路径信息最多输入 200 个字符",
    },
  );

  assert.deepEqual(
    validateActionWorkspacePayloadFields({
      keep_subject: "人物表情",
      remove_noise: "",
    }),
    {
      ok: true,
      fieldName: "",
      message: "",
    },
  );
});

test("renderActionWorkspaceForm limits each workspace input to 200 characters", () => {
  const container = { innerHTML: "" };
  const submitButton = { disabled: true, textContent: "" };

  renderActionWorkspaceForm(container, submitButton, {
    workspaceTitle: "优化现有素材",
    inputSchema: [
      {
        fieldId: "keep_subject",
        label: "想保留的主体",
        inputType: "text",
        placeholder: "例如：人物表情",
      },
      {
        fieldId: "remove_noise",
        label: "想弱化或裁掉的部分",
        inputType: "textarea",
        placeholder: "例如：背景太杂",
      },
    ],
  });

  assert.equal(submitButton.disabled, false);
  assert.ok(container.innerHTML.includes('name="keep_subject" maxlength="200"'));
  assert.ok(container.innerHTML.includes('name="remove_noise" rows="3" maxlength="200"'));
});

test("renderActionWorkspacePathSelector shows PRD workspace path enum and active path", () => {
  const container = { innerHTML: "" };

  renderActionWorkspacePathSelector(
    container,
    [
      {
        workspaceId: "optimize-current",
        workspaceTitle: "优化现有素材",
        workspaceGoal: "围绕现有素材优化主体和文字区。",
      },
      {
        workspaceId: "search-matched",
        workspaceTitle: "补内容贴合图",
        workspaceGoal: "补一张更贴内容的辅助图。",
      },
      {
        workspaceId: "concept-first",
        workspaceTitle: "做创意概念图",
        workspaceGoal: "先确定概念主体再执行封面。",
      },
    ],
    "search-matched",
  );

  assert.ok(container.innerHTML.includes("请选择下一步处理路径"));
  assert.ok(container.innerHTML.includes('data-workspace-id="optimize-current"'));
  assert.ok(container.innerHTML.includes('data-workspace-id="search-matched"'));
  assert.ok(container.innerHTML.includes('data-workspace-id="concept-first"'));
  assert.ok(container.innerHTML.includes('class="workspace-path-option is-active"'));
});

test("syncWorkspaceDecisionActions hides feedback actions until suggestion exists", () => {
  const classes = new Set();
  const dom = {
    workspaceDecisionRow: {
      classList: {
        add: (name) => classes.add(name),
        remove: (name) => classes.delete(name),
      },
    },
    workspaceAcceptButton: { disabled: false, textContent: "" },
    workspaceRejectButton: { disabled: false, textContent: "" },
  };

  syncWorkspaceDecisionActions(dom, {
    latestWorkspaceResult: null,
    latestWorkspaceDecisionSave: null,
  });

  assert.equal(classes.has("hidden"), true);
  assert.equal(dom.workspaceAcceptButton.disabled, true);
  assert.equal(dom.workspaceRejectButton.disabled, true);

  syncWorkspaceDecisionActions(dom, {
    latestWorkspaceResult: { suggestion: { summary: "先处理主体" } },
    latestWorkspaceDecisionSave: { decision: "accept" },
  });

  assert.equal(classes.has("hidden"), false);
  assert.equal(dom.workspaceAcceptButton.disabled, true);
  assert.equal(dom.workspaceRejectButton.disabled, false);
  assert.equal(dom.workspaceAcceptButton.textContent, "已采纳这一步建议");
});

test("workspace reject state keeps suggestion visible and points back to path inputs", () => {
  const statusContainer = { innerHTML: "" };
  const refineHintContainer = { innerHTML: "" };
  const workspaceResult = {
    suggestion: {
      summary: "先提炼现有图主体",
      refinedTask: "保留人物表情，弱化背景杂讯。",
    },
  };
  const rejectSaveResult = {
    decision: "reject",
    decisionId: "WS-REJECT-1",
    markdownPath: "/tmp/workspace-summary.md",
  };

  renderWorkspaceDecisionStatus(statusContainer, rejectSaveResult, true);
  renderRefineWorkspaceHint(refineHintContainer, workspaceResult, rejectSaveResult);

  assert.ok(statusContainer.innerHTML.includes("已标记为不采纳"));
  assert.ok(statusContainer.innerHTML.includes("当前建议内容会保留"));
  assert.ok(statusContainer.innerHTML.includes("修改上方路径输入后重新生成工作区建议"));
  assert.ok(refineHintContainer.innerHTML.includes("先提炼现有图主体"));
  assert.ok(refineHintContainer.innerHTML.includes("调整工作区路径输入后重新生成建议"));
});

test("workspace decision save failures keep suggestion recoverable", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const stateSource = await readFile(new URL("../public/app/state.js", import.meta.url), "utf-8");
  const decisionStart = createAppSource.indexOf("async function saveWorkspaceDecisionWith");
  const acceptStart = createAppSource.indexOf('dom.workspaceAcceptButton.addEventListener("click"', decisionStart);
  const decisionFlow = createAppSource.slice(decisionStart, acceptStart);

  assert.ok(stateSource.includes("isWorkspaceDecisionSubmitting: false"));
  assert.ok(createAppSource.includes("function setWorkspaceDecisionSubmitting(dom, decision, isSubmitting)"));
  assert.ok(decisionFlow.includes("if (state.isWorkspaceDecisionSubmitting)"));
  assert.ok(decisionFlow.includes("setWorkspaceDecisionSubmitting(dom, decision, true);"));
  assert.ok(decisionFlow.includes("正在保存工作区反馈状态..."));
  assert.ok(decisionFlow.includes("error instanceof Error ? error.message : \"工作区反馈状态保存失败，请重试\""));
  assert.ok(decisionFlow.includes("renderWorkspaceDecisionStatus(dom.workspaceDecisionStatus, state.latestWorkspaceDecisionSave, true);"));
  assert.ok(decisionFlow.includes("renderRefineWorkspaceHint("));
  assert.ok(decisionFlow.includes("focusActionWorkspaceInputs(dom);"));
  assert.ok(decisionFlow.includes("syncWorkspaceDecisionActions(dom, state);"));
});

test("validateExistingCaseSelection enforces system case availability", () => {
  const cases = [
    { id: "real-001", sourceType: "real" },
    { id: "sample-001", sourceType: "sample" },
  ];

  assert.deepEqual(validateExistingCaseSelection({ caseId: "", cases }), {
    ok: false,
    caseRecord: null,
    message: "请选择需要复盘的案例",
  });

  assert.deepEqual(validateExistingCaseSelection({ caseId: "real-missing", cases }), {
    ok: false,
    caseRecord: null,
    message: "案例不可用，请刷新后重试",
  });

  assert.deepEqual(validateExistingCaseSelection({ caseId: "sample-001", cases }), {
    ok: false,
    caseRecord: null,
    message: "案例不可用，请刷新后重试",
  });

  assert.deepEqual(validateExistingCaseSelection({ caseId: "real-001", cases }), {
    ok: true,
    caseRecord: { id: "real-001", sourceType: "real" },
    message: "",
  });
});

test("getCaseReviewActionFailureMessage follows PRD case review exception copy", () => {
  assert.equal(getCaseReviewActionFailureMessage("load-workbench"), "案例读取失败，请重试");
  assert.equal(getCaseReviewActionFailureMessage("fill-preview"), "案例读取失败，请重试");
  assert.equal(getCaseReviewActionFailureMessage("sync-preview"), "案例读取失败，请重试");
  assert.equal(getCaseReviewActionFailureMessage("export-obsidian-fill"), "导出失败，请重试");
});

test("platform case review entry points keep PRD read failure fallback", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const platformReviewStart = createAppSource.indexOf('dom.loadPlatformReviewButton.addEventListener("click"');
  const sampleLoadStart = createAppSource.indexOf('dom.loadSampleButton.addEventListener("click"', platformReviewStart);
  const platformReviewFlow = createAppSource.slice(platformReviewStart, sampleLoadStart);

  assert.ok(platformReviewFlow.includes("loadPlatformReview(platformCaseId)"));
  assert.ok(platformReviewFlow.includes("loadPlatformBatchReview()"));
  assert.ok(platformReviewFlow.includes("loadPlatformSyncPreview(selected.id)"));
  assert.equal(
    (platformReviewFlow.match(/案例读取失败，请重试/g) || []).length,
    3,
  );
  assert.ok(createAppSource.includes("function focusPlatformCaseSummary(summaryElement)"));
  assert.ok(platformReviewFlow.includes("focusPlatformCaseSummary(dom.platformReviewSummary);"));
  assert.ok(platformReviewFlow.includes("focusPlatformCaseSummary(dom.platformBatchSummary);"));
  assert.ok(platformReviewFlow.includes("focusPlatformCaseSummary(dom.platformSyncSummary);"));
});

test("real case library read failures return to case list", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const caseEntryStart = createAppSource.indexOf("async function enterCaseReviewWorkspace");
  const realCaseActionStart = createAppSource.indexOf('dom.realCaseLibraryResult.addEventListener("click"', caseEntryStart);
  const platformReviewStart = createAppSource.indexOf('dom.loadPlatformReviewButton.addEventListener("click"', realCaseActionStart);
  const caseLibraryFlow = createAppSource.slice(caseEntryStart, platformReviewStart);

  assert.ok(createAppSource.includes("function focusRealCaseLibraryResult(dom)"));
  assert.ok(createAppSource.includes("dom.realCaseLibraryResult.scrollIntoView"));
  assert.ok(caseLibraryFlow.includes("案例读取失败，请重试"));
  assert.ok(caseLibraryFlow.match(/focusRealCaseLibraryResult\(dom\);/g)?.length >= 4);
});

test("real case library can load a case into the main workbench", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const renderersSource = await readFile(new URL("../public/app/renderers.js", import.meta.url), "utf-8");
  const loadCaseStart = createAppSource.indexOf("async function loadCaseIntoMainWorkbench");
  const dashboardStart = createAppSource.indexOf("async function generateBatchReviewDashboardPreview", loadCaseStart);
  const loadCaseFlow = createAppSource.slice(loadCaseStart, dashboardStart);
  const actionStart = createAppSource.indexOf('if (action === "load-workbench")');
  const actionFlow = createAppSource.slice(actionStart, actionStart + 180);

  assert.ok(renderersSource.includes('data-real-case-action="load-workbench"'));
  assert.ok(renderersSource.includes("加载到主工作台"));
  assert.ok(loadCaseFlow.includes("runAvailableCase(caseId)"));
  assert.ok(loadCaseFlow.includes("patchFormValues(dom.analyzeForm, payload.analysis.fields)"));
  assert.ok(loadCaseFlow.includes("state.latestTitleSelection = null"));
  assert.ok(loadCaseFlow.includes("state.latestTitleWritebackApply = null"));
  assert.ok(loadCaseFlow.includes('switchProductView("creation")'));
  assert.ok(loadCaseFlow.includes("focusDirectionCards(dom);"));
  assert.ok(actionFlow.includes("await loadCaseIntoMainWorkbench(caseId);"));
});

test("creation view exposes real case quick start for the main workflow", async () => {
  const indexSource = await readFile(new URL("../public/index.html", import.meta.url), "utf-8");
  const domSource = await readFile(new URL("../public/app/dom.js", import.meta.url), "utf-8");
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const renderersSource = await readFile(new URL("../public/app/renderers.js", import.meta.url), "utf-8");

  assert.ok(indexSource.includes('id="real-case-quick-start"'));
  assert.ok(indexSource.includes('id="real-case-quick-start-result"'));
  assert.ok(domSource.includes("realCaseQuickStartResult"));
  assert.ok(renderersSource.includes("export function renderRealCaseQuickStart"));
  assert.ok(renderersSource.includes('data-real-case-action="load-workbench"'));
  assert.ok(createAppSource.includes("void refreshRealCaseQuickStart()"));
  assert.ok(createAppSource.includes("dom.realCaseQuickStartResult.addEventListener"));
  assert.ok(createAppSource.includes("await loadCaseIntoMainWorkbench(caseId);"));
});

test("validateFormalWriteReadiness requires confirmed safe write preview", () => {
  assert.deepEqual(validateFormalWriteReadiness(null), {
    ok: false,
    message: "请先确认写回内容",
  });

  assert.deepEqual(validateFormalWriteReadiness({ status: "awaiting-safe-write-confirmation" }), {
    ok: false,
    message: "请先确认写回内容",
  });

  assert.deepEqual(validateFormalWriteReadiness({ status: "awaiting-manual-decision-adoption" }), {
    ok: false,
    message: "请先采用推荐确认块",
  });

  assert.deepEqual(validateFormalWriteReadiness({ status: "ready-to-formal-write" }), {
    ok: false,
    message: "请先生成写回预览并确认内容",
  });

  assert.deepEqual(
    validateFormalWriteReadiness({
      status: "ready-to-formal-write",
      latestSafeWriteStatus: {
        readbackOk: true,
        matchedExpectedContent: false,
        manualReviewConclusionValidation: { ok: true },
        canProceedToFormalWrite: true,
      },
    }),
    {
      ok: false,
      message: "请先生成写回预览并确认内容",
    },
  );

  assert.deepEqual(
    validateFormalWriteReadiness({
      status: "ready-to-formal-write",
      latestSafeWriteStatus: {
        readbackOk: true,
        matchedExpectedContent: true,
        manualReviewConclusionValidation: { ok: false, message: "请输入人工复盘结论" },
        canProceedToFormalWrite: true,
      },
    }),
    {
      ok: false,
      message: "请输入人工复盘结论",
    },
  );

  assert.deepEqual(
    validateFormalWriteReadiness({
      status: "ready-to-formal-write",
      latestSafeWriteStatus: {
        readbackOk: true,
        matchedExpectedContent: true,
        manualReviewConclusion: "结".repeat(501),
        manualReviewConclusionValidation: { ok: true },
        canProceedToFormalWrite: true,
      },
    }),
    {
      ok: false,
      message: "人工复盘结论最多输入 500 个字符",
    },
  );

  assert.deepEqual(
    validateFormalWriteReadiness({
      status: "ready-to-formal-write",
      latestSafeWriteStatus: {
        readbackOk: true,
        matchedExpectedContent: true,
        parsed: {
          manualReviewConclusion: "   ",
        },
        manualReviewConclusionValidation: { ok: true },
        canProceedToFormalWrite: true,
      },
    }),
    {
      ok: false,
      message: "请输入人工复盘结论",
    },
  );

  assert.deepEqual(validateFormalWriteReadiness({
    status: "ready-to-formal-write",
    latestSafeWriteStatus: {
      readbackOk: true,
      matchedExpectedContent: true,
      manualReviewConclusionValidation: { ok: true },
      canProceedToFormalWrite: true,
    },
    manualConfirmationDecision: {
      decisionStatus: "pending",
      canProceedToSafePreviewWrite: false,
    },
  }), {
    ok: false,
    message: "请先采用推荐确认块",
  });

  assert.deepEqual(validateFormalWriteReadiness({
    status: "ready-to-formal-write",
    latestSafeWriteStatus: {
      readbackOk: true,
      matchedExpectedContent: true,
      manualReviewConclusionValidation: { ok: true },
      canProceedToFormalWrite: true,
    },
    manualConfirmationDecision: {
      decisionStatus: "adopt-recommended",
      canProceedToSafePreviewWrite: true,
    },
  }), {
    ok: true,
    message: "",
  });
});

test("rule catalogs load from validated local json sources", () => {
  const coverCatalog = loadCoverEffectCatalog();
  const feedbackCatalog = loadFeedbackCatalog();
  const directionSignalCatalog = loadCoverDirectionSignalCatalog();
  const meta = getRuleCatalogMeta();

  assert.equal(Array.isArray(coverCatalog.order), true);
  assert.equal(coverCatalog.order.length, 5);
  assert.equal(typeof coverCatalog.effects.information.userLabel, "string");
  assert.equal(Array.isArray(feedbackCatalog.negativeMappings), true);
  assert.equal(Array.isArray(feedbackCatalog.positiveMappings), true);
  assert.equal(Array.isArray(directionSignalCatalog.order), true);
  assert.equal(directionSignalCatalog.order.length, 5);
  assert.equal(
    Array.isArray(directionSignalCatalog.directions.suspense.signalGroups),
    true,
  );
  assert.equal(meta.source, "local-json");
  assert.equal(meta.effectCount, coverCatalog.order.length);
  assert.equal(meta.negativeMappingCount, feedbackCatalog.negativeMappings.length);
  assert.equal(meta.positiveMappingCount, feedbackCatalog.positiveMappings.length);
  assert.equal(meta.directionSignalCount, directionSignalCatalog.order.length);
});

test("createAnalysisSession keeps asset-context-free input compatible", () => {
  const result = createAnalysisSession({
    contentTopic: "大学生存钱的3个误区",
    contentGoal: "让用户知道哪些方法其实在亏钱",
    userAssetType: "无图只有想法",
    platform: "抖音",
    referencePreference: "更抓眼一点",
  });

  assert.equal(result.fields.minimumInputMode, "内容说明");
  assert.equal(result.fields.hasLocalAssetContext, "否");
  assert.equal(result.fields.assetContext.hasLocalPreview, false);
  assert.ok(result.fields.suggestedAssetType.length > 0);
  assert.ok(result.fields.primaryAssetActionLabel.length > 0);
  assert.ok(result.actionWorkspace.workspaceId.length > 0);
  assert.ok(result.actionWorkspace.suggestedInputs.length >= 3);
});

test("createAnalysisSession exposes PRD workspace path enum labels", () => {
  const optimizeCurrent = createAnalysisSession({
    contentTopic: "为什么总觉得很忙却没有结果",
    contentGoal: "让用户意识到忙碌不等于有效产出",
    userAssetType: "截图",
    platform: "抖音",
  });
  const searchMatched = createAnalysisSession({
    contentTopic: "大学生存钱的3个误区",
    contentGoal: "让用户知道哪些方法其实在亏钱",
    userAssetType: "无图只有想法",
    platform: "抖音",
  });
  const conceptFirst = createAnalysisSession({
    contentTopic: "大学生存钱的3个误区",
    contentGoal: "让用户知道哪些方法其实在亏钱",
    userAssetType: "无图只有想法",
    platform: "抖音",
    referencePreference: "更抓眼一点，更有创意",
  });

  assert.equal(optimizeCurrent.actionWorkspace.workspaceTitle, "优化现有素材");
  assert.equal(
    buildActionWorkspace({
      fields: {
        primaryAssetActionId: "search-matched",
        primaryAssetActionReason: "当前主题明确但素材不足，适合先补贴内容的图。",
      },
      primaryCard: null,
    }).workspaceTitle,
    "补内容贴合图",
  );
  assert.ok(
    searchMatched.cards.some((card) => card.actionWorkspace.workspaceTitle === "做创意概念图"),
  );
  assert.equal(conceptFirst.actionWorkspace.workspaceTitle, "做创意概念图");
});

test("workspace path follows the currently selected direction card strategy", () => {
  const analysis = createAnalysisSession({
    contentTopic: "职场沟通反差案例",
    contentGoal: "制造强烈反差让人点开",
    userAssetType: "场景图",
    platform: "抖音",
    referencePreference: "更抓眼一点，更有创意",
  });
  const conceptCard = analysis.cards.find(
    (card) => card.rankedImageStrategies[0].candidateId === "creative-concept-asset",
  );
  const optimizeCard = analysis.cards.find(
    (card) => card.rankedImageStrategies[0].candidateId === "current-asset-optimize",
  );

  assert.equal(conceptCard.actionWorkspace.workspaceId, "concept-first");
  assert.equal(optimizeCard.actionWorkspace.workspaceId, "optimize-current");
  assert.equal(analysis.actionWorkspace.workspaceId, analysis.cards[0].actionWorkspace.workspaceId);

  const result = createActionWorkspaceSession({
    analysis,
    selectedCardId: optimizeCard.cardId,
    workspaceInputs: {
      keep_subject: "办公室争执场景",
      remove_noise: "弱化背景杂物",
      current_problem: "冲突点不够集中",
    },
  });

  assert.equal(result.workspace.workspaceId, "optimize-current");
  assert.equal(result.workspace.linkedCardDirection, optimizeCard.directionLabelUserFacing);
  assert.ok(result.workspace.whyNow.includes("优化现有画面"));
});

test("workspace path can be explicitly selected from PRD enum", () => {
  const analysis = createAnalysisSession({
    contentTopic: "职场沟通反差案例",
    contentGoal: "制造强烈反差让人点开",
    userAssetType: "场景图",
    platform: "抖音",
    referencePreference: "更抓眼一点，更有创意",
  });
  const selectedCard = analysis.cards[0];

  assert.deepEqual(
    selectedCard.actionWorkspaces.map((workspace) => workspace.workspaceId),
    ["optimize-current", "search-matched", "concept-first"],
  );

  const result = createActionWorkspaceSession({
    analysis,
    selectedCardId: selectedCard.cardId,
    workspaceId: "search-matched",
    workspaceInputs: {
      desired_subject: "会议室里被打断的表达场景",
      avoid_style: "避免素材库摆拍",
      strengthen_click_point: "突出沟通反差",
    },
  });

  assert.equal(result.workspace.workspaceId, "search-matched");
  assert.equal(result.workspace.workspaceTitle, "补内容贴合图");
  assert.equal(result.workspace.linkedCardDirection, selectedCard.directionLabelUserFacing);
  assert.equal(result.suggestion.workspaceId, "search-matched");
});

test("createActionWorkspaceSession rejects unsupported workspace path", () => {
  const analysis = createAnalysisSession({
    contentTopic: "职场沟通反差案例",
    contentGoal: "制造强烈反差让人点开",
    userAssetType: "场景图",
    platform: "抖音",
  });

  assert.throws(
    () =>
      createActionWorkspaceSession({
        analysis,
        selectedCardId: analysis.cards[0].cardId,
        workspaceId: "free-form-path",
        workspaceInputs: {
          desired_subject: "会议室",
        },
      }),
    /工作区路径不可用，请重新选择/,
  );
});

test("createRefinementSession preserves selected card and returns a second-round card", () => {
  const analysis = createAnalysisSession({
    contentTopic: "大学生存钱的3个误区",
    contentGoal: "让用户点开后知道哪些方法其实在亏钱",
    userAssetType: "场景图",
    platform: "抖音",
    referencePreference: "更抓眼一点",
    assetDescription: "当前是普通场景图，想做出更强的误区冲突感",
    assetNotes: "想做出有反差感的封面",
  });

  const refined = createRefinementSession({
    analysis,
    selectedCardId: analysis.cards[0].cardId,
    preserveElement: "保留当前的点击钩子",
    feedback: "别太像营销号，但还是要抓眼",
    workspaceResult: {
      workspace: analysis.actionWorkspace,
      suggestion: {
        summary: "先围绕现有图提炼主体和标题区",
        refinedTask: "优先保留人物表情，并弱化背景杂讯。",
        nextSuggestion: "先解决第一眼不聚焦的问题。",
        draftPromptLine: "保留人物表情，弱化背景杂讯，优先解决第一眼不聚焦。",
        recommendedFollowUp: "先做一轮裁切再进二轮反馈。",
      },
    },
  });

  assert.equal(refined.adjustment.selectedCardId, analysis.cards[0].cardId);
  assert.equal(typeof refined.ruleMeta.version, "string");
  assert.ok(refined.adjustment.feedbackMappingId.length > 0);
  assert.ok(refined.secondRound.refinedCard.cardTitle.includes("第二轮优化"));
  assert.ok(refined.secondRound.changedAction.length > 0);
  assert.ok(refined.secondRound.preservedVariable.length > 0);
  assert.ok(refined.adjustment.workspaceContext);
  assert.ok(refined.mappingExplanation.summary.length > 0);
  assert.ok(Array.isArray(refined.mappingExplanation.explanationLines));
  assert.ok(refined.secondRound.refinedCard.clickReason.includes("工作区补充建议"));
});

test("renderRefinementResult exposes PRD modification rationale", () => {
  const analysis = createAnalysisSession({
    contentTopic: "大学生存钱的3个误区",
    contentGoal: "让用户点开后知道哪些方法其实在亏钱",
    userAssetType: "场景图",
    platform: "抖音",
    referencePreference: "更抓眼一点",
    assetDescription: "普通场景图，想做出更强的误区冲突感",
    assetNotes: "想做出有反差感的封面",
  });

  const refined = createRefinementSession({
    analysis,
    selectedCardId: analysis.cards[0].cardId,
    preserveElement: "保留当前的点击钩子",
    feedback: "降低营销感，但保留误区冲突",
  });
  const container = { innerHTML: "" };

  renderRefinementResult(container, refined);

  assert.ok(container.innerHTML.includes("修改依据"));
  assert.ok(container.innerHTML.includes("识别到的修改请求"));
  assert.ok(container.innerHTML.includes(refined.adjustment.changeRequest));
  assert.ok(container.innerHTML.includes(refined.mappingExplanation.summary));
  assert.ok(container.innerHTML.includes(refined.secondRound.refinedCard.coverCopyMain));
  assert.ok(container.innerHTML.includes(refined.secondRound.refinedCard.imageDirection));
  assert.ok(container.innerHTML.includes(refined.secondRound.refinedCard.riskNote));
  assert.ok(container.innerHTML.includes('data-refinement-follow-up="workspace"'));
  assert.ok(container.innerHTML.includes("返回工作区调整"));
  assert.ok(container.innerHTML.includes("refinement-case-handoff-box"));
  assert.ok(container.innerHTML.includes("结果沉淀"));
  assert.ok(container.innerHTML.includes("把本轮结果沉淀为案例与规则证据"));
  assert.ok(container.innerHTML.includes('data-refinement-follow-up="record-case"'));
  assert.ok(container.innerHTML.includes("进入案例复盘记录"));
  assert.ok(container.innerHTML.includes('data-refinement-follow-up="review-dashboard"'));
  assert.ok(container.innerHTML.includes("进入规则复盘"));
  assert.ok(
    container.innerHTML.indexOf("结果沉淀") <
      container.innerHTML.indexOf('data-refinement-follow-up="record-case"'),
  );
});

test("second-round follow-up actions include return-to-workspace branch", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const followUpStart = createAppSource.indexOf('dom.secondRoundResult.addEventListener("click"');
  const workspaceSubmitStart = createAppSource.indexOf(
    'dom.actionWorkspaceForm.addEventListener("submit"',
    followUpStart,
  );
  const followUpFlow = createAppSource.slice(followUpStart, workspaceSubmitStart);

  assert.ok(followUpFlow.includes('action === "workspace"'));
  assert.ok(followUpFlow.includes("dom.actionWorkspacePanel.scrollIntoView"));
  assert.ok(followUpFlow.includes("已返回工作区，可调整路径信息后重新生成建议。"));
  assert.ok(followUpFlow.includes('action === "record-case"'));
  assert.ok(followUpFlow.includes('enterCaseReviewWorkspace("#real-case-form")'));
  assert.ok(followUpFlow.includes("已进入案例复盘记录，可继续沉淀当前结果。"));
  assert.ok(followUpFlow.includes('action === "review-dashboard"'));
  assert.ok(followUpFlow.includes('enterBatchReviewDashboardWorkspace("#review-dashboard-section")'));
});

test("case review bridge links expand their target workspace groups", async () => {
  const indexSource = await readFile(new URL("../public/index.html", import.meta.url), "utf-8");
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const apiSource = await readFile(new URL("../public/app/api.js", import.meta.url), "utf-8");
  const serverSource = await readFile(new URL("../src/server/server.js", import.meta.url), "utf-8");
  const styleSource = await readFile(new URL("../public/styles.css", import.meta.url), "utf-8");

  assert.ok(indexSource.includes('id="product-view-switch"'));
  assert.ok(indexSource.includes('data-product-view-target="creation"'));
  assert.ok(indexSource.includes('data-product-view-target="review"'));
  assert.ok(indexSource.includes('data-product-view-target="writeback"'));
  assert.ok(indexSource.includes('data-view-tone="creation"'));
  assert.ok(indexSource.includes('data-view-tone="review"'));
  assert.ok(indexSource.includes('data-view-tone="writeback"'));
  assert.ok(indexSource.includes('class="product-view-index">01'));
  assert.ok(indexSource.includes('class="product-view-index">02'));
  assert.ok(indexSource.includes('class="product-view-index">03'));
  assert.ok(indexSource.includes('aria-controls="product-view-creation"'));
  assert.ok(indexSource.includes('aria-controls="product-view-review"'));
  assert.ok(indexSource.includes('aria-controls="product-view-writeback"'));
  assert.ok(indexSource.includes('id="product-view-creation"'));
  assert.ok(indexSource.includes('id="product-view-review"'));
  assert.ok(indexSource.includes('id="product-view-writeback"'));
  assert.ok(indexSource.includes('data-product-view="creation"'));
  assert.ok(indexSource.includes('data-product-view="review"'));
  assert.ok(indexSource.includes('data-product-view="writeback"'));
  assert.ok(indexSource.includes('aria-label="创作主线视图说明"'));
  assert.ok(indexSource.includes('aria-label="复盘态视图说明"'));
  assert.ok(indexSource.includes('aria-label="写回态视图说明"'));
  assert.ok(indexSource.includes("产出：方向卡与修订结果"));
  assert.ok(indexSource.includes("产出：工作单、批次记录与复盘证据"));
  assert.ok(indexSource.includes("产出：复盘看板、安全预览与写回状态"));
  assert.ok(indexSource.includes('id="writeback-gate-overview"'));
  assert.ok(indexSource.includes('id="refresh-writeback-gate-status-button"'));
  assert.ok(indexSource.includes("正式写回门禁总览"));
  assert.ok(indexSource.includes("生成安全预览"));
  assert.ok(indexSource.includes("补齐人工确认"));
  assert.ok(indexSource.includes("检查写回状态"));
  assert.ok(indexSource.includes("执行正式写回"));
  assert.ok(indexSource.includes("写回门禁总览"));
  assert.ok(indexSource.includes("刷新门禁状态"));
  assert.ok(indexSource.includes("检查写回门禁"));
  assert.ok(indexSource.includes("查看复盘看板写回状态"));
  assert.ok(!indexSource.includes("刷新写回状态"));
  assert.ok(!indexSource.includes("检查正式写回状态"));
  assert.ok(!indexSource.includes("查看正式写回入口"));
  assert.ok(!indexSource.includes('<a href="#review-dashboard-section">执行正式写回</a>'));
  assert.ok(indexSource.includes('aria-label="正式写回门禁操作顺序"'));
  assert.ok(indexSource.includes('href="#real-case-form" data-workspace-group-link="cases"'));
  assert.ok(indexSource.includes('href="#review-dashboard-section" data-workspace-group-link="validation"'));
  assert.ok(createAppSource.includes("function syncProductView()"));
  assert.ok(createAppSource.includes("function switchProductView(viewId"));
  assert.ok(createAppSource.includes("function getProductViewTargetSelector(viewId)"));
  assert.ok(createAppSource.includes('creation: "#product-view-creation"'));
  assert.ok(createAppSource.includes('review: "#product-view-review"'));
  assert.ok(createAppSource.includes('writeback: "#product-view-writeback"'));
  assert.ok(createAppSource.includes("function syncProductViewWorkspaceState(viewId)"));
  assert.ok(createAppSource.includes("function resolveProductViewForHash(hash)"));
  assert.ok(createAppSource.includes("function restoreProductViewFromHash(hash = window.location.hash)"));
  assert.ok(createAppSource.includes("state.currentProductView = viewId;"));
  assert.ok(createAppSource.includes('document.querySelectorAll("a[data-product-view-link]")'));
  assert.ok(createAppSource.includes('document.querySelectorAll("a[data-workspace-group-link]")'));
  assert.ok(createAppSource.includes("openWorkspaceGroupTarget(groupName, targetSelector)"));
  assert.ok(createAppSource.includes("switchProductView(viewId, targetSelector)"));
  assert.ok(createAppSource.includes("const targetSelector = getProductViewTargetSelector(viewId);"));
  assert.ok(createAppSource.includes("window.location.hash = targetSelector;"));
  assert.ok(createAppSource.includes("syncProductViewWorkspaceState(viewId)"));
  assert.ok(createAppSource.includes('syncWorkspaceGroupToggle("cases", true)'));
  assert.ok(createAppSource.includes('syncWorkspaceGroupToggle("validation", true)'));
  assert.ok(createAppSource.includes('switchProductView("review")'));
  assert.ok(createAppSource.includes('switchProductView("writeback")'));
  assert.ok(createAppSource.includes("enterCaseReviewWorkspace(targetSelector)"));
  assert.ok(createAppSource.includes("正在读取案例状态..."));
  assert.ok(createAppSource.includes("案例状态已更新，可继续查看缺口或生成复盘材料。"));
  assert.ok(createAppSource.includes('targetSelector === "#review-dashboard-section"'));
  assert.ok(createAppSource.includes("enterBatchReviewDashboardWorkspace(targetSelector)"));
  assert.ok(createAppSource.includes("generateBatchReviewDashboardPreview()"));
  assert.ok(createAppSource.includes("已生成批次复盘看板。"));
  assert.ok(createAppSource.includes("focusDashboardNextStep(dom);"));
  assert.ok(createAppSource.includes('window.addEventListener("hashchange"'));
  assert.ok(createAppSource.includes("restoreProductViewFromHash();"));
  assert.ok(indexSource.includes("第一轮方向结果"));
  assert.ok(createAppSource.includes("renderCards(dom.cardsContainer"));
  assert.ok(createAppSource.includes("renderAnalysisOverview(dom.analysisSummary"));
  assert.ok(styleSource.includes(".direction-result-rhythm"));
  assert.ok(styleSource.includes(".refinement-case-handoff-box"));
  assert.ok(styleSource.includes(".product-view-button::before"));
  assert.ok(styleSource.includes("touch-action: manipulation;"));
  assert.ok(styleSource.includes(".product-view-button:focus-visible"));
  assert.ok(styleSource.includes('.product-view-button[data-view-tone="review"]:focus-visible'));
  assert.ok(styleSource.includes('.product-view-button[data-view-tone="writeback"]:focus-visible'));
  assert.ok(styleSource.includes('.product-view-button[data-view-tone="review"].active'));
  assert.ok(styleSource.includes('.product-view-button[data-view-tone="writeback"].active'));
  assert.ok(styleSource.includes('.view-stage-panel[data-view-tone="review"]'));
  assert.ok(styleSource.includes('.view-stage-panel[data-view-tone="writeback"]'));
  assert.ok(styleSource.includes(".writeback-overview-panel"));
  assert.ok(styleSource.includes(".writeback-overview-grid"));
  assert.ok(styleSource.includes(".writeback-gate-actions"));
  assert.ok(indexSource.includes('id="refresh-writeback-gate-status-button"'));
  assert.ok(indexSource.includes('id="writeback-gate-status-result"'));
  assert.ok(indexSource.includes('data-review-followup-action="export-manual-review-safe-write"'));
  assert.ok(indexSource.includes('data-review-followup-action="check-manual-review-formal-write-readiness"'));
  assert.ok(createAppSource.includes("dom.refreshWritebackGateStatusButton.addEventListener"));
  assert.ok(createAppSource.includes("function handleReviewFollowupAction(event)"));
  assert.ok(createAppSource.includes("button[data-copy-handoff-confirmation]"));
  assert.ok(createAppSource.includes("button[data-copy-adoption-replacements]"));
  assert.ok(createAppSource.includes("button[data-copy-safe-preview-write-phrase]"));
  assert.ok(createAppSource.includes("copyTextToClipboard(confirmationBlock)"));
  assert.ok(createAppSource.includes("copyTextToClipboard(replacementText)"));
  assert.ok(createAppSource.includes('const confirmationPhrase = "确认写入安全预览确认块"'));
  assert.ok(createAppSource.includes("phraseInput.value = confirmationPhrase"));
  assert.ok(createAppSource.includes("copyTextToClipboard(confirmationPhrase)"));
  assert.ok(createAppSource.includes("function syncManualConfirmationSafePreviewWriteButton(panel)"));
  assert.ok(createAppSource.includes("function syncManualFormalWriteButton(panel)"));
  assert.ok(createAppSource.includes('submitButton.setAttribute("aria-disabled", matched ? "false" : "true")'));
  assert.ok(createAppSource.includes('dom.batchReviewDashboardResult.addEventListener("input", handleSafePreviewPhraseInput)'));
  assert.ok(createAppSource.includes('dom.batchReviewDashboardResult.addEventListener("input", handleFormalWritePhraseInput)'));
  assert.ok(createAppSource.includes("确认块已复制，可写入安全预览记录。"));
  assert.ok(createAppSource.includes("替换项已复制，可用于更新决策记录。"));
  assert.ok(createAppSource.includes("确认短语已填入，可继续写入确认块。"));
  assert.ok(createAppSource.includes("function refreshFormalWriteGateEvidence(state)"));
  assert.ok(createAppSource.includes("previewBatchReviewManualFormalWriteExecutionPrecheck()"));
  assert.ok(createAppSource.includes("state.latestManualFormalWriteExecutionPrecheck"));
  assert.ok(createAppSource.includes("previewBatchReviewManualConfirmationDraftValidation()"));
  assert.ok(createAppSource.includes("previewBatchReviewManualConfirmationApplyPreview()"));
  assert.ok(createAppSource.includes("previewBatchReviewManualConfirmationHandoffPacket()"));
  assert.ok(createAppSource.includes("previewBatchReviewManualConfirmationDecision()"));
  assert.ok(createAppSource.includes("previewBatchReviewManualConfirmationDecisionAdoptionPreview()"));
  assert.ok(createAppSource.includes("previewBatchReviewManualConfirmationDecisionAdoptionPacket()"));
  assert.ok(createAppSource.includes("previewBatchReviewManualConfirmationSafePreviewAdoptionPacket()"));
  assert.ok(createAppSource.includes("previewBatchReviewManualConfirmationSafePreviewWritePrecheck()"));
  assert.ok(createAppSource.includes("previewBatchReviewManualConfirmationSafePreviewWriteProjection()"));
  assert.ok(createAppSource.includes("previewBatchReviewManualFormalWriteExecutionPacket()"));
  assert.ok(createAppSource.includes("previewBatchReviewManualFormalWritePostExecutionAcceptance()"));
  assert.ok(createAppSource.includes("previewPiEngineExecutionPositionAudit()"));
  assert.ok(createAppSource.includes("state.latestManualConfirmationSafePreviewWriteProjection"));
  assert.ok(createAppSource.includes("state.latestManualFormalWriteExecutionPacket"));
  assert.ok(createAppSource.includes("state.latestManualFormalWritePostExecutionAcceptance"));
  assert.ok(createAppSource.includes("state.latestPiEngineExecutionPositionAudit"));
  assert.ok(createAppSource.includes("applyBatchReviewManualConfirmationSafePreviewWrite(confirmationPhrase)"));
  assert.ok(createAppSource.includes("apply-manual-confirmation-safe-preview-write"));
  assert.ok(createAppSource.includes("确认短语不匹配，安全预览记录保持不变。"));
  assert.ok(createAppSource.includes('const confirmationPhrase = "确认执行正式写回"'));
  assert.ok(createAppSource.includes("exportBatchReviewManualFormalWrite(confirmationPhrase)"));
  assert.ok(createAppSource.includes("正式写回短语不匹配，目标记录保持不变。"));
  assert.ok(createAppSource.includes("正式写回短语已填入，可继续执行。"));
  assert.ok(createAppSource.includes("button[data-copy-formal-write-phrase]"));
  assert.ok(createAppSource.includes("function syncManualFormalWriteButton(panel)"));
  assert.ok(createAppSource.includes("handleFormalWritePhraseInput"));
  assert.ok(apiSource.includes("previewBatchReviewManualConfirmationDecision"));
  assert.ok(apiSource.includes("/api/batch-review-manual-confirmation-decision"));
  assert.ok(apiSource.includes("previewBatchReviewManualConfirmationDecisionAdoptionPreview"));
  assert.ok(apiSource.includes("/api/batch-review-manual-confirmation-decision-adoption-preview"));
  assert.ok(apiSource.includes("previewBatchReviewManualConfirmationDecisionAdoptionPacket"));
  assert.ok(apiSource.includes("/api/batch-review-manual-confirmation-decision-adoption-packet"));
  assert.ok(apiSource.includes("previewBatchReviewManualConfirmationSafePreviewAdoptionPacket"));
  assert.ok(apiSource.includes("/api/batch-review-manual-confirmation-safe-preview-adoption-packet"));
  assert.ok(apiSource.includes("previewBatchReviewManualConfirmationSafePreviewWritePrecheck"));
  assert.ok(apiSource.includes("/api/batch-review-manual-confirmation-safe-preview-write-precheck"));
  assert.ok(apiSource.includes("previewBatchReviewManualConfirmationSafePreviewWriteProjection"));
  assert.ok(apiSource.includes("/api/batch-review-manual-confirmation-safe-preview-write-projection"));
  assert.ok(apiSource.includes("applyBatchReviewManualConfirmationSafePreviewWrite"));
  assert.ok(apiSource.includes("/api/batch-review-manual-confirmation-safe-preview-write-apply"));
  assert.ok(apiSource.includes("previewBatchReviewManualFormalWriteExecutionPrecheck"));
  assert.ok(apiSource.includes("/api/batch-review-manual-formal-write-execution-precheck"));
  assert.ok(apiSource.includes("previewBatchReviewManualFormalWriteExecutionPacket"));
  assert.ok(apiSource.includes("/api/batch-review-manual-formal-write-execution-packet"));
  assert.ok(apiSource.includes("previewBatchReviewManualFormalWritePostExecutionAcceptance"));
  assert.ok(apiSource.includes("/api/batch-review-manual-formal-write-post-execution-acceptance"));
  assert.ok(apiSource.includes("previewPiEngineExecutionPositionAudit"));
  assert.ok(apiSource.includes("/api/pi-engine-execution-position-audit"));
  assert.ok(apiSource.includes("exportBatchReviewManualFormalWrite(confirmationPhrase"));
  assert.ok(apiSource.includes("JSON.stringify({ confirmationPhrase })"));
  assert.ok(serverSource.includes("runManualConfirmationDecisionStatus"));
  assert.ok(serverSource.includes("/api/batch-review-manual-confirmation-decision"));
  assert.ok(serverSource.includes("runManualConfirmationDecisionAdoptionPreviewStatus"));
  assert.ok(serverSource.includes("/api/batch-review-manual-confirmation-decision-adoption-preview"));
  assert.ok(serverSource.includes("runManualConfirmationDecisionAdoptionPacketStatus"));
  assert.ok(serverSource.includes("/api/batch-review-manual-confirmation-decision-adoption-packet"));
  assert.ok(serverSource.includes("runManualConfirmationSafePreviewAdoptionPacketStatus"));
  assert.ok(serverSource.includes("/api/batch-review-manual-confirmation-safe-preview-adoption-packet"));
  assert.ok(serverSource.includes("runManualConfirmationSafePreviewWritePrecheckStatus"));
  assert.ok(serverSource.includes("/api/batch-review-manual-confirmation-safe-preview-write-precheck"));
  assert.ok(serverSource.includes("runManualConfirmationSafePreviewWriteProjectionStatus"));
  assert.ok(serverSource.includes("/api/batch-review-manual-confirmation-safe-preview-write-projection"));
  assert.ok(serverSource.includes("applyManualConfirmationSafePreviewWrite"));
  assert.ok(serverSource.includes("/api/batch-review-manual-confirmation-safe-preview-write-apply"));
  assert.ok(serverSource.includes("runManualFormalWriteExecutionPrecheckStatus"));
  assert.ok(serverSource.includes("/api/batch-review-manual-formal-write-execution-precheck"));
  assert.ok(serverSource.includes("runManualFormalWriteExecutionPacketStatus"));
  assert.ok(serverSource.includes("/api/batch-review-manual-formal-write-execution-packet"));
  assert.ok(serverSource.includes("runManualFormalWritePostExecutionAcceptanceStatus"));
  assert.ok(serverSource.includes("/api/batch-review-manual-formal-write-post-execution-acceptance"));
  assert.ok(serverSource.includes("runPiEngineExecutionPositionAuditStatus"));
  assert.ok(serverSource.includes("/api/pi-engine-execution-position-audit"));
  assert.ok(apiSource.includes("previewFormalWriteFollowUpPlan"));
  assert.ok(apiSource.includes("/api/formal-write-follow-up-plan"));
  assert.ok(serverSource.includes("runFormalWriteFollowUpPlanStatus"));
  assert.ok(serverSource.includes("/api/formal-write-follow-up-plan"));
  assert.ok(createAppSource.includes("previewFormalWriteFollowUpPlan"));
  assert.ok(createAppSource.includes("state.latestFormalWriteFollowUpPlan"));
  assert.ok(createAppSource.includes('dom.batchReviewDashboardResult.addEventListener("click", handleReviewFollowupAction)'));
  assert.ok(createAppSource.includes('?.addEventListener("click", handleReviewFollowupAction)'));
  assert.ok(styleSource.includes(".manual-formal-write-precheck-panel"));
  assert.ok(styleSource.includes(".manual-formal-write-packet-panel"));
  assert.ok(styleSource.includes(".manual-formal-write-acceptance-panel"));
  assert.ok(styleSource.includes(".manual-formal-write-acceptance-list"));
  assert.ok(styleSource.includes(".formal-write-follow-up-plan-panel"));
  assert.ok(styleSource.includes(".formal-write-follow-up-plan-grid"));
  assert.ok(styleSource.includes(".pi-engine-audit-panel"));
  assert.ok(styleSource.includes(".pi-engine-audit-columns"));
  assert.ok(styleSource.includes(".pi-engine-completion-list"));
  assert.ok(styleSource.includes(".manual-formal-write-blockers"));
  assert.ok(styleSource.includes(".manual-formal-write-next-action"));
  assert.ok(styleSource.includes(".manual-confirmation-projection-panel"));
  assert.ok(createAppSource.includes("function renderWritebackGateStatusFromState(dom, state)"));
  assert.ok(createAppSource.includes("state.latestManualConfirmationDraftValidation"));
  assert.ok(createAppSource.includes("state.latestManualConfirmationApplyPreview"));
  assert.ok(createAppSource.includes("state.latestManualConfirmationHandoffPacket"));
  assert.ok(createAppSource.includes("state.latestManualConfirmationDecision"));
  assert.ok(createAppSource.includes("state.latestManualConfirmationDecisionAdoptionPreview"));
  assert.ok(createAppSource.includes("state.latestManualConfirmationDecisionAdoptionPacket"));
  assert.ok(createAppSource.includes("state.latestManualConfirmationSafePreviewAdoptionPacket"));
  assert.ok(createAppSource.includes("state.latestManualConfirmationSafePreviewWritePrecheck"));
  assert.ok(createAppSource.includes("state.latestManualConfirmationSafePreviewWriteApply"));
  assert.ok(createAppSource.includes("state.followUpActionStatus"));
  assert.ok(createAppSource.includes("renderWritebackGateStatusFromState(dom, state)"));
  assert.ok(styleSource.includes(".writeback-status-board"));
  assert.ok(styleSource.includes(".writeback-status-grid"));
  assert.ok(styleSource.includes(".writeback-gate-progress"));
  assert.ok(styleSource.includes(".writeback-gate-step-active"));
  assert.ok(styleSource.includes(".writeback-gate-step-locked"));
  assert.ok(styleSource.includes(".writeback-action-progress"));
  assert.ok(styleSource.includes(".writeback-action-progress-running"));
  assert.ok(styleSource.includes(".writeback-action-progress-failed"));
  assert.ok(styleSource.includes(".writeback-action-recovery"));
  assert.ok(styleSource.includes(".writeback-confirmation-guidance"));
  assert.ok(styleSource.includes(".manual-confirmation-draft-panel"));
  assert.ok(styleSource.includes(".manual-confirmation-draft-grid"));
  assert.ok(styleSource.includes(".manual-confirmation-apply-panel"));
  assert.ok(styleSource.includes(".manual-confirmation-apply-grid"));
  assert.ok(styleSource.includes(".manual-confirmation-handoff-panel"));
  assert.ok(styleSource.includes(".manual-confirmation-handoff-grid"));
  assert.ok(styleSource.includes(".manual-confirmation-handoff-copy-head"));
  assert.ok(styleSource.includes(".manual-confirmation-decision-box"));
  assert.ok(styleSource.includes(".manual-confirmation-decision-panel"));
  assert.ok(styleSource.includes(".manual-confirmation-decision-grid"));
  assert.ok(styleSource.includes(".manual-confirmation-adoption-progress-panel"));
  assert.ok(styleSource.includes(".manual-confirmation-adoption-progress-steps"));
  assert.ok(styleSource.includes(".manual-confirmation-adoption-guidance"));
  assert.ok(styleSource.includes(".manual-confirmation-decision-outcomes"));
  assert.ok(styleSource.includes(".manual-confirmation-preflight-checks"));
  assert.ok(styleSource.includes(".manual-confirmation-preflight-pass"));
  assert.ok(styleSource.includes(".manual-confirmation-adoption-preview-panel"));
  assert.ok(styleSource.includes(".manual-confirmation-adoption-preview-grid"));
  assert.ok(styleSource.includes(".manual-confirmation-adoption-packet-panel"));
  assert.ok(styleSource.includes(".manual-confirmation-adoption-replacements"));
  assert.ok(styleSource.includes(".manual-confirmation-adoption-replacements-head"));
  assert.ok(styleSource.includes(".manual-confirmation-rejection-replacements"));
  assert.ok(styleSource.includes(".manual-confirmation-controlled-write"));
  assert.ok(styleSource.includes(".manual-confirmation-controlled-write-brief"));
  assert.ok(styleSource.includes(".manual-confirmation-controlled-write-action"));
  assert.ok(styleSource.includes(".writeback-gate-actions button"));
  assert.ok(styleSource.includes("@media (prefers-reduced-motion: reduce)"));
});

test("renderWritebackGateOverviewStatus shows empty and readiness states", () => {
  const container = { innerHTML: "" };

  renderWritebackGateOverviewStatus(container, null);

  assert.ok(container.innerHTML.includes("刷新后将展示最新安全预览"));
  assert.ok(!container.innerHTML.includes('aria-label="写回操作执行状态"'));

  renderWritebackGateOverviewStatus(container, null, {
    "check-manual-review-formal-write-readiness": { state: "failed" },
  });

  assert.ok(container.innerHTML.includes("刷新后将展示最新安全预览"));
  assert.ok(container.innerHTML.includes('aria-label="写回操作执行状态"'));
  assert.ok(container.innerHTML.includes("检查写回状态"));
  assert.ok(container.innerHTML.includes("需复查"));
  assert.ok(container.innerHTML.includes("writeback-action-progress-failed"));
  assert.ok(container.innerHTML.includes("writeback-action-recovery"));
  assert.ok(container.innerHTML.includes("重新检查写回状态"));
  assert.ok(container.innerHTML.includes('data-review-followup-action="check-manual-review-formal-write-readiness"'));

  renderWritebackGateOverviewStatus(container, {
    status: "awaiting-safe-write-confirmation",
    statusLabel: "先补安全写回确认",
    summary: "请输入人工复盘结论",
    latestSafeWriteStatus: {
      targetBatchLabel: "real-002_to_real-003",
      targetPath: "/tmp/safe-write-preview.md",
      readbackOk: true,
      matchedExpectedContent: true,
      hasManualConfirmation: false,
      canProceedToFormalWrite: false,
      manualReviewConclusion: "",
    },
  },
  {},
  {
    ok: true,
    summary: "人工确认草稿门禁效果符合预期。",
    sourcePath: "/tmp/manual-confirmation-draft.md",
    blocks: [
      {
        label: "建议填写块",
        canProceedToFormalWrite: true,
        manualReviewConclusionValidation: { ok: true },
        manualReviewConclusion: "本批次可以作为阶段性结论写回。",
        confirmedLines: "最卡环节 / UI 优化时机",
        stillNeedsEdit: "",
        readyDecision: "可以",
      },
      {
        label: "保守填写块",
        canProceedToFormalWrite: false,
        manualReviewConclusionValidation: { ok: true },
        manualReviewConclusion: "本批次仍需复核措辞。",
        confirmedLines: "最卡环节 / UI 优化时机",
        stillNeedsEdit: "需人工复核措辞",
        readyDecision: "暂不进入",
      },
    ],
  },
  {
    ok: true,
    summary: "人工确认写入前预演通过。",
    safetyBoundary: "仅生成项目内预演副本，不写入 Obsidian，不执行正式写回。",
    variants: [
      {
        label: "建议填写块",
        expectedCanProceedToFormalWrite: true,
        canProceedToFormalWrite: true,
        stillNeedsEdit: "",
        outputPath: "/tmp/suggested-safe-write-preview.md",
      },
      {
        label: "保守填写块",
        expectedCanProceedToFormalWrite: false,
        canProceedToFormalWrite: false,
        stillNeedsEdit: "需人工复核措辞",
        outputPath: "/tmp/conservative-safe-write-preview.md",
      },
    ],
  },
  {
    ok: true,
    status: "ready-for-manual-transfer",
    summary: "人工确认交接包已生成，可用于人工写入安全预览记录。",
    safetyBoundary: "仅生成项目内交接包，不写入 Obsidian，不执行正式写回。",
    targetBatchLabel: "real-002_to_real-003",
    targetPath: "/tmp/real-002_to_real-003.md",
    confirmationBlock: [
      "## 4. 人工补充",
      "- 人工复盘结论：本批次可以作为阶段性结论写回。",
      "- 哪几行确认可以正式写回：最卡环节 / UI 优化时机",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
    ].join("\n"),
    suggestedGateResult: {
      canProceedToFormalWrite: true,
    },
    conservativeGateResult: {
      canProceedToFormalWrite: false,
    },
    nextChecks: [
      "将推荐确认块写入 Obsidian 安全预览记录底部。",
      "重新检查正式写回门禁。",
    ],
    outputPaths: {
      markdown: "/tmp/manual-confirmation-handoff-packet.md",
    },
  },
  {
    ok: true,
    status: "awaiting-decision",
    decisionStatus: "pending",
    decisionLabel: "待确认",
    targetBatchLabel: "real-002_to_real-003",
    summary: "决策仍待确认，正式写回保持锁定。",
    safetyBoundary: "仅校验项目内决策记录，不写入 Obsidian，不执行正式写回。",
    canProceedToSafePreviewWrite: false,
    outputPaths: {
      decision: "/tmp/manual-confirmation-decision.md",
    },
  },
  {
    ok: true,
    status: "adoption-preview-ready",
    summary: "采用推荐确认块后的决策预演通过，可作为进入安全预览写入前复查的依据。",
    safetyBoundary: "仅生成采用推荐确认块后的项目内预演，不修改决策记录，不写入 Obsidian，不执行正式写回。",
    canProceedToSafePreviewWriteAfterAdoption: true,
    currentDecision: {
      decisionLabel: "待确认",
    },
    adoptedDecision: {
      decisionLabel: "采用推荐确认块",
    },
    outputPaths: {
      markdown: "/tmp/manual-confirmation-decision-adoption-preview.md",
    },
  },
  {
    ok: true,
    status: "adoption-packet-ready",
    summary: "人工采用操作包已生成，可用于人工更新决策记录。",
    safetyBoundary: "仅生成项目内人工操作包，不修改决策记录，不写入 Obsidian，不执行正式写回。",
    canProceedToSafePreviewWriteAfterAdoption: true,
    currentDecision: {
      decisionLabel: "待确认",
    },
    adoptedDecision: {
      decisionLabel: "采用推荐确认块",
    },
    sourcePaths: {
      decision: "/tmp/manual-confirmation-decision.md",
    },
    replacements: [
      {
        label: "决策状态",
        from: "- 决策状态：pending",
        to: "- 决策状态：adopt-recommended",
      },
      {
        label: "决策说明",
        from: "- 决策说明：待确认",
        to: "- 决策说明：采用推荐确认块",
      },
    ],
    outputPaths: {
      markdown: "/tmp/manual-confirmation-decision-adoption-packet.md",
    },
  });

  assert.ok(container.innerHTML.includes("data-writeback-gate-status-panel"));
  assert.ok(container.innerHTML.includes("先补安全写回确认"));
  assert.ok(container.innerHTML.includes("awaiting-safe-write-confirmation"));
  assert.ok(container.innerHTML.includes("real-002_to_real-003"));
  assert.ok(container.innerHTML.includes("安全预览读回"));
  assert.ok(container.innerHTML.includes("已确认"));
  assert.ok(container.innerHTML.includes("人工确认"));
  assert.ok(container.innerHTML.includes("待补齐"));
  assert.ok(container.innerHTML.includes("写回许可"));
  assert.ok(container.innerHTML.includes("待人工确认"));
  assert.ok(container.innerHTML.includes('aria-label="正式写回门禁进度"'));
  assert.ok(container.innerHTML.includes("安全预览"));
  assert.ok(container.innerHTML.includes("预览已读回"));
  assert.ok(container.innerHTML.includes("人工确认"));
  assert.ok(container.innerHTML.includes("等待结论"));
  assert.ok(container.innerHTML.includes("状态检查"));
  assert.ok(container.innerHTML.includes("门禁未满足"));
  assert.ok(container.innerHTML.includes("正式写回"));
  assert.ok(container.innerHTML.includes("保持锁定"));
  assert.ok(container.innerHTML.includes("writeback-gate-step-active"));
  assert.ok(container.innerHTML.includes("writeback-gate-step-locked"));
  assert.ok(container.innerHTML.includes("请输入人工复盘结论"));
  assert.ok(container.innerHTML.includes('aria-label="人工确认补齐提示"'));
  assert.ok(container.innerHTML.includes("待补人工确认"));
  assert.ok(container.innerHTML.includes("/tmp/safe-write-preview.md"));
  assert.ok(container.innerHTML.includes("在安全预览底部填写人工复盘结论后，重新检查写回状态。"));
  assert.ok(container.innerHTML.includes('data-review-followup-action="check-manual-review-formal-write-readiness"'));
  assert.ok(container.innerHTML.includes('aria-label="人工确认草稿门禁验证"'));
  assert.ok(container.innerHTML.includes("人工确认草稿验证"));
  assert.ok(container.innerHTML.includes("人工确认草稿门禁效果符合预期。"));
  assert.ok(container.innerHTML.includes("草稿来源：/tmp/manual-confirmation-draft.md"));
  assert.ok(container.innerHTML.includes("建议填写块"));
  assert.ok(container.innerHTML.includes("会打开门禁"));
  assert.ok(container.innerHTML.includes("人工结论"));
  assert.ok(container.innerHTML.includes("本批次可以作为阶段性结论写回。"));
  assert.ok(container.innerHTML.includes("确认行"));
  assert.ok(container.innerHTML.includes("最卡环节 / UI 优化时机"));
  assert.ok(container.innerHTML.includes("保守填写块"));
  assert.ok(container.innerHTML.includes("保持锁定"));
  assert.ok(container.innerHTML.includes("本批次仍需复核措辞。"));
  assert.ok(container.innerHTML.includes("仍需手改"));
  assert.ok(container.innerHTML.includes("写回许可"));
  assert.ok(container.innerHTML.includes("该区域只验证草稿效果，不写入安全预览，也不执行正式写回。"));
  assert.ok(container.innerHTML.includes('aria-label="人工确认写入前预演"'));
  assert.ok(container.innerHTML.includes("写入前预演"));
  assert.ok(container.innerHTML.includes("人工确认写入前预演通过。"));
  assert.ok(container.innerHTML.includes("仅生成项目内预演副本，不写入 Obsidian，不执行正式写回。"));
  assert.ok(container.innerHTML.includes("合并后可写回"));
  assert.ok(container.innerHTML.includes("合并后保持锁定"));
  assert.ok(container.innerHTML.includes("预演副本"));
  assert.ok(container.innerHTML.includes("/tmp/suggested-safe-write-preview.md"));
  assert.ok(container.innerHTML.includes("/tmp/conservative-safe-write-preview.md"));
  assert.ok(container.innerHTML.includes('aria-label="人工确认交接包"'));
  assert.ok(container.innerHTML.includes("人工确认交接包"));
  assert.ok(container.innerHTML.includes("可交接"));
  assert.ok(container.innerHTML.includes("人工确认交接包已生成，可用于人工写入安全预览记录。"));
  assert.ok(container.innerHTML.includes("页面自动读取项目内交接包；人工处理只需确认是否采用推荐确认块。"));
  assert.ok(container.innerHTML.includes("仅生成项目内交接包，不写入 Obsidian，不执行正式写回。"));
  assert.ok(container.innerHTML.includes("当前决策项"));
  assert.ok(container.innerHTML.includes("采用推荐确认块 / 暂不采用"));
  assert.ok(container.innerHTML.includes("确认采用后，再进入安全预览写入与门禁复查。"));
  assert.ok(container.innerHTML.includes("/tmp/real-002_to_real-003.md"));
  assert.ok(container.innerHTML.includes("推荐确认块"));
  assert.ok(container.innerHTML.includes("复制确认块"));
  assert.ok(container.innerHTML.includes("data-copy-handoff-confirmation"));
  assert.ok(container.innerHTML.includes("data-handoff-confirmation-block"));
  assert.ok(container.innerHTML.includes("本批次可以作为阶段性结论写回。"));
  assert.ok(container.innerHTML.includes("写入后打开门禁"));
  assert.ok(container.innerHTML.includes("写入后保持锁定"));
  assert.ok(container.innerHTML.includes("将推荐确认块写入 Obsidian 安全预览记录底部。"));
  assert.ok(container.innerHTML.includes("/tmp/manual-confirmation-handoff-packet.md"));
  assert.ok(container.innerHTML.includes('aria-label="人工采用进度总览"'));
  assert.ok(container.innerHTML.includes("人工采用进度总览"));
  assert.ok(container.innerHTML.includes("等待人工采用决策"));
  assert.ok(container.innerHTML.includes("当前状态：等待人工采用决策。下一步：复制替换项并更新决策记录。"));
  assert.ok(container.innerHTML.includes("决策记录"));
  assert.ok(container.innerHTML.includes("已读取"));
  assert.ok(container.innerHTML.includes("采用预演"));
  assert.ok(container.innerHTML.includes("已通过"));
  assert.ok(container.innerHTML.includes("操作包"));
  assert.ok(container.innerHTML.includes("可使用"));
  assert.ok(container.innerHTML.includes('aria-label="人工采用操作指引"'));
  assert.ok(container.innerHTML.includes("人工采用操作指引"));
  assert.ok(container.innerHTML.includes("查看采用预演是否通过。"));
  assert.ok(container.innerHTML.includes("复制操作包中的两条替换项。"));
  assert.ok(container.innerHTML.includes("人工更新项目内决策记录后重新刷新门禁。"));
  assert.ok(container.innerHTML.includes('aria-label="人工决策后果预览"'));
  assert.ok(container.innerHTML.includes("人工决策后果预览"));
  assert.ok(container.innerHTML.includes("采用推荐确认块"));
  assert.ok(container.innerHTML.includes("可进入复查"));
  assert.ok(container.innerHTML.includes("人工更新决策记录后，状态会进入安全预览写入前复查。"));
  assert.ok(container.innerHTML.includes("暂不采用推荐确认块"));
  assert.ok(container.innerHTML.includes("保持锁定"));
  assert.ok(container.innerHTML.includes("决策记录可保持正式写回锁定，后续继续补充人工结论。"));
  assert.ok(container.innerHTML.includes('aria-label="安全预览写入前置检查"'));
  assert.ok(container.innerHTML.includes("安全预览写入前置检查"));
  assert.ok(container.innerHTML.includes("继续锁定"));
  assert.ok(container.innerHTML.includes("前置检查尚未满足，正式写回继续保持锁定。"));
  assert.ok(container.innerHTML.includes("交接证据"));
  assert.ok(container.innerHTML.includes("已就绪"));
  assert.ok(container.innerHTML.includes("待确认"));
  assert.ok(container.innerHTML.includes('aria-label="人工确认决策记录"'));
  assert.ok(container.innerHTML.includes("人工确认决策记录"));
  assert.ok(container.innerHTML.includes("决策仍待确认，正式写回保持锁定。"));
  assert.ok(container.innerHTML.includes("仅校验项目内决策记录，不写入 Obsidian，不执行正式写回。"));
  assert.ok(container.innerHTML.includes("校验状态"));
  assert.ok(container.innerHTML.includes("决策状态"));
  assert.ok(container.innerHTML.includes("pending"));
  assert.ok(container.innerHTML.includes("保持等待"));
  assert.ok(container.innerHTML.includes("/tmp/manual-confirmation-decision.md"));
  assert.ok(container.innerHTML.includes('aria-label="采用推荐确认块预演"'));
  assert.ok(container.innerHTML.includes("采用推荐确认块预演"));
  assert.ok(container.innerHTML.includes("预演通过"));
  assert.ok(container.innerHTML.includes("采用推荐确认块后的决策预演通过"));
  assert.ok(container.innerHTML.includes("不修改决策记录，不写入 Obsidian，不执行正式写回。"));
  assert.ok(container.innerHTML.includes("当前决策"));
  assert.ok(container.innerHTML.includes("预演决策"));
  assert.ok(container.innerHTML.includes("进入写入前复查"));
  assert.ok(container.innerHTML.includes("/tmp/manual-confirmation-decision-adoption-preview.md"));
  assert.ok(container.innerHTML.includes('aria-label="人工采用操作包"'));
  assert.ok(container.innerHTML.includes("人工采用操作包"));
  assert.ok(container.innerHTML.includes("人工采用操作包已生成，可用于人工更新决策记录。"));
  assert.ok(container.innerHTML.includes("采用替换项"));
  assert.ok(container.innerHTML.includes("复制替换项"));
  assert.ok(container.innerHTML.includes("data-copy-adoption-replacements"));
  assert.ok(container.innerHTML.includes("data-adoption-replacement-text"));
  assert.ok(container.innerHTML.includes("- 决策状态：pending"));
  assert.ok(container.innerHTML.includes("- 决策状态：adopt-recommended"));
  assert.ok(container.innerHTML.includes("- 决策说明：采用推荐确认块"));
  assert.ok(container.innerHTML.includes('aria-label="暂不采用替换项"'));
  assert.ok(container.innerHTML.includes("暂不采用替换项"));
  assert.ok(container.innerHTML.includes("- 决策状态：reject-recommended"));
  assert.ok(container.innerHTML.includes("- 决策说明：暂不采用推荐确认块"));
  assert.ok(container.innerHTML.includes("/tmp/manual-confirmation-decision-adoption-packet.md"));
  assert.ok(container.innerHTML.includes("正式写回待解锁"));
  assert.ok(container.innerHTML.includes('disabled aria-disabled="true"'));

  renderWritebackGateOverviewStatus(
    container,
    {
      status: "ready-to-formal-write",
      statusLabel: "可以正式写回",
      summary: "安全预览已完成人工确认。",
      manualConfirmationDecision: {
        decisionStatus: "adopt-recommended",
        decisionLabel: "采用推荐确认块",
        canProceedToSafePreviewWrite: true,
      },
      latestSafeWriteStatus: {
        targetBatchLabel: "real-002_to_real-003",
        targetPath: "/tmp/safe-write-preview.md",
        readbackOk: true,
        matchedExpectedContent: true,
        hasManualConfirmation: true,
        canProceedToFormalWrite: true,
        manualReviewConclusion: "安全预览可以作为正式写回依据。",
      },
    },
    {
      "export-manual-review-safe-write": { state: "completed" },
      "check-manual-review-formal-write-readiness": { state: "running" },
      "export-manual-review-formal-write": { state: "failed" },
    },
  );

  assert.ok(container.innerHTML.includes("可以正式写回"));
  assert.ok(container.innerHTML.includes("推荐块已采用"));
  assert.ok(container.innerHTML.includes("门禁已满足"));
  assert.ok(container.innerHTML.includes("允许执行"));
  assert.ok(container.innerHTML.includes('aria-label="写回操作执行状态"'));
  assert.ok(container.innerHTML.includes("导出安全预览"));
  assert.ok(container.innerHTML.includes("检查写回状态"));
  assert.ok(container.innerHTML.includes("已完成"));
  assert.ok(container.innerHTML.includes("执行中"));
  assert.ok(container.innerHTML.includes("需复查"));
  assert.ok(container.innerHTML.includes("writeback-action-progress-completed"));
  assert.ok(container.innerHTML.includes("writeback-action-progress-running"));
  assert.ok(container.innerHTML.includes("writeback-action-progress-failed"));
  assert.ok(container.innerHTML.includes("writeback-action-recovery"));
  assert.ok(container.innerHTML.includes("重新检查写回状态"));
  assert.ok(container.innerHTML.includes("执行正式写回"));
  assert.ok(container.innerHTML.includes('data-review-followup-action="export-manual-review-formal-write"'));
  assert.ok(!container.innerHTML.includes('disabled aria-disabled="true"'));
  assert.ok(!container.innerHTML.includes('aria-label="人工确认补齐提示"'));

  renderWritebackGateOverviewStatus(container, {
    status: "awaiting-safe-write-readback",
    statusLabel: "安全预览需复查",
    summary: "安全预览读回未完成。",
    latestSafeWriteStatus: {
      targetBatchLabel: "real-002_to_real-003",
      targetPath: "/tmp/safe-write-preview.md",
      readbackOk: true,
      matchedExpectedContent: false,
      hasManualConfirmation: false,
      canProceedToFormalWrite: false,
      manualReviewConclusion: "",
    },
  });

  assert.ok(container.innerHTML.includes("安全预览需复查"));
  assert.ok(container.innerHTML.includes("预览需复查"));
  assert.ok(container.innerHTML.includes("writeback-gate-step-attention"));
});

test("single real case preview and commit failures keep retry anchors visible", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const previewStart = createAppSource.indexOf('dom.previewRealCaseButton.addEventListener("click"');
  const commitStart = createAppSource.indexOf('dom.commitRealCaseButton.addEventListener("click"', previewStart);
  const batchStart = createAppSource.indexOf('dom.previewRealCaseBatchButton.addEventListener("click"', commitStart);
  const previewFlow = createAppSource.slice(previewStart, commitStart);
  const commitFlow = createAppSource.slice(commitStart, batchStart);

  assert.ok(createAppSource.includes("function focusRealCaseForm(dom)"));
  assert.ok(createAppSource.includes("function focusRealCasePreviewResult(dom)"));
  assert.ok(createAppSource.includes("function focusRealCaseCommitResult(dom)"));
  assert.ok(previewFlow.includes("try {"));
  assert.ok(previewFlow.includes('error instanceof Error ? error.message : "真实案例骨架预览失败，请检查后重试。"'));
  assert.ok(previewFlow.includes("focusRealCaseForm(dom);"));
  assert.ok(previewFlow.includes("focusRealCasePreviewResult(dom);"));
  assert.ok(commitFlow.includes("请先预览真实案例骨架，再确认写入。"));
  assert.ok(commitFlow.includes('error instanceof Error ? error.message : "真实案例写入失败，请检查后重试。"'));
  assert.ok(commitFlow.match(/focusRealCasePreviewResult\(dom\);/g)?.length >= 2);
  assert.ok(commitFlow.includes("focusRealCaseCommitResult(dom);"));
});

test("batch real case preview and commit keep retry anchors visible", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const previewStart = createAppSource.indexOf('dom.previewRealCaseBatchButton.addEventListener("click"');
  const commitStart = createAppSource.indexOf('dom.commitRealCaseBatchButton.addEventListener("click"', previewStart);
  const worksheetStart = createAppSource.indexOf('dom.previewRealCaseBatchWorksheetButton.addEventListener("click"', commitStart);
  const previewFlow = createAppSource.slice(previewStart, commitStart);
  const commitFlow = createAppSource.slice(commitStart, worksheetStart);

  assert.ok(createAppSource.includes("function focusRealCaseBatchForm(dom)"));
  assert.ok(createAppSource.includes("function focusRealCaseBatchPreviewResult(dom)"));
  assert.ok(createAppSource.includes("function focusRealCaseBatchCommitResult(dom)"));
  assert.ok(previewFlow.includes("已生成批量预览，可检查批次结构后再统一确认写入。"));
  assert.ok(previewFlow.includes("focusRealCaseBatchPreviewResult(dom);"));
  assert.ok(previewFlow.includes("focusRealCaseBatchForm(dom);"));
  assert.ok(commitFlow.includes("请先预览批量真实案例骨架，再确认写入。"));
  assert.ok(commitFlow.includes("批量真实案例已写入，可继续进入维护链。"));
  assert.ok(commitFlow.match(/focusRealCaseBatchPreviewResult\(dom\);/g)?.length >= 2);
  assert.ok(commitFlow.includes("focusRealCaseBatchCommitResult(dom);"));
});

test("batch worksheet preview export and history keep result anchors visible", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const previewStart = createAppSource.indexOf('dom.previewRealCaseBatchWorksheetButton.addEventListener("click"');
  const exportStart = createAppSource.indexOf('dom.exportRealCaseBatchWorksheetButton.addEventListener("click"', previewStart);
  const historyStart = createAppSource.indexOf('dom.loadRealCaseBatchWorksheetHistoryButton.addEventListener("click"', exportStart);
  const runRecordStart = createAppSource.indexOf('dom.previewRealCaseBatchRunRecordButton.addEventListener("click"', historyStart);
  const previewFlow = createAppSource.slice(previewStart, exportStart);
  const exportFlow = createAppSource.slice(exportStart, historyStart);
  const historyFlow = createAppSource.slice(historyStart, runRecordStart);

  assert.ok(createAppSource.includes("function focusRealCaseBatchWorksheetResult(dom)"));
  assert.ok(createAppSource.includes("dom.realCaseBatchWorksheetResult.scrollIntoView"));
  assert.ok(previewFlow.includes("已生成批量回填工作单预览，可继续导出到 Obsidian。"));
  assert.ok(previewFlow.includes("focusRealCaseBatchWorksheetResult(dom);"));
  assert.ok(previewFlow.includes("focusRealCaseBatchForm(dom);"));
  assert.ok(exportFlow.includes("批量回填工作单已导出到 Obsidian。"));
  assert.ok(exportFlow.match(/focusRealCaseBatchWorksheetResult\(dom\);/g)?.length >= 2);
  assert.ok(historyFlow.includes("已读取这批案例最近的工作单导出记录。"));
  assert.ok(historyFlow.match(/focusRealCaseBatchWorksheetResult\(dom\);/g)?.length >= 2);
});

test("batch run record preview and export keep result anchors visible", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const previewStart = createAppSource.indexOf('dom.previewRealCaseBatchRunRecordButton.addEventListener("click"');
  const exportStart = createAppSource.indexOf('dom.exportRealCaseBatchRunRecordButton.addEventListener("click"', previewStart);
  const uiReadinessStart = createAppSource.indexOf('dom.previewUiOptimizationReadinessButton.addEventListener("click"', exportStart);
  const previewFlow = createAppSource.slice(previewStart, exportStart);
  const exportFlow = createAppSource.slice(exportStart, uiReadinessStart);

  assert.ok(createAppSource.includes("function focusRealCaseBatchRunRecordResult(dom)"));
  assert.ok(createAppSource.includes("dom.realCaseBatchRunRecordResult.scrollIntoView"));
  assert.ok(previewFlow.includes("已生成批次试跑记录预览，可继续导出到 Obsidian。"));
  assert.ok(previewFlow.includes("focusRealCaseBatchRunRecordResult(dom);"));
  assert.ok(previewFlow.includes("focusRealCaseBatchForm(dom);"));
  assert.ok(exportFlow.includes("批次试跑记录已导出到 Obsidian。"));
  assert.ok(exportFlow.match(/focusRealCaseBatchRunRecordResult\(dom\);/g)?.length >= 2);
});

test("readiness and friction summary preview exports keep result anchors visible", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const readinessPreviewStart = createAppSource.indexOf('dom.previewUiOptimizationReadinessButton.addEventListener("click"');
  const readinessExportStart = createAppSource.indexOf('dom.exportUiOptimizationReadinessButton.addEventListener("click"', readinessPreviewStart);
  const frictionPreviewStart = createAppSource.indexOf('dom.previewBatchRunFrictionSummaryButton.addEventListener("click"', readinessExportStart);
  const frictionExportStart = createAppSource.indexOf('dom.exportBatchRunFrictionSummaryButton.addEventListener("click"', frictionPreviewStart);
  const dashboardStart = createAppSource.indexOf('dom.previewBatchReviewDashboardButton.addEventListener("click"', frictionExportStart);
  const readinessPreviewFlow = createAppSource.slice(readinessPreviewStart, readinessExportStart);
  const readinessExportFlow = createAppSource.slice(readinessExportStart, frictionPreviewStart);
  const frictionPreviewFlow = createAppSource.slice(frictionPreviewStart, frictionExportStart);
  const frictionExportFlow = createAppSource.slice(frictionExportStart, dashboardStart);

  assert.ok(createAppSource.includes("function focusUiOptimizationReadinessResult(dom)"));
  assert.ok(createAppSource.includes("function focusBatchRunFrictionSummaryResult(dom)"));
  assert.ok(readinessPreviewFlow.includes("已生成 UI 优化进入条件报告预览，可继续决定是否导出到 Obsidian。"));
  assert.ok(readinessPreviewFlow.match(/focusUiOptimizationReadinessResult\(dom\);/g)?.length >= 2);
  assert.ok(readinessExportFlow.includes("UI 优化进入条件报告已导出到 Obsidian。"));
  assert.ok(readinessExportFlow.match(/focusUiOptimizationReadinessResult\(dom\);/g)?.length >= 2);
  assert.ok(frictionPreviewFlow.includes("已生成跨批次摩擦点汇总预览。"));
  assert.ok(frictionPreviewFlow.match(/focusBatchRunFrictionSummaryResult\(dom\);/g)?.length >= 2);
  assert.ok(frictionExportFlow.includes("跨批次摩擦点汇总已导出到 Obsidian。"));
  assert.ok(frictionExportFlow.match(/focusBatchRunFrictionSummaryResult\(dom\);/g)?.length >= 2);
});

test("formal write validation failure focuses formal write status panel", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const renderersSource = await readFile(new URL("../public/app/renderers.js", import.meta.url), "utf-8");
  const formalWriteStart = createAppSource.indexOf('if (action === "export-manual-review-formal-write")');
  const formalWriteEnd = createAppSource.indexOf('dom.realCaseLibraryResult.addEventListener("click"', formalWriteStart);
  const formalWriteFlow = createAppSource.slice(formalWriteStart, formalWriteEnd);

  assert.ok(createAppSource.includes("function focusFormalWriteStatusPanel(dom)"));
  assert.ok(createAppSource.includes("[data-formal-write-status-panel]"));
  assert.ok(formalWriteFlow.includes("focusFormalWriteStatusPanel(dom);"));
  assert.ok(renderersSource.includes("data-formal-write-status-panel"));
});

test("formal write execution failure focuses formal write status panel", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const formalWriteStart = createAppSource.indexOf('if (action === "export-manual-review-formal-write")');
  const formalWriteEnd = createAppSource.indexOf('dom.realCaseLibraryResult.addEventListener("click"', formalWriteStart);
  const formalWriteFlow = createAppSource.slice(formalWriteStart, formalWriteEnd);
  const failureStart = formalWriteFlow.indexOf(".catch((error) =>");
  const failureFlow = formalWriteFlow.slice(failureStart);

  assert.ok(failureFlow.includes("error instanceof Error ? error.message : \"写回失败，请检查后重试\""));
  assert.ok(failureFlow.includes("focusFormalWriteStatusPanel(dom);"));
});

test("batch review export failures keep retry step visible", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const directExportStart = createAppSource.indexOf("dom.exportBatchReviewDashboardButton.addEventListener");
  const directExportEnd = createAppSource.indexOf('dom.batchReviewDashboardResult.addEventListener("click"', directExportStart);
  const directExportFlow = createAppSource.slice(directExportStart, directExportEnd);
  const followUpStart = createAppSource.indexOf('if (action === "export-manual-review-task-card")');
  const followUpEnd = createAppSource.indexOf('if (action === "check-manual-review-formal-write-readiness")', followUpStart);
  const followUpExportFlow = createAppSource.slice(followUpStart, followUpEnd);

  assert.ok(directExportFlow.includes("批次复盘看板导出失败。"));
  assert.ok(directExportFlow.includes("复盘套件导出失败。"));
  assert.ok(directExportFlow.match(/focusDashboardNextStep\(dom\);/g)?.length >= 2);
  assert.ok(followUpExportFlow.includes("人工复盘待补任务导出失败。"));
  assert.ok(followUpExportFlow.includes("人工复盘回流预览导出失败。"));
  assert.ok(followUpExportFlow.includes("真实批次试跑结论写回草稿导出失败。"));
  assert.ok(followUpExportFlow.includes("真实批次试跑记录安全写回预览导出失败。"));
  assert.ok(followUpExportFlow.match(/focusDashboardNextStep\(dom\);/g)?.length >= 4);
});

test("batch review dashboard preview failure keeps retry step visible", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const previewStart = createAppSource.indexOf("async function generateBatchReviewDashboardPreview");
  const previewEnd = createAppSource.indexOf("async function enterBatchReviewDashboardWorkspace", previewStart);
  const previewFlow = createAppSource.slice(previewStart, previewEnd);
  const failureStart = previewFlow.indexOf("} catch (error) {");
  const failureFlow = previewFlow.slice(failureStart);

  assert.ok(previewFlow.includes("正在生成批次复盘看板..."));
  assert.ok(failureFlow.includes('error instanceof Error ? error.message : "批次复盘看板生成失败。"'));
  assert.ok(failureFlow.includes("focusDashboardNextStep(dom);"));
  assert.ok(failureFlow.includes("return false;"));
});

test("batch review direct export success returns to next step", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const directExportStart = createAppSource.indexOf("dom.exportBatchReviewDashboardButton.addEventListener");
  const directExportEnd = createAppSource.indexOf('dom.batchReviewDashboardResult.addEventListener("click"', directExportStart);
  const directExportFlow = createAppSource.slice(directExportStart, directExportEnd);

  assert.ok(directExportFlow.includes("批次复盘看板已导出到 Obsidian。"));
  assert.ok(directExportFlow.includes("复盘套件已一键导出到 Obsidian。"));
  assert.ok(directExportFlow.match(/focusDashboardNextStep\(dom\);/g)?.length >= 4);
});

test("formal write readiness check focuses formal write status panel", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const readinessStart = createAppSource.indexOf('if (action === "check-manual-review-formal-write-readiness")');
  const readinessEnd = createAppSource.indexOf('if (action === "export-manual-review-formal-write")', readinessStart);
  const readinessFlow = createAppSource.slice(readinessStart, readinessEnd);

  assert.ok(readinessFlow.includes("正在检查正式写回是否已到可执行状态..."));
  assert.ok(readinessFlow.includes("正式写回状态检查失败。"));
  assert.ok(readinessFlow.match(/focusFormalWriteStatusPanel\(dom\);/g)?.length >= 2);
});

test("writeback gate refresh button records action progress", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const refreshStart = createAppSource.indexOf("dom.refreshWritebackGateStatusButton.addEventListener");
  const refreshEnd = createAppSource.indexOf("dom.refreshRealCaseLibraryButton.addEventListener", refreshStart);
  const refreshFlow = createAppSource.slice(refreshStart, refreshEnd);

  assert.ok(refreshFlow.includes('const action = "check-manual-review-formal-write-readiness"'));
  assert.ok(refreshFlow.includes('state: "running"'));
  assert.ok(refreshFlow.includes('state: result.status === "ready-to-formal-write" ? "completed" : "running"'));
  assert.ok(refreshFlow.includes('state: "failed"'));
  assert.ok(refreshFlow.match(/renderWritebackGateStatusFromState\(dom, state\);/g)?.length >= 3);
  assert.ok(refreshFlow.includes("buildDashboardRenderPayload("));
  assert.ok(refreshFlow.includes("正式写回门禁状态刷新失败。"));
});

test("unknown batch review follow-up action keeps dashboard recoverable", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const fallbackStart = createAppSource.indexOf("state.followUpActionStatus[action] = {", createAppSource.indexOf('if (action === "export-batch-review-suite")'));
  const fallbackEnd = createAppSource.indexOf("dom.refreshRealCaseLibraryButton.addEventListener", fallbackStart);
  const fallbackFlow = createAppSource.slice(fallbackStart, fallbackEnd);

  assert.ok(fallbackFlow.includes('state: "failed"'));
  assert.ok(fallbackFlow.includes("当前复盘动作暂不可执行，请选择其他复盘入口。"));
  assert.ok(fallbackFlow.includes("renderBatchReviewDashboardResult("));
  assert.ok(fallbackFlow.includes("focusDashboardNextStep(dom);"));
});

test("formal write success focuses follow-up task panel", async () => {
  const createAppSource = await readFile(new URL("../public/app/createApp.js", import.meta.url), "utf-8");
  const renderersSource = await readFile(new URL("../public/app/renderers.js", import.meta.url), "utf-8");
  const formalWriteStart = createAppSource.indexOf('if (action === "export-manual-review-formal-write")');
  const formalWriteEnd = createAppSource.indexOf('dom.realCaseLibraryResult.addEventListener("click"', formalWriteStart);
  const formalWriteFlow = createAppSource.slice(formalWriteStart, formalWriteEnd);

  assert.ok(createAppSource.includes("function focusFormalWriteFollowUpPanel(dom)"));
  assert.ok(createAppSource.includes("[data-formal-write-followup-panel]"));
  assert.ok(formalWriteFlow.includes("真实批次试跑记录已完成正式写回。"));
  assert.ok(formalWriteFlow.includes("state.latestManualFormalWritePostExecutionAcceptance"));
  assert.ok(formalWriteFlow.includes("result.postExecutionAcceptance"));
  assert.ok(formalWriteFlow.includes("focusFormalWriteFollowUpPanel(dom);"));
  assert.ok(renderersSource.includes("data-formal-write-followup-panel"));
});

test("createRefinementSession extracts preserved item from one-sentence feedback", () => {
  const analysis = createAnalysisSession({
    contentTopic: "大学生存钱的3个误区",
    contentGoal: "让用户点开后知道哪些方法其实在亏钱",
    userAssetType: "场景图",
    platform: "抖音",
    referencePreference: "更抓眼一点",
    assetDescription: "普通场景图，想做出更强的误区冲突感",
  });

  const refined = createRefinementSession({
    analysis,
    selectedCardId: analysis.cards[0].cardId,
    preserveElement: "",
    feedback: "保留误区冲突，但降低营销感",
  });

  assert.equal(refined.adjustment.preserveElement, "误区冲突");
  assert.equal(refined.adjustment.preserveElementSource, "feedback");
  assert.equal(refined.adjustment.changeRequest, "降低营销感");
  assert.equal(refined.adjustment.changeRequestSource, "feedback");
  assert.equal(refined.secondRound.preservedElement, "误区冲突");
  assert.ok(refined.mappingExplanation.explanationLines.some((line) => line.includes("修改请求识别为")));
  assert.ok(refined.mappingExplanation.explanationLines.some((line) => line.includes("一句反馈")));
});

test("createActionWorkspaceSession returns path-specific workspace suggestion", () => {
  const analysis = createAnalysisSession({
    contentTopic: "为什么你总觉得自己很忙但没结果",
    contentGoal: "让用户意识到忙不等于有效产出",
    userAssetType: "截图",
    platform: "抖音",
    referencePreference: "更高级一点，但别太平",
    assetDescription: "当前是口播截图，人物在左侧，背景比较空",
    assetNotes: "当前只有口播截图",
    assetContext: {
      origin: "local-preview",
      fileName: "busy-cover.png",
      mimeType: "image/png",
      sizeLabel: "428 KB",
      dimensionsLabel: "1080 × 1920",
      hasLocalPreview: true,
    },
  });

  const result = createActionWorkspaceSession({
    analysis,
    selectedCardId: analysis.cards[1].cardId,
    workspaceInputs: {
      keep_subject: "人物表情",
      remove_noise: "背景杂讯和角落字幕",
      current_problem: "第一眼不够聚焦",
    },
  });

  assert.equal(result.workspace.workspaceId, "optimize-current");
  assert.equal(result.workspace.linkedCardDirection, analysis.cards[1].directionLabelUserFacing);
  assert.equal(result.suggestion.linkedDirection, analysis.cards[1].directionLabelUserFacing);
  assert.ok(result.workspace.inputSchema.length >= 3);
  assert.ok(result.suggestion.summary.length > 0);
  assert.ok(result.suggestion.draftPromptLine.includes("人物表情"));
  assert.ok(result.suggestion.riskChecks.length >= 2);
});

test("createActionWorkspaceSession requires a current selected direction", () => {
  const analysis = createAnalysisSession({
    contentTopic: "为什么你总觉得自己很忙但没结果",
    contentGoal: "让用户意识到忙不等于有效产出",
    userAssetType: "截图",
    platform: "抖音",
  });

  assert.throws(
    () =>
      createActionWorkspaceSession({
        analysis,
        workspaceInputs: {
          keep_subject: "人物表情",
        },
      }),
    /请先选择一个封面方向/,
  );

  assert.throws(
    () =>
      createActionWorkspaceSession({
        analysis,
        selectedCardId: "stale-card",
        workspaceInputs: {
          keep_subject: "人物表情",
        },
      }),
    /当前方向已失效，请重新选择/,
  );
});

test("saveWorkspaceDecisionSession writes decision artifacts", async () => {
  const analysis = createAnalysisSession({
    contentTopic: "为什么你总觉得自己很忙但没结果",
    contentGoal: "让用户意识到忙不等于有效产出",
    userAssetType: "截图",
    platform: "抖音",
    referencePreference: "更高级一点，但别太平",
    assetDescription: "当前是口播截图，人物在左侧，背景比较空",
    assetNotes: "当前只有口播截图",
  });
  const workspaceResult = createActionWorkspaceSession({
    analysis,
    selectedCardId: analysis.cards[0].cardId,
    workspaceInputs: {
      keep_subject: "人物表情",
      remove_noise: "背景杂讯",
      current_problem: "第一眼不够聚焦",
    },
  });

  const saved = await saveWorkspaceDecisionSession({
    decision: "accept",
    analysis,
    workspace: workspaceResult.workspace,
    suggestion: workspaceResult.suggestion,
  });

  assert.equal(saved.ok, true);
  assert.equal(saved.decision, "accept");
  assert.ok(saved.decisionId.startsWith("WS-"));
  assert.ok(saved.jsonPath.endsWith("result.json"));
  assert.ok(saved.markdownPath.endsWith("summary.md"));
});

test("createPromptPreview returns prompt blocks for first and second round", () => {
  const analysis = createAnalysisSession({
    contentTopic: "英语口语一直学不会怎么办",
    contentGoal: "让用户理解口语提升卡住的真正原因",
    userAssetType: "人像",
    platform: "抖音",
    referencePreference: "更吸引人一点，但别太油",
    assetDescription: "有人像口播，但画面普通，希望更有停留感",
    assetNotes: "可以接受一点悬念感",
  });

  const promptPreview = createPromptPreview({
    analysis,
    selectedCardId: analysis.cards[0].cardId,
    feedback: "我喜欢这个方向，但别太像营销号",
    preserveElement: "保留当前点击钩子",
    workspaceResult: {
      workspace: analysis.actionWorkspace,
      suggestion: {
        summary: "先围绕现有图提炼主体和标题区",
        refinedTask: "优先保留人物表情，并弱化背景杂讯。",
        nextSuggestion: "先解决第一眼不聚焦的问题。",
        draftPromptLine: "保留人物表情，弱化背景杂讯，优先解决第一眼不聚焦。",
        recommendedFollowUp: "先做一轮裁切再进二轮反馈。",
      },
    },
  });

  assert.ok(promptPreview.firstRoundPrompt.includes("第一轮输出格式"));
  assert.ok(promptPreview.secondRoundPrompt.includes("第二轮输出格式"));
  assert.ok(promptPreview.secondRoundPrompt.includes("用户修改请求：别太像营销号"));
  assert.ok(promptPreview.secondRoundPrompt.includes("工作区上下文"));
});

test("createLlmDraft returns mock first-round draft", async () => {
  const result = await createLlmDraft({
    contentTopic: "大学生存钱的3个误区",
    contentGoal: "让用户点开后理解哪些常见做法其实在亏钱",
    userAssetType: "截图",
    platform: "抖音",
    referencePreference: "更抓眼一点",
    assetDescription: "当前是普通图文截图，想做出更强误区感",
    assetNotes: "目前是普通信息截图",
  });

  assert.equal(result.provider, "mock");
  assert.equal(result.mode, "first-round");
  assert.ok(result.llmDraft.summary.includes("模拟"));
  assert.equal(result.requestContext.provider, "mock");
});

test("createLlmDraft returns mock second-round draft", async () => {
  const analysis = createAnalysisSession({
    contentTopic: "英语口语一直学不会怎么办",
    contentGoal: "让用户理解口语卡住的原因",
    userAssetType: "人像",
    platform: "抖音",
    referencePreference: "更吸引人一点，但别太油",
    assetDescription: "当前是普通口播人像，想增加一点停留力",
    assetNotes: "可以接受一点悬念感",
  });

  const result = await createLlmDraft({
    analysis,
    selectedCardId: analysis.cards[0].cardId,
    feedback: "我喜欢这个方向，但别太像营销号",
    preserveElement: "保留当前点击钩子",
    workspaceResult: {
      workspace: analysis.actionWorkspace,
      suggestion: {
        summary: "先围绕现有图提炼主体和标题区",
        refinedTask: "优先保留人物表情，并弱化背景杂讯。",
        nextSuggestion: "先解决第一眼不聚焦的问题。",
        draftPromptLine: "保留人物表情，弱化背景杂讯，优先解决第一眼不聚焦。",
        recommendedFollowUp: "先做一轮裁切再进二轮反馈。",
      },
    },
  });

  assert.equal(result.provider, "mock");
  assert.equal(result.mode, "full");
  assert.ok(result.llmDraft.summary.includes("模拟"));
  assert.equal(result.requestContext.provider, "mock");
  assert.ok(result.promptPreview.secondRoundPrompt.includes("用户修改请求：别太像营销号"));
  assert.ok(result.refinement.adjustment.workspaceContext);
});

test("createLlmProvider supports openai provider skeleton", () => {
  const provider = createLlmProvider({
    provider: "openai",
    model: "gpt-test-model",
    temperature: 0.4,
    maxOutputTokens: 800,
  });

  assert.equal(provider.name, "openai");
  assert.equal(provider.model, "gpt-test-model");
});

test("normalize and validate first-round draft output", () => {
  const normalized = normalizeFirstRoundDraft({
    summary: "  首轮总结  ",
    highlights: "第一行\n第二行",
    draftCards: [
      {
        cardId: "A",
        label: "更有收获感",
        copy: "先让人看到收获",
        reason: "结果更明确",
      },
    ],
  });

  validateFirstRoundDraftOutput(normalized);
  assert.equal(normalized.summary, "首轮总结");
  assert.equal(normalized.highlights.length, 2);
});

test("normalize and validate second-round draft output", () => {
  const normalized = normalizeSecondRoundDraft({
    summary: "  二轮总结  ",
    highlights: ["保留主方向", "只改一个变量"],
    refinedDirection: " 第二轮优化方向 ",
    changeFocus: " 质感 ",
    refinedCopy: " 把语气收稳一点 ",
  });

  validateSecondRoundDraftOutput(normalized);
  assert.equal(normalized.refinedDirection, "第二轮优化方向");
  assert.equal(normalized.changeFocus, "质感");
});

test("listSampleCases returns structured sample fixtures", async () => {
  const items = await listSampleCases();

  assert.ok(items.length > 0);
  assert.equal(items[0].id, "sample-001");
});

test("validateCaseRecord normalizes a sample case", () => {
  const result = validateCaseRecord({
    id: " case-001 ",
    title: " 标题 ",
    platform: " 抖音 ",
    contentTopic: " 内容主题 ",
    contentGoal: " 点击目标 ",
    userAssetType: " 截图 ",
    assetDescription: " 当前只有普通截图，想补一张贴内容的辅助图 ",
    referencePreference: " 更抓眼 ",
    assetNotes: " 目前是普通封面 ",
    operations: {
      keyCaseRerunPriority: 5,
      maintenanceTags: ["sample", "priority"],
    },
    mockUserSelection: {
      selectedCardId: " B ",
      preserveElement: " 保留点击钩子 ",
      feedback: " 别太营销号 ",
    },
  }, "sample");

  assert.equal(result.id, "case-001");
  assert.equal(result.sourceType, "sample");
  assert.equal(result.mockUserSelection.selectedCardId, "B");
  assert.equal(result.operations.keyCaseRerunPriority, 5);
  assert.equal(result.operations.maintenanceTags.length, 2);
  assert.equal(result.assetDescription.includes("截图"), true);
});

test("validateCaseRecord rejects a real case without evidence", () => {
  assert.throws(
    () =>
      validateCaseRecord(
        {
          id: "real-001",
          title: "真实案例",
          platform: "抖音",
          tracking: {
            platformCaseId: "P-01",
            obsidianCasePath: "03/path/P-01_待补.md",
          },
          contentTopic: "主题",
          contentGoal: "目标",
          userAssetType: "截图",
          assetDescription: "当前只有普通截图，想补贴内容辅助图",
          referencePreference: "更抓眼",
          assetNotes: "当前素材说明",
          mockUserSelection: {
            selectedCardId: "A",
            preserveElement: "保留方向",
            feedback: "稍微更稳一点",
          },
        },
        "real",
      ),
    /Real case field "evidence" is required\./,
  );
});

test("buildRealCaseTemplate returns a usable scaffold", () => {
  const result = buildRealCaseTemplate({
    id: "real-101",
    title: "测试真实案例",
    platform: "小红书",
    platformCaseId: "P-01",
    obsidianCasePath: "03/path/P-01_待补.md",
    sourceLink: "https://example.com/post",
  });

  assert.equal(result.id, "real-101");
  assert.equal(result.sourceType, "real");
  assert.equal(result.platform, "小红书");
  assert.equal(result.tracking.platformCaseId, "P-01");
  assert.equal(result.operations.keyCaseRerunPriority, 1);
  assert.ok(result.assetDescription.includes("截图"));
  assert.equal(result.evidence.sourceLink, "https://example.com/post");
});

test("prepareRealCaseScaffold returns record and index entry with default obsidian path", () => {
  const result = prepareRealCaseScaffold({
    currentIndex: [
      {
        id: "real-001",
        platformCaseId: "P-01",
        file: "items/real-001.json",
        status: "draft",
      },
    ],
    id: "real-002",
    title: "待补真实案例 real-002",
    platformCaseId: "P-02",
    keyCaseRerunPriority: 6,
    maintenanceTags: ["real-case", "high-priority-candidate"],
  });

  assert.equal(result.fileName, "real-002.json");
  assert.equal(result.id, "real-002");
  assert.equal(result.indexEntry.id, "real-002");
  assert.equal(result.indexEntry.file, "items/real-002.json");
  assert.equal(result.indexEntry.status, "draft");
  assert.equal(
    result.record.tracking.obsidianCasePath,
    "03_方法论与规则库/案例库/平台原生案例/第一批案例/P-02_待补.md",
  );
  assert.equal(result.record.operations.keyCaseRerunPriority, 6);
  assert.deepEqual(result.record.operations.maintenanceTags, [
    "real-case",
    "high-priority-candidate",
  ]);
});

test("prepareRealCaseBatchScaffold creates multiple index-ready items", () => {
  const result = prepareRealCaseBatchScaffold({
    currentIndex: [],
    batchItems: [
      {
        id: "real-002",
        title: "待补真实案例 real-002",
        platformCaseId: "P-02",
        keyCaseRerunPriority: 5,
        maintenanceTags: ["real-case", "high-priority-candidate"],
      },
      {
        id: "real-003",
        title: "待补真实案例 real-003",
        platformCaseId: "P-03",
        status: "ready",
        keyCaseRerunPriority: 8,
        maintenanceTags: ["real-case", "misclassified-high-frequency"],
      },
    ],
  });

  assert.equal(result.created.length, 2);
  assert.equal(result.nextIndex.length, 2);
  assert.equal(result.created[0].fileName, "real-002.json");
  assert.equal(result.created[1].indexEntry.status, "ready");
  assert.equal(
    result.created[1].record.tracking.obsidianCasePath,
    "03_方法论与规则库/案例库/平台原生案例/第一批案例/P-03_待补.md",
  );
  assert.equal(result.created[1].record.operations.keyCaseRerunPriority, 8);
});

test("createRealCaseScaffoldPreview uses current index and returns preview payload", async () => {
  const result = await createRealCaseScaffoldPreview({
    id: "real-099",
    title: "待补真实案例 real-099",
    platformCaseId: "P-99",
    keyCaseRerunPriority: 7,
    maintenanceTags: ["real-case", "high-priority-candidate"],
  });

  assert.equal(result.id, "real-099");
  assert.equal(result.indexEntry.file, "items/real-099.json");
  assert.equal(
    result.record.tracking.obsidianCasePath,
    "03_方法论与规则库/案例库/平台原生案例/第一批案例/P-99_待补.md",
  );
});

test("createRealCaseBatchScaffoldPreview returns preview-ready batch payload", async () => {
  const result = await createRealCaseBatchScaffoldPreview({
    batchItems: [
      {
        id: "real-098",
        title: "待补真实案例 real-098",
        platformCaseId: "P-98",
      },
    ],
  });

  assert.equal(result.created.length, 1);
  assert.equal(result.created[0].id, "real-098");
  assert.equal(result.nextIndex.length >= 2, true);
  assert.equal(result.validationSummary.summary.totalRealCases, 1);
  assert.equal(result.validationSummary.rows[0].missingCount > 0, true);
});

test("buildRealCaseBatchValidationSummary aggregates missing fields across preview batch", () => {
  const preparedBatch = prepareRealCaseBatchScaffold({
    currentIndex: [],
    batchItems: [
      {
        id: "real-201",
        title: "待补真实案例 real-201",
        platformCaseId: "P-201",
      },
      {
        id: "real-202",
        title: "待补真实案例 real-202",
        platformCaseId: "P-202",
        screenshotPath: "assets/screenshots/real-202.png",
      },
    ],
  });

  const result = buildRealCaseBatchValidationSummary(preparedBatch);

  assert.equal(result.summary.totalRealCases, 2);
  assert.equal(result.summary.pendingCount >= 1, true);
  assert.equal(result.summary.totalMissingFields > 0, true);
  assert.equal(result.missingFieldStats[0].count >= 1, true);
  assert.equal(result.rows[0].missingCount >= result.rows[1].missingCount, true);
  assert.equal(result.recommendedBatchActions.length > 0, true);
  assert.equal(result.recommendedBatchActions[0].affectedCaseCount >= 1, true);
  assert.equal(Boolean(result.rows[0].nextTask?.label), true);
});

test("commitRealCaseScaffold writes index and item through injected storage", async () => {
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-real-case-"));
  const indexPath = join(tempRoot, "index.json");
  const itemsDir = join(tempRoot, "items");
  await writeFile(
    indexPath,
    JSON.stringify(
      [
        {
          id: "real-001",
          platformCaseId: "P-01",
          file: "items/real-001.json",
          status: "draft",
        },
      ],
      null,
      2,
    ),
    "utf-8",
  );

  let resetCalled = false;
  const result = await commitRealCaseScaffold(
    {
      id: "real-002",
      title: "待补真实案例 real-002",
      platformCaseId: "P-02",
      keyCaseRerunPriority: 6,
      maintenanceTags: ["real-case", "high-priority-candidate"],
    },
    {
      loadIndex: async () => JSON.parse(await readFile(indexPath, "utf-8")),
      savePrepared: async ({ currentIndex, prepared }) => {
        const { savePreparedRealCaseScaffold } = await import(
          "../src/infrastructure/cases/savePreparedRealCaseScaffold.js"
        );
        return savePreparedRealCaseScaffold({
          currentIndex,
          prepared,
          storagePaths: {
            realCasesIndexPath: indexPath,
            realCasesItemsDir: itemsDir,
          },
        });
      },
      onCommitted: () => {
        resetCalled = true;
      },
    },
  );

  const nextIndex = JSON.parse(await readFile(indexPath, "utf-8"));
  const itemRecord = JSON.parse(
    await readFile(join(itemsDir, "real-002.json"), "utf-8"),
  );

  assert.equal(result.ok, true);
  assert.equal(result.indexEntry.id, "real-002");
  assert.equal(nextIndex.length, 2);
  assert.equal(itemRecord.id, "real-002");
  assert.equal(itemRecord.operations.keyCaseRerunPriority, 6);
  assert.equal(resetCalled, true);
});

test("commitRealCaseBatchScaffold writes multiple real cases through injected storage", async () => {
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-real-case-batch-"));
  const indexPath = join(tempRoot, "index.json");
  const itemsDir = join(tempRoot, "items");
  await writeFile(indexPath, `${JSON.stringify([], null, 2)}\n`, "utf-8");

  let resetCalled = false;
  const result = await commitRealCaseBatchScaffold(
    {
      batchItems: [
        {
          id: "real-002",
          title: "待补真实案例 real-002",
          platformCaseId: "P-02",
          keyCaseRerunPriority: 5,
          maintenanceTags: ["real-case", "high-priority-candidate"],
        },
        {
          id: "real-003",
          title: "待补真实案例 real-003",
          platformCaseId: "P-03",
          status: "ready",
          keyCaseRerunPriority: 8,
          maintenanceTags: ["real-case", "misclassified-high-frequency"],
        },
      ],
    },
    {
      loadIndex: async () => JSON.parse(await readFile(indexPath, "utf-8")),
      savePrepared: async ({ currentIndex, preparedBatch }) => {
        const { savePreparedRealCaseBatchScaffold } = await import(
          "../src/infrastructure/cases/savePreparedRealCaseBatchScaffold.js"
        );
        return savePreparedRealCaseBatchScaffold({
          currentIndex,
          preparedBatch,
          storagePaths: {
            realCasesIndexPath: indexPath,
            realCasesItemsDir: itemsDir,
          },
        });
      },
      onCommitted: () => {
        resetCalled = true;
      },
    },
  );

  const nextIndex = JSON.parse(await readFile(indexPath, "utf-8"));
  const itemRecord = JSON.parse(
    await readFile(join(itemsDir, "real-003.json"), "utf-8"),
  );

  assert.equal(result.ok, true);
  assert.equal(result.createdCount, 2);
  assert.equal(result.itemPaths.length, 2);
  assert.equal(result.validationSummary.summary.totalRealCases, 2);
  assert.equal(nextIndex.length, 2);
  assert.equal(itemRecord.id, "real-003");
  assert.equal(itemRecord.operations.keyCaseRerunPriority, 8);
  assert.equal(resetCalled, true);
});

test("buildRealCaseBatchFillWorksheetMarkdown renders batch-level actions and per-case next steps", () => {
  const preparedBatch = prepareRealCaseBatchScaffold({
    currentIndex: [],
    batchItems: [
      {
        id: "real-301",
        title: "待补真实案例 real-301",
        platformCaseId: "P-301",
      },
      {
        id: "real-302",
        title: "待补真实案例 real-302",
        platformCaseId: "P-302",
      },
    ],
  });
  const validationSummary = buildRealCaseBatchValidationSummary(preparedBatch);
  const markdown = buildRealCaseBatchFillWorksheetMarkdown({
    batchLabel: "real-301_to_real-302",
    validationSummary,
  });

  assert.ok(markdown.includes("# 批量真实案例回填工作单｜real-301_to_real-302"));
  assert.ok(markdown.includes("## 建议先补的批量动作"));
  assert.ok(markdown.includes("## 逐条案例下一步"));
});

test("buildObsidianRealCaseBatchFillWorksheetRecord wraps batch worksheet into editable draft", () => {
  const markdown = buildObsidianRealCaseBatchFillWorksheetRecord({
    generatedDate: "2026-06-26",
    sourceMarkdownPath: "/tmp/batch-fill-sheet.md",
    worksheetMarkdown: "# 批量真实案例回填工作单｜demo",
  });

  assert.ok(markdown.includes("# 批量真实案例回填工作单_2026-06-26"));
  assert.ok(markdown.includes("## 1. 代码侧批量工作单底稿"));
});

test("createRealCaseBatchFillObsidianPreview returns target metadata for batch worksheet", () => {
  const result = createRealCaseBatchFillObsidianPreview({
    batchLabel: "real-401_to_real-402",
    worksheetMarkdown: "# worksheet",
    obsidianRoot: "/tmp/obsidian-root",
  });

  assert.ok(result.targetPath.includes("real-401_to_real-402_批量回填工作单_"));
  assert.ok(result.markdown.includes("# 批量真实案例回填工作单_"));
});

test("runRealCaseBatchFillPreview returns worksheet markdown and obsidian draft", async () => {
  const result = await runRealCaseBatchFillPreview({
    batchItems: [
      {
        id: "real-501",
        title: "待补真实案例 real-501",
        platformCaseId: "P-501",
      },
    ],
  });

  assert.equal(result.createdCount, 1);
  assert.ok(result.validationSummary.recommendedBatchActions.length > 0);
  assert.ok(result.worksheetMarkdown.includes("## 建议先补的批量动作"));
  assert.ok(result.obsidianDraft.targetPath.includes("批量回填工作单"));
});

test("exportRealCaseBatchFillWorksheetToObsidian writes editable batch draft", async () => {
  const tempObsidianRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-batch-fill-obsidian-"));
  const result = await exportRealCaseBatchFillWorksheetToObsidian({
    batchItems: [
      {
        id: "real-601",
        title: "待补真实案例 real-601",
        platformCaseId: "P-601",
      },
    ],
    batchLabel: "real-601",
    obsidianRoot: tempObsidianRoot,
  });

  const exported = await readFile(result.targetPath, "utf-8");

  assert.equal(result.ok, true);
  assert.equal(result.readback.ok, true);
  assert.ok(exported.includes("# 批量真实案例回填工作单_"));
});

test("loadRealCaseBatchFillWorksheetHistory returns latest export status and recent rows", async () => {
  const tempObsidianRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-batch-fill-history-"));
  await exportRealCaseBatchFillWorksheetToObsidian({
    batchItems: [
      {
        id: "real-701",
        title: "待补真实案例 real-701",
        platformCaseId: "P-701",
      },
      {
        id: "real-702",
        title: "待补真实案例 real-702",
        platformCaseId: "P-702",
      },
    ],
    batchLabel: "real-701_to_real-702",
    obsidianRoot: tempObsidianRoot,
  });

  const result = await loadRealCaseBatchFillWorksheetHistory({
    batchItems: [
      {
        id: "real-701",
        title: "待补真实案例 real-701",
        platformCaseId: "P-701",
      },
      {
        id: "real-702",
        title: "待补真实案例 real-702",
        platformCaseId: "P-702",
      },
    ],
    batchLabel: "real-701_to_real-702",
  });

  assert.equal(result.normalizedLabel, "real-701_to_real-702");
  assert.equal(result.createdCount, 2);
  assert.equal(Boolean(result.latestExportStatus?.exportId), true);
  assert.equal(result.history.rows.length >= 1, true);
  assert.equal(result.history.rows[0].readbackOk, true);
});

test("buildRealCaseBatchRunRecordMarkdown renders batch run observations scaffold", async () => {
  const fillPreview = await runRealCaseBatchFillPreview({
    batchItems: [
      {
        id: "real-801",
        title: "待补真实案例 real-801",
        platformCaseId: "P-801",
      },
    ],
    batchLabel: "real-801",
  });
  const history = await loadRealCaseBatchFillWorksheetHistory({
    batchItems: [
      {
        id: "real-801",
        title: "待补真实案例 real-801",
        platformCaseId: "P-801",
      },
    ],
    batchLabel: "real-801",
  });
  const manualReviewGuide = buildBatchRunManualReviewGuide({
    frictionTemplate: buildBatchRunFrictionTemplate({
      validationSummary: fillPreview.validationSummary,
      latestWorksheetHistory: history,
    }),
    validationSummary: fillPreview.validationSummary,
    latestWorksheetHistory: history,
  });
  const markdown = buildRealCaseBatchRunRecordMarkdown({
    batchLabel: fillPreview.batchLabel,
    created: fillPreview.created,
    validationSummary: fillPreview.validationSummary,
    latestWorksheetHistory: history,
    frictionTemplate: buildBatchRunFrictionTemplate({
      validationSummary: fillPreview.validationSummary,
      latestWorksheetHistory: history,
    }),
    manualReviewGuide,
  });

  assert.ok(markdown.includes("# 批次试跑记录｜real-801"));
  assert.ok(markdown.includes("## 5. 结构化摩擦点记录"));
  assert.ok(markdown.includes("- 建议先填：最卡环节 / 问题类型 / 前置模块 / UI 时机"));
  assert.ok(markdown.includes("- 最近还没有这批试跑记录的人工结论导出状态。"));
  assert.ok(markdown.includes("### 输入准备与案例结构"));
  assert.ok(markdown.includes("## 8. 下一步动作"));
});

test("buildBatchRunManualReviewGuide returns ordered key review fields", () => {
  const result = buildBatchRunManualReviewGuide({
    frictionTemplate: [
      {
        id: "input-structure",
        priorityReason: "输入字段很多",
      },
      {
        id: "ui-decision-readiness",
        priorityReason: "先别急着做 UI",
      },
    ],
    validationSummary: {
      summary: {
        totalMissingFields: 12,
      },
    },
    latestWorksheetHistory: {
      latestExportStatus: null,
    },
  });

  assert.equal(result.fillOrder.length, 4);
  assert.equal(result.fillOrder[0].key, "bottleneckStep");
  assert.equal(result.fillOrder[3].key, "uiOptimizationTiming");
  assert.ok(result.supportingSignals[0].includes("输入准备"));
  assert.ok(result.completionRule.includes("最低建议先填完"));
});

test("buildBatchRunFrictionTemplate prioritizes structured friction categories", () => {
  const result = buildBatchRunFrictionTemplate({
    validationSummary: {
      summary: {
        pendingCount: 2,
        partialCount: 1,
        readyCount: 0,
        totalMissingFields: 12,
        avgMissingFields: 4,
      },
      recommendedBatchActions: [
        {
          label: "先补内容主题和目标",
          priorityReason: "这会影响后续所有判断。",
        },
      ],
      rows: [
        { caseId: "real-1", missingCount: 4 },
        { caseId: "real-2", missingCount: 3 },
        { caseId: "real-3", missingCount: 1 },
      ],
    },
    latestWorksheetHistory: {
      latestExportStatus: {
        actionLabel: "overwrite",
        exportedAt: "2026-06-27T12:00:00.000Z",
        readbackOk: false,
      },
    },
  });

  assert.equal(result.length >= 5, true);
  assert.equal(result[0].label, "输入准备与案例结构");
  assert.ok(result.some((item) => item.label === "是否进入 UI 优化讨论"));
  assert.ok(result[0].signals.some((item) => item.includes("缺失字段总数")));
});

test("buildObsidianRealCaseBatchRunRecord wraps batch run record into editable draft", () => {
  const markdown = buildObsidianRealCaseBatchRunRecord({
    generatedDate: "2026-06-27",
    sourceMarkdownPath: "/tmp/run-record.md",
    runRecordMarkdown: "# 批次试跑记录｜demo",
  });

  assert.ok(markdown.includes("# 批次试跑记录_2026-06-27"));
  assert.ok(markdown.includes("## 1. 代码侧试跑底稿"));
});

test("createRealCaseBatchRunRecordObsidianPreview returns target metadata for batch run record", () => {
  const result = createRealCaseBatchRunRecordObsidianPreview({
    batchLabel: "real-901_to_real-902",
    runRecordMarkdown: "# run record",
    obsidianRoot: "/tmp/obsidian-root",
  });

  assert.ok(result.targetPath.includes("real-901_to_real-902_批次试跑记录_"));
  assert.ok(result.markdown.includes("# 批次试跑记录_"));
});

test("runRealCaseBatchRunRecordPreview returns run record markdown and obsidian draft", async () => {
  const result = await runRealCaseBatchRunRecordPreview({
    batchItems: [
      {
        id: "real-903",
        title: "待补真实案例 real-903",
        platformCaseId: "P-903",
      },
    ],
    batchLabel: "real-903",
  });

  assert.equal(result.createdCount, 1);
  assert.ok(Array.isArray(result.frictionTemplate));
  assert.ok(result.frictionTemplate.length >= 5);
  assert.equal(Array.isArray(result.manualReviewGuide.fillOrder), true);
  assert.equal(result.manualReviewGuide.fillOrder.length, 4);
  assert.equal(result.latestManualReviewStatus, null);
  assert.ok(result.runRecordMarkdown.includes("## 8. 下一步动作"));
  assert.ok(result.obsidianDraft.targetPath.includes("批次试跑记录"));
});

test("loadLatestRealCaseBatchRunManualReviewStatus parses latest exported review note", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-batch-run-manual-review-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-a"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "batch-a",
      "RBR-test-a.json",
    ),
    `${JSON.stringify(
      {
        exportId: "RBR-test-a",
        exportedAt: "2026-06-27T12:00:00.000Z",
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        targetPath: join(tempRoot, "obsidian", "batch-a.md"),
        overwrite: {
          actionLabel: "覆盖现有草稿",
          requestedMode: "overwrite",
        },
        readback: {
          ok: true,
          matchedExpectedContent: true,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "obsidian", "batch-a.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "- 这批案例最卡的环节：输入太重",
      "- 当前更像功能问题，还是界面问题：更像功能问题",
      "- UI 优化是否已经到时机：先别急着做 UI",
      "",
    ].join("\n"),
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await loadLatestRealCaseBatchRunManualReviewStatus("batch-a");

  assert.equal(result.exportId, "RBR-test-a");
  assert.equal(result.hasManualConclusion, true);
  assert.equal(result.filledFieldCount, 3);
  assert.equal(result.missingKeyFields[0].label, "最该前置模块");
});

test("runRealCaseBatchRunRecordPreview loads latest manual review status when available", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-batch-run-preview-manual-status-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "real-903",
    ),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "real-903",
      "RBR-test-real-903.json",
    ),
    `${JSON.stringify(
      {
        exportId: "RBR-test-real-903",
        exportedAt: "2026-06-27T13:00:00.000Z",
        batchLabel: "real-903",
        normalizedLabel: "real-903",
        targetPath: join(tempRoot, "obsidian", "real-903.md"),
        overwrite: {
          actionLabel: "覆盖现有草稿",
          requestedMode: "overwrite",
        },
        readback: {
          ok: true,
          matchedExpectedContent: true,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "obsidian", "real-903.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "- 这批案例最卡的环节：看完结果不知道先选哪条",
      "- 当前更像功能问题，还是界面问题：更像界面问题",
      "",
    ].join("\n"),
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await runRealCaseBatchRunRecordPreview({
    batchItems: [
      {
        id: "real-903",
        title: "待补真实案例 real-903",
        platformCaseId: "P-903",
      },
    ],
    batchLabel: "real-903",
  });

  assert.equal(result.latestManualReviewStatus.exportId, "RBR-test-real-903");
  assert.equal(result.latestManualReviewStatus.hasManualConclusion, true);
  assert.ok(result.runRecordMarkdown.includes("最近一次人工结论覆盖：已填写 2 项"));
});

test("exportRealCaseBatchRunRecordToObsidian writes editable batch run record draft", async () => {
  const tempObsidianRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-batch-run-record-"));
  const result = await exportRealCaseBatchRunRecordToObsidian({
    batchItems: [
      {
        id: "real-904",
        title: "待补真实案例 real-904",
        platformCaseId: "P-904",
      },
    ],
    batchLabel: "real-904",
    obsidianRoot: tempObsidianRoot,
  });

  const exported = await readFile(result.targetPath, "utf-8");

  assert.equal(result.ok, true);
  assert.equal(result.readback.ok, true);
  assert.ok(exported.includes("# 批次试跑记录_"));
});

test("buildBatchRunFrictionSummaryReport aggregates repeated categories across batches", () => {
  const result = buildBatchRunFrictionSummaryReport({
    batchRunRecords: [
      {
        batchLabel: "batch-a",
        createdCount: 2,
        manualReview: {
          hasManualConclusion: true,
          review: {
            bottleneckStep: "输入太重",
            issueType: "更像功能问题",
            uiOptimizationTiming: "先别急着做 UI",
            prioritizedModule: "输入准备区",
          },
        },
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 95,
            whyItMatters: "input",
            priorityReason: "缺失字段很多",
          },
          {
            id: "guidance-and-prioritization",
            label: "补写建议与优先顺序",
            priorityScore: 90,
            whyItMatters: "guidance",
            priorityReason: "建议是否真有用",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: { readbackOk: true },
        },
      },
      {
        batchLabel: "batch-b",
        createdCount: 3,
        manualReview: {
          hasManualConclusion: true,
          review: {
            bottleneckStep: "看完结果不知道先做哪条",
            issueType: "更像界面问题",
            uiOptimizationTiming: "接近可以讨论 UI",
            prioritizedModule: "",
          },
        },
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 92,
            whyItMatters: "input",
            priorityReason: "输入还是太重",
          },
          {
            id: "result-reading",
            label: "结果阅读与选择判断",
            priorityScore: 80,
            whyItMatters: "result",
            priorityReason: "结果层级不清",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: null,
        },
      },
    ],
  });

  assert.equal(result.summary.totalBatches, 2);
  assert.equal(result.summary.totalCases, 5);
  assert.equal(result.summary.reviewedBatchCount, 2);
  assert.equal(result.summary.missingManualReviewCount, 0);
  assert.equal(result.summary.fullyCoveredBatchCount, 1);
  assert.equal(result.summary.partiallyCoveredBatchCount, 1);
  assert.equal(result.topCategories[0].label, "输入准备与案例结构");
  assert.equal(result.topCategories[0].batchCount, 2);
  assert.equal(result.topRecommendedActions[0].label, "内容主题");
  assert.equal(result.uiDiscussionSignal.status, "emerging-signal");
  assert.equal(result.manualReview.latestManualConclusions.length, 2);
  assert.equal(result.manualReview.keyFieldCoverage.bottleneckStep.count, 2);
  assert.equal(result.manualReview.pendingBatchRows.length, 1);
  assert.equal(result.manualReview.pendingBatchRows[0].batchLabel, "batch-b");
  assert.equal(result.manualReview.pendingBatchRows[0].missingKeyFields[0].label, "最该前置模块");
});

test("buildBatchRunFrictionSummaryMarkdown renders repeated category summary", () => {
  const markdown = buildBatchRunFrictionSummaryMarkdown({
    summary: {
      totalBatches: 2,
      totalCases: 5,
      repeatedCategories: 1,
      worksheetMissingCount: 1,
      reviewedBatchCount: 1,
      missingManualReviewCount: 1,
      fullyCoveredBatchCount: 1,
      partiallyCoveredBatchCount: 0,
    },
    uiDiscussionSignal: {
      status: "emerging-signal",
      label: "接近可以讨论 UI 优化",
      reason: "已经开始出现跨批次重复摩擦点，但证据还不算非常稳。",
    },
    topCategories: [
      {
        label: "输入准备与案例结构",
        batchCount: 2,
        averagePriorityScore: 93.5,
        whyItMatters: "input",
        latestPriorityReason: "输入还是太重",
      },
    ],
    topRecommendedActions: [
      {
        label: "内容主题",
        count: 2,
        maxPriorityScore: 95,
        latestPriorityReason: "主题不明确",
      },
    ],
    batchRows: [
      {
        batchLabel: "batch-a",
        createdCount: 2,
        topCategoryLabels: ["输入准备与案例结构"],
        topActionLabels: ["内容主题"],
        hasWorksheetExport: true,
        worksheetReadbackOk: true,
      },
    ],
    manualReview: {
      reviewedBatchCount: 1,
      keyFieldCoverage: {
        bottleneckStep: { key: "bottleneckStep", label: "最卡环节", count: 1 },
      },
      pendingBatchRows: [
        {
          batchLabel: "batch-b",
          hasManualConclusion: false,
          missingKeyFields: [{ key: "bottleneckStep", label: "最卡环节" }],
        },
      ],
      latestManualConclusions: [
        {
          batchLabel: "batch-a",
          bottleneckStep: "输入太重",
          issueType: "更像功能问题",
          uiOptimizationTiming: "先别急着做 UI",
        },
      ],
    },
  });

  assert.ok(markdown.includes("# 跨批次摩擦点汇总"));
  assert.ok(markdown.includes("输入准备与案例结构：出现在 2 批"));
  assert.ok(markdown.includes("内容主题：出现 2 次"));
  assert.ok(markdown.includes("已填写人工结论批次数：1"));
  assert.ok(markdown.includes("完全未写人工结论的批次数：1"));
  assert.ok(markdown.includes("关键人工字段已完整覆盖批次数：1"));
  assert.ok(markdown.includes("## 7. 人工补充优先级"));
  assert.ok(markdown.includes("batch-b：整批还没写人工结论"));
});

test("parseBatchRunRecordReviewNote extracts manual review fields", () => {
  const result = parseBatchRunRecordReviewNote(`
- 这批案例最卡的环节：输入太重
- 哪些字段最难补：内容主题 / 素材描述
- 哪个输出最有价值：批量工作单
- 和通用 AI 相比更有帮助的点：优先顺序更清楚
- 和通用 AI 相比仍然不够好的点：结果区还不够聚焦
- 哪个按钮或模块最该前置：结果区
- 哪段说明文字太多：工作区说明
- 哪个步骤最值得做成更强引导：导出后下一步
- 当前更像功能问题，还是界面问题：更像界面问题
- 这批试跑最关键的结论：先别急着改视觉
- 下一批还要不要继续同样赛道：要
- UI 优化是否已经到时机：接近可以讨论 UI
`);

  assert.equal(result.hasManualConclusion, true);
  assert.equal(result.review.bottleneckStep, "输入太重");
  assert.equal(result.review.issueType, "更像界面问题");
  assert.equal(result.review.uiOptimizationTiming, "接近可以讨论 UI");
  assert.ok(result.filledFields.includes("prioritizedModule"));
});

test("buildObsidianBatchRunFrictionSummaryRecord wraps summary into editable draft", () => {
  const markdown = buildObsidianBatchRunFrictionSummaryRecord({
    generatedDate: "2026-06-27",
    sourceMarkdownPath: "/tmp/batch-run-friction-summary.md",
    summaryMarkdown: "# 跨批次摩擦点汇总\n\n- line",
  });

  assert.ok(markdown.includes("# 跨批次摩擦点汇总_2026-06-27"));
  assert.ok(markdown.includes("## 1. 代码侧汇总底稿"));
  assert.ok(markdown.includes("## 2. 人工补充"));
});

test("createBatchRunFrictionSummaryObsidianPreview returns target metadata", () => {
  const result = createBatchRunFrictionSummaryObsidianPreview({
    summaryMarkdown: "# 跨批次摩擦点汇总\n\n- line",
    obsidianRoot: "/tmp/obsidian-root",
  });

  assert.ok(result.targetPath.includes("跨批次摩擦点汇总_"));
  assert.ok(result.targetPath.includes("05_验证与实验/批次试跑记录/跨批次摩擦点汇总"));
  assert.ok(result.markdown.includes("## 2. 人工补充"));
});

test("runBatchRunFrictionSummaryPreview loads exported batch run records", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-batch-run-friction-preview-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-a"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-b"), { recursive: true });
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-b"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-a", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        createdCount: 2,
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 95,
            whyItMatters: "input",
            priorityReason: "缺失字段很多",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: { readbackOk: true },
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-b", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        createdCount: 1,
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 90,
            whyItMatters: "input",
            priorityReason: "输入还是太重",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: null,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "batch-a",
      "RBR-test-a.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        targetPath: join(tempRoot, "obsidian", "batch-a.md"),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "obsidian", "batch-a.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "- 这批案例最卡的环节：输入太重",
      "- 当前更像功能问题，还是界面问题：更像功能问题",
      "- UI 优化是否已经到时机：先别急着做 UI",
      "",
    ].join("\n"),
    "utf-8",
  );

  process.chdir(tempRoot);
  const obsidianRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-batch-run-friction-obsidian-"));
  const result = await runBatchRunFrictionSummaryPreview({ obsidianRoot });

  assert.equal(result.report.summary.totalBatches, 2);
  assert.equal(result.report.summary.reviewedBatchCount, 1);
  assert.equal(result.report.summary.missingManualReviewCount, 1);
  assert.ok(result.summaryMarkdown.includes("## 3. 最常重复的摩擦点类别"));
  assert.ok(result.summaryMarkdown.includes("## 6. 人工试跑结论回看"));
  assert.ok(result.summaryMarkdown.includes("## 7. 人工补充优先级"));
  assert.ok(result.obsidianDraft.targetPath.startsWith(obsidianRoot));
});

test("exportBatchRunFrictionSummaryToObsidian writes editable summary draft", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-batch-run-friction-export-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-a"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-b"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-c"), { recursive: true });

  const record = (batchLabel, priorityReason) => ({
    batchLabel,
    createdCount: 2,
    frictionTemplate: [
      {
        id: "input-structure",
        label: "输入准备与案例结构",
        priorityScore: 95,
        whyItMatters: "input",
        priorityReason,
      },
      {
        id: "guidance-and-prioritization",
        label: "补写建议与优先顺序",
        priorityScore: 90,
        whyItMatters: "guidance",
        priorityReason: "建议是否真有用",
      },
    ],
    validationSummary: {
      recommendedBatchActions: [
        { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
      ],
    },
    latestWorksheetHistory: {
      latestExportStatus: { readbackOk: true },
    },
  });

  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-a", "run-record.json"),
    `${JSON.stringify(record("batch-a", "缺失字段很多"), null, 2)}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-b", "run-record.json"),
    `${JSON.stringify(record("batch-b", "输入还是太重"), null, 2)}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-c", "run-record.json"),
    `${JSON.stringify(record("batch-c", "输入字段仍然散"), null, 2)}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const obsidianRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-batch-run-friction-export-obsidian-"));
  const result = await exportBatchRunFrictionSummaryToObsidian({ obsidianRoot });
  const exported = await readFile(result.targetPath, "utf-8");

  assert.equal(result.ok, true);
  assert.equal(result.readback.ok, true);
  assert.equal(result.report.uiDiscussionSignal.status, "strong-signal");
  assert.ok(exported.includes("# 跨批次摩擦点汇总_"));
});

test("buildUiOptimizationReadinessReport summarizes evidence thresholds", () => {
  const result = buildUiOptimizationReadinessReport({
    batchFillWorksheetStatuses: [
      { batchLabel: "batch-a", readbackOk: true, exportedAt: "2026-06-27T10:00:00.000Z" },
      { batchLabel: "batch-b", readbackOk: true, exportedAt: "2026-06-27T11:00:00.000Z" },
    ],
    batchRunRecordStatuses: [
      { batchLabel: "batch-a", readbackOk: true, exportedAt: "2026-06-27T12:00:00.000Z" },
      { batchLabel: "batch-b", readbackOk: false, exportedAt: "2026-06-27T13:00:00.000Z" },
    ],
    crossBatchFrictionSummary: {
      summary: {
        totalBatches: 3,
        repeatedCategories: 2,
        reviewedBatchCount: 2,
        missingManualReviewCount: 1,
        fullyCoveredBatchCount: 1,
        partiallyCoveredBatchCount: 1,
      },
      uiDiscussionSignal: {
        status: "strong-signal",
        label: "可以开始系统讨论 UI 优化",
        reason: "重复信号已经稳定。",
      },
      topCategories: [{ label: "结果阅读与选择判断" }],
    },
  });

  assert.equal(result.readinessLevel, "ready");
  assert.equal(result.summary.batchFillWorksheetBatchCount, 2);
  assert.equal(result.summary.batchRunReadbackConfirmedCount, 1);
  assert.equal(result.summary.manualReviewFullyCoveredBatchCount, 1);
  assert.equal(result.crossBatchSignal.status, "strong-signal");
  assert.equal(result.passedChecks.filter((item) => item.passed).length, 6);
});

test("buildUiOptimizationReadinessMarkdown renders current decision and evidence", () => {
  const markdown = buildUiOptimizationReadinessMarkdown({
    readinessLabel: "接近可以进入 UI 讨论",
    readinessLevel: "near-ready",
    summary: {
      batchFillWorksheetBatchCount: 2,
      batchFillReadbackConfirmedCount: 1,
      batchRunRecordBatchCount: 1,
      batchRunReadbackConfirmedCount: 0,
      manualReviewReviewedBatchCount: 1,
      manualReviewFullyCoveredBatchCount: 0,
      manualReviewPartiallyCoveredBatchCount: 1,
    },
    crossBatchSignal: {
      status: "emerging-signal",
      label: "接近可以讨论 UI 优化",
      reason: "已经开始出现跨批次重复摩擦点，但证据还不算非常稳。",
      repeatedCategories: 1,
      totalBatches: 2,
      topRepeatedCategoryLabel: "输入准备与案例结构",
    },
    passedChecks: [
      { label: "至少 2 批批量工作单导出", passed: true },
      { label: "至少 2 批真实批次试跑记录", passed: false },
    ],
    risks: ["真实批次试跑记录数量还不够，UI 讨论容易脱离真实使用。"],
    nextActions: ["至少再补 1 批真实案例试跑记录。"],
    evidence: {
      batchFillWorksheetStatuses: [
        { batchLabel: "batch-a", readbackOk: true, exportedAt: "2026-06-27T10:00:00.000Z" },
      ],
      batchRunRecordStatuses: [],
    },
  });

  assert.ok(markdown.includes("# UI优化进入条件报告"));
  assert.ok(markdown.includes("当前状态：接近可以进入 UI 讨论"));
  assert.ok(markdown.includes("跨批次信号：接近可以讨论 UI 优化"));
  assert.ok(markdown.includes("人工关键字段完整覆盖批次数：0"));
  assert.ok(markdown.includes("工作单 / batch-a：读回已确认"));
});

test("buildBatchReviewDashboardReport prioritizes pending review batches", () => {
  const result = buildBatchReviewDashboardReport({
    crossBatchReport: {
      summary: {
        totalBatches: 3,
        reviewedBatchCount: 2,
        fullyCoveredBatchCount: 1,
        partiallyCoveredBatchCount: 1,
        missingManualReviewCount: 1,
        repeatedCategories: 2,
      },
      uiDiscussionSignal: {
        status: "emerging-signal",
        label: "接近可以讨论 UI 优化",
        reason: "重复信号开始出现。",
      },
      manualReview: {
        pendingBatchRows: [
          {
            batchLabel: "batch-b",
            hasManualConclusion: true,
            missingKeyFields: [{ label: "最该前置模块" }],
          },
          {
            batchLabel: "batch-c",
            hasManualConclusion: false,
            missingKeyFields: [{ label: "最卡环节" }],
          },
        ],
      },
      batchRows: [
        { batchLabel: "batch-b", createdCount: 2, topCategoryLabels: ["结果阅读与选择判断"] },
        { batchLabel: "batch-c", createdCount: 1, topCategoryLabels: ["输入准备与案例结构"] },
      ],
    },
    uiReadinessReport: {
      readinessLevel: "near-ready",
      readinessLabel: "接近可以进入 UI 讨论",
    },
    ruleRevisionReport: {
      summary: {
        sourceSampleCount: 1,
        taskCount: 1,
        p1Count: 0,
        p2Count: 0,
        p3Count: 1,
      },
      tasks: [
        {
          taskId: "REV-001",
          taskTitle: "补强 neg-content-distance 相关关键词：不贴内容",
          priority: "P3",
          caseIds: ["sample-001"],
          suggestedMappingId: "neg-content-distance",
        },
      ],
    },
  });

  assert.equal(result.coverageTrend.status, "emerging");
  assert.equal(result.priorityRows.length, 2);
  assert.equal(result.priorityRows[0].batchLabel, "batch-b");
  assert.ok(result.nextActions[0].includes("batch-b"));
  assert.equal(result.followUpChecklist.title, "复盘后操作清单");
  assert.ok(result.followUpChecklist.phases.length >= 3);
  assert.ok(result.followUpChecklist.phases[1].items[0].label.includes("batch-b"));
  assert.equal(
    result.followUpChecklist.phases[1].items[0].actionId,
    "preview-real-case-batch-run-record",
  );
  assert.equal(result.manualReviewTaskCard.targetBatchLabel, "batch-b");
  assert.equal(result.manualReviewTaskCard.fieldTasks[0].label, "最该前置模块");
  assert.equal(result.uiRecheckPlan.status, "awaiting-manual-fill");
  assert.ok(result.uiRecheckPlan.steps[0].label.includes("batch-b"));
  assert.equal(result.ruleRevisionSignal.taskCount, 1);
  assert.equal(result.keyCaseRerunHandoff.status, "ready-to-plan");
  assert.deepEqual(result.keyCaseRerunHandoff.candidateCaseIds, ["sample-001"]);
  assert.ok(
    result.keyCaseRerunHandoff.commandSequence.includes(
      "npm run export:obsidian-key-case-rerun-plan",
    ),
  );
  assert.ok(result.keyCaseRerunHandoff.commandSequence.includes("npm run rerun:key-cases"));
});

test("buildBatchReviewDashboardReport reads latest key case rerun status", () => {
  const result = buildBatchReviewDashboardReport({
    ruleRevisionReport: {
      summary: {
        sourceSampleCount: 1,
        taskCount: 1,
        p1Count: 0,
        p2Count: 0,
        p3Count: 1,
      },
      tasks: [
        {
          taskId: "REV-001",
          taskTitle: "补强 neg-content-distance 相关关键词：不贴内容",
          priority: "P3",
          caseIds: ["sample-001"],
          suggestedMappingId: "neg-content-distance",
        },
      ],
    },
    keyCaseRerunReport: {
      meta: {
        planId: "key-case-rerun-default",
        generatedAt: "2026-07-23 11:19:28",
        caseIds: ["sample-001", "real-001"],
        downstreamRefreshTargets: ["reviewed-misclassified", "rule-revision-task-sheet"],
      },
      summary: {
        rerunCaseCount: 2,
      },
    },
    keyCaseRerunDiffReport: {
      summary: {
        changedCaseCount: 0,
        downstreamChangedCount: 0,
      },
    },
  });

  assert.equal(result.keyCaseRerunHandoff.status, "rerun-complete");
  assert.equal(result.keyCaseRerunHandoff.label, "关键样例复跑已完成");
  assert.deepEqual(result.keyCaseRerunHandoff.candidateCaseIds, ["sample-001"]);
  assert.equal(result.keyCaseRerunHandoff.latestRun.planId, "key-case-rerun-default");
  assert.equal(result.keyCaseRerunHandoff.latestRun.rerunCaseCount, 2);
  assert.equal(result.keyCaseRerunHandoff.latestRun.changedCaseCount, 0);
  assert.equal(result.keyCaseRerunHandoff.latestRun.downstreamChangedCount, 0);
});

test("buildBatchReviewDashboardReport surfaces exported manual task card status", () => {
  const result = buildBatchReviewDashboardReport({
    crossBatchReport: {
      summary: {
        totalBatches: 1,
        reviewedBatchCount: 0,
        fullyCoveredBatchCount: 0,
        partiallyCoveredBatchCount: 0,
        missingManualReviewCount: 1,
        repeatedCategories: 1,
      },
      manualReview: {
        pendingBatchRows: [
          {
            batchLabel: "real-002_to_real-003",
            hasManualConclusion: false,
            missingKeyFields: [{ key: "bottleneckStep", label: "最卡环节" }],
          },
        ],
      },
      batchRows: [
        {
          batchLabel: "real-002_to_real-003",
          createdCount: 2,
          topCategoryLabels: ["输入准备与案例结构"],
          topActionLabels: ["内容主题"],
        },
      ],
    },
    latestManualTaskCardStatus: {
      targetBatchLabel: "real-002_to_real-003",
      targetPath: "/tmp/人工复盘待补任务.md",
      exportedAt: "2026-07-23T11:30:00.000Z",
      readbackOk: true,
      hasManualInput: false,
      filledFieldCount: 0,
    },
  });

  assert.equal(result.manualReviewTaskHandoff.status, "draft-exported");
  assert.equal(result.manualReviewTaskHandoff.label, "人工复盘草稿已导出");
  assert.equal(result.manualReviewTaskHandoff.targetBatchLabel, "real-002_to_real-003");
  assert.equal(result.manualReviewTaskHandoff.readbackOk, true);
});

test("buildBatchReviewDashboardReport surfaces formal write gate evidence", () => {
  const result = buildBatchReviewDashboardReport({
    latestManualSafeWriteStatus: {
      targetBatchLabel: "real-002_to_real-003",
      targetPath: "/tmp/安全写回预览.md",
      patchSourceLabel: "系统建议初稿",
      readbackOk: true,
      matchedExpectedContent: true,
      manualReviewConclusion: "",
      canProceedToFormalWrite: false,
      parsed: {
        parsed: {
          confirmedLines: "",
          stillNeedsEdit: "",
          readyDecision: "",
        },
      },
    },
  });

  assert.equal(result.formalWriteGate.status, "awaiting-safe-write-confirmation");
  assert.equal(result.formalWriteGate.label, "先补安全写回确认");
  assert.equal(result.formalWriteGate.targetBatchLabel, "real-002_to_real-003");
  assert.equal(result.formalWriteGate.patchSourceLabel, "系统建议初稿");
  assert.equal(result.formalWriteGate.manualReviewConclusionStatus, "待补");
  assert.equal(result.formalWriteGate.formalWritePermission, "待人工确认");
  assert.equal(result.formalWriteGate.confirmationChecklist.length, 5);
  assert.deepEqual(
    result.formalWriteGate.confirmationChecklist.map((item) => item.status),
    ["done", "current", "pending", "done", "pending"],
  );
  assert.ok(result.formalWriteGate.confirmationChecklist[1].detail.includes("人工复盘结论"));
});

test("buildBatchReviewManualTaskCard turns top pending batch into fill tasks", () => {
  const result = buildBatchReviewManualTaskCard([
    {
      batchLabel: "batch-b",
      hasManualConclusion: false,
      topCategoryLabels: ["输入准备与案例结构"],
      topActionLabels: ["内容主题", "素材描述"],
      missingKeyFields: [
        { key: "bottleneckStep", label: "最卡环节" },
        { key: "uiOptimizationTiming", label: "UI 时机判断" },
      ],
    },
  ]);

  assert.equal(result.status, "start-manual-review");
  assert.equal(result.targetBatchLabel, "batch-b");
  assert.equal(result.fieldTasks.length, 2);
  assert.ok(result.fieldTasks[0].prompt.includes("最容易停住"));
  assert.ok(result.fieldTasks[0].startSuggestion.includes("输入准备与案例结构"));
  assert.ok(result.fieldTasks[0].suggestedDraft.includes("准备输入信息时"));
  assert.ok(result.fieldTasks[1].startSuggestion.includes("先别急着做 UI"));
  assert.ok(result.fieldTasks[1].suggestedDraft.includes("先别急着做 UI"));
  assert.ok(result.topActionLabels.includes("内容主题"));
});

test("buildUiOptimizationRecheckPlan prioritizes manual review before rerunning readiness", () => {
  const result = buildUiOptimizationRecheckPlan({
    priorityRows: [
      {
        batchLabel: "batch-b",
        missingFieldLabels: ["最该前置模块", "UI 时机判断"],
        topCategoryLabels: ["结果阅读与选择判断"],
      },
    ],
    uiReadiness: {
      readinessLevel: "near-ready",
      readinessLabel: "接近可以进入 UI 讨论",
    },
    coverageTrend: {
      status: "emerging",
      label: "人工复盘开始成形",
    },
    crossBatchSignal: {
      label: "接近可以讨论 UI 优化",
    },
  });

  assert.equal(result.status, "awaiting-manual-fill");
  assert.ok(result.blockers[0].includes("batch-b"));
  assert.equal(result.steps[0].status, "current");
  assert.ok(result.steps[1].label.includes("重新生成跨批次摩擦点汇总"));
});

test("buildBatchReviewFollowUpChecklist returns phased checklist for pending batches", () => {
  const result = buildBatchReviewFollowUpChecklist({
    uiReadiness: {
      readinessLevel: "not-ready",
      readinessLabel: "暂不建议进入 UI 讨论",
    },
    coverageTrend: {
      status: "fragmented",
      label: "人工复盘仍然零散",
    },
    priorityRows: [
      {
        batchLabel: "batch-b",
        urgencyLabel: "补齐关键判断",
        missingFieldLabels: ["最该前置模块", "UI 时机判断"],
        topCategoryLabels: ["结果阅读与选择判断"],
      },
    ],
  });

  assert.equal(result.focusLabel, "batch-b 优先");
  assert.equal(result.readyForUi, false);
  assert.ok(result.phases[1].items[0].label.includes("batch-b"));
  assert.equal(result.phases[1].items[0].actionLabel, "生成批次试跑记录");
  assert.ok(result.phases[3].items[0].label.includes("暂不建议进入 UI 讨论"));
});

test("buildBatchReviewFollowUpChecklist adds rule handoff items when ready for UI", () => {
  const result = buildBatchReviewFollowUpChecklist({
    uiReadiness: {
      readinessLevel: "ready",
      readinessLabel: "可以进入 UI 讨论",
    },
    coverageTrend: {
      status: "stabilizing",
      label: "人工复盘趋于稳定",
    },
    priorityRows: [],
  });

  assert.equal(result.readyForUi, true);
  assert.equal(result.phases[3].label, "进入 UI 讨论前的收口动作");
  assert.ok(result.phases[3].items[1].label.includes("规则修订任务单"));
  assert.ok(result.phases[3].items[2].label.includes("关键样例"));
  assert.equal(result.phases[3].items[1].actionId, "");
});

test("buildFollowUpProgressSummary returns next and most recent completed actions", () => {
  const checklist = {
    phases: [
      {
        label: "先确认这轮复盘材料",
        items: [
          {
            label: "先回看跨批次摩擦点汇总。",
            actionId: "preview-batch-run-friction-summary",
            actionLabel: "生成跨批次摩擦点预览",
          },
          {
            label: "再回看 UI 优化进入条件报告。",
            actionId: "preview-ui-optimization-readiness",
            actionLabel: "生成 UI 就绪度预览",
          },
        ],
      },
      {
        label: "补完后立刻重跑复盘判断",
        items: [
          {
            label: "再重新生成 UI 优化进入条件报告和批次复盘看板。",
            actionId: "preview-ui-and-dashboard",
            actionLabel: "重跑 UI 报告和复盘看板",
          },
        ],
      },
    ],
  };
  const progress = {
    "preview-batch-run-friction-summary": {
      state: "completed",
      updatedAt: "2026-06-28T12:00:00.000Z",
    },
    "preview-ui-optimization-readiness": {
      state: "completed",
      updatedAt: "2026-06-28T12:05:00.000Z",
    },
  };

  const result = buildFollowUpProgressSummary(checklist, progress);

  assert.equal(result.totalActionableCount, 3);
  assert.equal(result.completedCount, 2);
  assert.equal(result.runningCount, 0);
  assert.equal(result.remainingCount, 1);
  assert.equal(result.completedPhaseCount, 1);
  assert.equal(result.totalPhaseCount, 2);
  assert.equal(result.nextPhaseLabel, "补完后立刻重跑复盘判断");
  assert.equal(result.phaseSummaries[0].status, "completed");
  assert.equal(result.phaseSummaries[1].status, "active");
  assert.equal(result.nextEntry.item.actionId, "preview-ui-and-dashboard");
  assert.equal(
    result.mostRecentCompleted.item.actionId,
    "preview-ui-optimization-readiness",
  );
  assert.equal(result.recentCompletedEntries.length, 2);
  assert.equal(
    result.recentCompletedEntries[0].item.actionId,
    "preview-ui-optimization-readiness",
  );
  assert.equal(
    result.recentCompletedEntries[1].item.actionId,
    "preview-batch-run-friction-summary",
  );
  assert.ok(result.transitionSummary.includes("刚完成"));
  assert.ok(result.upcomingSummary.includes("补完后立刻重跑复盘判断"));
});

test("buildBatchReviewDashboardMarkdown renders dashboard summary", () => {
  const markdown = buildBatchReviewDashboardMarkdown({
    uiReadiness: {
      readinessLabel: "接近可以进入 UI 讨论",
    },
    crossBatchSignal: {
      label: "接近可以讨论 UI 优化",
    },
    coverageTrend: {
      label: "人工复盘开始成形",
      reason: "已经出现至少 1 批完整人工复盘。",
    },
    summary: {
      totalBatches: 3,
      reviewedBatchCount: 2,
      fullyCoveredBatchCount: 1,
      partiallyCoveredBatchCount: 1,
      missingManualReviewCount: 1,
      repeatedCategories: 2,
    },
    ruleRevisionSignal: {
      label: "已有规则修订任务",
      taskCount: 1,
      sourceSampleCount: 1,
      prioritySummary: "P1 0 / P2 0 / P3 1",
      topTasks: [
        {
          taskId: "REV-001",
          priority: "P3",
          taskTitle: "补强 neg-content-distance 相关关键词：不贴内容",
          suggestedMappingId: "neg-content-distance",
          caseIds: ["sample-001"],
        },
      ],
    },
    keyCaseRerunHandoff: {
      label: "关键样例复跑已完成",
      candidateCaseIds: ["sample-001"],
      downstreamRefreshTargets: ["reviewed-misclassified", "rule-revision-task-sheet"],
      summary: "已完成 2 个关键样例复跑，差异样例 0 个，下游变化 0 项。",
      latestRun: {
        planId: "key-case-rerun-default",
        generatedAt: "2026-07-23 11:19:28",
        rerunCaseCount: 2,
        changedCaseCount: 0,
        downstreamChangedCount: 0,
      },
      commandSequence: [
        "npm run generate:key-case-rerun-plan",
        "npm run export:obsidian-key-case-rerun-plan",
        "npm run rerun:key-cases",
      ],
    },
    priorityRows: [
      {
        batchLabel: "batch-b",
        urgencyLabel: "补齐关键判断",
        missingFieldLabels: ["最该前置模块"],
        createdCount: 2,
        topCategoryLabels: ["结果阅读与选择判断"],
      },
    ],
    nextActions: ["先补 batch-b 这一批"],
    uiRecheckPlan: {
      statusLabel: "先补人工复盘，再重跑判断",
      summary: "先补齐人工复盘字段。",
      blockers: ["batch-b 仍缺：最该前置模块"],
      steps: [
        {
          status: "current",
          label: "先补 batch-b 的人工复盘字段。",
          note: "当前最强摩擦点：结果阅读与选择判断",
        },
      ],
    },
    manualReviewTaskCard: {
      statusLabel: "继续补齐关键判断",
      targetBatchLabel: "batch-b",
      summary: "先把 batch-b 这批剩余关键字段补齐。",
      topCategoryLabels: ["结果阅读与选择判断"],
      topActionLabels: ["内容主题"],
      fieldTasks: [
        {
          label: "最该前置模块",
          prompt: "如果只能先把一个模块前置或强调，优先选择哪块？",
          answerHint: "优先写模块名。",
        },
      ],
    },
    manualReviewTaskHandoff: {
      label: "人工复盘草稿已导出",
      targetBatchLabel: "batch-b",
      targetPath: "/tmp/人工复盘待补任务.md",
      readbackOk: true,
      filledFieldCount: 0,
    },
    formalWriteGate: {
      label: "先补安全写回确认",
      targetBatchLabel: "real-002_to_real-003",
      targetPath: "/tmp/安全写回预览.md",
      patchSourceLabel: "系统建议初稿",
      readbackOk: true,
      matchedExpectedContent: true,
      manualReviewConclusionStatus: "待补",
      formalWritePermission: "待人工确认",
      summary: "安全写回预览已读回，但人工复盘结论或写回确认仍未补齐。",
      confirmationChecklist: [
        {
          label: "人工复盘结论",
          status: "current",
          detail: "在安全写回预览底部补一句本轮人工复盘结论。",
        },
        {
          label: "进入正式写回确认",
          status: "pending",
          detail: "确认无误后，将“是否已经可以进入正式写回”填写为“可以”。",
        },
      ],
    },
    followUpChecklist: {
      phases: [
        {
          label: "先补当前最关键缺口",
          items: [
            {
              label: "batch-b 是当前优先级最高的批次。",
              actionLabel: "生成批次试跑记录",
            },
          ],
        },
      ],
    },
  });

  assert.ok(markdown.includes("# 批次复盘看板"));
  assert.ok(markdown.includes("人工完整覆盖批次数：1"));
  assert.ok(markdown.includes("## 3. 规则修订任务信号"));
  assert.ok(markdown.includes("任务数量：1"));
  assert.ok(markdown.includes("REV-001｜P3｜补强 neg-content-distance 相关关键词：不贴内容"));
  assert.ok(markdown.includes("## 4. 关键样例复跑承接"));
  assert.ok(markdown.includes("当前状态：关键样例复跑已完成"));
  assert.ok(markdown.includes("候选样例：sample-001"));
  assert.ok(markdown.includes("最近复跑计划：key-case-rerun-default"));
  assert.ok(markdown.includes("最近变化样例数：0"));
  assert.ok(markdown.includes("npm run export:obsidian-key-case-rerun-plan"));
  assert.ok(markdown.includes("npm run rerun:key-cases"));
  assert.ok(markdown.includes("batch-b：补齐关键判断"));
  assert.ok(markdown.includes("## 7. 人工复盘补齐后的再判断链路"));
  assert.ok(markdown.includes("## 9. 正式写回门禁"));
  assert.ok(markdown.includes("改写来源：系统建议初稿"));
  assert.ok(markdown.includes("人工结论：待补"));
  assert.ok(markdown.includes("写回许可：待人工确认"));
  assert.ok(markdown.includes("安全预览路径：/tmp/安全写回预览.md"));
  assert.ok(markdown.includes("确认清单："));
  assert.ok(markdown.includes("[current] 人工复盘结论"));
  assert.ok(markdown.includes("[pending] 进入正式写回确认"));
  assert.ok(markdown.includes("## 10. 复盘后操作清单"));
  assert.ok(markdown.includes("batch-b 仍缺：最该前置模块"));
  assert.ok(markdown.includes("## 8. 人工复盘待补任务"));
  assert.ok(markdown.includes("目标批次：batch-b"));
  assert.ok(markdown.includes("草稿状态：人工复盘草稿已导出"));
  assert.ok(markdown.includes("草稿读回：已确认"));
  assert.ok(markdown.includes("填写提示：优先写模块名。"));
  assert.ok(markdown.includes("页面入口：生成批次试跑记录"));
});

test("buildBatchReviewManualTaskCardMarkdown renders fill prompts", () => {
  const markdown = buildBatchReviewManualTaskCardMarkdown({
    statusLabel: "继续补齐关键判断",
    targetBatchLabel: "batch-b",
    summary: "先把 batch-b 这批剩余关键字段补齐。",
    topCategoryLabels: ["结果阅读与选择判断"],
    topActionLabels: ["内容主题"],
    fieldTasks: [
      {
        label: "最该前置模块",
        prompt: "如果只能先把一个模块前置或强调，优先选择哪块？",
        answerHint: "优先写模块名。",
        startSuggestion: "先写一个最该前置的模块名即可，例如：结果区。",
        suggestedDraft: "建议先把结果区前置，因为它和“内容主题”最直接相关。",
      },
    ],
  });

  assert.ok(markdown.includes("# 人工复盘待补任务"));
  assert.ok(markdown.includes("目标批次：batch-b"));
  assert.ok(markdown.includes("填写提示：优先写模块名。"));
  assert.ok(markdown.includes("起笔建议：先写一个最该前置的模块名即可，例如：结果区。"));
  assert.ok(markdown.includes("建议初稿：建议先把结果区前置，因为它和“内容主题”最直接相关。"));
  assert.ok(markdown.includes("## 3. 人工填写区"));
  assert.ok(markdown.includes("可直接改写起笔句：先写一个最该前置的模块名即可，例如：结果区。"));
  assert.ok(markdown.includes("可直接修改初稿：建议先把结果区前置，因为它和“内容主题”最直接相关。"));
});

test("buildObsidianBatchReviewManualTaskCardRecord wraps task card into editable draft", () => {
  const markdown = buildObsidianBatchReviewManualTaskCardRecord({
    generatedDate: "2026-07-01",
    sourceMarkdownPath: "/tmp/batch-review-manual-task-card.md",
    taskCardMarkdown: "# 人工复盘待补任务\n\n- line",
  });

  assert.ok(markdown.includes("人工复盘待补任务_2026-07-01"));
  assert.ok(markdown.includes("代码侧人工复盘待补任务自动生成草稿"));
  assert.ok(markdown.includes("## 2. 人工补充"));
});

test("parseBatchReviewManualTaskCardNote extracts filled review fields", () => {
  const result = parseBatchReviewManualTaskCardNote([
    "# 人工复盘待补任务_2026-07-01",
    "",
    "- 目标批次：real-002_to_real-003",
    "- 最卡环节：看完结果不知道先选哪条",
    "- 问题类型判断：更像界面问题",
    "- 最该前置模块：结果区",
    "- UI 时机判断：接近可以讨论 UI",
    "- 这一批最重要的一句判断：结果阅读比输入更卡",
    "",
  ].join("\n"));

  assert.equal(result.targetBatchLabel, "real-002_to_real-003");
  assert.equal(result.hasManualInput, true);
  assert.ok(result.filledFields.includes("bottleneckStep"));
  assert.ok(result.filledFields.includes("keyConclusion"));
});

test("parseBatchReviewManualSafeWritePreviewNote extracts confirmation fields", () => {
  const result = parseBatchReviewManualSafeWritePreviewNote([
    "# 真实批次试跑记录安全写回预览_2026-07-02",
    "",
    "- 目标批次：real-002_to_real-003",
    "- 目标记录：/tmp/run.md",
    "- 当前改写来源：系统建议初稿",
    "- 人工复盘结论：结果区前置后，使用者能更快判断下一步。",
    "- 哪几行确认可以正式写回：最卡环节 / 前置模块",
    "- 哪几行仍需手改：",
    "- 是否已经可以进入正式写回：可以",
  ].join("\n"));

  assert.equal(result.targetBatchLabel, "real-002_to_real-003");
  assert.equal(result.patchSourceLabel, "系统建议初稿");
  assert.equal(result.hasManualConfirmation, true);
  assert.equal(result.canProceedToFormalWrite, true);
});

test("buildBatchReviewManualTaskBackfillPreview maps filled task card fields into review patch", () => {
  const result = buildBatchReviewManualTaskBackfillPreview({
    targetBatchLabel: "real-002_to_real-003",
    parsed: {
      parsed: {
        bottleneckStep: "看完结果不知道先选哪条",
        issueType: "更像界面问题",
        prioritizedModule: "结果区",
        uiOptimizationTiming: "接近可以讨论 UI",
      },
    },
  });

  assert.equal(result.status, "ready-to-backfill");
  assert.equal(result.targetBatchLabel, "real-002_to_real-003");
  assert.equal(result.reviewPatch.prioritizedModule, "结果区");
  assert.equal(result.missingFieldLabels.length, 0);
});

test("createBatchReviewManualTaskCardObsidianPreview returns target metadata", () => {
  const result = createBatchReviewManualTaskCardObsidianPreview({
    taskCardMarkdown: "# 人工复盘待补任务\n\n- line",
    obsidianRoot: "/tmp/obsidian",
  });

  assert.equal(result.generatedDate.length, 10);
  assert.ok(result.targetPath.startsWith("/tmp/obsidian"));
  assert.ok(result.markdown.includes("人工复盘待补任务"));
});

test("buildBatchReviewManualBackfillMarkdown renders review patch preview", () => {
  const markdown = buildBatchReviewManualBackfillMarkdown({
    backfillPreview: {
      statusLabel: "可回流到批次试跑结论",
      targetBatchLabel: "real-002_to_real-003",
      summary: "当前 4 个关键人工判断字段都已填写。",
      filledFieldLabels: ["最卡环节", "问题类型判断", "最该前置模块", "UI 时机判断"],
      missingFieldLabels: [],
      reviewPatch: {
        bottleneckStep: "看完结果不知道先选哪条",
        issueType: "更像界面问题",
        prioritizedModule: "结果区",
        uiOptimizationTiming: "接近可以讨论 UI",
      },
    },
    latestTaskCardStatus: {
      targetPath: "/tmp/manual-task.md",
    },
    latestRunRecordStatus: {
      targetPath: "/tmp/run-record.md",
    },
  });

  assert.ok(markdown.includes("# 人工复盘回流预览"));
  assert.ok(markdown.includes("最近任务草稿：/tmp/manual-task.md"));
  assert.ok(markdown.includes("可回流批次试跑结论 patch"));
  assert.ok(markdown.includes("当前更像功能问题，还是界面问题：更像界面问题"));
});

test("buildObsidianBatchReviewManualBackfillRecord wraps backfill preview into editable draft", () => {
  const markdown = buildObsidianBatchReviewManualBackfillRecord({
    generatedDate: "2026-07-01",
    sourceMarkdownPath: "/tmp/batch-review-manual-backfill.md",
    backfillMarkdown: "# 人工复盘回流预览\n\n- line",
  });

  assert.ok(markdown.includes("人工复盘回流预览_2026-07-01"));
  assert.ok(markdown.includes("代码侧人工复盘回流预览自动生成草稿"));
  assert.ok(markdown.includes("## 2. 人工补充"));
});

test("createBatchReviewManualBackfillObsidianPreview returns target metadata", () => {
  const result = createBatchReviewManualBackfillObsidianPreview({
    backfillMarkdown: "# 人工复盘回流预览\n\n- line",
    obsidianRoot: "/tmp/obsidian",
  });

  assert.equal(result.generatedDate.length, 10);
  assert.ok(result.targetPath.startsWith("/tmp/obsidian"));
  assert.ok(result.markdown.includes("人工复盘回流预览"));
});

test("buildBatchReviewManualWritebackDraftMarkdown renders aligned writeback sections", () => {
  const markdown = buildBatchReviewManualWritebackDraftMarkdown({
    backfillPreview: {
      statusLabel: "可回流到批次试跑结论",
      targetBatchLabel: "real-002_to_real-003",
      summary: "当前 4 个关键人工判断字段都已填写。",
      filledFieldLabels: ["最卡环节", "问题类型判断", "最该前置模块", "UI 时机判断"],
      missingFieldLabels: [],
      reviewPatch: {
        bottleneckStep: "看完结果不知道先选哪条",
        issueType: "更像界面问题",
        prioritizedModule: "结果区",
        uiOptimizationTiming: "接近可以讨论 UI",
      },
    },
    latestTaskCardStatus: {
      targetPath: "/tmp/manual-task.md",
    },
    latestRunRecordStatus: {
      targetPath: "/tmp/run-record.md",
    },
  });

  assert.ok(markdown.includes("# 真实批次试跑结论写回草稿"));
  assert.ok(markdown.includes("### 6. 人工试跑结论"));
  assert.ok(markdown.includes("最近任务草稿：/tmp/manual-task.md"));
  assert.ok(markdown.includes("目标批次试跑记录：/tmp/run-record.md"));
  assert.ok(markdown.includes("哪个按钮或模块最该前置：结果区"));
});

test("buildBatchReviewManualWritebackPatch builds and applies safe writeback values", () => {
  const patch = buildBatchReviewManualWritebackPatch({
    backfillPreview: {
      reviewPatch: {
        bottleneckStep: "看完结果不知道先改哪一步",
        issueType: "更像流程问题",
        prioritizedModule: "输入准备区",
        uiOptimizationTiming: "先别急着做 UI",
      },
    },
    latestTaskCardStatus: {
      parsed: {
        parsed: {
          keyConclusion: "结果还不够让人直接行动",
          rerunFocus: "先验证输入准备区前置后是否更顺",
          uiDiscussionProgress: "先别急着做 UI",
        },
      },
    },
  });

  const patched = applyBatchReviewManualWritebackPatch(
    [
      "## 6. 人工试跑结论",
      "- 这批案例最卡的环节：",
      "",
      "## 7. 对产品的影响",
      "- 哪个按钮或模块最该前置：",
      "- 当前更像功能问题，还是界面问题：",
      "",
      "## 2. 补充结论",
      "- 这批试跑最关键的结论：",
      "- 下一批还要不要继续同样赛道：",
      "- UI 优化是否已经到时机：",
    ].join("\n"),
    patch,
  );

  assert.equal(patch.bottleneckStep, "看完结果不知道先改哪一步");
  assert.equal(patch.batchCriticalConclusion, "结果还不够让人直接行动");
  assert.ok(patched.includes("这批案例最卡的环节：看完结果不知道先改哪一步"));
  assert.ok(patched.includes("哪个按钮或模块最该前置：输入准备区"));
  assert.ok(patched.includes("这批试跑最关键的结论：结果还不够让人直接行动"));
});

test("buildBatchReviewManualWritebackPatch falls back to suggested drafts when manual fields are empty", () => {
  const patch = buildBatchReviewManualWritebackPatch({
    backfillPreview: {
      filledFieldLabels: [],
      reviewPatch: {
        bottleneckStep: "",
        issueType: "",
        prioritizedModule: "",
        uiOptimizationTiming: "",
      },
    },
    latestTaskCardStatus: {
      parsed: {
        parsed: {},
      },
    },
    taskCardReport: {
      fieldTasks: [
        { key: "bottleneckStep", suggestedDraft: "最卡在准备输入信息时，不知道先补哪项。" },
        { key: "issueType", suggestedDraft: "更像流程问题，因为关键补写顺序还不明确。" },
        { key: "prioritizedModule", suggestedDraft: "建议先把输入准备区前置，因为它和来源链接最直接相关。" },
        { key: "uiOptimizationTiming", suggestedDraft: "先别急着做 UI，先补齐关键人工判断再重跑更稳。" },
      ],
    },
  });

  assert.equal(patch.patchSource, "suggested-draft");
  assert.equal(patch.bottleneckStep, "最卡在准备输入信息时，不知道先补哪项。");
  assert.equal(patch.issueType, "更像流程问题，因为关键补写顺序还不明确。");
  assert.equal(patch.prioritizedModule, "建议先把输入准备区前置，因为它和来源链接最直接相关。");
  assert.equal(patch.uiOptimizationTiming, "先别急着做 UI，先补齐关键人工判断再重跑更稳。");
});

test("buildBatchReviewManualSafeWritePreviewMarkdown renders current and patched run record", () => {
  const markdown = buildBatchReviewManualSafeWritePreviewMarkdown({
    targetBatchLabel: "batch-a",
    targetPath: "/tmp/batch-a-run.md",
    patch: {
      patchSource: "manual-or-mixed",
      bottleneckStep: "看完结果不知道先改哪一步",
      prioritizedModule: "输入准备区",
      issueType: "更像流程问题",
      batchCriticalConclusion: "结果还不够让人直接行动",
      nextBatchSameTrack: "先验证输入准备区前置后是否更顺",
      uiOptimizationTiming: "先别急着做 UI",
    },
    currentMarkdown: "# 原文",
    patchedMarkdown: "# 预览",
  });

  assert.ok(markdown.includes("# 真实批次试跑记录安全写回预览"));
  assert.ok(markdown.includes("目标记录：/tmp/batch-a-run.md"));
  assert.ok(markdown.includes("当前改写来源：人工填写或人工+建议混合"));
  assert.ok(markdown.includes("这批试跑最关键的结论：结果还不够让人直接行动"));
  assert.ok(markdown.includes("## 2. 当前记录原文"));
  assert.ok(markdown.includes("## 3. 写回后预览"));
});

test("buildObsidianBatchReviewManualSafeWritePreviewRecord wraps safe write preview into editable note", () => {
  const markdown = buildObsidianBatchReviewManualSafeWritePreviewRecord({
    generatedDate: "2026-07-02",
    sourceMarkdownPath: "/tmp/batch-review-manual-safe-write-preview.md",
    safeWritePreviewMarkdown: "# 真实批次试跑记录安全写回预览\n\n- line",
    confirmationHints: {
      manualConclusionHint: "确认本次预览是否可作为正式写回依据",
      confirmedLinesHint: "字段 A / 字段 B",
      stillNeedsEditHint: "若无问题可留空",
      readyDecisionHint: "确认后填写可以",
    },
  });

  assert.ok(markdown.includes("真实批次试跑记录安全写回预览_2026-07-02"));
  assert.ok(markdown.includes("代码侧人工复盘安全写回预览自动生成"));
  assert.ok(markdown.includes("## 2. 人工补充"));
  assert.ok(markdown.includes("- 人工复盘结论："));
  assert.ok(markdown.includes("建议起笔（人工复盘结论）：确认本次预览是否可作为正式写回依据"));
  assert.ok(markdown.includes("建议起笔（确认写回行）：字段 A / 字段 B"));
  assert.ok(markdown.includes("## 3. 填写参考"));
  assert.ok(markdown.includes("人工复盘结论建议"));

  const parsed = parseBatchReviewManualSafeWritePreviewNote(markdown);

  assert.equal(parsed.hasManualConfirmation, false);
  assert.equal(parsed.canProceedToFormalWrite, false);
});

test("createBatchReviewManualSafeWritePreviewObsidianPreview returns target metadata", () => {
  const result = createBatchReviewManualSafeWritePreviewObsidianPreview({
    safeWritePreviewMarkdown: "# 真实批次试跑记录安全写回预览\n\n- line",
    patch: {
      bottleneckStep: "看完结果还是不知道先改什么",
      prioritizedModule: "输入准备区",
      patchSource: "suggested-draft",
    },
    obsidianRoot: "/tmp/obsidian",
  });

  assert.equal(result.generatedDate.length, 10);
  assert.ok(result.targetPath.startsWith("/tmp/obsidian"));
  assert.ok(result.markdown.includes("真实批次试跑记录安全写回预览"));
  assert.ok(result.markdown.includes("建议起笔（确认写回行）：这批案例最卡的环节 / 哪个按钮或模块最该前置"));
  assert.ok(result.markdown.includes("本轮采用系统建议初稿作为安全预览"));
  assert.ok(result.markdown.includes("建议稿可接受，且“仍需手改”为空时，可填写“可以”"));
});

test("buildObsidianBatchReviewManualWritebackDraftRecord wraps writeback draft into editable note", () => {
  const markdown = buildObsidianBatchReviewManualWritebackDraftRecord({
    generatedDate: "2026-07-02",
    sourceMarkdownPath: "/tmp/batch-review-manual-writeback-draft.md",
    writebackDraftMarkdown: "# 真实批次试跑结论写回草稿\n\n- line",
  });

  assert.ok(markdown.includes("真实批次试跑结论写回草稿_2026-07-02"));
  assert.ok(markdown.includes("代码侧人工复盘写回草稿自动生成"));
  assert.ok(markdown.includes("## 2. 人工补充"));
});

test("createBatchReviewManualWritebackDraftObsidianPreview returns target metadata", () => {
  const result = createBatchReviewManualWritebackDraftObsidianPreview({
    writebackDraftMarkdown: "# 真实批次试跑结论写回草稿\n\n- line",
    obsidianRoot: "/tmp/obsidian",
  });

  assert.equal(result.generatedDate.length, 10);
  assert.ok(result.targetPath.startsWith("/tmp/obsidian"));
  assert.ok(result.markdown.includes("真实批次试跑结论写回草稿"));
});

test("buildObsidianBatchReviewDashboardRecord wraps dashboard into editable draft", () => {
  const markdown = buildObsidianBatchReviewDashboardRecord({
    generatedDate: "2026-06-27",
    sourceMarkdownPath: "/tmp/batch-review-dashboard.md",
    dashboardMarkdown: "# 批次复盘看板\n\n- line",
  });

  assert.ok(markdown.includes("# 批次复盘看板_2026-06-27"));
  assert.ok(markdown.includes("## 1. 代码侧看板底稿"));
  assert.ok(markdown.includes("## 2. 人工补充"));
});

test("runBatchReviewManualTaskCardPreview derives task card from dashboard", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-manual-task-preview-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-fill-sheets", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-a"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-a"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-b"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "obsidian-export-logs", "batch-review-manual-task-card"), {
    recursive: true,
  });
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-fill-sheets",
      "batch-a",
      "2026-06-27T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T10:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: "/tmp/batch-a-fill.md",
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-a", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        createdCount: 2,
        frictionTemplate: [
          {
            id: "result-reading",
            label: "结果阅读与选择判断",
            priorityScore: 95,
            whyItMatters: "result",
            priorityReason: "结果阅读不顺",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: { readbackOk: true },
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-b", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        createdCount: 1,
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 90,
            whyItMatters: "input",
            priorityReason: "输入还是太重",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "素材描述", priorityScore: 95, priorityReason: "素材不清楚" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: null,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  const taskTargetPath = join(tempRoot, "obsidian", "人工复盘待补任务_2026-07-01.md");
  await writeFile(
    taskTargetPath,
    [
      "# 人工复盘待补任务_2026-07-01",
      "",
      "- 目标批次：batch-a",
      "- 最卡环节：看完结果不知道先选哪条",
      "- 问题类型判断：更像界面问题",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-manual-task-card",
      "BRM-2026-07-01T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        exportId: "BRM-2026-07-01T10-00-00-000Z",
        exportedAt: "2026-07-01T10:00:00.000Z",
        targetPath: taskTargetPath,
        sourceMarkdownPath: "/tmp/batch-review-manual-task-card.md",
        sourceJsonPath: "/tmp/batch-review-manual-task-card.json",
        readback: { ok: true, matchedExpectedContent: true },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await runBatchReviewManualTaskCardPreview();

  assert.equal(result.report.targetBatchLabel, "batch-a");
  assert.ok(result.taskCardMarkdown.includes("# 人工复盘待补任务"));
  assert.ok(result.taskCardMarkdown.includes("人工填写区"));
  assert.equal(result.latestTaskCardStatus.targetBatchLabel, "batch-a");
  assert.equal(result.latestTaskCardStatus.hasManualInput, true);
  assert.equal(result.backfillPreview.status, "partial-ready");
  assert.ok(result.backfillPreview.filledFieldLabels.includes("最卡环节"));
});

test("runBatchReviewManualBackfillPreview builds export-ready backfill draft", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-manual-backfill-preview-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-fill-sheets", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-a"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-a"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-b"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "obsidian-export-logs", "batch-review-manual-task-card"), {
    recursive: true,
  });
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-fill-sheets",
      "batch-a",
      "2026-06-27T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T10:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: "/tmp/batch-a-fill.md",
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "batch-a",
      "2026-06-27T11-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T11:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: join(tempRoot, "obsidian", "batch-a-run.md"),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "obsidian", "batch-a-run.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "- 这批案例最卡的环节：",
      "- 当前更像功能问题，还是界面问题：",
      "- 哪个按钮或模块最该前置：",
      "- UI 优化是否已经到时机：",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-a", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        createdCount: 2,
        frictionTemplate: [
          {
            id: "result-reading",
            label: "结果阅读与选择判断",
            priorityScore: 95,
            whyItMatters: "result",
            priorityReason: "结果阅读不顺",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: { readbackOk: true },
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-b", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        createdCount: 1,
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 90,
            whyItMatters: "input",
            priorityReason: "输入还是太重",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "素材描述", priorityScore: 95, priorityReason: "素材不清楚" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: null,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  const taskTargetPath = join(tempRoot, "obsidian", "人工复盘待补任务_2026-07-01.md");
  await writeFile(
    taskTargetPath,
    [
      "# 人工复盘待补任务_2026-07-01",
      "",
      "- 目标批次：batch-a",
      "- 最卡环节：看完结果不知道先选哪条",
      "- 问题类型判断：更像界面问题",
      "- 最该前置模块：结果区",
      "- UI 时机判断：接近可以讨论 UI",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-manual-task-card",
      "BRM-2026-07-01T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        exportId: "BRM-2026-07-01T10-00-00-000Z",
        exportedAt: "2026-07-01T10:00:00.000Z",
        targetPath: taskTargetPath,
        sourceMarkdownPath: "/tmp/batch-review-manual-task-card.md",
        sourceJsonPath: "/tmp/batch-review-manual-task-card.json",
        readback: { ok: true, matchedExpectedContent: true },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await runBatchReviewManualBackfillPreview();

  assert.equal(result.report.status, "ready-to-backfill");
  assert.ok(result.backfillMarkdown.includes("可回流批次试跑结论 patch"));
  assert.equal(result.latestRunRecordStatus.batchLabel, "batch-a");
});

test("runBatchReviewManualWritebackDraftPreview builds aligned writeback draft", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-manual-writeback-preview-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-fill-sheets", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-a"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-a"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-b"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "obsidian-export-logs", "batch-review-manual-task-card"), {
    recursive: true,
  });
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-fill-sheets",
      "batch-a",
      "2026-06-27T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T10:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: "/tmp/batch-a-fill.md",
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "batch-a",
      "2026-06-27T11-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T11:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: join(tempRoot, "obsidian", "batch-a-run.md"),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "obsidian", "batch-a-run.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "- 这批案例最卡的环节：",
      "- 当前更像功能问题，还是界面问题：",
      "- 哪个按钮或模块最该前置：",
      "- UI 优化是否已经到时机：",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-a", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        createdCount: 2,
        frictionTemplate: [
          {
            id: "result-reading",
            label: "结果阅读与选择判断",
            priorityScore: 95,
            whyItMatters: "result",
            priorityReason: "结果阅读不顺",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: { readbackOk: true },
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-b", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        createdCount: 1,
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 90,
            whyItMatters: "input",
            priorityReason: "输入还是太重",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "素材描述", priorityScore: 95, priorityReason: "素材不清楚" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: null,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  const taskTargetPath = join(tempRoot, "obsidian", "人工复盘待补任务_2026-07-01.md");
  await writeFile(
    taskTargetPath,
    [
      "# 人工复盘待补任务_2026-07-01",
      "",
      "- 目标批次：batch-a",
      "- 最卡环节：看完结果不知道先选哪条",
      "- 问题类型判断：更像界面问题",
      "- 最该前置模块：结果区",
      "- UI 时机判断：接近可以讨论 UI",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-manual-task-card",
      "BRM-2026-07-01T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        exportId: "BRM-2026-07-01T10-00-00-000Z",
        exportedAt: "2026-07-01T10:00:00.000Z",
        targetPath: taskTargetPath,
        sourceMarkdownPath: "/tmp/batch-review-manual-task-card.md",
        sourceJsonPath: "/tmp/batch-review-manual-task-card.json",
        readback: { ok: true, matchedExpectedContent: true },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await runBatchReviewManualWritebackDraftPreview();

  assert.equal(result.report.status, "ready-to-backfill");
  assert.ok(result.writebackDraftMarkdown.includes("### 6. 人工试跑结论"));
  assert.ok(result.writebackDraftMarkdown.includes("哪个按钮或模块最该前置：结果区"));
  assert.equal(result.latestRunRecordStatus.batchLabel, "batch-a");
});

test("runBatchReviewManualSafeWritePreview builds merged safe write preview", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-manual-safe-write-preview-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-fill-sheets", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-a"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-a"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-b"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "obsidian-export-logs", "batch-review-manual-task-card"), {
    recursive: true,
  });
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-fill-sheets",
      "batch-a",
      "2026-06-27T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T10:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: "/tmp/batch-a-fill.md",
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "batch-a",
      "2026-06-27T11-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T11:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: join(tempRoot, "obsidian", "batch-a-run.md"),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "obsidian", "batch-a-run.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "## 6. 人工试跑结论",
      "- 这批案例最卡的环节：",
      "",
      "## 7. 对产品的影响",
      "- 哪个按钮或模块最该前置：",
      "- 当前更像功能问题，还是界面问题：",
      "",
      "## 2. 补充结论",
      "- 这批试跑最关键的结论：",
      "- 下一批还要不要继续同样赛道：",
      "- UI 优化是否已经到时机：",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-a", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        createdCount: 2,
        frictionTemplate: [
          {
            id: "result-reading",
            label: "结果阅读与选择判断",
            priorityScore: 95,
            whyItMatters: "result",
            priorityReason: "结果阅读不顺",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: { readbackOk: true },
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-b", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        createdCount: 1,
        frictionTemplate: [],
        validationSummary: {
          recommendedBatchActions: [],
        },
        latestWorksheetHistory: {
          latestExportStatus: null,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  const taskTargetPath = join(tempRoot, "obsidian", "人工复盘待补任务_2026-07-01.md");
  await writeFile(
    taskTargetPath,
    [
      "# 人工复盘待补任务_2026-07-01",
      "",
      "- 目标批次：batch-a",
      "- 最卡环节：看完结果不知道先改哪一步",
      "- 问题类型判断：更像流程问题",
      "- 最该前置模块：输入准备区",
      "- UI 时机判断：先别急着做 UI",
      "- 这一批最重要的一句判断：结果还不够让人直接行动",
      "- 补完后最想重跑验证的点：先验证输入准备区前置后是否更顺",
      "- 是否更接近进入首页系统 UI 讨论：先别急着做 UI",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-manual-task-card",
      "BRM-2026-07-01T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        exportId: "BRM-2026-07-01T10-00-00-000Z",
        exportedAt: "2026-07-01T10:00:00.000Z",
        targetPath: taskTargetPath,
        sourceMarkdownPath: "/tmp/batch-review-manual-task-card.md",
        sourceJsonPath: "/tmp/batch-review-manual-task-card.json",
        readback: { ok: true, matchedExpectedContent: true },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await runBatchReviewManualSafeWritePreview();

  assert.equal(result.report.targetBatchLabel, "batch-a");
  assert.equal(result.patch.prioritizedModule, "输入准备区");
  assert.ok(result.patchedMarkdown.includes("这批试跑最关键的结论：结果还不够让人直接行动"));
  assert.ok(result.safeWritePreviewMarkdown.includes("## 3. 写回后预览"));
});

test("loadLatestBatchReviewManualTaskCardStatus reads latest exported task card note", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-manual-task-status-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(join(tempRoot, "outputs", "obsidian-export-logs", "batch-review-manual-task-card"), {
    recursive: true,
  });
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  const targetPath = join(tempRoot, "obsidian", "人工复盘待补任务_2026-07-01.md");
  await writeFile(
    targetPath,
    [
      "# 人工复盘待补任务_2026-07-01",
      "",
      "- 目标批次：real-002_to_real-003",
      "- 最卡环节：看完结果不知道先选哪条",
      "- 问题类型判断：更像界面问题",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-manual-task-card",
      "BRM-2026-07-01T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        exportId: "BRM-2026-07-01T10-00-00-000Z",
        exportedAt: "2026-07-01T10:00:00.000Z",
        targetPath,
        sourceMarkdownPath: "/tmp/batch-review-manual-task-card.md",
        sourceJsonPath: "/tmp/batch-review-manual-task-card.json",
        readback: { ok: true, matchedExpectedContent: true },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await loadLatestBatchReviewManualTaskCardStatus();

  assert.equal(result.targetBatchLabel, "real-002_to_real-003");
  assert.equal(result.hasManualInput, true);
  assert.ok(result.filledFields.includes("bottleneckStep"));
});

test("loadLatestBatchReviewManualSafeWritePreviewStatus reads latest safe preview note", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-safe-write-status-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "batch-review-manual-safe-write-preview"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  await writeManualConfirmationDecisionFixture(tempRoot);
  const targetPath = join(tempRoot, "obsidian", "真实批次试跑记录安全写回预览_2026-07-02.md");
  await writeFile(
    targetPath,
    [
      "# 真实批次试跑记录安全写回预览_2026-07-02",
      "",
      "- 目标批次：real-002_to_real-003",
      "- 当前改写来源：系统建议初稿",
      "- 人工复盘结论：结果区前置后，批次复盘链路可以继续写回。",
      "- 哪几行确认可以正式写回：最卡环节 / 前置模块",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-manual-safe-write-preview",
      "BRS-2026-07-02T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        exportId: "BRS-2026-07-02T10-00-00-000Z",
        exportedAt: "2026-07-02T10:00:00.000Z",
        targetPath,
        sourceMarkdownPath: "/tmp/batch-review-manual-safe-write-preview.md",
        sourceJsonPath: "/tmp/batch-review-manual-safe-write-preview.json",
        readback: { ok: true, matchedExpectedContent: true },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await loadLatestBatchReviewManualSafeWritePreviewStatus();

  assert.equal(result.targetBatchLabel, "real-002_to_real-003");
  assert.equal(result.manualReviewConclusion, "结果区前置后，批次复盘链路可以继续写回。");
  assert.equal(result.manualReviewConclusionValidation.ok, true);
  assert.equal(result.hasManualConfirmation, true);
  assert.equal(result.canProceedToFormalWrite, true);
});

test("validateManualReviewConclusion enforces formal write conclusion contract", () => {
  assert.deepEqual(validateManualReviewConclusion("   "), {
    ok: false,
    message: "请输入人工复盘结论",
  });

  assert.deepEqual(validateManualReviewConclusion("结".repeat(501)), {
    ok: false,
    message: "人工复盘结论最多输入 500 个字符",
  });

  assert.deepEqual(validateManualReviewConclusion("  结果区前置后再进入正式写回。  "), {
    ok: true,
    message: "",
  });
});

test("parseBatchReviewManualSafeWritePreviewNote supports multiline manual conclusion", () => {
  const result = parseBatchReviewManualSafeWritePreviewNote([
    "# 真实批次试跑记录安全写回预览_2026-07-02",
    "",
    "- 人工复盘结论：第一行判断",
    "  第二行补充说明",
    "- 建议起笔（人工复盘结论）：请输入本次人工复盘结论",
    "- 哪几行确认可以正式写回：最卡环节",
    "- 哪几行仍需手改：",
    "- 是否已经可以进入正式写回：可以",
  ].join("\n"));

  assert.equal(result.manualReviewConclusion, "第一行判断\n第二行补充说明");
  assert.equal(result.canProceedToFormalWrite, true);
});

async function writeManualConfirmationDecisionFixture(tempRoot, {
  decisionStatus = "adopt-recommended",
  decisionNote = "采用推荐确认块",
} = {}) {
  const sourceDir = join(tempRoot, "outputs", "batch-review-manual-safe-write-preview");
  const handoffDir = join(sourceDir, "manual-confirmation-handoff-packet");
  const decisionDir = join(sourceDir, "manual-confirmation-decision");
  const handoffPacket = {
    ok: true,
    targetBatchLabel: "real-002_to_real-003",
    confirmationBlock: [
      "## 4. 人工补充",
      "- 人工复盘结论：结果区前置后，批次复盘链路可以继续写回。",
      "- 哪几行确认可以正式写回：最卡环节 / 前置模块",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
    ].join("\n"),
  };
  const decisionMarkdown = buildManualConfirmationDecisionTemplate({
    handoffPacket,
    sourcePaths: {
      manualConfirmationHandoffPacket: join(handoffDir, "manual-confirmation-handoff-packet.md"),
    },
  })
    .replace("- 决策状态：pending", `- 决策状态：${decisionStatus}`)
    .replace("- 决策说明：待确认", `- 决策说明：${decisionNote}`);

  await mkdir(handoffDir, { recursive: true });
  await mkdir(decisionDir, { recursive: true });
  await writeFile(
    join(handoffDir, "manual-confirmation-handoff-packet.json"),
    `${JSON.stringify(handoffPacket, null, 2)}\n`,
    "utf-8",
  );
  await writeFile(
    join(decisionDir, "manual-confirmation-decision.md"),
    `${decisionMarkdown}\n`,
    "utf-8",
  );
}

test("runBatchReviewManualFormalWriteReadinessPreview returns ready status from confirmed safe preview", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-formal-write-readiness-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "batch-review-manual-safe-write-preview"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  const targetPath = join(tempRoot, "obsidian", "真实批次试跑记录安全写回预览_2026-07-02.md");
  await writeFile(
    targetPath,
    [
      "# 真实批次试跑记录安全写回预览_2026-07-02",
      "",
      "- 目标批次：real-002_to_real-003",
      "- 人工复盘结论：结果区前置后，批次复盘链路可以继续写回。",
      "- 哪几行确认可以正式写回：最卡环节 / 前置模块",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-manual-safe-write-preview",
      "BRS-2026-07-02T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        exportId: "BRS-2026-07-02T10-00-00-000Z",
        exportedAt: "2026-07-02T10:00:00.000Z",
        targetPath,
        sourceMarkdownPath: "/tmp/batch-review-manual-safe-write-preview.md",
        sourceJsonPath: "/tmp/batch-review-manual-safe-write-preview.json",
        readback: { ok: true, matchedExpectedContent: true },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await runBatchReviewManualFormalWriteReadinessPreview({
    manualConfirmationDecisionLoader: async () => ({
      ok: true,
      status: "ready-for-safe-preview-write",
      decisionStatus: "adopt-recommended",
      decisionLabel: "采用推荐确认块",
      canProceedToSafePreviewWrite: true,
    }),
  });

  assert.equal(result.status, "ready-to-formal-write");
  assert.equal(result.latestSafeWriteStatus.canProceedToFormalWrite, true);
  assert.equal(result.manualConfirmationDecision.decisionStatus, "adopt-recommended");
  assert.equal(result.manualConfirmationDecision.canProceedToSafePreviewWrite, true);
});

test("runBatchReviewManualFormalWriteReadinessPreview blocks before recommended confirmation adoption", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-formal-write-manual-decision-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "batch-review-manual-safe-write-preview"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  await writeManualConfirmationDecisionFixture(tempRoot, {
    decisionStatus: "pending",
    decisionNote: "待确认",
  });
  const targetPath = join(tempRoot, "obsidian", "真实批次试跑记录安全写回预览_2026-07-02.md");
  await writeFile(
    targetPath,
    [
      "# 真实批次试跑记录安全写回预览_2026-07-02",
      "",
      "- 目标批次：real-002_to_real-003",
      "- 人工复盘结论：结果区前置后，批次复盘链路可以继续写回。",
      "- 哪几行确认可以正式写回：最卡环节 / 前置模块",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-manual-safe-write-preview",
      "BRS-2026-07-02T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        exportId: "BRS-2026-07-02T10-00-00-000Z",
        exportedAt: "2026-07-02T10:00:00.000Z",
        targetPath,
        sourceMarkdownPath: "/tmp/batch-review-manual-safe-write-preview.md",
        sourceJsonPath: "/tmp/batch-review-manual-safe-write-preview.json",
        readback: { ok: true, matchedExpectedContent: true },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await runBatchReviewManualFormalWriteReadinessPreview({
    manualConfirmationDecisionLoader: async () => ({
      ok: true,
      status: "awaiting-decision",
      decisionStatus: "pending",
      decisionLabel: "待确认",
      canProceedToSafePreviewWrite: false,
    }),
  });

  assert.equal(result.status, "awaiting-manual-decision-adoption");
  assert.equal(result.statusLabel, "先采用推荐确认块");
  assert.equal(result.latestSafeWriteStatus.canProceedToFormalWrite, true);
  assert.equal(result.manualConfirmationDecision.decisionStatus, "pending");
  assert.equal(result.manualConfirmationDecision.canProceedToSafePreviewWrite, false);
});

test("runBatchReviewManualFormalWriteReadinessPreview blocks readback mismatch", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-formal-write-readback-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "batch-review-manual-safe-write-preview"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  const targetPath = join(tempRoot, "obsidian", "真实批次试跑记录安全写回预览_2026-07-02.md");
  await writeFile(
    targetPath,
    [
      "# 真实批次试跑记录安全写回预览_2026-07-02",
      "",
      "- 目标批次：real-002_to_real-003",
      "- 人工复盘结论：结果区前置后，批次复盘链路可以继续写回。",
      "- 哪几行确认可以正式写回：最卡环节 / 前置模块",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-manual-safe-write-preview",
      "BRS-2026-07-02T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        exportId: "BRS-2026-07-02T10-00-00-000Z",
        exportedAt: "2026-07-02T10:00:00.000Z",
        targetPath,
        sourceMarkdownPath: "/tmp/batch-review-manual-safe-write-preview.md",
        sourceJsonPath: "/tmp/batch-review-manual-safe-write-preview.json",
        readback: { ok: true, matchedExpectedContent: false },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await runBatchReviewManualFormalWriteReadinessPreview();

  assert.equal(result.status, "safe-preview-readback-mismatch");
  assert.equal(result.latestSafeWriteStatus.canProceedToFormalWrite, true);
  assert.equal(result.latestSafeWriteStatus.matchedExpectedContent, false);
  assert.ok(result.summary.includes("读回一致性确认"));
});

test("parseBatchReviewManualSafeWritePreviewNote extracts patched markdown from editable preview", () => {
  const source = [
    "# 真实批次试跑记录安全写回预览_2026-07-02",
    "",
    "## 1. 代码侧安全写回预览",
    "",
    "# 真实批次试跑记录安全写回预览",
    "",
    "## 0. 当前状态",
    "- 目标批次：real-002_to_real-003",
    "- 目标记录：/tmp/real-002.md",
    "",
    "## 2. 当前记录原文",
    "",
    "<!-- SAFE_WRITE_CURRENT_START -->",
    "# 原记录",
    "- 这批案例最卡的环节：原值",
    "<!-- SAFE_WRITE_CURRENT_END -->",
    "",
    "## 3. 写回后预览",
    "",
    "<!-- SAFE_WRITE_PATCHED_START -->",
    "# 原记录",
    "- 这批案例最卡的环节：新值",
    "<!-- SAFE_WRITE_PATCHED_END -->",
    "",
    "## 2. 人工补充",
    "- 人工复盘结论：结果区前置后，批次复盘链路可以继续写回。",
    "- 哪几行确认可以正式写回：最卡环节",
    "- 哪几行仍需手改：",
    "- 是否已经可以进入正式写回：可以",
    "",
  ].join("\n");

  const parsed = parseBatchReviewManualSafeWritePreviewNote(source);

  assert.equal(parsed.targetPath, "/tmp/real-002.md");
  assert.equal(parsed.patchedMarkdown, "# 原记录\n- 这批案例最卡的环节：新值");
  assert.equal(parsed.currentMarkdown, "# 原记录\n- 这批案例最卡的环节：原值");
  assert.equal(parsed.canProceedToFormalWrite, true);
});

test("validateManualConfirmationDraft verifies suggested and conservative gate outcomes", () => {
  const source = [
    "# 安全写回预览人工确认填写建议稿",
    "",
    "## 1. 建议填写块",
    "",
    "```markdown",
    "## 4. 人工补充",
    "- 人工复盘结论：本批次可进入阶段性写回。",
    "- 哪几行确认可以正式写回：最卡环节 / UI 优化时机",
    "- 哪几行仍需手改：",
    "- 是否已经可以进入正式写回：可以",
    "```",
    "",
    "## 2. 保守填写块",
    "",
    "```markdown",
    "## 4. 人工补充",
    "- 人工复盘结论：本批次仍需复核措辞。",
    "- 哪几行确认可以正式写回：最卡环节 / UI 优化时机",
    "- 哪几行仍需手改：需人工复核措辞",
    "- 是否已经可以进入正式写回：暂不进入",
    "```",
    "",
    "## 3. 写入后的复查命令",
    "",
  ].join("\n");

  const result = validateManualConfirmationDraft(source);
  const markdown = buildManualConfirmationDraftValidationMarkdown(result);

  assert.equal(result.ok, true);
  assert.equal(result.blocks.length, 2);
  assert.equal(result.blocks[0].key, "suggested");
  assert.equal(result.blocks[0].canProceedToFormalWrite, true);
  assert.equal(result.blocks[1].key, "conservative");
  assert.equal(result.blocks[1].canProceedToFormalWrite, false);
  assert.equal(result.blocks[1].stillNeedsEdit, "需人工复核措辞");
  assert.ok(markdown.includes("人工确认草稿门禁验证报告"));
  assert.ok(markdown.includes("建议填写块会打开正式写回门禁"));
});

test("buildManualConfirmationApplyPreview validates merged safe write copies", () => {
  const safeWriteMarkdown = [
    "# 真实批次试跑记录安全写回预览",
    "",
    "## 0. 当前状态",
    "- 目标批次：real-002_to_real-003",
    "- 目标记录：/tmp/real-002_to_real-003.md",
    "- 当前改写来源：系统建议初稿",
    "",
    "## 2. 当前记录原文",
    "",
    "<!-- SAFE_WRITE_CURRENT_START -->",
    "# 当前记录",
    "<!-- SAFE_WRITE_CURRENT_END -->",
    "",
    "## 3. 写回后预览",
    "",
    "<!-- SAFE_WRITE_PATCHED_START -->",
    "# 写回后记录",
    "<!-- SAFE_WRITE_PATCHED_END -->",
  ].join("\n");
  const draftMarkdown = [
    "# 安全写回预览人工确认填写建议稿",
    "",
    "## 1. 建议填写块",
    "",
    "```markdown",
    "## 4. 人工补充",
    "- 人工复盘结论：本批次可进入阶段性写回。",
    "- 哪几行确认可以正式写回：最卡环节 / UI 优化时机",
    "- 哪几行仍需手改：",
    "- 是否已经可以进入正式写回：可以",
    "```",
    "",
    "## 2. 保守填写块",
    "",
    "```markdown",
    "## 4. 人工补充",
    "- 人工复盘结论：本批次仍需复核措辞。",
    "- 哪几行确认可以正式写回：最卡环节 / UI 优化时机",
    "- 哪几行仍需手改：需人工复核措辞",
    "- 是否已经可以进入正式写回：暂不进入",
    "```",
    "",
    "## 3. 写入后的复查命令",
  ].join("\n");

  const result = buildManualConfirmationApplyPreview({
    safeWriteMarkdown,
    draftMarkdown,
  });
  const markdown = buildManualConfirmationApplyPreviewMarkdown(result);

  assert.equal(result.ok, true);
  assert.equal(result.variants.length, 2);
  assert.equal(result.variants[0].key, "suggested");
  assert.equal(result.variants[0].canProceedToFormalWrite, true);
  assert.equal(result.variants[1].key, "conservative");
  assert.equal(result.variants[1].canProceedToFormalWrite, false);
  assert.ok(result.variants[0].markdown.includes("## 4. 人工补充"));
  assert.ok(markdown.includes("人工确认写入前预演报告"));
  assert.ok(markdown.includes("不写入 Obsidian，不执行正式写回"));
});

test("buildManualConfirmationHandoffPacket creates transfer-ready confirmation block", () => {
  const safeWriteMarkdown = [
    "# 真实批次试跑记录安全写回预览",
    "",
    "## 0. 当前状态",
    "- 目标批次：real-002_to_real-003",
    "- 目标记录：/tmp/real-002_to_real-003.md",
    "- 当前改写来源：系统建议初稿",
    "",
    "## 2. 当前记录原文",
    "",
    "<!-- SAFE_WRITE_CURRENT_START -->",
    "# 当前记录",
    "<!-- SAFE_WRITE_CURRENT_END -->",
    "",
    "## 3. 写回后预览",
    "",
    "<!-- SAFE_WRITE_PATCHED_START -->",
    "# 写回后记录",
    "<!-- SAFE_WRITE_PATCHED_END -->",
  ].join("\n");
  const draftMarkdown = [
    "# 安全写回预览人工确认填写建议稿",
    "",
    "## 1. 建议填写块",
    "",
    "```markdown",
    "## 4. 人工补充",
    "- 人工复盘结论：本批次可进入阶段性写回。",
    "- 哪几行确认可以正式写回：最卡环节 / UI 优化时机",
    "- 哪几行仍需手改：",
    "- 是否已经可以进入正式写回：可以",
    "```",
    "",
    "## 2. 保守填写块",
    "",
    "```markdown",
    "## 4. 人工补充",
    "- 人工复盘结论：本批次仍需复核措辞。",
    "- 哪几行确认可以正式写回：最卡环节 / UI 优化时机",
    "- 哪几行仍需手改：需人工复核措辞",
    "- 是否已经可以进入正式写回：暂不进入",
    "```",
    "",
    "## 3. 写入后的复查命令",
  ].join("\n");
  const applyPreview = buildManualConfirmationApplyPreview({
    safeWriteMarkdown,
    draftMarkdown,
  });
  const packet = buildManualConfirmationHandoffPacket({
    applyPreview,
    draftMarkdown,
    sourcePaths: {
      safeWritePreview: "/tmp/safe-write-preview.md",
      manualConfirmationDraft: "/tmp/manual-confirmation-draft.md",
    },
  });
  const markdown = buildManualConfirmationHandoffPacketMarkdown(packet);

  assert.equal(packet.ok, true);
  assert.equal(packet.status, "ready-for-manual-transfer");
  assert.equal(packet.targetBatchLabel, "real-002_to_real-003");
  assert.equal(packet.targetPath, "/tmp/real-002_to_real-003.md");
  assert.ok(packet.confirmationBlock.includes("## 4. 人工补充"));
  assert.equal(packet.suggestedGateResult.canProceedToFormalWrite, true);
  assert.equal(packet.conservativeGateResult.canProceedToFormalWrite, false);
  assert.ok(markdown.includes("人工确认交接包"));
  assert.ok(markdown.includes("仅生成项目内交接包，不写入 Obsidian，不执行正式写回。"));
  assert.ok(markdown.includes("curl -s http://127.0.0.1:3201/api/batch-review-manual-formal-write-readiness"));
});

test("validateManualConfirmationDecision keeps adoption as an explicit gate", () => {
  const handoffPacket = {
    ok: true,
    targetBatchLabel: "real-002_to_real-003",
    confirmationBlock: [
      "## 4. 人工补充",
      "- 人工复盘结论：本批次可进入阶段性写回。",
      "- 哪几行确认可以正式写回：最卡环节 / UI 优化时机",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
    ].join("\n"),
  };
  const template = buildManualConfirmationDecisionTemplate({
    handoffPacket,
    sourcePaths: {
      manualConfirmationHandoffPacket: "/tmp/manual-confirmation-handoff-packet.md",
    },
  });
  const pendingResult = validateManualConfirmationDecision(template, { handoffPacket });
  const adoptResult = validateManualConfirmationDecision(
    template.replace("- 决策状态：pending", "- 决策状态：adopt-recommended").replace("- 决策说明：待确认", "- 决策说明：采用推荐确认块"),
    { handoffPacket },
  );
  const rejectResult = validateManualConfirmationDecision(
    template.replace("- 决策状态：pending", "- 决策状态：reject-recommended").replace("- 决策说明：待确认", "- 决策说明：暂不采用推荐确认块"),
    { handoffPacket },
  );
  const invalidResult = validateManualConfirmationDecision(
    template.replace("- 决策状态：pending", "- 决策状态：done"),
    { handoffPacket },
  );
  const markdown = buildManualConfirmationDecisionValidationMarkdown(pendingResult);

  assert.equal(pendingResult.ok, true);
  assert.equal(pendingResult.status, "awaiting-decision");
  assert.equal(pendingResult.canProceedToSafePreviewWrite, false);
  assert.equal(adoptResult.ok, true);
  assert.equal(adoptResult.status, "ready-for-safe-preview-write");
  assert.equal(adoptResult.canProceedToSafePreviewWrite, true);
  assert.equal(rejectResult.ok, true);
  assert.equal(rejectResult.status, "decision-rejected");
  assert.equal(rejectResult.canProceedToSafePreviewWrite, false);
  assert.equal(invalidResult.ok, false);
  assert.equal(invalidResult.status, "decision-invalid");
  assert.ok(template.includes("- 决策状态：pending"));
  assert.ok(template.includes("本记录不会写入 Obsidian。"));
  assert.ok(markdown.includes("人工确认决策校验报告"));
  assert.ok(markdown.includes("是否可进入安全预览写入前复查：否"));
});

test("buildManualConfirmationDecisionAdoptionPreview simulates adoption without changing current decision", () => {
  const handoffPacket = {
    ok: true,
    targetBatchLabel: "real-002_to_real-003",
    confirmationBlock: [
      "## 4. 人工补充",
      "- 人工复盘结论：本批次可进入阶段性写回。",
      "- 哪几行确认可以正式写回：最卡环节 / UI 优化时机",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
    ].join("\n"),
  };
  const decisionMarkdown = buildManualConfirmationDecisionTemplate({
    handoffPacket,
    sourcePaths: {
      manualConfirmationHandoffPacket: "/tmp/manual-confirmation-handoff-packet.md",
    },
  });
  const preview = buildManualConfirmationDecisionAdoptionPreview({
    decisionMarkdown,
    handoffPacket,
  });
  const markdown = buildManualConfirmationDecisionAdoptionPreviewMarkdown(preview);

  assert.equal(preview.ok, true);
  assert.equal(preview.status, "adoption-preview-ready");
  assert.equal(preview.currentDecision.status, "awaiting-decision");
  assert.equal(preview.currentDecision.canProceedToSafePreviewWrite, false);
  assert.equal(preview.adoptedDecision.status, "ready-for-safe-preview-write");
  assert.equal(preview.canProceedToSafePreviewWriteAfterAdoption, true);
  assert.ok(preview.adoptedDecisionMarkdown.includes("- 决策状态：adopt-recommended"));
  assert.ok(decisionMarkdown.includes("- 决策状态：pending"));
  assert.ok(markdown.includes("人工确认采用预演报告"));
  assert.ok(markdown.includes("不修改决策记录，不写入 Obsidian，不执行正式写回"));
});

test("buildManualConfirmationDecisionAdoptionPacket creates explicit manual replacements", () => {
  const handoffPacket = {
    ok: true,
    targetBatchLabel: "real-002_to_real-003",
    confirmationBlock: [
      "## 4. 人工补充",
      "- 人工复盘结论：本批次可进入阶段性写回。",
      "- 哪几行确认可以正式写回：最卡环节 / UI 优化时机",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
    ].join("\n"),
  };
  const decisionMarkdown = buildManualConfirmationDecisionTemplate({
    handoffPacket,
    sourcePaths: {
      manualConfirmationHandoffPacket: "/tmp/manual-confirmation-handoff-packet.md",
    },
  });
  const packet = buildManualConfirmationDecisionAdoptionPacket({
    decisionMarkdown,
    handoffPacket,
    sourcePaths: {
      decision: "/tmp/manual-confirmation-decision.md",
      handoffPacket: "/tmp/manual-confirmation-handoff-packet.json",
    },
  });
  const markdown = buildManualConfirmationDecisionAdoptionPacketMarkdown(packet);

  assert.equal(packet.ok, true);
  assert.equal(packet.status, "adoption-packet-ready");
  assert.equal(packet.replacements.length, 2);
  assert.equal(packet.replacements[0].from, "- 决策状态：pending");
  assert.equal(packet.replacements[0].to, "- 决策状态：adopt-recommended");
  assert.equal(packet.currentDecision.status, "awaiting-decision");
  assert.equal(packet.adoptedDecision.status, "ready-for-safe-preview-write");
  assert.equal(packet.canProceedToSafePreviewWriteAfterAdoption, true);
  assert.ok(markdown.includes("人工采用操作包"));
  assert.ok(markdown.includes("不修改决策记录，不写入 Obsidian，不执行正式写回"));
  assert.ok(markdown.includes("```diff"));
});

test("buildManualConfirmationDecisionAdoptionPacket reports an already applied adoption", () => {
  const handoffPacket = {
    ok: true,
    targetBatchLabel: "real-002_to_real-003",
    confirmationBlock: [
      "## 4. 人工补充",
      "- 人工复盘结论：本批次可进入阶段性写回。",
      "- 哪几行确认可以正式写回：最卡环节 / UI 优化时机",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
    ].join("\n"),
  };
  const decisionMarkdown = buildManualConfirmationDecisionTemplate({
    handoffPacket,
    sourcePaths: {
      manualConfirmationHandoffPacket: "/tmp/manual-confirmation-handoff-packet.md",
    },
  })
    .replace("- 决策状态：pending", "- 决策状态：adopt-recommended")
    .replace("- 决策说明：待确认", "- 决策说明：采用推荐确认块");
  const packet = buildManualConfirmationDecisionAdoptionPacket({
    decisionMarkdown,
    handoffPacket,
  });
  const markdown = buildManualConfirmationDecisionAdoptionPacketMarkdown(packet);

  assert.equal(packet.ok, true);
  assert.equal(packet.status, "adoption-packet-applied");
  assert.equal(packet.currentDecision.status, "ready-for-safe-preview-write");
  assert.equal(packet.canProceedToSafePreviewWriteAfterAdoption, true);
  assert.ok(markdown.includes("操作包状态：已应用"));
});

test("buildManualConfirmationSafePreviewAdoptionPacket summarizes the next safe preview write step", () => {
  const packet = buildManualConfirmationSafePreviewAdoptionPacket({
    applyPreview: {
      ok: true,
      variants: [
        {
          key: "suggested",
          label: "建议填写块",
          ok: true,
          canProceedToFormalWrite: true,
          targetBatchLabel: "real-002_to_real-003",
          outputPath: "/tmp/suggested-safe-write-preview.md",
          manualReviewConclusion: "本批次输入准备阶段最容易卡住。",
          confirmedLines: "这批案例最卡的环节 / UI 优化是否已经到时机",
          stillNeedsEdit: "",
          readyDecision: "可以",
        },
      ],
    },
    decision: {
      decisionStatus: "adopt-recommended",
      decisionLabel: "采用推荐确认块",
      canProceedToSafePreviewWrite: true,
      targetBatchLabel: "real-002_to_real-003",
    },
    sourcePaths: {
      latestSafeWritePreview: "/tmp/真实批次试跑记录安全写回预览.md",
    },
  });
  const markdown = buildManualConfirmationSafePreviewAdoptionPacketMarkdown(packet);

  assert.equal(packet.ok, true);
  assert.equal(packet.status, "safe-preview-adoption-packet-ready");
  assert.equal(packet.targetBatchLabel, "real-002_to_real-003");
  assert.equal(packet.canProceedToFormalWriteAfterApply, true);
  assert.ok(markdown.includes("安全预览确认采用包"));
  assert.ok(markdown.includes("/tmp/真实批次试跑记录安全写回预览.md"));
  assert.ok(markdown.includes("本批次输入准备阶段最容易卡住。"));
  assert.ok(markdown.includes("不写入 Obsidian，不执行正式写回"));
});

test("buildManualConfirmationSafePreviewAdoptionPacket blocks before manual decision adoption", () => {
  const packet = buildManualConfirmationSafePreviewAdoptionPacket({
    applyPreview: {
      ok: true,
      variants: [
        {
          key: "suggested",
          ok: true,
          canProceedToFormalWrite: true,
        },
      ],
    },
    decision: {
      decisionStatus: "pending",
      decisionLabel: "待确认",
      canProceedToSafePreviewWrite: false,
    },
  });

  assert.equal(packet.ok, false);
  assert.equal(packet.status, "safe-preview-adoption-packet-blocked");
});

test("buildManualConfirmationSafePreviewWritePrecheck compares current and suggested confirmations", () => {
  const currentMarkdown = [
    "# 安全写回预览",
    "",
    "- 目标批次：real-002_to_real-003",
    "- 目标记录：/tmp/real-002.md",
    "- 改写来源：系统建议初稿",
    "",
    "## 4. 人工补充",
    "- 人工复盘结论：",
    "- 哪几行确认可以正式写回：",
    "- 哪几行仍需手改：",
    "- 是否已经可以进入正式写回：",
  ].join("\n");
  const suggestedMarkdown = [
    "# 安全写回预览",
    "",
    "- 目标批次：real-002_to_real-003",
    "- 目标记录：/tmp/real-002.md",
    "- 改写来源：系统建议初稿",
    "",
    "## 4. 人工补充",
    "- 人工复盘结论：本批次输入准备阶段最容易卡住。",
    "- 哪几行确认可以正式写回：这批案例最卡的环节 / UI 优化是否已经到时机",
    "- 哪几行仍需手改：",
    "- 是否已经可以进入正式写回：可以",
  ].join("\n");
  const precheck = buildManualConfirmationSafePreviewWritePrecheck({
    currentMarkdown,
    suggestedMarkdown,
    adoptionPacket: {
      ok: true,
      targetBatchLabel: "real-002_to_real-003",
      targetSafePreviewPath: "/tmp/safe-write-preview.md",
      suggestedPreviewPath: "/tmp/suggested-safe-write-preview.md",
    },
  });
  const markdown = buildManualConfirmationSafePreviewWritePrecheckMarkdown(precheck);

  assert.equal(precheck.ok, true);
  assert.equal(precheck.status, "safe-preview-write-precheck-ready");
  assert.equal(precheck.before.canProceedToFormalWrite, false);
  assert.equal(precheck.after.canProceedToFormalWrite, true);
  assert.equal(precheck.targetMatches, true);
  assert.equal(precheck.changedFieldCount, 3);
  assert.equal(precheck.confirmation.requiredPhrase, "确认写入安全预览确认块");
  assert.equal(precheck.nextAction.actionId, "apply-manual-confirmation-safe-preview-write");
  assert.equal(precheck.nextAction.requiredPhrase, "确认写入安全预览确认块");
  assert.equal(precheck.writePlan.targetPath, "/tmp/safe-write-preview.md");
  assert.equal(precheck.writePlan.sourcePath, "/tmp/suggested-safe-write-preview.md");
  assert.equal(precheck.writePlan.requiredPhrase, "确认写入安全预览确认块");
  assert.equal(precheck.writePlan.changedFieldCount, 3);
  assert.ok(precheck.writePlan.suggestedContentLength > precheck.writePlan.currentContentLength);
  assert.ok(precheck.writePlan.postWriteChecks.includes("读回失败时恢复写入前内容。"));
  assert.ok(markdown.includes("安全预览确认写入预检"));
  assert.ok(markdown.includes("## 2. 写入执行计划"));
  assert.ok(markdown.includes("写入确认短语：确认写入安全预览确认块"));
  assert.ok(markdown.includes("读回失败时恢复写入前内容。"));
  assert.ok(markdown.includes("写入后是否可进入正式写回复查：是"));
  assert.ok(markdown.includes("确认短语：确认写入安全预览确认块"));
  assert.ok(markdown.includes("推荐动作：写入安全预览确认块"));
  assert.ok(markdown.includes("本批次输入准备阶段最容易卡住。"));
  assert.ok(markdown.includes("不写入 Obsidian，不执行正式写回"));
});

test("buildManualFormalWriteExecutionPrecheck summarizes final read-only gate", () => {
  const precheck = buildManualFormalWriteExecutionPrecheck({
    readiness: {
      status: "ready-to-formal-write",
      statusLabel: "可以正式写回",
      summary: "安全预览已完成人工确认。",
      manualConfirmationDecision: {
        decisionStatus: "adopt-recommended",
        decisionLabel: "采用推荐确认块",
        canProceedToSafePreviewWrite: true,
      },
      latestSafeWriteStatus: {
        targetBatchLabel: "real-002_to_real-003",
        targetPath: "/tmp/safe-write-preview.md",
        readbackOk: true,
        matchedExpectedContent: true,
        hasManualConfirmation: true,
        canProceedToFormalWrite: true,
        parsed: {
          targetPath: "/tmp/real-002.md",
          patchedMarkdown: "# 批次记录\n\n- 人工复盘结论：可以正式写回",
        },
      },
    },
    confirmationPhrase: BATCH_REVIEW_MANUAL_FORMAL_WRITE_PHRASE,
  });
  const markdown = buildManualFormalWriteExecutionPrecheckMarkdown(precheck);

  assert.equal(precheck.ok, true);
  assert.equal(precheck.status, "formal-write-execution-precheck-ready");
  assert.equal(precheck.confirmation.requiredPhrase, "确认执行正式写回");
  assert.equal(precheck.target.targetRecordPath, "/tmp/real-002.md");
  assert.equal(precheck.target.hasPatchedMarkdown, true);
  assert.equal(precheck.manualDecision.decisionLabel, "采用推荐确认块");
  assert.equal(precheck.manualDecision.adopted, true);
  assert.deepEqual(precheck.blockers, []);
  assert.equal(precheck.nextAction.actionId, "export-manual-review-formal-write");
  assert.equal(precheck.nextAction.requiredPhrase, "确认执行正式写回");
  assert.ok(markdown.includes("正式写回执行前预检"));
  assert.ok(markdown.includes("确认执行正式写回"));
  assert.ok(markdown.includes("当前没有阻塞点"));
  assert.ok(markdown.includes("推荐动作：执行正式写回"));
  assert.ok(markdown.includes("仅生成正式写回执行前只读预检，不写入 Obsidian，不执行正式写回。"));
});

test("buildManualFormalWriteExecutionPacket summarizes final write plan and rollback", () => {
  const packet = buildManualFormalWriteExecutionPacket({
    precheck: {
      ok: true,
      status: "formal-write-execution-precheck-ready",
      confirmation: {
        requiredPhrase: BATCH_REVIEW_MANUAL_FORMAL_WRITE_PHRASE,
      },
      blockers: [],
    },
    readiness: {
      latestSafeWriteStatus: {
        targetBatchLabel: "real-002_to_real-003",
        targetPath: "/tmp/safe-write-preview.md",
        manualReviewConclusion: "安全预览可以作为正式写回依据。",
        parsed: {
          targetPath: "/tmp/real-002.md",
          patchedMarkdown: "# 批次记录\n\n- 人工复盘结论：可以正式写回",
          parsed: {
            confirmedLines: "这批试跑最关键的结论",
            readyDecision: "可以",
          },
        },
      },
    },
    currentTargetMarkdown: "# 旧批次记录\n\n- 本批结论：\n",
    patchedMarkdown: "# 批次记录\n\n- 人工复盘结论：可以正式写回",
    outputPaths: {
      sourceMarkdownPath: "/tmp/batch-review-manual-formal-write.md",
      sourceJsonPath: "/tmp/batch-review-manual-formal-write.json",
      sourcePreviousMarkdownPath: "/tmp/batch-review-manual-formal-write.previous.md",
      logDirectory: "/tmp/logs",
    },
  });
  const markdown = buildManualFormalWriteExecutionPacketMarkdown(packet);

  assert.equal(packet.ok, true);
  assert.equal(packet.status, "formal-write-execution-packet-ready");
  assert.equal(packet.target.targetRecordPath, "/tmp/real-002.md");
  assert.equal(packet.confirmation.requiredPhrase, "确认执行正式写回");
  assert.equal(packet.writePlan.willOverwriteTargetRecord, true);
  assert.equal(packet.writePlan.sourcePreviousMarkdownPath, "/tmp/batch-review-manual-formal-write.previous.md");
  assert.ok(packet.writePlan.finalContentLength > packet.writePlan.previousContentLength);
  assert.equal(packet.lineDiff.hasChanges, true);
  assert.ok(packet.lineDiff.addedLineCount > 0);
  assert.ok(packet.lineDiff.removedLineCount > 0);
  assert.ok(packet.lineDiff.hunkCount > 0);
  assert.equal(packet.rollback.restoreWhenReadbackMismatch, true);
  assert.equal(packet.rollback.readbackMustMatchFinalMarkdown, true);
  assert.equal(packet.nextAction.actionId, "export-manual-review-formal-write");
  assert.ok(markdown.includes("正式写回执行包"));
  assert.ok(markdown.includes("写入前快照：/tmp/batch-review-manual-formal-write.previous.md"));
  assert.ok(markdown.includes("读回不一致时恢复：是"));
  assert.ok(markdown.includes("## 3. 行级差异审计"));
  assert.ok(markdown.includes("新增行数："));
  assert.ok(markdown.includes("### hunk-1"));
  assert.ok(markdown.includes("+ - 人工复盘结论：可以正式写回"));
  assert.ok(markdown.includes("动作短语：确认执行正式写回"));
  assert.ok(markdown.includes("仅生成正式写回执行包，不写入 Obsidian，不执行正式写回。"));
});

test("buildManualFormalWriteLineDiff keeps compact hunks for markdown changes", () => {
  const diff = buildManualFormalWriteLineDiff({
    previousMarkdown: "# 标题\n- A：旧值\n- B：保留\n",
    finalMarkdown: "# 标题\n- A：新值\n- B：保留\n- C：新增\n",
    maxHunks: 2,
  });

  assert.equal(diff.hasChanges, true);
  assert.equal(diff.removedLineCount, 1);
  assert.equal(diff.addedLineCount, 2);
  assert.equal(diff.hunkCount, 2);
  assert.equal(diff.truncated, false);
  assert.deepEqual(diff.hunks[0].removedLines, ["- A：旧值"]);
  assert.deepEqual(diff.hunks[0].addedLines, ["- A：新值"]);
});

test("buildManualFormalWritePostExecutionAcceptance waits before formal write and passes after readback", () => {
  const executionPacket = {
    status: "formal-write-execution-packet-ready",
    target: {
      batchLabel: "real-002_to_real-003",
      targetRecordPath: "/tmp/real-002.md",
      safePreviewPath: "/tmp/safe-preview.md",
    },
    confirmation: {
      requiredPhrase: BATCH_REVIEW_MANUAL_FORMAL_WRITE_PHRASE,
    },
    writePlan: {
      sourceMarkdownPath: "/tmp/final.md",
      sourceJsonPath: "/tmp/final.json",
    },
    rollback: {
      previousSnapshotPath: "/tmp/previous.md",
    },
    lineDiff: {
      hunkCount: 4,
    },
  };
  const waiting = buildManualFormalWritePostExecutionAcceptance({ executionPacket });
  const waitingMarkdown = buildManualFormalWritePostExecutionAcceptanceMarkdown(waiting);

  assert.equal(waiting.ok, false);
  assert.equal(waiting.status, "formal-write-post-execution-acceptance-waiting");
  assert.equal(waiting.passedCount, 0);
  assert.equal(waiting.totalCount, 5);
  assert.equal(waiting.nextAction.requiredPhrase, "确认执行正式写回");
  assert.ok(waitingMarkdown.includes("正式写回后验收包"));
  assert.ok(waitingMarkdown.includes("验收进度：0 / 5"));
  assert.ok(waitingMarkdown.includes("动作短语：确认执行正式写回"));

  const passed = buildManualFormalWritePostExecutionAcceptance({
    executionPacket,
    formalWriteExport: {
      ok: true,
      exportId: "BRF-test",
      exportedAt: "2026-07-29T02:40:00.000Z",
      safeWriteNotePath: "/tmp/safe-preview.md",
      targetPath: "/tmp/real-002.md",
      sourceMarkdownPath: "/tmp/final.md",
      sourceJsonPath: "/tmp/final.json",
      sourcePreviousMarkdownPath: "/tmp/previous.md",
      readback: {
        ok: true,
        matchedExpectedContent: true,
      },
      followUpTasks: [
        { label: "规则修订任务单" },
        { label: "关键样例复跑" },
      ],
    },
  });

  assert.equal(passed.ok, true);
  assert.equal(passed.status, "formal-write-post-execution-acceptance-passed");
  assert.equal(passed.passedCount, 5);
  assert.equal(passed.nextAction.actionId, "review-formal-write-follow-up");
});

test("buildPiEngineExecutionPositionAudit marks formal write as the current PI Engine position", () => {
  const audit = buildPiEngineExecutionPositionAudit({
    artifactPaths: {
      requirementSpecPath: "/project/docs/prd/AI封面创意助手重做_Requirement_Spec_v0.1.md",
      prdInformationArchitecturePath: "/project/docs/prd/AI封面创意助手_MVP重做_PRD_信息架构确认_v0.1.md",
      architecturePlanPath: "/project/docs/architecture/AI封面创意助手产品线重做架构计划_v0.1.md",
      safePreviewConfirmationRecordPath: "/project/docs/operations/2026-07-29_安全预览确认块写入执行记录.md",
      formalWriteExecutionPacketPath: "/project/outputs/manual-formal-write-execution-packet.md",
      postExecutionAcceptancePath: "/project/outputs/manual-formal-write-post-execution-acceptance.md",
    },
    formalWriteReadiness: {
      status: "ready-to-formal-write",
      summary: "安全预览已完成人工确认。",
    },
    formalWriteExecutionPacket: {
      status: "formal-write-execution-packet-ready",
      confirmation: {
        requiredPhrase: "确认执行正式写回",
      },
      lineDiff: {
        hunkCount: 4,
      },
    },
    postExecutionAcceptance: {
      status: "formal-write-post-execution-acceptance-waiting",
      passedCount: 0,
      totalCount: 5,
    },
  });
  const markdown = buildPiEngineExecutionPositionAuditMarkdown(audit);

  assert.equal(audit.ok, true);
  assert.equal(audit.status, "formal-write-waiting-for-confirmation");
  assert.equal(audit.mode.piEngineMode, "maintenance");
  assert.equal(audit.artifactProgress.presentCount, 6);
  assert.equal(audit.goalCompletion.status, "waiting-for-formal-write-confirmation");
  assert.equal(audit.goalCompletion.completedCount, 6);
  assert.equal(audit.goalCompletion.totalCount, 8);
  assert.equal(audit.goalCompletion.remainingRequiredAction.requiredPhrase, "确认执行正式写回");
  assert.equal(audit.nextAction.actionId, "export-manual-review-formal-write");
  assert.equal(audit.nextAction.requiredPhrase, "确认执行正式写回");
  assert.ok(audit.blockedRepeats.includes("不重新生成 Requirement Spec"));
  assert.ok(markdown.includes("PI Engine 执行位点审计"));
  assert.ok(markdown.includes("目标完成度：6 / 8"));
  assert.ok(markdown.includes("执行正式写回：[waiting-for-confirmation]"));
  assert.ok(markdown.includes("不重新生成 PRD 信息架构"));
  assert.ok(markdown.includes("动作短语：确认执行正式写回"));
});

test("buildPiEngineExecutionPositionAudit completes after formal write acceptance passes", () => {
  const audit = buildPiEngineExecutionPositionAudit({
    artifactPaths: {
      requirementSpecPath: "/project/docs/prd/AI封面创意助手重做_Requirement_Spec_v0.1.md",
      prdInformationArchitecturePath: "/project/docs/prd/AI封面创意助手_MVP重做_PRD_信息架构确认_v0.1.md",
      architecturePlanPath: "/project/docs/architecture/AI封面创意助手产品线重做架构计划_v0.1.md",
      safePreviewConfirmationRecordPath: "/project/docs/operations/2026-07-29_安全预览确认块写入执行记录.md",
      formalWriteExecutionPacketPath: "/project/outputs/manual-formal-write-execution-packet.md",
      postExecutionAcceptancePath: "/project/outputs/manual-formal-write-post-execution-acceptance.md",
    },
    formalWriteReadiness: {
      status: "ready-to-formal-write",
      summary: "安全预览已完成人工确认。",
    },
    formalWriteExecutionPacket: {
      status: "formal-write-execution-packet-ready",
      confirmation: {
        requiredPhrase: "确认执行正式写回",
      },
      lineDiff: {
        hunkCount: 4,
      },
    },
    postExecutionAcceptance: {
      status: "formal-write-post-execution-acceptance-passed",
      passedCount: 5,
      totalCount: 5,
    },
  });
  const markdown = buildPiEngineExecutionPositionAuditMarkdown(audit);

  assert.equal(audit.status, "post-formal-write-follow-up");
  assert.equal(audit.goalCompletion.status, "complete");
  assert.equal(audit.goalCompletion.completedCount, 8);
  assert.equal(audit.goalCompletion.totalCount, 8);
  assert.equal(audit.nextAction.actionId, "review-formal-write-follow-up");
  assert.ok(markdown.includes("目标完成度：8 / 8"));
  assert.ok(markdown.includes("执行正式写回：[completed]"));
  assert.ok(markdown.includes("完成写回后验收：[completed]"));
});

test("buildFormalWriteFollowUpPlan combines rule revision and key rerun first version", () => {
  const plan = buildFormalWriteFollowUpPlan({
    formalWriteExport: {
      exportId: "BRF-test",
      targetPath: "/tmp/real-002.md",
      manualReviewConclusion: "输入准备阶段存在重复摩擦点。",
      confirmedLines: "这批案例最卡的环节 / 当前更像功能问题，还是界面问题",
      followUpTasks: [
        {
          taskId: "rule-revision-task-sheet",
          taskType: "rule-revision",
          label: "规则修订任务单",
          summary: "整理可进入规则引擎下一轮调整的重复摩擦点。",
          evidence: ["输入准备阶段存在重复摩擦点。"],
        },
        {
          taskId: "key-case-rerun-plan",
          taskType: "key-case-rerun",
          label: "关键样例复跑",
          summary: "验证写回判断对主链路的影响。",
          evidence: ["输入准备阶段存在重复摩擦点。"],
        },
      ],
    },
    postExecutionAcceptance: {
      status: "formal-write-post-execution-acceptance-passed",
    },
    piEngineExecutionPositionAudit: {
      status: "post-formal-write-follow-up",
      goalCompletion: {
        status: "complete",
        completedCount: 8,
        totalCount: 8,
      },
    },
    ruleRevisionReport: {
      summary: {
        taskCount: 1,
        sourceSampleCount: 1,
        p1Count: 0,
        p2Count: 0,
        p3Count: 1,
      },
      tasks: [
        {
          taskId: "REV-001",
          taskTitle: "补强输入准备提示",
          priority: "P3",
          caseIds: ["sample-001"],
        },
      ],
    },
    keyCaseRerunPlan: {
      planId: "key-case-rerun-generated",
      caseIds: ["sample-001"],
      formalWriteCandidateBatches: [
        {
          batchLabel: "real-002_to_real-003",
          taskId: "key-case-rerun-plan",
          status: "pending",
          executionMode: "manual-review-required",
          summary: "将 real-002_to_real-003 纳入规则调整后的关键样例复跑候选。",
        },
      ],
      downstreamRefreshTargets: ["reviewed-misclassified", "rule-revision-task-sheet"],
    },
    keyCaseRerunReport: {
      plan: {
        planId: "key-case-rerun-generated",
      },
      summary: {
        rerunCaseCount: 1,
      },
    },
    keyCaseRerunDiff: {
      summary: {
        changedCaseCount: 0,
      },
    },
  });
  const markdown = buildFormalWriteFollowUpPlanMarkdown(plan);

  assert.equal(plan.ok, true);
  assert.equal(plan.status, "formal-write-follow-up-plan-ready");
  assert.equal(plan.sections.ruleRevision.label, "规则修订任务单已生成");
  assert.equal(plan.sections.keyCaseRerun.label, "关键样例复跑计划已生成");
  assert.equal(plan.sections.ruleRevision.existingReport.taskCount, 1);
  assert.equal(plan.sections.keyCaseRerun.plan.caseIds.length, 1);
  assert.equal(plan.sections.keyCaseRerun.plan.formalWriteCandidateBatches[0].batchLabel, "real-002_to_real-003");
  assert.equal(plan.commandChain.length, 5);
  assert.ok(markdown.includes("# 正式写回后承接计划"));
  assert.ok(markdown.includes("## 1. 规则修订任务单"));
  assert.ok(markdown.includes("## 2. 关键样例复跑计划"));
  assert.ok(markdown.includes("正式写回候选批次：real-002_to_real-003"));
  assert.ok(markdown.includes("npm run generate:key-case-rerun-plan"));
});

test("buildManualConfirmationSafePreviewWriteProjection forecasts formal write readiness", () => {
  const projection = buildManualConfirmationSafePreviewWriteProjection({
    writePrecheck: {
      ok: true,
      status: "safe-preview-write-precheck-ready",
      targetBatchLabel: "real-002_to_real-003",
      targetSafePreviewPath: "/tmp/safe-write-preview.md",
      suggestedPreviewPath: "/tmp/suggested-safe-write-preview.md",
      changedFieldCount: 3,
      confirmation: {
        requiredPhrase: "确认写入安全预览确认块",
      },
      after: {
        hasManualConfirmation: true,
        canProceedToFormalWrite: true,
      },
    },
    manualDecision: {
      decisionStatus: "adopt-recommended",
      decisionLabel: "采用推荐确认块",
      canProceedToSafePreviewWrite: true,
    },
  });
  const markdown = buildManualConfirmationSafePreviewWriteProjectionMarkdown(projection);

  assert.equal(projection.ok, true);
  assert.equal(projection.status, "safe-preview-write-projection-ready-to-formal-write");
  assert.equal(projection.projectedReadiness.status, "ready-to-formal-write");
  assert.equal(projection.nextAction.actionId, "apply-manual-confirmation-safe-preview-write");
  assert.equal(projection.nextAction.requiredPhrase, "确认写入安全预览确认块");
  assert.deepEqual(projection.blockers, []);
  assert.ok(markdown.includes("安全预览确认写入后门禁投影"));
  assert.ok(markdown.includes("预计 readiness：ready-to-formal-write"));
  assert.ok(markdown.includes("当前没有投影阻塞点"));
  assert.ok(markdown.includes("不写入 Obsidian，不执行正式写回"));
});

test("buildManualConfirmationSafePreviewWriteProjection blocks before manual decision adoption", () => {
  const projection = buildManualConfirmationSafePreviewWriteProjection({
    writePrecheck: {
      ok: true,
      after: {
        hasManualConfirmation: true,
        canProceedToFormalWrite: true,
      },
    },
    manualDecision: {
      decisionStatus: "pending",
      decisionLabel: "待确认",
      canProceedToSafePreviewWrite: false,
    },
  });

  assert.equal(projection.ok, false);
  assert.equal(projection.status, "safe-preview-write-projection-blocked");
  assert.equal(projection.blockers[0].code, "manual-decision-not-adopted");
});

test("buildManualFormalWriteExecutionPrecheck stays blocked before readiness", () => {
  const precheck = buildManualFormalWriteExecutionPrecheck({
    readiness: {
      status: "awaiting-safe-write-confirmation",
      statusLabel: "先补安全写回确认",
      latestSafeWriteStatus: {
        targetBatchLabel: "real-002_to_real-003",
        targetPath: "/tmp/safe-write-preview.md",
        readbackOk: true,
        matchedExpectedContent: true,
        canProceedToFormalWrite: false,
        parsed: {
          targetPath: "/tmp/real-002.md",
          patchedMarkdown: "# 批次记录",
        },
      },
      manualConfirmationDecision: {
        decisionStatus: "adopt-recommended",
        decisionLabel: "采用推荐确认块",
        canProceedToSafePreviewWrite: true,
      },
    },
  });

  assert.equal(precheck.ok, false);
  assert.equal(precheck.status, "formal-write-execution-precheck-blocked");
  assert.equal(precheck.target.canProceedToFormalWrite, false);
  assert.equal(precheck.blockers[0].code, "missing-manual-confirmation");
  assert.equal(precheck.nextAction.actionId, "apply-manual-confirmation-safe-preview-write");
  assert.equal(precheck.nextAction.requiredPhrase, "确认写入安全预览确认块");
});

test("applyManualConfirmationSafePreviewWrite requires explicit confirmation phrase", async () => {
  await assert.rejects(
    () =>
      applyManualConfirmationSafePreviewWrite({
        confirmationPhrase: "",
        runPrecheckStatus: async () => ({
          ok: true,
          status: "safe-preview-write-precheck-ready",
        }),
      }),
    /请输入确认短语：确认写入安全预览确认块/,
  );
});

test("applyManualConfirmationSafePreviewWrite applies suggested preview with readback", async () => {
  const tempDir = await mkdtemp(join(os.tmpdir(), "safe-preview-write-"));
  const currentPath = join(tempDir, "current.md");
  const suggestedPath = join(tempDir, "suggested.md");
  const currentMarkdown = [
    "# 安全写回预览",
    "",
    "- 目标批次：real-002_to_real-003",
    "",
    "## 4. 人工补充",
    "- 人工复盘结论：",
  ].join("\n");
  const suggestedMarkdown = [
    "# 安全写回预览",
    "",
    "- 目标批次：real-002_to_real-003",
    "",
    "## 4. 人工补充",
    "- 人工复盘结论：本批次可进入阶段性写回。",
    "- 哪几行确认可以正式写回：最卡环节 / UI 优化时机",
    "- 哪几行仍需手改：",
    "- 是否已经可以进入正式写回：可以",
  ].join("\n");

  await writeFile(currentPath, currentMarkdown, "utf-8");
  await writeFile(suggestedPath, suggestedMarkdown, "utf-8");

  const result = await applyManualConfirmationSafePreviewWrite({
    confirmationPhrase: MANUAL_CONFIRMATION_SAFE_PREVIEW_WRITE_PHRASE,
    runPrecheckStatus: async () => ({
      ok: true,
      status: "safe-preview-write-precheck-ready",
      summary: "预检通过",
      targetBatchLabel: "real-002_to_real-003",
      targetSafePreviewPath: currentPath,
      suggestedPreviewPath: suggestedPath,
      changedFieldCount: 3,
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, "safe-preview-confirmation-applied");
  assert.equal(result.readback.matchedExpectedContent, true);
  assert.equal(await readFile(currentPath, "utf-8"), `${suggestedMarkdown}\n`);
});

test("applyManualConfirmationSafePreviewWrite blocks when precheck is not ready", async () => {
  await assert.rejects(
    () =>
      applyManualConfirmationSafePreviewWrite({
        confirmationPhrase: MANUAL_CONFIRMATION_SAFE_PREVIEW_WRITE_PHRASE,
        runPrecheckStatus: async () => ({
          ok: false,
          status: "safe-preview-write-precheck-blocked",
          summary: "批次匹配未通过。",
        }),
      }),
    /批次匹配未通过/,
  );
});

test("buildManualConfirmationDecisionRejectionPreview simulates rejection without unlocking writeback", () => {
  const handoffPacket = {
    ok: true,
    targetBatchLabel: "real-002_to_real-003",
    confirmationBlock: [
      "## 4. 人工补充",
      "- 人工复盘结论：本批次可进入阶段性写回。",
      "- 哪几行确认可以正式写回：最卡环节 / UI 优化时机",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
    ].join("\n"),
  };
  const decisionMarkdown = buildManualConfirmationDecisionTemplate({
    handoffPacket,
    sourcePaths: {
      manualConfirmationHandoffPacket: "/tmp/manual-confirmation-handoff-packet.md",
    },
  });
  const preview = buildManualConfirmationDecisionRejectionPreview({
    decisionMarkdown,
    handoffPacket,
  });
  const markdown = buildManualConfirmationDecisionRejectionPreviewMarkdown(preview);

  assert.equal(preview.ok, true);
  assert.equal(preview.status, "rejection-preview-ready");
  assert.equal(preview.currentDecision.status, "awaiting-decision");
  assert.equal(preview.rejectedDecision.status, "decision-rejected");
  assert.equal(preview.canProceedToSafePreviewWriteAfterRejection, false);
  assert.ok(preview.rejectedDecisionMarkdown.includes("- 决策状态：reject-recommended"));
  assert.ok(decisionMarkdown.includes("- 决策状态：pending"));
  assert.ok(markdown.includes("人工确认暂不采用预演报告"));
  assert.ok(markdown.includes("暂不采用后是否进入安全预览写入前复查：否"));
  assert.ok(markdown.includes("不修改决策记录，不写入 Obsidian，不执行正式写回"));
});

test("buildManualConfirmationDecisionRejectionPacket creates explicit rejection replacements", () => {
  const handoffPacket = {
    ok: true,
    targetBatchLabel: "real-002_to_real-003",
    confirmationBlock: [
      "## 4. 人工补充",
      "- 人工复盘结论：本批次可进入阶段性写回。",
      "- 哪几行确认可以正式写回：最卡环节 / UI 优化时机",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
    ].join("\n"),
  };
  const decisionMarkdown = buildManualConfirmationDecisionTemplate({
    handoffPacket,
    sourcePaths: {
      manualConfirmationHandoffPacket: "/tmp/manual-confirmation-handoff-packet.md",
    },
  });
  const packet = buildManualConfirmationDecisionRejectionPacket({
    decisionMarkdown,
    handoffPacket,
    sourcePaths: {
      decision: "/tmp/manual-confirmation-decision.md",
      handoffPacket: "/tmp/manual-confirmation-handoff-packet.json",
    },
  });
  const markdown = buildManualConfirmationDecisionRejectionPacketMarkdown(packet);

  assert.equal(packet.ok, true);
  assert.equal(packet.status, "rejection-packet-ready");
  assert.equal(packet.replacements.length, 2);
  assert.equal(packet.replacements[0].from, "- 决策状态：pending");
  assert.equal(packet.replacements[0].to, "- 决策状态：reject-recommended");
  assert.equal(packet.currentDecision.status, "awaiting-decision");
  assert.equal(packet.rejectedDecision.status, "decision-rejected");
  assert.equal(packet.canProceedToSafePreviewWriteAfterRejection, false);
  assert.ok(markdown.includes("人工暂不采用操作包"));
  assert.ok(markdown.includes("暂不采用后是否进入安全预览写入前复查：否"));
  assert.ok(markdown.includes("不修改决策记录，不写入 Obsidian，不执行正式写回"));
  assert.ok(markdown.includes("```diff"));
});

test("buildManualConfirmationDecisionOptionsIndex summarizes adoption and rejection paths", () => {
  const decision = {
    ok: true,
    decisionStatus: "pending",
    decisionLabel: "待确认",
  };
  const adoptionPreview = {
    ok: true,
    status: "adoption-preview-ready",
    canProceedToSafePreviewWriteAfterAdoption: true,
  };
  const adoptionPacket = {
    ok: true,
    status: "adoption-packet-ready",
    outputPaths: {
      markdown: "/tmp/manual-confirmation-decision-adoption-packet.md",
    },
  };
  const rejectionPreview = {
    ok: true,
    status: "rejection-preview-ready",
    canProceedToSafePreviewWriteAfterRejection: false,
  };
  const rejectionPacket = {
    ok: true,
    status: "rejection-packet-ready",
    outputPaths: {
      markdown: "/tmp/manual-confirmation-decision-rejection-packet.md",
    },
  };
  const index = buildManualConfirmationDecisionOptionsIndex({
    decision,
    adoptionPreview,
    adoptionPacket,
    rejectionPreview,
    rejectionPacket,
    adoptionPacketPath: "/tmp/manual-confirmation-decision-adoption-packet.md",
    rejectionPacketPath: "/tmp/manual-confirmation-decision-rejection-packet.md",
  });
  const markdown = buildManualConfirmationDecisionOptionsIndexMarkdown(index);

  assert.equal(index.ok, true);
  assert.equal(index.status, "awaiting-manual-choice");
  assert.equal(index.adoption.result, "进入安全预览写入前复查");
  assert.equal(index.rejection.result, "正式写回保持锁定");
  assert.equal(index.rejection.canProceedToSafePreviewWrite, false);
  assert.ok(markdown.includes("人工确认决策选择索引"));
  assert.ok(markdown.includes("采用推荐确认块"));
  assert.ok(markdown.includes("暂不采用推荐确认块"));
  assert.ok(markdown.includes("/tmp/manual-confirmation-decision-adoption-packet.md"));
  assert.ok(markdown.includes("/tmp/manual-confirmation-decision-rejection-packet.md"));
  assert.ok(markdown.includes("本索引不会替代人工决策。"));
});

test("exportBatchReviewManualFormalWriteToObsidian blocks when safe preview is not confirmed", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-formal-write-block-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "batch-review-manual-safe-write-preview"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  const targetPath = join(tempRoot, "obsidian", "真实批次试跑记录安全写回预览_2026-07-02.md");
  await writeFile(
    targetPath,
    [
      "# 真实批次试跑记录安全写回预览_2026-07-02",
      "",
      "- 目标批次：real-002_to_real-003",
      "- 目标记录：/tmp/real-002.md",
      "- 哪几行确认可以正式写回：",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-manual-safe-write-preview",
      "BRS-2026-07-02T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        exportId: "BRS-2026-07-02T10-00-00-000Z",
        exportedAt: "2026-07-02T10:00:00.000Z",
        targetPath,
        sourceMarkdownPath: "/tmp/batch-review-manual-safe-write-preview.md",
        sourceJsonPath: "/tmp/batch-review-manual-safe-write-preview.json",
        readback: { ok: true, matchedExpectedContent: true },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);

  await assert.rejects(
    () =>
      exportBatchReviewManualFormalWriteToObsidian({
        confirmationPhrase: BATCH_REVIEW_MANUAL_FORMAL_WRITE_PHRASE,
      }),
    /请输入人工复盘结论/u,
  );
});

test("exportBatchReviewManualFormalWriteToObsidian requires formal write confirmation phrase", async () => {
  await assert.rejects(
    () => exportBatchReviewManualFormalWriteToObsidian(),
    /请输入确认短语：确认执行正式写回/u,
  );
});

test("buildFormalWriteFollowUpTasks creates rule and rerun follow-up tasks", () => {
  const tasks = buildFormalWriteFollowUpTasks({
    targetBatchLabel: "real-002_to_real-003",
    manualReviewConclusion: "结果区前置后，批次复盘链路可以继续写回。",
    confirmedLines: "最卡环节",
  });

  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].taskId, "rule-revision-task-sheet");
  assert.equal(tasks[0].taskType, "rule-revision");
  assert.equal(tasks[0].executionMode, "manual-review-required");
  assert.equal(tasks[1].taskId, "key-case-rerun-plan");
  assert.equal(tasks[1].taskType, "key-case-rerun");
  assert.equal(tasks[1].executionMode, "manual-review-required");
  assert.ok(tasks[0].summary.includes("real-002_to_real-003"));
  assert.ok(tasks[1].summary.includes("关键样例复跑"));
});

test("exportBatchReviewManualFormalWriteToObsidian overwrites target record from confirmed patched preview", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-formal-write-ok-"));
  const obsidianRoot = join(tempRoot, "obsidian");
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "batch-review-manual-safe-write-preview"),
    { recursive: true },
  );
  await mkdir(obsidianRoot, { recursive: true });
  const finalRecordPath = join(obsidianRoot, "real-002_to_real-003_批次试跑记录.md");
  const safeWritePreviewPath = join(obsidianRoot, "真实批次试跑记录安全写回预览_2026-07-02.md");
  await writeFile(
    finalRecordPath,
    "# 原记录\n- 这批案例最卡的环节：旧值\n",
    "utf-8",
  );
  await writeFile(
    safeWritePreviewPath,
    [
      "# 真实批次试跑记录安全写回预览_2026-07-02",
      "",
      "## 1. 代码侧安全写回预览",
      "",
      "# 真实批次试跑记录安全写回预览",
      "",
      "## 0. 当前状态",
      "- 目标批次：real-002_to_real-003",
      `- 目标记录：${finalRecordPath}`,
      "- 人工复盘结论：结果区前置后，批次复盘链路可以继续写回。",
      "- 哪几行确认可以正式写回：最卡环节",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
      "",
      "## 3. 写回后预览",
      "",
      "<!-- SAFE_WRITE_PATCHED_START -->",
      "# 原记录",
      "- 这批案例最卡的环节：新值",
      "<!-- SAFE_WRITE_PATCHED_END -->",
      "",
      "## 2. 人工补充",
      "- 人工复盘结论：结果区前置后，批次复盘链路可以继续写回。",
      "- 哪几行确认可以正式写回：最卡环节",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-manual-safe-write-preview",
      "BRS-2026-07-02T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        exportId: "BRS-2026-07-02T10-00-00-000Z",
        exportedAt: "2026-07-02T10:00:00.000Z",
        targetPath: safeWritePreviewPath,
        sourceMarkdownPath: "/tmp/batch-review-manual-safe-write-preview.md",
        sourceJsonPath: "/tmp/batch-review-manual-safe-write-preview.json",
        readback: { ok: true, matchedExpectedContent: true },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await exportBatchReviewManualFormalWriteToObsidian({
    confirmationPhrase: BATCH_REVIEW_MANUAL_FORMAL_WRITE_PHRASE,
    obsidianRoot,
  });
  const persisted = await readFile(finalRecordPath, "utf-8");

  assert.equal(result.readback.ok, true);
  assert.equal(result.targetPath, finalRecordPath);
  assert.equal(result.manualReviewConclusion, "结果区前置后，批次复盘链路可以继续写回。");
  assert.equal(result.followUpTasks.length, 2);
  assert.equal(result.followUpTasks[0].label, "规则修订任务单");
  assert.equal(result.followUpTasks[0].executionMode, "manual-review-required");
  assert.equal(result.followUpTasks[1].label, "关键样例复跑");
  assert.equal(result.followUpTasks[1].executionMode, "manual-review-required");
  assert.equal(result.postExecutionAcceptance.status, "formal-write-post-execution-acceptance-passed");
  assert.equal(result.postExecutionAcceptance.passedCount, 5);
  assert.equal(result.postExecutionAcceptance.totalCount, 5);
  assert.ok(result.postExecutionAcceptance.outputPaths.markdown.endsWith("manual-formal-write-post-execution-acceptance.md"));
  assert.ok(result.postExecutionAcceptance.acceptanceChecks.every((item) => item.status === "passed"));
  assert.equal(persisted, "# 原记录\n- 这批案例最卡的环节：新值\n");
  assert.ok(result.sourcePreviousMarkdownPath.endsWith("batch-review-manual-formal-write.previous.md"));
  assert.ok(
    await readFile(result.postExecutionAcceptance.outputPaths.markdown, "utf-8")
      .then((markdown) => markdown.includes("验收状态：通过")),
  );
});

test("exportBatchReviewManualFormalWriteToObsidian restores target record when readback mismatches", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-formal-write-restore-"));
  const obsidianRoot = join(tempRoot, "obsidian");
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "batch-review-manual-safe-write-preview"),
    { recursive: true },
  );
  await mkdir(obsidianRoot, { recursive: true });
  const originalMarkdown = "# 原记录\n- 这批案例最卡的环节：旧值\n";
  const finalRecordPath = join(obsidianRoot, "real-002_to_real-003_批次试跑记录.md");
  const safeWritePreviewPath = join(obsidianRoot, "真实批次试跑记录安全写回预览_2026-07-02.md");
  await writeFile(finalRecordPath, originalMarkdown, "utf-8");
  await writeFile(
    safeWritePreviewPath,
    [
      "# 真实批次试跑记录安全写回预览_2026-07-02",
      "",
      "## 1. 代码侧安全写回预览",
      "",
      "# 真实批次试跑记录安全写回预览",
      "",
      "## 0. 当前状态",
      "- 目标批次：real-002_to_real-003",
      `- 目标记录：${finalRecordPath}`,
      "- 人工复盘结论：结果区前置后，批次复盘链路可以继续写回。",
      "- 哪几行确认可以正式写回：最卡环节",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
      "",
      "## 3. 写回后预览",
      "",
      "<!-- SAFE_WRITE_PATCHED_START -->",
      "# 原记录",
      "- 这批案例最卡的环节：新值",
      "<!-- SAFE_WRITE_PATCHED_END -->",
      "",
      "## 2. 人工补充",
      "- 人工复盘结论：结果区前置后，批次复盘链路可以继续写回。",
      "- 哪几行确认可以正式写回：最卡环节",
      "- 哪几行仍需手改：",
      "- 是否已经可以进入正式写回：可以",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-manual-safe-write-preview",
      "BRS-2026-07-02T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        exportId: "BRS-2026-07-02T10-00-00-000Z",
        exportedAt: "2026-07-02T10:00:00.000Z",
        targetPath: safeWritePreviewPath,
        sourceMarkdownPath: "/tmp/batch-review-manual-safe-write-preview.md",
        sourceJsonPath: "/tmp/batch-review-manual-safe-write-preview.json",
        readback: { ok: true, matchedExpectedContent: true },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  await assert.rejects(
    () =>
      exportBatchReviewManualFormalWriteToObsidian({
        confirmationPhrase: BATCH_REVIEW_MANUAL_FORMAL_WRITE_PHRASE,
        fileSystem: {
          readTextFile: (path) => readFile(path, "utf-8"),
          writeTextFile: (path, content) =>
            writeFile(
              path,
              path === finalRecordPath && content !== originalMarkdown
                ? "写回过程中产生的不一致内容\n"
                : content,
              "utf-8",
            ),
        },
      }),
    /写回失败，请检查后重试/u,
  );

  const persisted = await readFile(finalRecordPath, "utf-8");
  assert.equal(persisted, originalMarkdown);
});

test("createBatchReviewDashboardObsidianPreview returns target metadata", () => {
  const result = createBatchReviewDashboardObsidianPreview({
    dashboardMarkdown: "# 批次复盘看板\n\n- line",
    obsidianRoot: "/tmp/obsidian-root",
  });

  assert.ok(result.targetPath.includes("批次复盘看板_"));
  assert.ok(result.targetPath.includes("05_验证与实验/批次试跑记录/批次复盘看板"));
  assert.ok(result.markdown.includes("## 2. 人工补充"));
});

test("renderBatchReviewDashboardResult shows suggested-draft follow-up actions before manual fill", () => {
  const container = { innerHTML: "" };

  renderBatchReviewDashboardResult(container, {
    report: {
      summary: {},
      coverageTrend: { label: "人工复盘开始成形", reason: "仍需继续补人工判断" },
      uiReadiness: { readinessLabel: "暂不建议进入 UI 讨论" },
      crossBatchSignal: { label: "信号还不稳定" },
      manualReviewTaskCard: {
        title: "人工复盘待补任务",
        summary: "先补任务卡，再继续看建议态草稿。",
        statusLabel: "草稿已生成",
        targetBatchLabel: "real-002_to_real-003",
        topCategoryLabels: ["标题判断"],
        topActionLabels: ["补最卡环节"],
        fieldTasks: [
          {
            label: "最卡环节",
            prompt: "先写最卡哪里",
            answerHint: "一句话",
            suggestedDraft: "标题和封面判断不稳",
          },
        ],
      },
      formalWriteGate: {
        label: "先补安全写回确认",
        targetPath: "/tmp/安全写回预览.md",
        patchSourceLabel: "系统建议初稿",
        readbackOk: true,
        matchedExpectedContent: true,
        formalWritePermission: "待人工确认",
        confirmationChecklist: [
          {
            label: "人工复盘结论",
            status: "current",
            detail: "在安全写回预览底部补一句本轮人工复盘结论。",
          },
          {
            label: "进入正式写回确认",
            status: "pending",
            detail: "确认无误后，将“是否已经可以进入正式写回”填写为“可以”。",
          },
        ],
      },
      uiRecheckPlan: {},
      followUpChecklist: { phases: [] },
      nextActions: [],
      priorityRows: [],
    },
    manualTaskPreview: {
      backfillPreview: {
        status: "no-manual-input",
        filledFieldLabels: [],
      },
    },
  });

  assert.ok(container.innerHTML.includes("导出建议态写回草稿"));
  assert.ok(container.innerHTML.includes("导出建议态安全写回预览"));
  assert.ok(container.innerHTML.includes("检查写回门禁"));
  assert.ok(!container.innerHTML.includes("检查正式写回状态"));
  assert.ok(container.innerHTML.includes("人工复盘写回闸门"));
  assert.ok(container.innerHTML.includes("先补安全写回确认"));
  assert.ok(container.innerHTML.includes("人工复盘结论"));
  assert.ok(container.innerHTML.includes("进入正式写回确认"));
  assert.ok(container.innerHTML.includes("当前尚未填写人工判断，可先导出建议态草稿"));
  assert.ok(!container.innerHTML.includes("执行正式写回（需先确认安全预览）"));
});

test("renderBatchReviewDashboardResult persists formal write readiness summary", () => {
  const container = { innerHTML: "" };

  renderBatchReviewDashboardResult(container, {
    report: {
      summary: {},
      coverageTrend: { label: "人工复盘开始成形", reason: "仍需继续补人工判断" },
      uiReadiness: { readinessLabel: "暂不建议进入 UI 讨论" },
      crossBatchSignal: { label: "信号还不稳定" },
      manualReviewTaskCard: {
        title: "人工复盘待补任务",
        summary: "继续推进即可。",
        statusLabel: "草稿已生成",
        targetBatchLabel: "real-002_to_real-003",
        fieldTasks: [],
      },
      uiRecheckPlan: {},
      followUpChecklist: { phases: [] },
      nextActions: [],
      priorityRows: [],
    },
    formalWriteReadiness: {
      status: "awaiting-safe-write-confirmation",
      statusLabel: "先补安全写回确认",
      summary: "当前安全写回预览还没有人工确认内容，先在预览底部补确认信息再继续。",
      latestSafeWriteStatus: {
        targetBatchLabel: "real-002_to_real-003",
        targetPath: "/tmp/safe-write-preview.md",
        patchSourceLabel: "系统建议初稿",
        manualReviewConclusion: "",
        readbackOk: true,
        matchedExpectedContent: true,
        canProceedToFormalWrite: false,
      },
    },
    manualConfirmationSafePreviewWritePrecheck: {
      ok: true,
      status: "safe-preview-write-precheck-ready",
      summary: "安全预览确认写入预检通过。",
      targetSafePreviewPath: "/tmp/safe-write-preview.md",
      suggestedPreviewPath: "/tmp/suggested-safe-write-preview.md",
      confirmation: {
        requiredPhrase: "确认写入安全预览确认块",
        phraseRequiredBeforeWrite: true,
      },
      nextAction: {
        actionId: "apply-manual-confirmation-safe-preview-write",
        label: "写入安全预览确认块",
        requiredPhrase: "确认写入安全预览确认块",
        summary: "写入后会读回安全预览记录，并重新检查正式写回门禁。",
      },
      writePlan: {
        targetPath: "/tmp/safe-write-preview.md",
        sourcePath: "/tmp/suggested-safe-write-preview.md",
        currentContentLength: 120,
        suggestedContentLength: 180,
        contentLengthDelta: 60,
        currentLineCount: 12,
        suggestedLineCount: 18,
        lineCountDelta: 6,
        changedFieldCount: 3,
        requiredPhrase: "确认写入安全预览确认块",
        postWriteChecks: ["写入后读回安全预览记录并校验内容一致。"],
      },
      changedFieldCount: 3,
      before: {
        hasManualConfirmation: false,
        canProceedToFormalWrite: false,
        manualReviewConclusionValidation: { ok: false, message: "请输入人工复盘结论" },
      },
      after: {
        hasManualConfirmation: true,
        canProceedToFormalWrite: true,
        manualReviewConclusionValidation: { ok: true, message: "" },
      },
      fieldChanges: [
        {
          label: "人工复盘结论",
          before: "",
          after: "本批次输入准备阶段最容易卡住。",
          changed: true,
        },
      ],
      safetyBoundary: "仅生成项目内写入预检，不写入 Obsidian，不执行正式写回。",
    },
    manualConfirmationSafePreviewWriteProjection: {
      ok: true,
      status: "safe-preview-write-projection-ready-to-formal-write",
      summary: "投影验证通过：安全预览确认块写入后，正式写回门禁预计会进入 ready-to-formal-write。",
      projectedReadiness: {
        status: "ready-to-formal-write",
        statusLabel: "预计可以进入正式写回",
      },
      writePrecheck: {
        targetBatchLabel: "real-002_to_real-003",
        targetSafePreviewPath: "/tmp/safe-write-preview.md",
        suggestedPreviewPath: "/tmp/suggested-safe-write-preview.md",
        changedFieldCount: 3,
        hasManualConfirmationAfterApply: true,
        canProceedToFormalWriteAfterApply: true,
      },
      manualDecision: {
        decisionStatus: "adopt-recommended",
        decisionLabel: "采用推荐确认块",
        adopted: true,
      },
      blockers: [],
      nextAction: {
        actionId: "apply-manual-confirmation-safe-preview-write",
        label: "写入安全预览确认块",
        requiredPhrase: "确认写入安全预览确认块",
        summary: "写入成功后重新检查正式写回门禁。",
      },
      safetyBoundary: "仅生成安全预览确认写入后的门禁投影，不写入 Obsidian，不执行正式写回。",
    },
    manualFormalWriteExecutionPrecheck: {
      ok: false,
      status: "formal-write-execution-precheck-blocked",
      summary: "正式写回执行前预检未通过，请先完成安全预览确认、人工决策或写回内容复查。",
      confirmation: {
        requiredPhrase: "确认执行正式写回",
        phraseRequiredBeforeWrite: true,
      },
      readiness: {
        status: "awaiting-safe-write-confirmation",
        statusLabel: "先补安全写回确认",
      },
      target: {
        batchLabel: "real-002_to_real-003",
        safePreviewPath: "/tmp/safe-write-preview.md",
        targetRecordPath: "/tmp/real-002.md",
        hasPatchedMarkdown: true,
        readbackOk: true,
        hasManualConfirmation: false,
        canProceedToFormalWrite: false,
      },
      manualDecision: {
        decisionStatus: "adopt-recommended",
        decisionLabel: "采用推荐确认块",
        canProceedToSafePreviewWrite: true,
        adopted: true,
      },
      blockers: [
        {
          code: "missing-manual-confirmation",
          label: "人工确认待写入",
          detail: "采用推荐确认块后，还需写入安全预览记录并重新检查门禁。",
        },
      ],
      nextAction: {
        actionId: "apply-manual-confirmation-safe-preview-write",
        label: "写入安全预览确认块",
        requiredPhrase: "确认写入安全预览确认块",
        summary: "写入后重新检查正式写回门禁。",
      },
      safetyBoundary: "仅生成正式写回执行前只读预检，不写入 Obsidian，不执行正式写回。",
      nextChecks: ["确认目标记录路径和安全预览来源。"],
    },
  });

  assert.ok(container.innerHTML.includes("正式写回状态"));
  assert.ok(container.innerHTML.includes("data-formal-write-status-panel"));
  assert.ok(container.innerHTML.includes("先补安全写回确认"));
  assert.ok(container.innerHTML.includes("awaiting-safe-write-confirmation"));
  assert.ok(container.innerHTML.includes("/tmp/safe-write-preview.md"));
  assert.ok(container.innerHTML.includes("改写来源"));
  assert.ok(container.innerHTML.includes("系统建议初稿"));
  assert.ok(container.innerHTML.includes("人工结论"));
  assert.ok(container.innerHTML.includes("写回许可"));
  assert.ok(container.innerHTML.includes("待人工确认"));
  assert.ok(container.innerHTML.includes('aria-label="正式写回门禁进度"'));
  assert.ok(container.innerHTML.includes("预览已读回"));
  assert.ok(container.innerHTML.includes("等待结论"));
  assert.ok(container.innerHTML.includes("门禁未满足"));
  assert.ok(container.innerHTML.includes("保持锁定"));
  assert.ok(container.innerHTML.includes("安全预览确认写入预检"));
  assert.ok(container.innerHTML.includes("预检通过"));
  assert.ok(container.innerHTML.includes("本批次输入准备阶段最容易卡住。"));
  assert.ok(container.innerHTML.includes("受控写入入口"));
  assert.ok(container.innerHTML.includes("写入目标"));
  assert.ok(container.innerHTML.includes("/tmp/suggested-safe-write-preview.md"));
  assert.ok(container.innerHTML.includes("推荐动作"));
  assert.ok(container.innerHTML.includes("写入安全预览确认块"));
  assert.ok(container.innerHTML.includes("动作短语"));
  assert.ok(container.innerHTML.includes("确认写入安全预览确认块"));
  assert.ok(container.innerHTML.includes("内容变化"));
  assert.ok(container.innerHTML.includes("120 -&gt; 180"));
  assert.ok(container.innerHTML.includes("行数变化"));
  assert.ok(container.innerHTML.includes("12 -&gt; 18"));
  assert.ok(container.innerHTML.includes("data-safe-preview-write-phrase"));
  assert.ok(container.innerHTML.includes("data-copy-safe-preview-write-phrase"));
  assert.ok(container.innerHTML.includes("data-safe-preview-write-submit"));
  assert.ok(container.innerHTML.includes("disabled"));
  assert.ok(container.innerHTML.includes('aria-disabled="true"'));
  assert.ok(container.innerHTML.includes("填入短语"));
  assert.ok(container.innerHTML.includes("写入后复查"));
  assert.ok(container.innerHTML.includes("写入后门禁投影"));
  assert.ok(container.innerHTML.includes("投影通过"));
  assert.ok(container.innerHTML.includes("safe-preview-write-projection-ready-to-formal-write"));
  assert.ok(container.innerHTML.includes("预计 readiness"));
  assert.ok(container.innerHTML.includes("当前无阻塞点"));
  assert.ok(container.innerHTML.includes("仅生成安全预览确认写入后的门禁投影，不写入 Obsidian，不执行正式写回。"));
  assert.ok(container.innerHTML.includes("ready-to-formal-write"));
  assert.ok(container.innerHTML.includes("达成后仍需单独执行正式写回"));
  assert.ok(container.innerHTML.includes("复查写回门禁"));
  assert.ok(container.innerHTML.includes('data-review-followup-action="check-manual-review-formal-write-readiness"'));
  assert.ok(container.innerHTML.includes('data-review-followup-action="apply-manual-confirmation-safe-preview-write"'));
  assert.ok(container.innerHTML.includes("正式写回执行前预检"));
  assert.ok(container.innerHTML.includes("formal-write-execution-precheck-blocked"));
  assert.ok(container.innerHTML.includes("/tmp/real-002.md"));
  assert.ok(container.innerHTML.includes("确认执行正式写回"));
  assert.ok(container.innerHTML.includes("当前阻塞点"));
  assert.ok(container.innerHTML.includes("人工确认待写入"));
  assert.ok(container.innerHTML.includes("写入安全预览确认块"));
  assert.ok(container.innerHTML.includes("确认写入安全预览确认块"));
  assert.ok(container.innerHTML.includes("仅生成正式写回执行前只读预检，不写入 Obsidian，不执行正式写回。"));
  assert.ok(container.innerHTML.includes('href="#writeback-gate-overview"'));
  assert.ok(container.innerHTML.includes("查看写回门禁总览"));
  assert.ok(!container.innerHTML.includes("执行正式写回（需先确认安全预览）"));
  assert.ok(!container.innerHTML.includes('<button type="button" class="ghost-button" data-review-followup-action="export-manual-review-formal-write">执行正式写回</button>'));
});

test("renderBatchReviewDashboardResult shows formal write action only when readiness allows", () => {
  const container = { innerHTML: "" };

  renderBatchReviewDashboardResult(container, {
    report: {
      summary: {},
      coverageTrend: { label: "人工复盘开始成形", reason: "人工确认已完成" },
      uiReadiness: { readinessLabel: "暂不建议进入 UI 讨论" },
      crossBatchSignal: { label: "信号还不稳定" },
      manualReviewTaskCard: {
        title: "人工复盘待补任务",
        summary: "继续推进即可。",
        statusLabel: "已补齐",
        targetBatchLabel: "real-002_to_real-003",
        fieldTasks: [],
      },
      uiRecheckPlan: {},
      followUpChecklist: { phases: [] },
      nextActions: [],
      priorityRows: [],
    },
    formalWriteReadiness: {
      status: "ready-to-formal-write",
      statusLabel: "可以正式写回",
      summary: "安全预览已完成人工确认。",
      manualConfirmationDecision: {
        decisionStatus: "adopt-recommended",
        decisionLabel: "采用推荐确认块",
        canProceedToSafePreviewWrite: true,
      },
      latestSafeWriteStatus: {
        targetBatchLabel: "real-002_to_real-003",
        targetPath: "/tmp/safe-write-preview.md",
        patchSourceLabel: "人工确认稿",
        manualReviewConclusion: "安全预览可以作为正式写回依据。",
        readbackOk: true,
        matchedExpectedContent: true,
        hasManualConfirmation: true,
        canProceedToFormalWrite: true,
      },
    },
    piEngineExecutionPositionAudit: {
      ok: true,
      status: "formal-write-waiting-for-confirmation",
      summary: "AI 项目资料流程已进入 PI Engine 维护模式，当前位点是正式写回确认门禁。",
      mode: {
        piEngineMode: "maintenance",
        implementationBoundary: "复用当前 Web 应用，不新建 Web v2，不切换技术栈。",
      },
      artifactProgress: {
        presentCount: 6,
        totalCount: 6,
      },
      goalCompletion: {
        status: "waiting-for-formal-write-confirmation",
        completedCount: 6,
        totalCount: 8,
        items: [
          {
            label: "生成 Requirement Spec",
            status: "completed",
            evidence: "AI封面创意助手重做_Requirement_Spec_v0.1.md",
          },
          {
            label: "执行正式写回",
            status: "waiting-for-confirmation",
            evidence: "等待确认短语：确认执行正式写回",
          },
          {
            label: "完成写回后验收",
            status: "pending",
            evidence: "0 / 5",
          },
        ],
      },
      formalWriteGate: {
        readinessStatus: "ready-to-formal-write",
        postExecutionAcceptanceProgress: "0 / 5",
      },
      artifacts: [
        {
          label: "Requirement Spec",
          status: "present",
        },
        {
          label: "PRD 信息架构",
          status: "present",
        },
      ],
      blockedRepeats: [
        "不重新生成 Requirement Spec",
        "不重新生成 PRD 信息架构",
        "不重复写入安全预览确认块",
      ],
      nextAction: {
        label: "执行正式写回",
        requiredPhrase: "确认执行正式写回",
        summary: "当前不需要重跑需求或 PRD，下一步只等待人工确认正式写回。",
      },
      safetyBoundary: "该审计包只读取项目状态并生成项目内证据，不写入 Obsidian，不执行正式写回。",
    },
    manualFormalWriteExecutionPacket: {
      ok: true,
      status: "formal-write-execution-packet-ready",
      summary: "正式写回执行包已生成，可作为人工确认前的最后审计材料。",
      safetyBoundary: "仅生成正式写回执行包，不写入 Obsidian，不执行正式写回。",
      target: {
        batchLabel: "real-002_to_real-003",
        targetRecordPath: "/tmp/real-002.md",
      },
      confirmation: {
        requiredPhrase: "确认执行正式写回",
      },
      writePlan: {
        willOverwriteTargetRecord: true,
        previousContentLength: 128,
        finalContentLength: 196,
        contentLengthDelta: 68,
        lineCountDelta: 4,
      },
      lineDiff: {
        hasChanges: true,
        addedLineCount: 2,
        removedLineCount: 1,
        hunkCount: 1,
        visibleHunkCount: 1,
        truncated: false,
        hunks: [
          {
            hunkId: "hunk-1",
            contextBefore: "## 6. 人工试跑结论",
            removedLines: ["- 这批案例最卡的环节："],
            addedLines: ["- 这批案例最卡的环节：最卡在准备输入信息时，不知道先补哪项。"],
            contextAfter: "- 哪些字段最难补：",
          },
        ],
      },
      rollback: {
        previousSnapshotPath: "/tmp/batch-review-manual-formal-write.previous.md",
        restoreWhenReadbackMismatch: true,
        summary: "正式写回执行时会先保存目标记录旧版本；读回不一致时恢复旧版本并报错。",
      },
      nextChecks: ["复核目标记录路径和安全预览来源。"],
    },
    manualFormalWritePostExecutionAcceptance: {
      ok: false,
      status: "formal-write-post-execution-acceptance-waiting",
      summary: "正式写回后验收包已生成，等待执行正式写回后自动复核。",
      safetyBoundary: "仅生成正式写回后验收包，不写入 Obsidian，不执行正式写回。",
      target: {
        batchLabel: "real-002_to_real-003",
        targetRecordPath: "/tmp/real-002.md",
      },
      passedCount: 0,
      totalCount: 5,
      acceptanceChecks: [
        {
          label: "目标记录读回",
          status: "pending",
          expectedEvidence: "/tmp/real-002.md",
          summary: "正式写回后，目标记录内容必须与最终 Markdown 完全一致。",
        },
        {
          label: "承接任务生成",
          status: "pending",
          expectedEvidence: "",
          summary: "正式写回后应生成规则修订任务单和关键样例复跑两个承接任务。",
        },
      ],
      nextAction: {
        label: "执行正式写回",
        requiredPhrase: "确认执行正式写回",
        summary: "执行正式写回后，重新生成验收包并检查读回结果。",
      },
    },
  });

  assert.ok(container.innerHTML.includes("可以正式写回"));
  assert.ok(container.innerHTML.includes("执行位点审计"));
  assert.ok(container.innerHTML.includes("PI Engine Position"));
  assert.ok(container.innerHTML.includes("目标完成度审计"));
  assert.ok(container.innerHTML.includes("6 / 8"));
  assert.ok(container.innerHTML.includes("waiting-for-formal-write-confirmation"));
  assert.ok(container.innerHTML.includes("等待确认短语：确认执行正式写回"));
  assert.ok(container.innerHTML.includes("不重新生成 Requirement Spec"));
  assert.ok(container.innerHTML.includes("不重新生成 PRD 信息架构"));
  assert.ok(container.innerHTML.includes("唯一下一步"));
  assert.ok(container.innerHTML.includes("当前不需要重跑需求或 PRD，下一步只等待人工确认正式写回。"));
  assert.ok(container.innerHTML.includes("可进入正式写回"));
  assert.ok(container.innerHTML.includes("人工决策"));
  assert.ok(container.innerHTML.includes("采用推荐确认块"));
  assert.ok(container.innerHTML.includes("推荐块已采用"));
  assert.ok(container.innerHTML.includes("data-formal-write-confirm-panel"));
  assert.ok(container.innerHTML.includes("data-formal-write-confirm-phrase"));
  assert.ok(container.innerHTML.includes("确认执行正式写回"));
  assert.ok(container.innerHTML.includes("data-copy-formal-write-phrase"));
  assert.ok(container.innerHTML.includes("data-formal-write-submit"));
  assert.ok(container.innerHTML.includes('data-review-followup-action="export-manual-review-formal-write"'));
  assert.ok(container.innerHTML.includes("门禁已满足，填入确认短语后仍会再次校验状态。"));
  assert.ok(container.innerHTML.includes("执行正式写回"));
  assert.ok(container.innerHTML.includes("正式写回执行包"));
  assert.ok(container.innerHTML.includes("formal-write-execution-packet-ready"));
  assert.ok(container.innerHTML.includes("长度变化"));
  assert.ok(container.innerHTML.includes("行级差异审计"));
  assert.ok(container.innerHTML.includes("新增行数"));
  assert.ok(container.innerHTML.includes("移除行数"));
  assert.ok(container.innerHTML.includes("hunk-1"));
  assert.ok(container.innerHTML.includes("- 这批案例最卡的环节："));
  assert.ok(container.innerHTML.includes("+ - 这批案例最卡的环节：最卡在准备输入信息时，不知道先补哪项。"));
  assert.ok(container.innerHTML.includes("读回不一致时恢复旧版本"));
  assert.ok(container.innerHTML.includes("/tmp/batch-review-manual-formal-write.previous.md"));
  assert.ok(container.innerHTML.includes("正式写回后验收包"));
  assert.ok(container.innerHTML.includes("formal-write-post-execution-acceptance-waiting"));
  assert.ok(container.innerHTML.includes("验收进度"));
  assert.ok(container.innerHTML.includes("0 / 5"));
  assert.ok(container.innerHTML.includes("目标记录读回"));
  assert.ok(container.innerHTML.includes("承接任务生成"));
  assert.ok(!container.innerHTML.includes("执行正式写回（需先确认安全预览）"));
});

test("renderBatchReviewDashboardResult keeps formal write locked before manual decision adoption", () => {
  const container = { innerHTML: "" };

  renderBatchReviewDashboardResult(container, {
    report: {
      summary: {},
      coverageTrend: { label: "人工复盘开始成形", reason: "人工确认仍待采用" },
      uiReadiness: { readinessLabel: "暂不建议进入 UI 讨论" },
      crossBatchSignal: { label: "信号还不稳定" },
      manualReviewTaskCard: {
        title: "人工复盘待补任务",
        summary: "继续推进即可。",
        statusLabel: "已补齐",
        targetBatchLabel: "real-002_to_real-003",
        fieldTasks: [],
      },
      uiRecheckPlan: {},
      followUpChecklist: { phases: [] },
      nextActions: [],
      priorityRows: [],
    },
    formalWriteReadiness: {
      status: "awaiting-manual-decision-adoption",
      statusLabel: "先采用推荐确认块",
      summary: "安全写回预览已完成读回确认，仍需采用推荐确认块后再进入正式写回。",
      manualConfirmationDecision: {
        decisionStatus: "pending",
        decisionLabel: "待确认",
        canProceedToSafePreviewWrite: false,
      },
      latestSafeWriteStatus: {
        targetBatchLabel: "real-002_to_real-003",
        targetPath: "/tmp/safe-write-preview.md",
        patchSourceLabel: "人工确认稿",
        manualReviewConclusion: "安全预览可以作为正式写回依据。",
        readbackOk: true,
        matchedExpectedContent: true,
        hasManualConfirmation: true,
        canProceedToFormalWrite: true,
      },
    },
  });

  assert.ok(container.innerHTML.includes("先采用推荐确认块"));
  assert.ok(container.innerHTML.includes("人工决策"));
  assert.ok(container.innerHTML.includes("等待采用"));
  assert.ok(container.innerHTML.includes("待人工决策"));
  assert.ok(container.innerHTML.includes("保持锁定"));
  assert.ok(!container.innerHTML.includes('data-review-followup-action="export-manual-review-formal-write"'));
});

test("renderBatchReviewDashboardResult surfaces safe write readback mismatch", () => {
  const container = { innerHTML: "" };

  renderBatchReviewDashboardResult(container, {
    report: {
      summary: {},
      coverageTrend: { label: "人工复盘开始成形", reason: "仍需继续补人工判断" },
      uiReadiness: { readinessLabel: "暂不建议进入 UI 讨论" },
      crossBatchSignal: { label: "信号还不稳定" },
      manualReviewTaskCard: {
        title: "人工复盘待补任务",
        summary: "继续推进即可。",
        statusLabel: "草稿已生成",
        targetBatchLabel: "real-002_to_real-003",
        fieldTasks: [],
      },
      uiRecheckPlan: {},
      followUpChecklist: { phases: [] },
      nextActions: [],
      priorityRows: [],
    },
    formalWriteReadiness: {
      status: "safe-preview-readback-mismatch",
      statusLabel: "安全预览读回待确认",
      summary: "最近一份安全写回预览未完成读回一致性确认，请重新生成写回预览并确认内容。",
      latestSafeWriteStatus: {
        targetBatchLabel: "real-002_to_real-003",
        targetPath: "/tmp/safe-write-preview.md",
        readbackOk: true,
        matchedExpectedContent: false,
      },
    },
  });

  assert.ok(container.innerHTML.includes("安全预览读回待确认"));
  assert.ok(container.innerHTML.includes("内容待复查"));
  assert.ok(container.innerHTML.includes("内容一致性"));
  assert.ok(container.innerHTML.includes("待复查"));
  assert.ok(container.innerHTML.includes("writeback-gate-step-attention"));
  assert.ok(container.innerHTML.includes("预览需复查"));
});

test("renderBatchReviewDashboardResult shows formal write follow-up tasks", () => {
  const container = { innerHTML: "" };

  renderBatchReviewDashboardResult(container, {
    report: {
      summary: {},
      coverageTrend: { label: "人工复盘开始成形", reason: "仍需继续补人工判断" },
      uiReadiness: { readinessLabel: "暂不建议进入 UI 讨论" },
      crossBatchSignal: { label: "信号还不稳定" },
      manualReviewTaskCard: {
        title: "人工复盘待补任务",
        summary: "继续推进即可。",
        statusLabel: "草稿已生成",
        targetBatchLabel: "real-002_to_real-003",
        fieldTasks: [],
      },
      uiRecheckPlan: {},
      followUpChecklist: { phases: [] },
      nextActions: [],
      priorityRows: [],
    },
    formalWriteExport: {
      targetPath: "/tmp/run.md",
      manualReviewConclusion: "结果区前置后，批次复盘链路可以继续写回。",
      readback: { ok: true },
      followUpTasks: [
        {
          label: "规则修订任务单",
          taskType: "rule-revision",
          status: "pending",
          executionMode: "manual-review-required",
          summary: "整理重复摩擦点。",
          evidence: ["结果区前置后，批次复盘链路可以继续写回。", "最卡环节"],
        },
        {
          label: "关键样例复跑",
          taskType: "key-case-rerun",
          status: "pending",
          executionMode: "manual-review-required",
          summary: "验证规则调整前后差异。",
          evidence: ["结果区前置后，批次复盘链路可以继续写回。"],
        },
      ],
    },
    formalWriteFollowUpPlan: {
      ok: true,
      status: "formal-write-follow-up-plan-ready",
      summary: "正式写回后承接计划已生成。",
      safetyBoundary: "仅生成正式写回后承接计划。",
      sections: {
        ruleRevision: {
          label: "规则修订任务单已生成",
          summary: "整理重复摩擦点。",
          existingReport: {
            taskCount: 1,
            sourceSampleCount: 1,
            topTask: {
              taskTitle: "补强输入准备提示",
            },
          },
          nextStep: {
            label: "整理规则修订任务单",
          },
        },
        keyCaseRerun: {
          label: "关键样例复跑计划已生成",
          summary: "验证规则调整前后差异。",
          plan: {
            planId: "key-case-rerun-generated",
            caseIds: ["sample-001"],
          },
          latestRun: {
            planId: "key-case-rerun-generated",
            completedCaseCount: 1,
          },
          nextStep: {
            summary: "等待复跑计划确认。",
          },
        },
      },
      commandChain: [
        "npm run report:rule-revision-task-sheet",
        "npm run generate:key-case-rerun-plan",
      ],
    },
  });

  assert.ok(container.innerHTML.includes("写回后承接任务"));
  assert.ok(container.innerHTML.includes("data-formal-write-followup-panel"));
  assert.ok(container.innerHTML.includes("规则修订任务单"));
  assert.ok(container.innerHTML.includes("关键样例复跑"));
  assert.ok(container.innerHTML.includes("任务状态：待处理"));
  assert.ok(container.innerHTML.includes("任务类型：规则修订"));
  assert.ok(container.innerHTML.includes("任务类型：关键样例复跑"));
  assert.ok(container.innerHTML.includes("执行方式：需人工确认"));
  assert.ok(container.innerHTML.includes("依据：结果区前置后"));
  assert.ok(container.innerHTML.includes("最卡环节"));
  assert.ok(container.innerHTML.includes("下一步：整理规则修订任务单"));
  assert.ok(container.innerHTML.includes("下一步：选择关键样例"));
  assert.ok(container.innerHTML.includes("结果区前置后"));
  assert.ok(container.innerHTML.includes("正式写回后承接计划"));
  assert.ok(container.innerHTML.includes("规则修订任务单已生成"));
  assert.ok(container.innerHTML.includes("关键样例复跑计划已生成"));
  assert.ok(container.innerHTML.includes("npm run generate:key-case-rerun-plan"));
});

test("renderBatchReviewDashboardResult shows rule handoff when evidence is ready", () => {
  const container = { innerHTML: "" };

  renderBatchReviewDashboardResult(container, {
    report: {
      summary: {
        missingManualReviewCount: 0,
        fullyCoveredBatchCount: 2,
        repeatedCategories: 2,
      },
      coverageTrend: {
        status: "stabilizing",
        label: "人工复盘趋于稳定",
        reason: "连续批次已补齐人工判断",
      },
      uiReadiness: {
        readinessLevel: "ready",
        readinessLabel: "可以进入 UI 讨论",
      },
      crossBatchSignal: { label: "重复信号稳定" },
      manualReviewTaskCard: {},
      uiRecheckPlan: {},
      followUpChecklist: { phases: [] },
      nextActions: [],
      priorityRows: [],
    },
  });

  assert.ok(container.innerHTML.includes("Rule Handoff"));
  assert.ok(container.innerHTML.includes("规则修订交接"));
  assert.ok(container.innerHTML.includes("关键样例复跑"));
  assert.ok(container.innerHTML.includes("局部 UI 优化"));
});

test("renderBatchReviewDashboardResult surfaces rule revision task signal", () => {
  const container = { innerHTML: "" };

  renderBatchReviewDashboardResult(container, {
    report: {
      summary: {
        missingManualReviewCount: 0,
        fullyCoveredBatchCount: 1,
        repeatedCategories: 1,
      },
      coverageTrend: {
        status: "emerging",
        label: "人工复盘开始成形",
        reason: "已有人工复盘样本，继续补齐重复信号。",
      },
      uiReadiness: {
        readinessLevel: "not-ready",
        readinessLabel: "暂不建议进入 UI 讨论",
      },
      crossBatchSignal: { label: "重复信号仍需观察" },
      ruleRevisionSignal: {
        label: "已有规则修订任务",
        taskCount: 1,
        sourceSampleCount: 1,
        prioritySummary: "P1 0 / P2 0 / P3 1",
        topTasks: [
          {
            taskId: "REV-001",
            priority: "P3",
            taskTitle: "补强 neg-content-distance 相关关键词：不贴内容",
            suggestedMappingId: "neg-content-distance",
            caseIds: ["sample-001"],
          },
        ],
      },
      keyCaseRerunHandoff: {
        label: "关键样例复跑已完成",
        candidateCaseIds: ["sample-001"],
        downstreamRefreshTargets: ["reviewed-misclassified", "rule-revision-task-sheet"],
        summary: "已完成 2 个关键样例复跑，差异样例 0 个，下游变化 0 项。",
        latestRun: {
          planId: "key-case-rerun-default",
          rerunCaseCount: 2,
          changedCaseCount: 0,
          downstreamChangedCount: 0,
        },
        commandSequence: [
          "npm run generate:key-case-rerun-plan",
          "npm run rerun:key-cases",
          "npm run export:obsidian-key-case-rerun",
        ],
      },
      manualReviewTaskCard: {},
      manualReviewTaskHandoff: {
        label: "人工复盘草稿已导出",
        targetBatchLabel: "real-002_to_real-003",
        readbackOk: true,
      },
      uiRecheckPlan: {},
      followUpChecklist: { phases: [] },
      nextActions: [],
      priorityRows: [],
    },
  });

  assert.ok(container.innerHTML.includes("规则修订任务信号"));
  assert.ok(container.innerHTML.includes("已有规则修订任务"));
  assert.ok(container.innerHTML.includes("规则修订任务数"));
  assert.ok(container.innerHTML.includes("REV-001"));
  assert.ok(container.innerHTML.includes("补强 neg-content-distance 相关关键词：不贴内容"));
  assert.ok(container.innerHTML.includes("建议映射：neg-content-distance"));
  assert.ok(container.innerHTML.includes("关联样本：sample-001"));
  assert.ok(container.innerHTML.includes("关键样例复跑承接"));
  assert.ok(container.innerHTML.includes("关键样例复跑已完成"));
  assert.ok(container.innerHTML.includes("候选样例"));
  assert.ok(container.innerHTML.includes("sample-001"));
  assert.ok(container.innerHTML.includes("最近复跑计划"));
  assert.ok(container.innerHTML.includes("key-case-rerun-default"));
  assert.ok(container.innerHTML.includes("草稿状态"));
  assert.ok(container.innerHTML.includes("人工复盘草稿已导出"));
  assert.ok(container.innerHTML.includes("草稿读回"));
  assert.ok(container.innerHTML.includes("已确认"));
  assert.ok(container.innerHTML.includes("npm run rerun:key-cases"));
});

test("buildBatchReviewSuiteMarkdown renders suite overview and priorities", () => {
  const markdown = buildBatchReviewSuiteMarkdown({
    frictionSummaryExport: {
      readback: { ok: true },
      targetPath: "/tmp/friction-summary.md",
    },
    uiReadinessExport: {
      readback: { ok: true },
      targetPath: "/tmp/ui-readiness.md",
    },
    dashboardExport: {
      readback: { ok: true },
      targetPath: "/tmp/review-dashboard.md",
      report: {
        crossBatchSignal: { label: "接近可以讨论 UI 优化" },
        uiReadiness: { readinessLabel: "接近可以进入 UI 讨论" },
        coverageTrend: { label: "人工复盘开始成形" },
        priorityRows: [
          {
            batchLabel: "batch-b",
            urgencyLabel: "补齐关键判断",
            missingFieldLabels: ["最该前置模块"],
            topCategoryLabels: ["结果阅读与选择判断"],
          },
        ],
        nextActions: ["先补 batch-b 这一批"],
        followUpChecklist: {
          phases: [
            {
              label: "先补当前最关键缺口",
              items: [
                {
                  label: "batch-b 是当前优先级最高的批次。",
                  actionLabel: "生成批次试跑记录",
                },
              ],
            },
          ],
        },
      },
    },
  });

  assert.ok(markdown.includes("# 批次复盘套件"));
  assert.ok(markdown.includes("跨批次摩擦点汇总：已导出并读回确认"));
  assert.ok(markdown.includes("batch-b：补齐关键判断"));
  assert.ok(markdown.includes("先补 batch-b 这一批"));
  assert.ok(markdown.includes("## 6. 复盘后操作清单"));
  assert.ok(markdown.includes("页面入口：生成批次试跑记录"));
});

test("buildObsidianBatchReviewSuiteRecord wraps suite into editable draft", () => {
  const markdown = buildObsidianBatchReviewSuiteRecord({
    generatedDate: "2026-06-27",
    sourceMarkdownPath: "/tmp/batch-review-suite.md",
    suiteMarkdown: "# 批次复盘套件\n\n- line",
  });

  assert.ok(markdown.includes("# 批次复盘套件_2026-06-27"));
  assert.ok(markdown.includes("## 1. 代码侧套件底稿"));
  assert.ok(markdown.includes("## 2. 人工补充"));
});

test("createBatchReviewSuiteObsidianPreview returns target metadata", () => {
  const result = createBatchReviewSuiteObsidianPreview({
    suiteMarkdown: "# 批次复盘套件\n\n- line",
    obsidianRoot: "/tmp/obsidian-root",
  });

  assert.ok(result.targetPath.includes("批次复盘套件_"));
  assert.ok(result.targetPath.includes("05_验证与实验/批次试跑记录/批次复盘套件"));
  assert.ok(result.markdown.includes("## 2. 人工补充"));
});

test("buildObsidianUiOptimizationReadinessRecord wraps report into editable draft", () => {
  const markdown = buildObsidianUiOptimizationReadinessRecord({
    generatedDate: "2026-06-27",
    sourceMarkdownPath: "/tmp/ui-readiness-report.md",
    readinessMarkdown: "# UI优化进入条件报告\n\n- line",
  });

  assert.ok(markdown.includes("# UI优化进入条件报告_2026-06-27"));
  assert.ok(markdown.includes("## 1. 代码侧判断底稿"));
  assert.ok(markdown.includes("## 2. 人工判断"));
});

test("createUiOptimizationReadinessObsidianPreview returns target metadata", () => {
  const result = createUiOptimizationReadinessObsidianPreview({
    readinessMarkdown: "# UI优化进入条件报告\n\n- line",
    obsidianRoot: "/tmp/obsidian-root",
  });

  assert.ok(result.targetPath.includes("UI优化进入条件报告_"));
  assert.ok(result.targetPath.includes("06_PRD与版本记录/UI优化进入条件报告/已生成记录"));
  assert.ok(result.markdown.includes("## 2. 人工判断"));
});

test("runUiOptimizationReadinessPreview reads export logs and builds report", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-ui-readiness-preview-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-fill-sheets", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-a"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-a"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-b"), { recursive: true });
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-fill-sheets",
      "batch-a",
      "2026-06-27T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T10:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: "/tmp/batch-a-fill.md",
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "batch-a",
      "2026-06-27T11-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T11:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: join(tempRoot, "obsidian", "batch-a-run.md"),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  await writeFile(
    join(tempRoot, "obsidian", "batch-a-run.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "- 这批案例最卡的环节：输入太重",
      "- 当前更像功能问题，还是界面问题：更像功能问题",
      "- 哪个按钮或模块最该前置：输入准备区",
      "- UI 优化是否已经到时机：先别急着做 UI",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-a", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        createdCount: 2,
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 95,
            whyItMatters: "input",
            priorityReason: "缺失字段很多",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: { readbackOk: true },
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-b", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        createdCount: 1,
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 90,
            whyItMatters: "input",
            priorityReason: "输入还是太重",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: null,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const obsidianRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-ui-readiness-obsidian-"));
  const result = await runUiOptimizationReadinessPreview({ obsidianRoot });

  assert.equal(result.report.summary.batchFillWorksheetBatchCount, 1);
  assert.equal(result.report.summary.batchRunRecordBatchCount, 1);
  assert.equal(result.report.summary.manualReviewFullyCoveredBatchCount, 1);
  assert.equal(result.report.crossBatchSignal.status, "emerging-signal");
  assert.ok(result.readinessMarkdown.includes("## 3. 检查项"));
  assert.ok(result.obsidianDraft.targetPath.startsWith(obsidianRoot));
});

test("runBatchReviewDashboardPreview combines cross-batch and readiness reports", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-review-dashboard-preview-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-fill-sheets", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-a"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-a"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-b"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "reports", "rule-revision-task-sheet"), {
    recursive: true,
  });
  await mkdir(join(tempRoot, "outputs", "reports", "key-case-rerun"), {
    recursive: true,
  });
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-fill-sheets",
      "batch-a",
      "2026-06-27T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T10:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: "/tmp/batch-a-fill.md",
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "batch-a",
      "2026-06-27T11-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T11:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: join(tempRoot, "obsidian", "batch-a-run.md"),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "obsidian", "batch-a-run.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "- 这批案例最卡的环节：输入太重",
      "- 当前更像功能问题，还是界面问题：更像功能问题",
      "- 哪个按钮或模块最该前置：输入准备区",
      "- UI 优化是否已经到时机：先别急着做 UI",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-a", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        createdCount: 2,
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 95,
            whyItMatters: "input",
            priorityReason: "缺失字段很多",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: { readbackOk: true },
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-b", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        createdCount: 1,
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 90,
            whyItMatters: "input",
            priorityReason: "输入还是太重",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: null,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "reports", "rule-revision-task-sheet", "rule-revision-task-sheet.json"),
    `${JSON.stringify(
      {
        summary: {
          sourceSampleCount: 1,
          taskCount: 1,
          p1Count: 0,
          p2Count: 0,
          p3Count: 1,
        },
        tasks: [
          {
            taskId: "REV-001",
            taskTitle: "补强 neg-content-distance 相关关键词：不贴内容",
            priority: "P3",
            caseIds: ["sample-001"],
            suggestedMappingId: "neg-content-distance",
          },
        ],
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "reports", "key-case-rerun", "key-case-rerun.json"),
    `${JSON.stringify(
      {
        meta: {
          planId: "key-case-rerun-default",
          generatedAt: "2026-07-23 11:19:28",
          caseIds: ["sample-001", "real-001"],
          downstreamRefreshTargets: ["reviewed-misclassified", "rule-revision-task-sheet"],
        },
        summary: {
          rerunCaseCount: 2,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "reports", "key-case-rerun", "key-case-rerun-diff.json"),
    `${JSON.stringify(
      {
        summary: {
          changedCaseCount: 0,
          downstreamChangedCount: 0,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await runBatchReviewDashboardPreview();

  assert.equal(result.report.summary.fullyCoveredBatchCount, 1);
  assert.equal(result.report.uiReadiness.readinessLevel, "not-ready");
  assert.equal(result.report.uiRecheckPlan.status, "awaiting-manual-fill");
  assert.equal(result.report.ruleRevisionSignal.taskCount, 1);
  assert.equal(result.report.ruleRevisionSignal.topTasks[0].suggestedMappingId, "neg-content-distance");
  assert.equal(result.report.keyCaseRerunHandoff.status, "rerun-complete");
  assert.equal(result.report.keyCaseRerunHandoff.latestRun.rerunCaseCount, 2);
  assert.ok(result.dashboardMarkdown.includes("# 批次复盘看板"));
  assert.ok(result.dashboardMarkdown.includes("## 3. 规则修订任务信号"));
  assert.ok(result.dashboardMarkdown.includes("补强 neg-content-distance 相关关键词：不贴内容"));
  assert.ok(result.dashboardMarkdown.includes("最近复跑计划：key-case-rerun-default"));
});

test("exportBatchReviewDashboardToObsidian writes editable dashboard draft", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-review-dashboard-export-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-fill-sheets", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-a"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-a"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-b"), { recursive: true });
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-fill-sheets",
      "batch-a",
      "2026-06-27T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T10:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: "/tmp/batch-a-fill.md",
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "batch-a",
      "2026-06-27T11-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T11:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: join(tempRoot, "obsidian", "batch-a-run.md"),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "obsidian", "batch-a-run.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "- 这批案例最卡的环节：输入太重",
      "- 当前更像功能问题，还是界面问题：更像功能问题",
      "- 哪个按钮或模块最该前置：输入准备区",
      "- UI 优化是否已经到时机：先别急着做 UI",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-a", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        createdCount: 2,
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 95,
            whyItMatters: "input",
            priorityReason: "缺失字段很多",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: { readbackOk: true },
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-b", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        createdCount: 1,
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 90,
            whyItMatters: "input",
            priorityReason: "输入还是太重",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: null,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const obsidianRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-review-dashboard-export-obsidian-"));
  const result = await exportBatchReviewDashboardToObsidian({ obsidianRoot });
  const exported = await readFile(result.targetPath, "utf-8");
  const logContent = await readFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-dashboard",
      `${result.exportId}.json`,
    ),
    "utf-8",
  );

  assert.equal(result.ok, true);
  assert.equal(result.readback.ok, true);
  assert.ok(result.dashboardMarkdown.includes("# 批次复盘看板"));
  assert.ok(exported.includes("# 批次复盘看板_"));
  assert.ok(logContent.includes(`"exportId": "${result.exportId}"`));
});

test("exportBatchReviewManualTaskCardToObsidian writes editable task-card draft", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-manual-task-export-"));
  const obsidianRoot = join(tempRoot, "obsidian");
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-fill-sheets", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-a"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-a"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-b"), { recursive: true });
  await mkdir(obsidianRoot, { recursive: true });
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-fill-sheets",
      "batch-a",
      "2026-06-27T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T10:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: "/tmp/batch-a-fill.md",
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-a", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        createdCount: 2,
        frictionTemplate: [
          {
            id: "result-reading",
            label: "结果阅读与选择判断",
            priorityScore: 95,
            whyItMatters: "result",
            priorityReason: "结果阅读不顺",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: { readbackOk: true },
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-b", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        createdCount: 1,
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 90,
            whyItMatters: "input",
            priorityReason: "输入还是太重",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "素材描述", priorityScore: 95, priorityReason: "素材不清楚" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: null,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await exportBatchReviewManualTaskCardToObsidian({ obsidianRoot });

  assert.equal(result.readback.ok, true);
  assert.ok(result.targetPath.startsWith(obsidianRoot));
  assert.ok(result.taskCardMarkdown.includes("人工复盘待补任务"));
});

test("exportBatchReviewManualBackfillToObsidian writes editable backfill draft", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-manual-backfill-export-"));
  const obsidianRoot = join(tempRoot, "obsidian");
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-fill-sheets", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-a"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-a"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-b"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "obsidian-export-logs", "batch-review-manual-task-card"), {
    recursive: true,
  });
  await mkdir(obsidianRoot, { recursive: true });
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-fill-sheets",
      "batch-a",
      "2026-06-27T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T10:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: "/tmp/batch-a-fill.md",
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "batch-a",
      "2026-06-27T11-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T11:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: join(tempRoot, "obsidian", "batch-a-run.md"),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "obsidian", "batch-a-run.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "- 这批案例最卡的环节：",
      "- 当前更像功能问题，还是界面问题：",
      "- 哪个按钮或模块最该前置：",
      "- UI 优化是否已经到时机：",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-a", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        createdCount: 2,
        frictionTemplate: [
          {
            id: "result-reading",
            label: "结果阅读与选择判断",
            priorityScore: 95,
            whyItMatters: "result",
            priorityReason: "结果阅读不顺",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: { readbackOk: true },
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-b", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        createdCount: 1,
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 90,
            whyItMatters: "input",
            priorityReason: "输入还是太重",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "素材描述", priorityScore: 95, priorityReason: "素材不清楚" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: null,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  const taskTargetPath = join(tempRoot, "obsidian", "人工复盘待补任务_2026-07-01.md");
  await writeFile(
    taskTargetPath,
    [
      "# 人工复盘待补任务_2026-07-01",
      "",
      "- 目标批次：batch-a",
      "- 最卡环节：看完结果不知道先选哪条",
      "- 问题类型判断：更像界面问题",
      "- 最该前置模块：结果区",
      "- UI 时机判断：接近可以讨论 UI",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-manual-task-card",
      "BRM-2026-07-01T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        exportId: "BRM-2026-07-01T10-00-00-000Z",
        exportedAt: "2026-07-01T10:00:00.000Z",
        targetPath: taskTargetPath,
        sourceMarkdownPath: "/tmp/batch-review-manual-task-card.md",
        sourceJsonPath: "/tmp/batch-review-manual-task-card.json",
        readback: { ok: true, matchedExpectedContent: true },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await exportBatchReviewManualBackfillToObsidian({ obsidianRoot });

  assert.equal(result.readback.ok, true);
  assert.ok(result.targetPath.startsWith(obsidianRoot));
  assert.ok(result.backfillMarkdown.includes("人工复盘回流预览"));
});

test("exportBatchReviewManualWritebackDraftToObsidian writes editable writeback draft", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-manual-writeback-export-"));
  const obsidianRoot = join(tempRoot, "obsidian");
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-fill-sheets", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-a"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-a"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-b"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "obsidian-export-logs", "batch-review-manual-task-card"), {
    recursive: true,
  });
  await mkdir(obsidianRoot, { recursive: true });
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-fill-sheets",
      "batch-a",
      "2026-06-27T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T10:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: "/tmp/batch-a-fill.md",
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "batch-a",
      "2026-06-27T11-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T11:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: join(tempRoot, "obsidian", "batch-a-run.md"),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "obsidian", "batch-a-run.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "- 这批案例最卡的环节：",
      "- 当前更像功能问题，还是界面问题：",
      "- 哪个按钮或模块最该前置：",
      "- UI 优化是否已经到时机：",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-a", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        createdCount: 2,
        frictionTemplate: [
          {
            id: "result-reading",
            label: "结果阅读与选择判断",
            priorityScore: 95,
            whyItMatters: "result",
            priorityReason: "结果阅读不顺",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: { readbackOk: true },
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-b", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        createdCount: 1,
        frictionTemplate: [
          {
            id: "input-structure",
            label: "输入准备与案例结构",
            priorityScore: 90,
            whyItMatters: "input",
            priorityReason: "输入还是太重",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "素材描述", priorityScore: 95, priorityReason: "素材不清楚" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: null,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  const taskTargetPath = join(tempRoot, "obsidian", "人工复盘待补任务_2026-07-01.md");
  await writeFile(
    taskTargetPath,
    [
      "# 人工复盘待补任务_2026-07-01",
      "",
      "- 目标批次：batch-a",
      "- 最卡环节：看完结果不知道先选哪条",
      "- 问题类型判断：更像界面问题",
      "- 最该前置模块：结果区",
      "- UI 时机判断：接近可以讨论 UI",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-manual-task-card",
      "BRM-2026-07-01T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        exportId: "BRM-2026-07-01T10-00-00-000Z",
        exportedAt: "2026-07-01T10:00:00.000Z",
        targetPath: taskTargetPath,
        sourceMarkdownPath: "/tmp/batch-review-manual-task-card.md",
        sourceJsonPath: "/tmp/batch-review-manual-task-card.json",
        readback: { ok: true, matchedExpectedContent: true },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await exportBatchReviewManualWritebackDraftToObsidian({ obsidianRoot });

  assert.equal(result.readback.ok, true);
  assert.ok(result.targetPath.startsWith(obsidianRoot));
  assert.ok(result.writebackDraftMarkdown.includes("真实批次试跑结论写回草稿"));
});

test("exportBatchReviewManualSafeWritePreviewToObsidian writes editable safe write preview", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-manual-safe-write-export-"));
  const obsidianRoot = join(tempRoot, "obsidian");
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-fill-sheets", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-a"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-a"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-b"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "obsidian-export-logs", "batch-review-manual-task-card"), {
    recursive: true,
  });
  await mkdir(obsidianRoot, { recursive: true });
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-fill-sheets",
      "batch-a",
      "2026-06-27T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T10:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: "/tmp/batch-a-fill.md",
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "batch-a",
      "2026-06-27T11-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T11:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: join(tempRoot, "obsidian", "batch-a-run.md"),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "obsidian", "batch-a-run.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "## 6. 人工试跑结论",
      "- 这批案例最卡的环节：",
      "",
      "## 7. 对产品的影响",
      "- 哪个按钮或模块最该前置：",
      "- 当前更像功能问题，还是界面问题：",
      "",
      "## 2. 补充结论",
      "- 这批试跑最关键的结论：",
      "- 下一批还要不要继续同样赛道：",
      "- UI 优化是否已经到时机：",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-a", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        createdCount: 2,
        frictionTemplate: [
          {
            id: "result-reading",
            label: "结果阅读与选择判断",
            priorityScore: 95,
            whyItMatters: "result",
            priorityReason: "结果阅读不顺",
          },
        ],
        validationSummary: {
          recommendedBatchActions: [
            { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
          ],
        },
        latestWorksheetHistory: {
          latestExportStatus: { readbackOk: true },
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-b", "run-record.json"),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        createdCount: 1,
        frictionTemplate: [],
        validationSummary: {
          recommendedBatchActions: [],
        },
        latestWorksheetHistory: {
          latestExportStatus: null,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  const taskTargetPath = join(tempRoot, "obsidian", "人工复盘待补任务_2026-07-01.md");
  await writeFile(
    taskTargetPath,
    [
      "# 人工复盘待补任务_2026-07-01",
      "",
      "- 目标批次：batch-a",
      "- 最卡环节：看完结果不知道先改哪一步",
      "- 问题类型判断：更像流程问题",
      "- 最该前置模块：输入准备区",
      "- UI 时机判断：先别急着做 UI",
      "- 这一批最重要的一句判断：结果还不够让人直接行动",
      "- 补完后最想重跑验证的点：先验证输入准备区前置后是否更顺",
      "- 是否更接近进入首页系统 UI 讨论：先别急着做 UI",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-manual-task-card",
      "BRM-2026-07-01T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        exportId: "BRM-2026-07-01T10-00-00-000Z",
        exportedAt: "2026-07-01T10:00:00.000Z",
        targetPath: taskTargetPath,
        sourceMarkdownPath: "/tmp/batch-review-manual-task-card.md",
        sourceJsonPath: "/tmp/batch-review-manual-task-card.json",
        readback: { ok: true, matchedExpectedContent: true },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const result = await exportBatchReviewManualSafeWritePreviewToObsidian({ obsidianRoot });

  assert.equal(result.readback.ok, true);
  assert.ok(result.targetPath.startsWith(obsidianRoot));
  assert.ok(result.safeWritePreviewMarkdown.includes("真实批次试跑记录安全写回预览"));
});

test("exportBatchReviewSuiteToObsidian writes bundled review artifacts", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-review-suite-export-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-fill-sheets", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-fill-sheets", "batch-b"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-b"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-a"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-b"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-c"), { recursive: true });
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });

  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-fill-sheets",
      "batch-a",
      "2026-06-27T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T10:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: "/tmp/batch-a-fill.md",
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-fill-sheets",
      "batch-b",
      "2026-06-27T10-30-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        normalizedLabel: "batch-b",
        exportedAt: "2026-06-27T10:30:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: "/tmp/batch-b-fill.md",
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "batch-a",
      "2026-06-27T11-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T11:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: join(tempRoot, "obsidian", "batch-a-run.md"),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "batch-b",
      "2026-06-27T11-30-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        normalizedLabel: "batch-b",
        exportedAt: "2026-06-27T11:30:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: join(tempRoot, "obsidian", "batch-b-run.md"),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "obsidian", "batch-a-run.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "- 这批案例最卡的环节：输入太重",
      "- 当前更像功能问题，还是界面问题：更像功能问题",
      "- 哪个按钮或模块最该前置：输入准备区",
      "- UI 优化是否已经到时机：先别急着做 UI",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "obsidian", "batch-b-run.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "- 这批案例最卡的环节：结果区太散",
      "- 当前更像功能问题，还是界面问题：更像界面问题",
      "- 哪个按钮或模块最该前置：结果区",
      "- UI 优化是否已经到时机：先别急着做 UI",
      "",
    ].join("\n"),
    "utf-8",
  );

  const record = (batchLabel, priorityReason) => ({
    batchLabel,
    createdCount: 2,
    frictionTemplate: [
      {
        id: "input-structure",
        label: "输入准备与案例结构",
        priorityScore: 95,
        whyItMatters: "input",
        priorityReason,
      },
      {
        id: "guidance-and-prioritization",
        label: "补写建议与优先顺序",
        priorityScore: 90,
        whyItMatters: "guidance",
        priorityReason: "建议是否真有用",
      },
    ],
    validationSummary: {
      recommendedBatchActions: [
        { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
      ],
    },
    latestWorksheetHistory: {
      latestExportStatus: { readbackOk: true },
    },
  });
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-a", "run-record.json"),
    `${JSON.stringify(record("batch-a", "缺失字段很多"), null, 2)}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-b", "run-record.json"),
    `${JSON.stringify(record("batch-b", "输入还是太重"), null, 2)}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-c", "run-record.json"),
    `${JSON.stringify(record("batch-c", "输入字段仍然散"), null, 2)}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const obsidianRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-review-suite-export-obsidian-"));
  const result = await exportBatchReviewSuiteToObsidian({ obsidianRoot });
  const exported = await readFile(result.targetPath, "utf-8");
  const logContent = await readFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "batch-review-suite",
      `${result.exportId}.json`,
    ),
    "utf-8",
  );

  assert.equal(result.ok, true);
  assert.equal(result.readback.ok, true);
  assert.equal(result.frictionSummaryExport.ok, true);
  assert.equal(result.uiReadinessExport.ok, true);
  assert.equal(result.dashboardExport.ok, true);
  assert.ok(result.suiteMarkdown.includes("# 批次复盘套件"));
  assert.ok(exported.includes("# 批次复盘套件_"));
  assert.ok(logContent.includes(`"exportId": "${result.exportId}"`));
});

test("exportUiOptimizationReadinessToObsidian writes editable readiness report", async (t) => {
  const previousCwd = process.cwd();
  const tempRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-ui-readiness-export-"));
  t.after(() => {
    process.chdir(previousCwd);
  });

  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-fill-sheets", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-fill-sheets", "batch-b"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-a"),
    { recursive: true },
  );
  await mkdir(
    join(tempRoot, "outputs", "obsidian-export-logs", "real-case-batch-run-records", "batch-b"),
    { recursive: true },
  );
  await mkdir(join(tempRoot, "obsidian"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-a"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-b"), { recursive: true });
  await mkdir(join(tempRoot, "outputs", "batch-run-records", "batch-c"), { recursive: true });
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-fill-sheets",
      "batch-a",
      "2026-06-27T10-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T10:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: "/tmp/batch-a-fill.md",
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "batch-b",
      "2026-06-27T11-30-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        normalizedLabel: "batch-b",
        exportedAt: "2026-06-27T11:30:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: false },
        targetPath: join(tempRoot, "obsidian", "batch-b-run.md"),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-fill-sheets",
      "batch-b",
      "2026-06-27T10-30-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-b",
        normalizedLabel: "batch-b",
        exportedAt: "2026-06-27T10:30:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: "/tmp/batch-b-fill.md",
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(
      tempRoot,
      "outputs",
      "obsidian-export-logs",
      "real-case-batch-run-records",
      "batch-a",
      "2026-06-27T11-00-00-000Z.json",
    ),
    `${JSON.stringify(
      {
        batchLabel: "batch-a",
        normalizedLabel: "batch-a",
        exportedAt: "2026-06-27T11:00:00.000Z",
        overwrite: { actionLabel: "overwrite" },
        readback: { ok: true },
        targetPath: join(tempRoot, "obsidian", "batch-a-run.md"),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "obsidian", "batch-a-run.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "- 这批案例最卡的环节：输入太重",
      "- 当前更像功能问题，还是界面问题：更像功能问题",
      "- 哪个按钮或模块最该前置：输入准备区",
      "- UI 优化是否已经到时机：先别急着做 UI",
      "",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "obsidian", "batch-b-run.md"),
    [
      "# 批次试跑记录_2026-06-27",
      "",
      "- 这批案例最卡的环节：结果区太散",
      "- 当前更像功能问题，还是界面问题：更像界面问题",
      "",
    ].join("\n"),
    "utf-8",
  );
  const readinessRecord = (batchLabel, priorityReason) => ({
    batchLabel,
    createdCount: 2,
    frictionTemplate: [
      {
        id: "input-structure",
        label: "输入准备与案例结构",
        priorityScore: 95,
        whyItMatters: "input",
        priorityReason,
      },
      {
        id: "guidance-and-prioritization",
        label: "补写建议与优先顺序",
        priorityScore: 90,
        whyItMatters: "guidance",
        priorityReason: "建议是否真有用",
      },
    ],
    validationSummary: {
      recommendedBatchActions: [
        { label: "内容主题", priorityScore: 95, priorityReason: "主题不明确" },
      ],
    },
    latestWorksheetHistory: {
      latestExportStatus: { readbackOk: true },
    },
  });
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-a", "run-record.json"),
    `${JSON.stringify(readinessRecord("batch-a", "缺失字段很多"), null, 2)}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-b", "run-record.json"),
    `${JSON.stringify(readinessRecord("batch-b", "输入还是太重"), null, 2)}\n`,
    "utf-8",
  );
  await writeFile(
    join(tempRoot, "outputs", "batch-run-records", "batch-c", "run-record.json"),
    `${JSON.stringify(readinessRecord("batch-c", "输入字段仍然散"), null, 2)}\n`,
    "utf-8",
  );

  process.chdir(tempRoot);
  const obsidianRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-ui-readiness-export-obsidian-"));
  const result = await exportUiOptimizationReadinessToObsidian({ obsidianRoot });
  const exported = await readFile(result.targetPath, "utf-8");
  const logContent = await readFile(
    join(tempRoot, "outputs", "obsidian-export-logs", "ui-readiness", `${result.exportId}.json`),
    "utf-8",
  );

  assert.equal(result.ok, true);
  assert.equal(result.readback.ok, true);
  assert.equal(result.report.crossBatchSignal.status, "strong-signal");
  assert.equal(result.report.readinessLevel, "ready");
  assert.ok(exported.includes("# UI优化进入条件报告_"));
  assert.ok(logContent.includes(`"exportId": "${result.exportId}"`));
});

test("runRealCaseFillPreview returns top fill tasks for one real case", async () => {
  const result = await runRealCaseFillPreview({ caseId: "real-001" });

  assert.equal(result.caseId, "real-001");
  assert.ok(result.readiness.status.length > 0);
  assert.ok(result.fillSheet.missingCount >= 0);
  assert.ok(Array.isArray(result.fillSheet.topPriorityItems));
  assert.ok(result.obsidianDraft.markdown.includes("## 1. 代码侧回填底稿"));
});

test("exportRealCaseFillSheetToObsidian writes editable obsidian draft", async () => {
  const obsidianRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-real-fill-"));
  const result = await exportRealCaseFillSheetToObsidian({
    caseId: "real-001",
    obsidianRoot,
  });
  const written = await readFile(result.targetPath, "utf-8");

  assert.equal(result.ok, true);
  assert.equal(result.caseId, "real-001");
  assert.equal(result.overwrite.requestedMode, "overwrite");
  assert.ok(result.targetPath.startsWith(obsidianRoot));
  assert.ok(written.includes("# 真实案例回填工作单_"));
  assert.ok(written.includes("## 2. 人工补充"));
  assert.equal(result.overwrite.actionLabel, "新建草稿");
  assert.equal(result.readback.ok, true);
  assert.equal(result.readback.matchedExpectedContent, true);
  assert.ok(result.readback.persistedHeading.startsWith("# 真实案例回填工作单_"));
  assert.ok(result.readback.persistedLength > 0);
  assert.ok(result.history.latestLogPath.includes("/outputs/obsidian-export-logs/real-case-fill-sheets/real-001/"));
  assert.ok(Array.isArray(result.history.recentExports));
  assert.ok(result.history.recentExports.length >= 1);
});

test("exportRealCaseFillSheetToObsidian marks overwrite when exporting same target again", async () => {
  const obsidianRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-real-fill-overwrite-"));
  const first = await exportRealCaseFillSheetToObsidian({
    caseId: "real-001",
    obsidianRoot,
  });
  const second = await exportRealCaseFillSheetToObsidian({
    caseId: "real-001",
    obsidianRoot,
  });

  assert.equal(first.overwrite.targetAlreadyExisted, false);
  assert.equal(second.overwrite.targetAlreadyExisted, true);
  assert.equal(second.overwrite.actionLabel, "覆盖现有草稿");
  assert.ok(second.overwrite.previousHeading.startsWith("# 真实案例回填工作单_"));
  assert.ok(second.history.recentExports.length >= 2);
});

test("exportRealCaseFillSheetToObsidian supports copy mode without overwriting base target", async () => {
  const obsidianRoot = await mkdtemp(join(os.tmpdir(), "ai-cover-real-fill-copy-"));
  const result = await exportRealCaseFillSheetToObsidian({
    caseId: "real-001",
    obsidianRoot,
    exportMode: "copy",
  });
  const written = await readFile(result.targetPath, "utf-8");

  assert.equal(result.overwrite.requestedMode, "copy");
  assert.equal(result.overwrite.actionLabel, "新建副本草稿");
  assert.ok(result.targetPath.includes("__副本_"));
  assert.equal(result.overwrite.targetAlreadyExisted, false);
  assert.ok(written.includes("## 2. 人工补充"));
});

test("runPlatformSyncPreview returns a dry-run sync preview for one real case", async () => {
  const obsidianRoot = await createTemporaryObsidianRoot();
  const result = await runPlatformSyncPreview({
    caseId: "real-001",
    obsidianRoot,
  });

  assert.equal(result.caseId, "real-001");
  assert.equal(result.platformCaseId, "P-01");
  assert.ok(Array.isArray(result.syncSummary.changedFields));
  assert.ok(result.syncSummary.readinessBefore.status.length > 0);
  assert.ok(result.syncSummary.readinessAfter.status.length > 0);
});

test("runPlatformCaseReview returns a structured review for one platform case", async () => {
  const obsidianRoot = await createTemporaryObsidianRoot();
  const result = await runPlatformCaseReview({
    platformCaseId: "P-01",
    obsidianRoot,
  });

  assert.equal(result.platformCaseId, "P-01");
  assert.equal(result.summary.completenessStatus, "可进入同步");
  assert.equal(result.summary.qualityStatus, "可用于生成");
  assert.equal(result.summary.linkedCaseCount >= 1, true);
  assert.ok(Array.isArray(result.summary.topPriorityItems));
  assert.ok(Array.isArray(result.actionPlan.tasks));
  assert.ok(result.syncPreview);
});

test("runPlatformCaseBatchReview returns a batch board across platform cases", async () => {
  const obsidianRoot = await createTemporaryObsidianRoot();
  const result = await runPlatformCaseBatchReview({ obsidianRoot });

  assert.equal(result.summary.totalCases >= 1, true);
  assert.ok(Array.isArray(result.topPriorityRows));
  assert.ok(Array.isArray(result.rows));
  assert.equal(result.rows[0].platformCaseId, "P-01");
});

test("buildPlatformCaseBatchReviewMarkdown renders a batch review board", () => {
  const markdown = buildPlatformCaseBatchReviewMarkdown({
    summary: {
      totalCases: 2,
      pendingCount: 1,
      partialCount: 1,
      readyCount: 0,
    },
    topPriorityRows: [
      {
        platformCaseId: "P-01",
        completenessStatus: "待回填",
        topPriorityItems: ["内容主题", "视觉焦点"],
      },
    ],
    rows: [
      {
        platformCaseId: "P-01",
        summary: {
          completenessStatus: "待回填",
          completedChecks: 5,
          totalChecks: 12,
          linkedCaseCount: 1,
          topPriorityItems: ["内容主题", "视觉焦点"],
        },
        syncPreview: {
          syncSummary: {
            changedFields: ["内容主题", "素材描述"],
          },
        },
      },
    ],
  });

  assert.ok(markdown.includes("# 平台案例批量复核看板"));
  assert.ok(markdown.includes("P-01｜待回填"));
  assert.ok(markdown.includes("Sync 预览变化：内容主题 / 素材描述"));
});

test("inspectPlatformCaseFieldQuality identifies missing and weak fields", () => {
  const result = inspectPlatformCaseFieldQuality({
    platformCaseId: "P-01",
    parsedNote: {
      content_topic: "待补",
      content_goal_guess: "太短",
      link_or_asset_path: "example",
      subject_description: "",
      visual_focus: "人物",
      click_driver_primary: "风险",
      direction_type_primary: "风险损失型",
      likely_positive_feedback: "更抓眼",
      possible_adjustment_direction: "",
      one_sentence_summary: "总结太短",
    },
  });

  assert.equal(result.status, "待回填");
  assert.ok(result.missingFields.includes("主体描述"));
  assert.ok(result.weakFields.some((item) => item.includes("内容主题")));
  assert.ok(result.weakFields.some((item) => item.includes("来源链接或素材路径")));
});

test("buildPlatformCaseReviewMarkdown renders completeness and quality summary", () => {
  const markdown = buildPlatformCaseReviewMarkdown({
    platformCaseId: "P-01",
    completeness: {
      checks: [{ label: "内容主题", complete: false }],
    },
    quality: {
      usableCount: 2,
      totalChecks: 10,
      checks: [{ label: "内容主题", status: "weak", issue: "仍是占位词" }],
    },
    actionPlan: {
      tasks: [
        {
          order: 1,
          label: "内容主题",
          priority: "P0",
          issue: "仍是占位词",
          reason: "主题不明确，整条案例无法被准确归类。",
          obsidianField: "0.基础信息 / content_topic",
          prompt: "用一句话写清这条内容具体讲什么。",
          example: "例如：为什么你总觉得自己很忙但没结果。",
        },
      ],
    },
    linkedCases: [{ caseId: "real-001", title: "案例", platform: "抖音" }],
    syncPreview: {
      syncSummary: {
        changedFields: ["内容主题"],
        readinessBefore: { status: "待回填", completedChecks: 0, totalChecks: 9 },
        readinessAfter: { status: "待补强", completedChecks: 5, totalChecks: 9 },
      },
    },
    summary: {
      completenessStatus: "待回填",
      qualityStatus: "待补强",
      completedChecks: 2,
      totalChecks: 12,
      linkedCaseCount: 1,
      readyToSync: false,
      topPriorityItems: ["内容主题", "内容目标"],
    },
  });

  assert.ok(markdown.includes("## 质量检查"));
  assert.ok(markdown.includes("## 补全顺序建议"));
  assert.ok(markdown.includes("为什么先补：主题不明确，整条案例无法被准确归类。"));
  assert.ok(markdown.includes("内容主题：weak｜仍是占位词"));
  assert.ok(markdown.includes("当前是否建议进入 sync：否"));
});

test("buildPlatformCaseActionPlan ranks missing and weak fields into fill order", () => {
  const actionPlan = buildPlatformCaseActionPlan({
    completeness: {
      missingFields: ["内容主题", "来源链接或素材路径", "视觉焦点"],
    },
    quality: {
      checks: [
        { label: "一句话结论", status: "weak", issue: "信息过短，建议至少 12 字" },
        { label: "内容主题", status: "missing", issue: "缺失" },
      ],
    },
  });

  assert.equal(actionPlan.tasks[0].label, "内容主题");
  assert.equal(actionPlan.tasks[1].label, "来源链接或素材路径");
  assert.ok(actionPlan.tasks.some((item) => item.label === "一句话结论"));
});

test("buildPlatformCaseFillDraft renders editable fill guidance", () => {
  const markdown = buildPlatformCaseFillDraft({
    platformCaseId: "P-01",
    notePath: "/tmp/P-01.md",
    quality: {
      usableCount: 0,
      totalChecks: 10,
    },
    summary: {
      completenessStatus: "待回填",
      completedChecks: 2,
      totalChecks: 12,
      qualityStatus: "待回填",
      readyToSync: false,
    },
    actionPlan: {
      tasks: [
        {
          order: 1,
          label: "内容主题",
          priority: "P0",
          reason: "主题不明确。",
          obsidianField: "0.基础信息 / content_topic",
          prompt: "用一句话写清内容主题。",
          example: "例如：为什么你总觉得自己很忙但没结果。",
        },
      ],
    },
    candidateSuggestions: {
      tasks: [
        {
          label: "内容主题",
          suggestion: {
            text: "待人工确认：把这条抖音内容具体讲什么写成一句话主题。",
            source: "规则提示",
          },
        },
      ],
    },
  });

  assert.ok(markdown.includes("# P-01 补写草稿"));
  assert.ok(markdown.includes("### 1. 内容主题"));
  assert.ok(markdown.includes("补写提示：用一句话写清内容主题。"));
  assert.ok(markdown.includes("候选填写：待人工确认：把这条抖音内容具体讲什么写成一句话主题。"));
});

test("buildObsidianPlatformCaseFillDraftRecord wraps fill draft into editable draft", () => {
  const markdown = buildObsidianPlatformCaseFillDraftRecord({
    generatedAt: "2026-06-19_190000",
    platformCaseId: "P-01",
    sourceMarkdownPath: "/tmp/P-01-fill.md",
    fillDraftMarkdown: "# P-01 补写草稿\n\n- line",
  });

  assert.ok(markdown.includes("# P-01_补写草稿_2026-06-19_190000"));
  assert.ok(markdown.includes("## 1. 代码侧补写底稿"));
  assert.ok(markdown.includes("## 2. 人工补充"));
});

test("buildPlatformCaseCandidateSuggestions creates manual-safe candidate hints", () => {
  const suggestions = buildPlatformCaseCandidateSuggestions({
    linkedCases: [{ platform: "抖音" }],
    parsedNote: {},
    syncPreview: { preview: {} },
    actionPlan: {
      tasks: [
        { order: 1, label: "内容主题", priority: "P0" },
        { order: 2, label: "来源链接或素材路径", priority: "P0" },
      ],
    },
  });

  assert.equal(suggestions.totalSuggestions, 2);
  assert.equal(suggestions.readyCandidates, 0);
  assert.ok(suggestions.tasks[0].suggestion.text.includes("待人工确认"));
});

test("buildPlatformCasePriorityDrafts creates top draft cards", () => {
  const drafts = buildPlatformCasePriorityDrafts(
    {
      actionPlan: {
        tasks: [
          {
            order: 1,
            label: "内容主题",
            priority: "P0",
            reason: "主题不明确。",
            obsidianField: "0.基础信息 / content_topic",
            prompt: "用一句话写清内容主题。",
            example: "例如：为什么你总觉得自己很忙但没结果。",
            candidateSuggestion: {
              text: "待人工确认：把这条抖音内容具体讲什么写成一句话主题。",
              source: "规则提示",
            },
          },
          {
            order: 2,
            label: "来源链接或素材路径",
            priority: "P0",
            reason: "需要证据。",
            obsidianField: "0.基础信息 / link_or_asset_path",
            prompt: "补真实链接或截图路径。",
            example: "例如：https://www.douyin.com/...",
            candidateSuggestion: {
              text: "待人工确认：补真实抖音链接。",
              source: "规则提示",
            },
          },
        ],
      },
    },
    2,
  );

  assert.equal(drafts.totalCards, 2);
  assert.ok(drafts.cards[0].draftText.includes("这条内容主要在讲"));
});

test("buildPlatformCasePriorityDraftsMarkdown renders editable priority cards", () => {
  const markdown = buildPlatformCasePriorityDraftsMarkdown({
    platformCaseId: "P-01",
    notePath: "/tmp/P-01.md",
    drafts: {
      cards: [
        {
          order: 1,
          label: "内容主题",
          priority: "P0",
          reason: "主题不明确。",
          obsidianField: "0.基础信息 / content_topic",
          editHint: "避免太泛。",
          candidateText: "待人工确认：把主题写清。",
          candidateSource: "规则提示",
          example: "例如：为什么你总觉得自己很忙但没结果。",
          draftText: "这条内容主要在讲：[把具体主题写清]。",
        },
      ],
    },
  });

  assert.ok(markdown.includes("# P-01 前三优先字段初稿卡"));
  assert.ok(markdown.includes("可编辑初稿：这条内容主要在讲"));
});

test("buildObsidianPlatformCasePriorityDraftsRecord wraps priority drafts into editable draft", () => {
  const markdown = buildObsidianPlatformCasePriorityDraftsRecord({
    generatedAt: "2026-06-19_210000",
    platformCaseId: "P-01",
    sourceMarkdownPath: "/tmp/P-01-priority.md",
    draftsMarkdown: "# P-01 前三优先字段初稿卡\n\n- line",
  });

  assert.ok(markdown.includes("# P-01_前三优先字段初稿卡_2026-06-19_210000"));
  assert.ok(markdown.includes("## 1. 代码侧初稿卡底稿"));
  assert.ok(markdown.includes("## 2. 人工补充"));
});

test("applyPlatformCaseDraftUpdates replaces targeted platform-case fields", () => {
  const markdown = [
    "- content_topic：",
    "- link_or_asset_path：",
    "- subject_description：",
  ].join("\n");

  const result = applyPlatformCaseDraftUpdates(markdown, {
    content_topic: "[待确认草稿] 这条内容主要在讲：[把具体主题写清]。",
    link_or_asset_path: "[待确认草稿] 待补真实案例来源：[粘贴抖音链接]。",
  });

  assert.ok(result.includes("- content_topic：[待确认草稿] 这条内容主要在讲"));
  assert.ok(result.includes("- link_or_asset_path：[待确认草稿] 待补真实案例来源"));
  assert.ok(result.includes("- subject_description："));
});

test("getPlatformCaseFieldKey resolves supported platform-case labels", () => {
  assert.equal(getPlatformCaseFieldKey("内容目标"), "content_goal_guess");
  assert.equal(getPlatformCaseFieldKey("视觉焦点"), "visual_focus");
  assert.equal(getPlatformCaseFieldKey("主点击机制"), "click_driver_primary");
});

test("buildPlatformCaseApplyLogMarkdown renders before and after values", () => {
  const markdown = buildPlatformCaseApplyLogMarkdown({
    platformCaseId: "P-01",
    notePath: "/tmp/P-01.md",
    updatedFields: [
      {
        fieldKey: "content_goal_guess",
        before: "- content_goal_guess：",
        after: "- content_goal_guess：[待确认草稿] 这条内容希望用户点开后获得...",
      },
    ],
  });

  assert.ok(markdown.includes("# 平台案例回填记录｜P-01"));
  assert.ok(markdown.includes("变更前：- content_goal_guess："));
  assert.ok(markdown.includes("变更后：- content_goal_guess：[待确认草稿]"));
});

test("buildObsidianPlatformCaseApplyLogRecord wraps apply log into editable draft", () => {
  const markdown = buildObsidianPlatformCaseApplyLogRecord({
    generatedAt: "2026-06-19_210500",
    sourceMarkdownPath: "/tmp/apply-log.md",
    applyLogMarkdown: "# 平台案例回填记录｜P-01\n\n- line",
  });

  assert.ok(markdown.includes("# 平台案例回填记录_2026-06-19_210500"));
  assert.ok(markdown.includes("## 1. 代码侧回填底稿"));
  assert.ok(markdown.includes("## 2. 人工补充"));
});

test("buildObsidianPlatformCaseReviewRecord wraps review into editable draft", () => {
  const markdown = buildObsidianPlatformCaseReviewRecord({
    generatedAt: "2026-06-19_180000",
    platformCaseId: "P-01",
    sourceMarkdownPath: "/tmp/P-01.md",
    reviewMarkdown: "# 平台案例复核总览｜P-01\n\n- line",
  });

  assert.ok(markdown.includes("# P-01_复核总览_2026-06-19_180000"));
  assert.ok(markdown.includes("## 1. 代码侧复核底稿"));
  assert.ok(markdown.includes("## 2. 人工补充"));
});

test("buildObsidianPlatformCaseBatchReviewRecord wraps batch review into editable draft", () => {
  const markdown = buildObsidianPlatformCaseBatchReviewRecord({
    generatedAt: "2026-06-19_173000",
    sourceMarkdownPath: "/tmp/platform-case-batch-review.md",
    reviewMarkdown: "# 平台案例批量复核看板\n\n- line",
  });

  assert.ok(markdown.includes("# 平台案例批量复核看板_2026-06-19_173000"));
  assert.ok(markdown.includes("## 1. 代码侧批量复核底稿"));
  assert.ok(markdown.includes("## 2. 人工补充"));
});

test("resolveRealCaseEntries supports file-based real case items", async () => {
  const items = [
    {
      id: "real-201",
      file: "items/real-201.json",
      status: "draft",
    },
  ];

  const result = await resolveRealCaseEntries({
    items,
    indexPath: "/tmp/index.json",
    readJson: async (path) => {
      assert.equal(path, "/tmp/items/real-201.json");

      return {
        id: "real-201",
        title: "真实案例文件",
        sourceType: "real",
        platform: "抖音",
        tracking: {
          platformCaseId: "P-02",
          obsidianCasePath: "03/path/P-02_待补.md",
        },
        contentTopic: "主题",
        contentGoal: "目标",
        userAssetType: "截图",
        assetDescription: "当前只有普通截图，想补贴内容辅助图",
        referencePreference: "更抓眼",
        assetNotes: "素材说明",
        evidence: {
          sourceLink: "",
          screenshotPath: "",
          notes: "入选原因",
        },
        mockUserSelection: {
          selectedCardId: "A",
          preserveElement: "保留主钩子",
          feedback: "更贴内容一点",
        },
      };
    },
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "real-201");
});

test("listAvailableCases prioritizes real pending cases before samples", async () => {
  const items = await listAvailableCases();

  assert.ok(items.length > 0);
  assert.equal(items[0].sourceType, "real");
  assert.equal(items[0].overviewMeta?.isActionable, true);
  assert.ok(typeof items[0].keyCaseRerunPriority === "number");
  const realCase = items.find((item) => item.sourceType === "real");
  const sampleCase = items.find((item) => item.sourceType === "sample");
  assert.ok(realCase);
  assert.ok(sampleCase);
  assert.ok(items.indexOf(realCase) < items.indexOf(sampleCase));
  assert.ok("latestExportStatus" in realCase);
  assert.ok("overviewMeta" in realCase);
  assert.equal(typeof realCase.overviewMeta.laneLabel, "string");
});

test("buildRealCaseOverviewMeta prioritizes undexported pending cases first", () => {
  const pending = buildRealCaseOverviewMeta({
    keyCaseRerunPriority: 8,
    readinessStatus: "待回填",
    latestExportStatus: null,
  });
  const validated = buildRealCaseOverviewMeta({
    keyCaseRerunPriority: 8,
    readinessStatus: "可进入手动验证",
    latestExportStatus: {
      actionLabel: "覆盖现有草稿",
      requestedMode: "overwrite",
      readbackOk: true,
    },
  });

  assert.equal(pending.laneLabel, "优先补写并导出");
  assert.equal(validated.laneLabel, "已可进入验证");
  assert.equal(pending.isActionable, true);
  assert.equal(validated.isActionable, false);
  assert.ok(pending.priorityScore < validated.priorityScore);
});

test("loadLatestRealCaseFillExportStatus returns latest export metadata when logs exist", async () => {
  const status = await loadLatestRealCaseFillExportStatus("real-001");

  assert.ok(status);
  assert.equal(typeof status.exportId, "string");
  assert.equal(typeof status.actionLabel, "string");
  assert.equal(typeof status.readbackOk, "boolean");
  assert.ok(status.logPath.includes("/outputs/obsidian-export-logs/real-case-fill-sheets/real-001/"));
});

test("runSampleCaseFlow returns an end-to-end sample record", async () => {
  const result = await runSampleCaseFlow("sample-001");

  assert.equal(result.sampleCase.id, "sample-001");
  assert.equal(result.analysis.cards.length, 3);
  assert.ok(result.refinement.secondRound.refinedCard.cardTitle.includes("第二轮优化"));
});

test("buildRefinementExplanationMarkdown renders second-round explanation details", async () => {
  const result = await runCaseFlow("sample-001");
  const markdown = buildRefinementExplanationMarkdown(result);

  assert.ok(markdown.includes("二轮解释验证记录"));
  assert.ok(markdown.includes("## 2.1 首轮方向判断依据"));
  assert.ok(markdown.includes(result.refinement.adjustment.feedbackMappingId));
  assert.ok(markdown.includes(result.refinement.mappingExplanation.summary));
});

test("buildObsidianRefinementExplanationRecord wraps explanation markdown into editable draft", () => {
  const markdown = buildObsidianRefinementExplanationRecord({
    caseId: "sample-001",
    generatedDate: "2026-06-20",
    resultJsonPath: "/tmp/result.json",
    summaryMarkdown: "# mock summary",
  });

  assert.ok(markdown.includes("二轮解释验证_2026-06-20_sample-001"));
  assert.ok(markdown.includes("代码侧解释底稿"));
  assert.ok(markdown.includes("# mock summary"));
});

test("parseRefinementExplanationReviewNote extracts structured review fields", () => {
  const review = parseRefinementExplanationReviewNote([
    "- review_case_id: sample-001",
    "- review_status: misclassified",
    "- explanation_status: unclear",
    "- misclassified: yes",
    "- should_export_to_misclassified: yes",
    "- actual_issue: 更像离内容太远",
    "- suggested_keyword: 不贴内容",
    "- suggested_mapping_id: neg-content-distance",
    "- suggested_positive_signal_id: pos-suspense-click",
    "- fallback_adjustment: 不要默认走 too-salesy",
  ].join("\n"));

  assert.equal(review.caseId, "sample-001");
  assert.equal(review.reviewStatus, "misclassified");
  assert.equal(review.shouldExportToMisclassified, "yes");
  assert.equal(review.suggestedMappingId, "neg-content-distance");
});

test("applyRefinementExplanationReviewFields updates structured review values", () => {
  const next = applyRefinementExplanationReviewFields(
    [
      "- review_case_id:",
      "- review_status: pending",
      "- explanation_status: pending",
      "- misclassified: pending",
      "- should_export_to_misclassified: pending",
      "- actual_issue:",
      "- suggested_keyword:",
      "- suggested_mapping_id:",
      "- suggested_positive_signal_id:",
      "- fallback_adjustment:",
    ].join("\n"),
    {
      caseId: "sample-001",
      reviewStatus: "misclassified",
      explanationStatus: "unclear",
      misclassified: "yes",
      shouldExportToMisclassified: "yes",
      actualIssue: "更像离内容太远",
      suggestedKeyword: "不贴内容",
      suggestedMappingId: "neg-content-distance",
      suggestedPositiveSignalId: "pos-suspense-click",
      fallbackAdjustment: "不要默认走 too-salesy",
    },
  );

  assert.ok(next.includes("- review_case_id: sample-001"));
  assert.ok(next.includes("- review_status: misclassified"));
  assert.ok(next.includes("- should_export_to_misclassified: yes"));
  assert.ok(next.includes("- suggested_mapping_id: neg-content-distance"));
});

test("applyRefinementExplanationReviewFields restores missing structured review fields", () => {
  const next = applyRefinementExplanationReviewFields(
    [
      "## 2. 人工复核结论",
      "- review_case_id: sample-001",
      "- explanation_status: pending",
      "- misclassified: pending",
      "- should_export_to_misclassified: pending",
      "- actual_issue:",
      "- suggested_mapping_id:",
      "- fallback_adjustment:",
      "",
      "- 解释是否足够清楚：",
      "- 是否存在误判：",
      "- 是否需要加入误判样本导出：",
      "",
      "## 3. 规则调整建议",
    ].join("\n"),
    {
      reviewStatus: "misclassified",
      suggestedKeyword: "不贴内容",
      suggestedPositiveSignalId: "pos-suspense-click",
    },
  );

  assert.ok(next.includes("- review_status: misclassified"));
  assert.ok(next.includes("- suggested_keyword: 不贴内容"));
  assert.ok(next.includes("- suggested_positive_signal_id: pos-suspense-click"));
  assert.ok(
    next.indexOf("- review_status: misclassified") <
      next.indexOf("- explanation_status: pending"),
  );
});

test("buildRefinementExplanationSummaryReport summarizes refinement explanation runs", async () => {
  const sample = await runCaseFlow("sample-001");
  const real = await runCaseFlow("real-001");
  const report = buildRefinementExplanationSummaryReport([sample, real], [
    {
      caseId: "sample-001",
      reviewStatus: "misclassified",
      explanationStatus: "unclear",
      misclassified: "yes",
      shouldExportToMisclassified: "yes",
      actualIssue: "更像离内容太远",
      suggestedKeyword: "不贴内容",
      suggestedMappingId: "neg-content-distance",
      suggestedPositiveSignalId: "",
      fallbackAdjustment: "不要默认走 too-salesy",
    },
  ]);

  assert.equal(report.summary.totalRows, 2);
  assert.ok(report.summary.uniqueNegativeMappingCount >= 1);
  assert.equal(report.summary.reviewedCount, 1);
  assert.equal(report.summary.misclassifiedCount, 1);
  assert.equal(report.summary.exportToMisclassifiedCount, 1);
  assert.ok(Array.isArray(report.topNegativeMappings));
  assert.equal(report.rows.length, 2);
});

test("buildRefinementExplanationSummaryMarkdown renders summary board", async () => {
  const sample = await runCaseFlow("sample-001");
  const report = buildRefinementExplanationSummaryReport([sample], [
    {
      caseId: "sample-001",
      reviewStatus: "misclassified",
      explanationStatus: "unclear",
      misclassified: "yes",
      shouldExportToMisclassified: "yes",
      actualIssue: "更像离内容太远",
      suggestedKeyword: "不贴内容",
      suggestedMappingId: "neg-content-distance",
      suggestedPositiveSignalId: "",
      fallbackAdjustment: "不要默认走 too-salesy",
    },
  ]);
  const markdown = buildRefinementExplanationSummaryMarkdown(report);

  assert.ok(markdown.includes("# 二轮解释验证汇总"));
  assert.ok(markdown.includes("## 高频负向映射"));
  assert.ok(markdown.includes("## 高频误判映射"));
  assert.ok(markdown.includes(sample.refinement.adjustment.feedbackMappingId));
});

test("buildObsidianRefinementExplanationSummaryRecord wraps summary into editable draft", () => {
  const markdown = buildObsidianRefinementExplanationSummaryRecord({
    generatedDate: "2026-06-20",
    sourceMarkdownPath: "/tmp/refinement-explanations.md",
    summaryMarkdown: "# mock summary",
  });

  assert.ok(markdown.includes("二轮解释验证汇总_2026-06-20"));
  assert.ok(markdown.includes("代码侧汇总底稿"));
  assert.ok(markdown.includes("# mock summary"));
});

test("buildReviewedMisclassifiedExportReport promotes reviewed misclassified rows", async () => {
  const sample = await runCaseFlow("sample-001");
  const report = buildReviewedMisclassifiedExportReport([sample], [
    {
      caseId: "sample-001",
      reviewStatus: "misclassified",
      explanationStatus: "unclear",
      shouldExportToMisclassified: "yes",
      actualIssue: "更像离内容太远",
      suggestedKeyword: "不贴内容",
      suggestedMappingId: "neg-content-distance",
      suggestedPositiveSignalId: "",
      fallbackAdjustment: "不要默认走 too-salesy",
    },
  ]);

  assert.equal(report.summary.eligibleExportCount, 1);
  assert.equal(report.summary.missingCaseRunCount, 0);
  assert.equal(report.rows[0].caseId, "sample-001");
  assert.equal(report.rows[0].suggestedMappingId, "neg-content-distance");
  assert.ok(report.rows[0].sourceDirectionLabel.length > 0);
  assert.ok(Array.isArray(report.rows[0].sourceMatchedSignals));
});

test("buildReviewedMisclassifiedExportMarkdown renders export-ready rows", async () => {
  const sample = await runCaseFlow("sample-001");
  const report = buildReviewedMisclassifiedExportReport([sample], [
    {
      caseId: "sample-001",
      reviewStatus: "misclassified",
      explanationStatus: "unclear",
      shouldExportToMisclassified: "yes",
      actualIssue: "更像离内容太远",
      suggestedKeyword: "不贴内容",
      suggestedMappingId: "neg-content-distance",
      suggestedPositiveSignalId: "",
      fallbackAdjustment: "不要默认走 too-salesy",
    },
  ]);
  const markdown = buildReviewedMisclassifiedExportMarkdown(report);

  assert.ok(markdown.includes("# 二轮误判样本导出"));
  assert.ok(markdown.includes("sample-001"));
  assert.ok(markdown.includes("neg-content-distance"));
  assert.ok(markdown.includes("原方向命中信号"));
});

test("buildObsidianReviewedMisclassifiedExportRecord wraps export markdown into editable draft", () => {
  const markdown = buildObsidianReviewedMisclassifiedExportRecord({
    generatedDate: "2026-06-20",
    sourceMarkdownPath: "/tmp/reviewed-misclassified.md",
    summaryMarkdown: "# mock summary",
  });

  assert.ok(markdown.includes("二轮误判样本导出_2026-06-20"));
  assert.ok(markdown.includes("代码侧导出底稿"));
  assert.ok(markdown.includes("# mock summary"));
});

test("buildReviewedMisclassifiedExportReport ignores rows without export flag", async () => {
  const sample = await runCaseFlow("sample-001");
  const report = buildReviewedMisclassifiedExportReport([sample], [
    {
      caseId: "sample-001",
      reviewStatus: "misclassified",
      explanationStatus: "unclear",
      shouldExportToMisclassified: "pending",
      actualIssue: "更像离内容太远",
      suggestedKeyword: "不贴内容",
      suggestedMappingId: "neg-content-distance",
      suggestedPositiveSignalId: "",
      fallbackAdjustment: "不要默认走 too-salesy",
    },
  ]);

  assert.equal(report.summary.eligibleExportCount, 0);
  assert.equal(report.rows.length, 0);
});

test("buildRuleRevisionTaskSheetReport groups reviewed misclassified rows into tasks", () => {
  const report = buildRuleRevisionTaskSheetReport({
    rows: [
      {
        caseId: "sample-001",
        title: "为什么你总觉得自己很忙但没结果",
        negativeMappingId: "neg-too-salesy",
        sourceDirectionLabel: "更让人想点开",
        sourceMatchedSignals: ["内容里存在异常点或可留白空间"],
        sourceBoundaryRules: ["悬念不能变成标题党"],
        suggestedMappingId: "neg-content-distance",
        suggestedKeyword: "不贴内容",
        fallbackAdjustment: "不要默认走 too-salesy",
        actualIssue: "更像离内容太远",
      },
      {
        caseId: "sample-002",
        title: "大学生存钱的 3 个误区",
        negativeMappingId: "neg-too-salesy",
        sourceDirectionLabel: "更让人想点开",
        sourceMatchedSignals: ["内容里存在异常点或可留白空间"],
        sourceBoundaryRules: ["悬念不能变成标题党"],
        suggestedMappingId: "neg-content-distance",
        suggestedKeyword: "不贴内容",
        fallbackAdjustment: "不要默认走 too-salesy",
        actualIssue: "更像离内容太远",
      },
    ],
  });

  assert.equal(report.summary.sourceSampleCount, 2);
  assert.equal(report.summary.taskCount, 1);
  assert.equal(report.tasks[0].sampleCount, 2);
  assert.equal(report.tasks[0].priority, "P2");
  assert.ok(report.tasks[0].sourceDirectionLabels.includes("更让人想点开"));
});

test("buildRuleRevisionTaskSheetMarkdown renders grouped tasks", () => {
  const markdown = buildRuleRevisionTaskSheetMarkdown({
    summary: {
      sourceSampleCount: 2,
      taskCount: 1,
      p1Count: 0,
      p2Count: 1,
      p3Count: 0,
    },
    tasks: [
      {
        taskId: "REV-001",
        taskTitle: "补强 neg-content-distance 相关关键词：不贴内容",
        priority: "P2",
        sampleCount: 2,
        caseIds: ["sample-001", "sample-002"],
        sourceNegativeMappingIds: ["neg-too-salesy"],
        sourceDirectionLabels: ["更让人想点开"],
        sourceMatchedSignals: ["内容里存在异常点或可留白空间"],
        sourceBoundaryRules: ["悬念不能变成标题党"],
        actualIssues: ["更像离内容太远"],
        titles: ["为什么你总觉得自己很忙但没结果", "大学生存钱的 3 个误区"],
        suggestedMappingId: "neg-content-distance",
        suggestedKeyword: "不贴内容",
        fallbackAdjustment: "不要默认走 too-salesy",
      },
    ],
  });

  assert.ok(markdown.includes("# 规则修订任务单"));
  assert.ok(markdown.includes("REV-001"));
  assert.ok(markdown.includes("neg-content-distance"));
  assert.ok(markdown.includes("原命中方向"));
});

test("buildObsidianRuleRevisionTaskSheetRecord wraps task sheet into editable draft", () => {
  const markdown = buildObsidianRuleRevisionTaskSheetRecord({
    generatedDate: "2026-06-21",
    sourceMarkdownPath: "/tmp/rule-revision-task-sheet.md",
    summaryMarkdown: "# mock summary",
  });

  assert.ok(markdown.includes("规则修订任务单_2026-06-21"));
  assert.ok(markdown.includes("代码侧任务底稿"));
  assert.ok(markdown.includes("# mock summary"));
});

test("runCaseFlow returns a generic case run payload", async () => {
  const result = await runCaseFlow("sample-001");

  assert.equal(result.caseMeta.id, "sample-001");
  assert.equal(result.caseMeta.sourceType, "sample");
  assert.equal(result.analysis.cards.length, 3);
  assert.ok(result.analysis.cards[0].rankedImageStrategies[0].priorityReason.length > 0);
});

test("buildCaseRunMarkdown returns a syncable markdown summary", async () => {
  const result = await runCaseFlow("sample-001");
  const markdown = buildCaseRunMarkdown(result);

  assert.ok(markdown.includes("# 端到端样例运行记录｜sample-001"));
  assert.ok(markdown.includes("命中信号"));
  assert.ok(markdown.includes("## 4. 第二轮优化结果"));
  assert.ok(markdown.includes("## 6. 后续动作"));
});

test("buildKeyCaseRerunReport summarizes rerun results and downstream refresh", async () => {
  const sample = await runCaseFlow("sample-001");
  const report = buildKeyCaseRerunReport({
    generatedAt: "2026-06-25 12:00:00",
    plan: {
      planId: "key-case-rerun-default",
      description: "关键样例复跑",
      caseIds: ["sample-001"],
      downstreamRefreshTargets: ["reviewed-misclassified", "rule-revision-task-sheet"],
    },
    rerunResults: [
      {
        caseId: "sample-001",
        result: sample,
        outputDir: "/tmp/sample-001",
      },
    ],
    downstreamReports: {
      reviewedMisclassified: {
        summary: {
          eligibleExportCount: 1,
        },
      },
      ruleRevisionTaskSheet: {
        summary: {
          taskCount: 1,
        },
      },
    },
  });

  assert.equal(report.summary.plannedCaseCount, 1);
  assert.equal(report.summary.rerunCaseCount, 1);
  assert.equal(report.rows[0].caseId, "sample-001");
  assert.ok(report.rows[0].topDirectionLabel.length > 0);
});

test("buildKeyCaseRerunMarkdown renders rerun board", () => {
  const markdown = buildKeyCaseRerunMarkdown({
    meta: {
      generatedAt: "2026-06-25 12:00:00",
      planId: "key-case-rerun-default",
      description: "关键样例复跑",
      downstreamRefreshTargets: ["reviewed-misclassified", "rule-revision-task-sheet"],
    },
    summary: {
      plannedCaseCount: 2,
      rerunCaseCount: 2,
      sampleCaseCount: 1,
      realCaseCount: 1,
    },
    rows: [
      {
        caseId: "sample-001",
        title: "为什么你总觉得自己很忙但没结果",
        sourceType: "sample",
        platform: "抖音",
        ruleVersion: "c18a3eda29",
        topDirectionLabel: "更让人想点开",
        topDirectionType: "强悬念感",
        topMatchedSignals: ["内容里存在异常点或可留白空间"],
        selectedCardId: "B",
        selectedDirectionLabel: "更让人想点开",
        refinementMappingId: "neg-too-salesy",
        outputDir: "/tmp/sample-001",
      },
    ],
    downstreamReports: {
      reviewedMisclassified: {
        summary: {
          eligibleExportCount: 1,
        },
      },
      ruleRevisionTaskSheet: {
        summary: {
          taskCount: 1,
        },
      },
    },
  });

  assert.ok(markdown.includes("# 关键样例复跑报告"));
  assert.ok(markdown.includes("sample-001"));
  assert.ok(markdown.includes("reviewed-misclassified"));
});

test("buildObsidianKeyCaseRerunRecord wraps rerun report into editable draft", () => {
  const markdown = buildObsidianKeyCaseRerunRecord({
    generatedDate: "2026-06-25",
    sourceMarkdownPath: "/tmp/key-case-rerun.md",
    summaryMarkdown: "# 关键样例复跑报告\n\n- line",
  });

  assert.ok(markdown.includes("# 关键样例复跑报告_2026-06-25"));
  assert.ok(markdown.includes("## 1. 代码侧复跑底稿"));
  assert.ok(markdown.includes("# 关键样例复跑报告"));
});

test("buildKeyCaseRerunPlan sorts cases by rerun priority", () => {
  const plan = buildKeyCaseRerunPlan(
    [
      {
        id: "real-001",
        title: "真实案例",
        sourceType: "real",
        operations: {
          keyCaseRerunPriority: 6,
          maintenanceTags: ["real-case"],
        },
      },
      {
        id: "sample-001",
        title: "样例",
        sourceType: "sample",
        operations: {
          keyCaseRerunPriority: 10,
          maintenanceTags: ["sample"],
        },
      },
      {
        id: "sample-002",
        title: "不进入计划",
        sourceType: "sample",
        operations: {
          keyCaseRerunPriority: 0,
          maintenanceTags: [],
        },
      },
    ],
    {
      planId: "custom-plan",
      downstreamRefreshTargets: ["reviewed-misclassified"],
    },
  );

  assert.equal(plan.planId, "custom-plan");
  assert.deepEqual(plan.caseIds, ["sample-001", "real-001"]);
  assert.equal(plan.generatedFromCaseOperations[0].keyCaseRerunPriority, 10);
});

test("buildKeyCaseRerunPlan carries formal write candidate batch separately from executable cases", () => {
  const plan = buildKeyCaseRerunPlan(
    [
      {
        id: "sample-001",
        title: "样例",
        sourceType: "sample",
        operations: {
          keyCaseRerunPriority: 10,
          maintenanceTags: ["sample"],
        },
      },
    ],
    {
      planId: "custom-plan",
      downstreamRefreshTargets: ["reviewed-misclassified"],
    },
    {
      formalWriteExport: {
        targetPath: "/tmp/real-002_to_real-003_批次试跑记录_2026-06-27.md",
        followUpTasks: [
          {
            taskId: "key-case-rerun-plan",
            taskType: "key-case-rerun",
            status: "pending",
            executionMode: "manual-review-required",
            summary: "将 real-002_to_real-003 纳入规则调整后的关键样例复跑候选。",
            evidence: ["输入准备阶段需要复核。"],
          },
        ],
      },
    },
  );

  assert.deepEqual(plan.caseIds, ["sample-001"]);
  assert.equal(plan.formalWriteCandidateBatches[0].batchLabel, "real-002_to_real-003");
  assert.equal(plan.formalWriteCandidateBatches[0].taskId, "key-case-rerun-plan");
});

test("buildGeneratedKeyCaseRerunPlanMarkdown renders generated plan", () => {
  const markdown = buildGeneratedKeyCaseRerunPlanMarkdown({
    planId: "key-case-rerun-generated",
    caseIds: ["sample-001"],
    downstreamRefreshTargets: ["reviewed-misclassified", "rule-revision-task-sheet"],
    formalWriteCandidateBatches: [
      {
        batchLabel: "real-002_to_real-003",
        taskId: "key-case-rerun-plan",
        status: "pending",
        executionMode: "manual-review-required",
        summary: "正式写回后待拆解为关键样例复跑候选。",
      },
    ],
    generatedFromCaseOperations: [
      {
        caseId: "sample-001",
        title: "为什么你总觉得自己很忙但没结果",
        sourceType: "sample",
        keyCaseRerunPriority: 10,
        maintenanceTags: ["sample", "baseline"],
      },
    ],
  });

  assert.ok(markdown.includes("# 自动生成的关键样例复跑计划"));
  assert.ok(markdown.includes("sample-001"));
  assert.ok(markdown.includes("关键复跑优先级：10"));
  assert.ok(markdown.includes("正式写回候选批次"));
  assert.ok(markdown.includes("real-002_to_real-003"));
});

test("buildObsidianGeneratedKeyCaseRerunPlanRecord wraps generated plan into editable draft", () => {
  const markdown = buildObsidianGeneratedKeyCaseRerunPlanRecord({
    generatedDate: "2026-06-25",
    sourceMarkdownPath: "/tmp/key-case-rerun-plan.md",
    summaryMarkdown: "# 自动生成的关键样例复跑计划\n\n- line",
  });

  assert.ok(markdown.includes("# 自动生成的关键样例复跑计划_2026-06-25"));
  assert.ok(markdown.includes("## 1. 代码侧计划底稿"));
  assert.ok(markdown.includes("# 自动生成的关键样例复跑计划"));
});

test("buildKeyCaseRerunDiffReport summarizes before and after changes", () => {
  const report = buildKeyCaseRerunDiffReport({
    generatedAt: "2026-06-25 12:30:00",
    plan: {
      planId: "key-case-rerun-default",
      caseIds: ["sample-001"],
    },
    beforeResultsByCaseId: {
      "sample-001": {
        caseMeta: {
          id: "sample-001",
          title: "为什么你总觉得自己很忙但没结果",
          sourceType: "sample",
          platform: "抖音",
        },
        analysis: {
          ruleMeta: { version: "old-version" },
          cards: [
            {
              cardId: "A",
              directionLabelUserFacing: "更让人想点开",
              directionTypeInternal: "强悬念感",
              directionSignalChecklist: {
                matchedSignals: ["旧信号"],
              },
            },
          ],
        },
        refinement: {
          adjustment: {
            selectedCardId: "A",
            feedbackMappingId: "neg-old",
          },
        },
      },
    },
    afterResultsByCaseId: {
      "sample-001": {
        caseMeta: {
          id: "sample-001",
          title: "为什么你总觉得自己很忙但没结果",
          sourceType: "sample",
          platform: "抖音",
        },
        analysis: {
          ruleMeta: { version: "new-version" },
          cards: [
            {
              cardId: "A",
              directionLabelUserFacing: "更有收获感",
              directionTypeInternal: "强结果感",
              directionSignalChecklist: {
                matchedSignals: ["新信号"],
              },
            },
          ],
        },
        refinement: {
          adjustment: {
            selectedCardId: "A",
            feedbackMappingId: "neg-new",
          },
        },
      },
    },
    outputDirsByCaseId: {
      "sample-001": "/tmp/sample-001",
    },
    downstreamBefore: {
      reviewedMisclassified: {
        summary: { eligibleExportCount: 0 },
      },
      ruleRevisionTaskSheet: {
        summary: { taskCount: 0 },
      },
    },
    downstreamAfter: {
      reviewedMisclassified: {
        summary: { eligibleExportCount: 1 },
      },
      ruleRevisionTaskSheet: {
        summary: { taskCount: 2 },
      },
    },
  });

  assert.equal(report.summary.comparedCaseCount, 1);
  assert.equal(report.summary.changedCaseCount, 1);
  assert.equal(report.summary.downstreamChangedCount, 2);
  assert.ok(report.caseDiffRows[0].changes.length >= 3);
});

test("buildKeyCaseRerunDiffMarkdown renders diff board", () => {
  const markdown = buildKeyCaseRerunDiffMarkdown({
    meta: {
      generatedAt: "2026-06-25 12:30:00",
      planId: "key-case-rerun-default",
    },
    summary: {
      comparedCaseCount: 1,
      changedCaseCount: 1,
      unchangedCaseCount: 0,
      downstreamChangedCount: 1,
    },
    caseDiffRows: [
      {
        caseId: "sample-001",
        title: "为什么你总觉得自己很忙但没结果",
        sourceType: "sample",
        platform: "抖音",
        outputDir: "/tmp/sample-001",
        changeCount: 2,
        changes: [
          {
            label: "首轮主方向",
            before: "更让人想点开",
            after: "更有收获感",
          },
        ],
      },
    ],
    downstreamDiffs: [
      {
        label: "可导出误判样本数",
        before: 0,
        after: 1,
        changed: true,
      },
    ],
  });

  assert.ok(markdown.includes("# 关键样例复跑前后差异报告"));
  assert.ok(markdown.includes("sample-001"));
  assert.ok(markdown.includes("首轮主方向"));
});

test("buildObsidianKeyCaseRerunDiffRecord wraps diff report into editable draft", () => {
  const markdown = buildObsidianKeyCaseRerunDiffRecord({
    generatedDate: "2026-06-25",
    sourceMarkdownPath: "/tmp/key-case-rerun-diff.md",
    summaryMarkdown: "# 关键样例复跑前后差异报告\n\n- line",
  });

  assert.ok(markdown.includes("# 关键样例复跑前后差异报告_2026-06-25"));
  assert.ok(markdown.includes("## 1. 代码侧差异底稿"));
  assert.ok(markdown.includes("# 关键样例复跑前后差异报告"));
});

test("buildObsidianCaseRunRecord wraps summary into an editable obsidian draft", () => {
  const markdown = buildObsidianCaseRunRecord({
    caseId: "sample-001",
    generatedDate: "2026-06-18",
    resultJsonPath: "/tmp/result.json",
    summaryMarkdown: "# 端到端样例运行记录｜sample-001\n\n## A\n- line",
  });

  assert.ok(markdown.includes("# 端到端样例_2026-06-18_sample-001"));
  assert.ok(markdown.includes("## 1. 代码侧运行底稿"));
  assert.ok(markdown.includes("## 2. 人工补充观察"));
});

test("buildCaseProgressReport summarizes case lifecycle states", () => {
  const report = buildCaseProgressReport({
    placeholderFiles: ["P-01_待补.md", "P-02_待补.md"],
    plannedEntries: [
      { id: "real-001", platformCaseId: "P-01" },
      { id: "real-002", platformCaseId: "P-02" },
    ],
    indexedEntries: [
      { id: "real-001", platformCaseId: "P-01" },
      { id: "real-002", platformCaseId: "P-02" },
    ],
    itemEntries: [{ id: "real-001", platformCaseId: "P-01" }],
    runIds: ["real-001", "sample-001"],
    obsidianIds: ["real-001"],
  });

  assert.equal(report.summary.placeholderOpenCount, 2);
  assert.equal(report.summary.plannedRealCaseCount, 2);
  assert.equal(report.summary.fullyBridgedCount, 1);
  assert.equal(report.summary.sampleRunExportCount, 1);
  assert.equal(report.rows.find((row) => row.caseId === "real-001")?.status, "已生成 Obsidian 草稿");
  assert.equal(report.rows.find((row) => row.caseId === "real-002")?.status, "仅有索引");
});

test("buildCaseProgressMarkdown renders report summary", () => {
  const markdown = buildCaseProgressMarkdown({
    summary: {
      placeholderOpenCount: 2,
      plannedRealCaseCount: 2,
      indexedRealCaseCount: 1,
      realCaseItemCount: 1,
      runExportCount: 1,
      obsidianDraftCount: 1,
      fullyBridgedCount: 1,
      sampleRunExportCount: 1,
      sampleObsidianDraftCount: 0,
      mappingWarningCount: 0,
    },
    placeholders: ["P-01_待补.md"],
    plannedEntries: [],
    mappingWarnings: [],
    rows: [{ caseId: "real-001", platformCaseId: "P-01", status: "已生成 Obsidian 草稿" }],
  });

  assert.ok(markdown.includes("# 案例进度报告"));
  assert.ok(markdown.includes("- P-01 / real-001：已生成 Obsidian 草稿"));
});

test("buildObsidianCaseProgressRecord wraps progress markdown into an editable obsidian draft", () => {
  const markdown = buildObsidianCaseProgressRecord({
    generatedDate: "2026-06-18",
    sourceMarkdownPath: "/tmp/case-progress.md",
    progressMarkdown: "# 案例进度报告\n\n- line",
  });

  assert.ok(markdown.includes("# 案例进度状态_2026-06-18"));
  assert.ok(markdown.includes("## 1. 代码侧状态底稿"));
  assert.ok(markdown.includes("## 3. 下一批动作"));
});

test("inspectRealCaseReadiness identifies placeholder gaps", () => {
  const result = inspectRealCaseReadiness({
    id: "real-001",
    title: "P-01 待补真实案例",
    tracking: {
      platformCaseId: "P-01",
    },
    contentTopic: "待补真实内容主题",
    contentGoal: "待补这条内容想传达的价值或点击目标",
    assetDescription: "待补当前已有截图/画面/用户想法，以及希望补什么类型的图",
    referencePreference: "待补希望的封面风格和质感倾向",
    assetNotes: "待补当前素材状态、画面特点、限制条件",
    evidence: {
      sourceLink: "",
      screenshotPath: "",
      notes: "待补为什么这条真实案例值得被纳入代码层样例",
    },
    mockUserSelection: {
      preserveElement: "待补希望保留的点击钩子或视觉元素",
      feedback: "待补第二轮优化反馈",
    },
  });

  assert.equal(result.status, "待回填");
  assert.ok(result.missingFields.includes("内容主题"));
  assert.ok(result.missingFields.includes("来源链接或截图路径"));
});

test("buildRealCaseReadinessReport summarizes readiness states", () => {
  const report = buildRealCaseReadinessReport([
    {
      caseId: "real-001",
      platformCaseId: "P-01",
      status: "待回填",
      completedChecks: 1,
      totalChecks: 9,
      missingFields: ["内容主题"],
    },
    {
      caseId: "real-002",
      platformCaseId: "P-02",
      status: "可进入手动验证",
      completedChecks: 9,
      totalChecks: 9,
      missingFields: [],
    },
  ]);

  assert.equal(report.summary.totalRealCases, 2);
  assert.equal(report.summary.readyCount, 1);
  assert.equal(report.summary.pendingCount, 1);
});

test("buildRealCaseReadinessMarkdown renders readiness details", () => {
  const markdown = buildRealCaseReadinessMarkdown({
    summary: {
      totalRealCases: 1,
      readyCount: 0,
      partialCount: 0,
      pendingCount: 1,
    },
    rows: [
      {
        caseId: "real-001",
        platformCaseId: "P-01",
        status: "待回填",
        completedChecks: 1,
        totalChecks: 9,
        missingFields: ["内容主题", "来源链接或截图路径"],
      },
    ],
  });

  assert.ok(markdown.includes("# 真实案例就绪度报告"));
  assert.ok(markdown.includes("P-01 / real-001：待回填"));
});

test("buildRealCaseMaintenanceBoardReport ranks real cases by priority and readiness", () => {
  const report = buildRealCaseMaintenanceBoardReport(
    [
      {
        id: "real-001",
        title: "真实案例一",
        sourceType: "real",
        platform: "抖音",
        tracking: {
          platformCaseId: "P-01",
        },
        operations: {
          keyCaseRerunPriority: 9,
          maintenanceTags: ["real-case", "high-priority-candidate"],
        },
      },
      {
        id: "real-002",
        title: "真实案例二",
        sourceType: "real",
        platform: "抖音",
        tracking: {
          platformCaseId: "P-02",
        },
        operations: {
          keyCaseRerunPriority: 2,
          maintenanceTags: ["real-case"],
        },
      },
    ],
    [
      {
        caseId: "real-001",
        status: "部分回填",
        completedChecks: 5,
        totalChecks: 9,
        missingFields: ["证据说明"],
      },
      {
        caseId: "real-002",
        status: "待回填",
        completedChecks: 1,
        totalChecks: 9,
        missingFields: ["内容主题"],
      },
    ],
  );

  assert.equal(report.summary.totalRealCases, 2);
  assert.equal(report.summary.p1Count, 1);
  assert.equal(report.rows[0].caseId, "real-001");
  assert.equal(report.rows[0].priorityBand, "P1");
});

test("buildRealCaseMaintenanceBoardMarkdown renders maintenance board", () => {
  const markdown = buildRealCaseMaintenanceBoardMarkdown({
    summary: {
      totalRealCases: 1,
      p1Count: 1,
      p2Count: 0,
      p3Count: 0,
      backlogCount: 0,
      readyHighPriorityCount: 0,
    },
    rows: [
      {
        caseId: "real-001",
        title: "真实案例一",
        platformCaseId: "P-01",
        priorityBand: "P1",
        rerunPriority: 9,
        readinessStatus: "部分回填",
        completedChecks: 5,
        totalChecks: 9,
        maintenanceTags: ["real-case", "high-priority-candidate"],
        reasonNotes: ["关键复跑优先级高", "当前字段缺失较多"],
        actionRecommendation: "优先补齐关键缺失字段，再进入验证",
        missingFields: ["证据说明"],
      },
    ],
  });

  assert.ok(markdown.includes("# 真实案例维护优先级看板"));
  assert.ok(markdown.includes("real-001"));
  assert.ok(markdown.includes("优先级：P1 / 9"));
});

test("buildObsidianRealCaseMaintenanceBoardRecord wraps maintenance board into editable draft", () => {
  const markdown = buildObsidianRealCaseMaintenanceBoardRecord({
    generatedDate: "2026-06-25",
    sourceMarkdownPath: "/tmp/real-case-maintenance-board.md",
    boardMarkdown: "# 真实案例维护优先级看板\n\n- line",
  });

  assert.ok(markdown.includes("# 真实案例维护优先级看板_2026-06-25"));
  assert.ok(markdown.includes("## 1. 代码侧看板底稿"));
  assert.ok(markdown.includes("# 真实案例维护优先级看板"));
});

test("buildObsidianRealCaseReadinessRecord wraps readiness report into editable draft", () => {
  const markdown = buildObsidianRealCaseReadinessRecord({
    generatedDate: "2026-06-18",
    sourceMarkdownPath: "/tmp/real-case-readiness.md",
    readinessMarkdown: "# 真实案例就绪度报告\n\n- line",
  });

  assert.ok(markdown.includes("# 真实案例就绪度_2026-06-18"));
  assert.ok(markdown.includes("## 1. 代码侧就绪度底稿"));
  assert.ok(markdown.includes("## 3. 下一批动作"));
});

test("buildRealCaseFillSheet maps missing readiness fields into tasks", () => {
  const fillSheet = buildRealCaseFillSheet({
    record: {
      id: "real-001",
      title: "P-01 待补真实案例",
      platform: "抖音",
      tracking: {
        platformCaseId: "P-01",
        obsidianCasePath: "03/path/P-01_待补.md",
      },
    },
    readiness: {
      status: "待回填",
      missingFields: ["内容主题", "来源链接或截图路径"],
    },
  });

  assert.equal(fillSheet.caseId, "real-001");
  assert.equal(fillSheet.missingCount, 2);
  assert.equal(fillSheet.missingItems[0].label, "来源链接或截图路径");
  assert.equal(fillSheet.missingItems[0].priority, "P0");
  assert.equal(fillSheet.missingItems[1].codeField, "contentTopic");
  assert.equal(fillSheet.topPriorityItems[0].label, "来源链接或截图路径");
});

test("buildRealCaseFillSheetMarkdown renders actionable fill tasks", () => {
  const markdown = buildRealCaseFillSheetMarkdown({
    caseId: "real-001",
    title: "P-01 待补真实案例",
    platform: "抖音",
    platformCaseId: "P-01",
    obsidianCasePath: "03/path/P-01_待补.md",
    readinessStatus: "待回填",
    missingCount: 1,
    missingItems: [
      {
        order: 1,
        label: "内容主题",
        codeField: "contentTopic",
        obsidianField: "0.基础信息 / content_topic",
        prompt: "用一句话写清这条内容到底在讲什么。",
      },
    ],
  });

  assert.ok(markdown.includes("# 真实案例回填工作单｜real-001"));
  assert.ok(markdown.includes("## 优先补这 3 项"));
  assert.ok(markdown.includes("### 1. 内容主题"));
  assert.ok(markdown.includes("代码字段：contentTopic"));
});

test("buildObsidianRealCaseFillSheetRecord wraps fill sheet into editable draft", () => {
  const markdown = buildObsidianRealCaseFillSheetRecord({
    generatedDate: "2026-06-18",
    sourceMarkdownPath: "/tmp/fill-sheet.md",
    fillSheetMarkdown: "# 真实案例回填工作单｜real-001\n\n- line",
  });

  assert.ok(markdown.includes("# 真实案例回填工作单_2026-06-18"));
  assert.ok(markdown.includes("## 1. 代码侧回填底稿"));
  assert.ok(markdown.includes("## 2. 人工补充"));
});

test("createRealCaseFillObsidianPreview returns draft metadata and markdown", () => {
  const preview = createRealCaseFillObsidianPreview({
    caseId: "real-001",
    fillSheetMarkdown: "# 真实案例回填工作单｜real-001\n\n- line",
    obsidianRoot: "/tmp/obsidian-root",
  });

  assert.equal(preview.generatedDate.length, 10);
  assert.equal(preview.sourceMarkdownPath.endsWith("/outputs/fill-sheets/real-001/fill-sheet.md"), true);
  assert.equal(preview.targetDir, "/tmp/obsidian-root/05_验证与实验/真实案例回填工作单/已生成记录");
  assert.equal(preview.targetPath.includes("real-001_回填工作单_"), true);
  assert.ok(preview.markdown.includes("## 1. 代码侧回填底稿"));
});

test("parsePlatformCaseNote extracts flat fields from platform note markdown", () => {
  const result = parsePlatformCaseNote(`
- content_topic：英语口语一直学不会怎么办
- content_goal_guess：让用户理解问题卡在哪里
- link_or_asset_path：https://example.com/post
- subject_description：人物半身口播截图
- visual_focus：红框标出关键词
`);

  assert.equal(result.content_topic, "英语口语一直学不会怎么办");
  assert.equal(result.link_or_asset_path, "https://example.com/post");
  assert.equal(result.visual_focus, "红框标出关键词");
});

test("buildRealCaseUpdateFromPlatformNote maps parsed fields into real-case structure", () => {
  const result = buildRealCaseUpdateFromPlatformNote(
    {
      id: "real-001",
      contentTopic: "待补真实内容主题",
      contentGoal: "待补这条内容想传达的价值或点击目标",
      assetDescription: "待补当前已有截图/画面/用户想法，以及希望补什么类型的图",
      assetNotes: "待补当前素材状态、画面特点、限制条件",
      referencePreference: "待补希望的封面风格和质感倾向",
      evidence: {
        sourceLink: "",
        screenshotPath: "",
        notes: "待补为什么这条真实案例值得被纳入代码层样例",
      },
      mockUserSelection: {
        preserveElement: "待补希望保留的点击钩子或视觉元素",
        feedback: "待补第二轮优化反馈",
      },
    },
    {
      content_topic: "英语口语一直学不会怎么办",
      content_goal_guess: "让用户理解问题卡在哪里",
      link_or_asset_path: "https://example.com/post",
      subject_description: "人物半身口播截图",
      visual_focus: "红框标出关键词",
      likely_positive_feedback: "很抓人",
      possible_adjustment_direction: "更贴内容一点",
    },
  );

  assert.equal(result.updates.contentTopic, "英语口语一直学不会怎么办");
  assert.equal(result.updates.contentGoal, "让用户理解问题卡在哪里");
  assert.equal(result.updates.evidence.sourceLink, "https://example.com/post");
  assert.ok(result.updates.assetDescription.includes("人物半身口播截图"));
  assert.equal(result.updates.mockUserSelection.feedback, "更贴内容一点");
});

test("buildPlatformSyncActions builds post-sync workflow steps", () => {
  const result = buildPlatformSyncActions({
    caseId: "real-001",
    refreshArtifacts: true,
    exportObsidian: true,
  });

  assert.equal(result.length, 5);
  assert.equal(result[0].id, "validate-cases");
  assert.equal(result[2].id, "generate-real-case-fill-sheet");
  assert.equal(result[4].id, "export-obsidian-fill-sheet");
});

test("buildPlatformSyncSummary compares changed fields and readiness delta", () => {
  const result = buildPlatformSyncSummary(
    {
      id: "real-001",
      title: "P-01 待补真实案例",
      tracking: { platformCaseId: "P-01" },
      contentTopic: "待补真实内容主题",
      contentGoal: "待补这条内容想传达的价值或点击目标",
      assetDescription: "待补当前已有截图/画面/用户想法，以及希望补什么类型的图",
      referencePreference: "待补希望的封面风格和质感倾向",
      assetNotes: "待补当前素材状态、画面特点、限制条件",
      evidence: {
        sourceLink: "",
        screenshotPath: "",
        notes: "待补为什么这条真实案例值得被纳入代码层样例",
      },
      mockUserSelection: {
        preserveElement: "待补希望保留的点击钩子或视觉元素",
        feedback: "待补第二轮优化反馈",
      },
    },
    {
      id: "real-001",
      title: "P-01 待补真实案例",
      tracking: { platformCaseId: "P-01" },
      contentTopic: "英语口语一直学不会怎么办",
      contentGoal: "让用户理解问题卡在哪里",
      assetDescription: "人物半身口播截图；红框标出关键词",
      referencePreference: "很抓人",
      assetNotes: "待补当前素材状态、画面特点、限制条件",
      evidence: {
        sourceLink: "https://example.com/post",
        screenshotPath: "",
        notes: "待补为什么这条真实案例值得被纳入代码层样例",
      },
      mockUserSelection: {
        preserveElement: "很抓人",
        feedback: "更贴内容一点",
      },
    },
  );

  assert.ok(result.changedFields.includes("内容主题"));
  assert.ok(result.changedFields.includes("来源链接"));
  assert.equal(result.readinessBefore.completedChecks, 0);
  assert.equal(result.readinessAfter.completedChecks, 7);
  assert.equal(result.readinessAfter.status, "部分回填");
});

test("buildPlatformSyncLogMarkdown renders sync delta summary", () => {
  const markdown = buildPlatformSyncLogMarkdown({
    caseId: "real-001",
    generatedAt: "2026-06-18_120000",
    dryRun: true,
    obsidianPath: "/tmp/P-01.md",
    targetPath: "/tmp/real-001.json",
    extractedFieldCount: 4,
    changedFieldCount: 3,
    changedFields: ["内容主题", "来源链接", "素材描述"],
    readinessBefore: {
      status: "待回填",
      completedChecks: 0,
      totalChecks: 9,
      missingFields: ["内容主题"],
    },
    readinessAfter: {
      status: "部分回填",
      completedChecks: 3,
      totalChecks: 9,
      missingFields: ["证据说明"],
    },
    postSyncActions: ["validate-cases", "report-real-case-readiness"],
    executedActions: [],
  });

  assert.ok(markdown.includes("# 平台案例同步日志｜real-001"));
  assert.ok(markdown.includes("同步前：待回填（0/9）"));
  assert.ok(markdown.includes("同步后：部分回填（3/9）"));
});

test("buildObsidianPlatformSyncLogRecord wraps sync log into editable draft", () => {
  const markdown = buildObsidianPlatformSyncLogRecord({
    generatedAt: "2026-06-18_120000",
    sourceMarkdownPath: "/tmp/sync-log.md",
    syncLogMarkdown: "# 平台案例同步日志｜real-001\n\n- line",
  });

  assert.ok(markdown.includes("# 平台案例同步记录_2026-06-18_120000"));
  assert.ok(markdown.includes("## 1. 代码侧同步底稿"));
  assert.ok(markdown.includes("## 2. 人工补充"));
});

test("inspectPlatformCaseCompleteness identifies missing platform-note fields", () => {
  const result = inspectPlatformCaseCompleteness({
    platformCaseId: "P-01",
    parsedNote: {
      case_id: "P-01",
      source_platform: "抖音",
      content_topic: "",
    },
  });

  assert.equal(result.status, "待回填");
  assert.ok(result.missingFields.includes("内容主题"));
  assert.ok(result.missingFields.includes("一句话结论"));
});

test("buildPlatformCaseCompletenessMarkdown renders checklist", () => {
  const markdown = buildPlatformCaseCompletenessMarkdown({
    platformCaseId: "P-01",
    status: "待回填",
    completedChecks: 2,
    totalChecks: 12,
    missingFields: ["内容主题", "内容目标"],
    checks: [
      { label: "案例编号", complete: true },
      { label: "内容主题", complete: false },
    ],
  });

  assert.ok(markdown.includes("# 平台案例完整度报告｜P-01"));
  assert.ok(markdown.includes("当前状态：待回填"));
  assert.ok(markdown.includes("内容主题：待填"));
});

test("buildObsidianPlatformCaseCompletenessRecord wraps completeness report into editable draft", () => {
  const markdown = buildObsidianPlatformCaseCompletenessRecord({
    generatedAt: "2026-06-18_235959",
    sourceMarkdownPath: "/tmp/P-01.md",
    completenessMarkdown: "# 平台案例完整度报告｜P-01\n\n- line",
  });

  assert.ok(markdown.includes("# 平台案例完整度_2026-06-18_235959"));
  assert.ok(markdown.includes("## 1. 代码侧完整度底稿"));
  assert.ok(markdown.includes("## 2. 人工补充"));
});

test("buildPlatformCasePlaceholder returns a reusable obsidian starter", () => {
  const markdown = buildPlatformCasePlaceholder({
    platformCaseId: "P-01",
    platform: "抖音",
    contentTopic: "英语口语一直学不会怎么办",
    sourceLink: "https://example.com/post",
  });

  assert.ok(markdown.includes("> 平台案例编号：P-01"));
  assert.ok(markdown.includes("- content_topic：英语口语一直学不会怎么办"));
  assert.ok(markdown.includes("- link_or_asset_path：https://example.com/post"));
});

test("isPlatformCasePlaceholder identifies the default obsidian placeholder", () => {
  assert.equal(
    isPlatformCasePlaceholder("# 平台案例占位\n\n- case_id：P-01"),
    true,
  );
  assert.equal(isPlatformCasePlaceholder("# 其他文档\n\n内容"), false);
});
