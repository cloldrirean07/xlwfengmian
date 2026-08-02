import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createAnalysisSession } from "../application/createAnalysisSession.js";
import { createActionWorkspaceSession } from "../application/createActionWorkspaceSession.js";
import { commitRealCaseBatchScaffold } from "../application/commitRealCaseBatchScaffold.js";
import { commitRealCaseScaffold } from "../application/commitRealCaseScaffold.js";
import { createRealCaseBatchScaffoldPreview } from "../application/createRealCaseBatchScaffoldPreview.js";
import { exportBatchRunFrictionSummaryToObsidian } from "../application/exportBatchRunFrictionSummaryToObsidian.js";
import { exportBatchReviewDashboardToObsidian } from "../application/exportBatchReviewDashboardToObsidian.js";
import { exportBatchReviewSuiteToObsidian } from "../application/exportBatchReviewSuiteToObsidian.js";
import { exportBatchReviewManualTaskCardToObsidian } from "../application/exportBatchReviewManualTaskCardToObsidian.js";
import { exportBatchReviewManualBackfillToObsidian } from "../application/exportBatchReviewManualBackfillToObsidian.js";
import { exportBatchReviewManualWritebackDraftToObsidian } from "../application/exportBatchReviewManualWritebackDraftToObsidian.js";
import { exportBatchReviewManualSafeWritePreviewToObsidian } from "../application/exportBatchReviewManualSafeWritePreviewToObsidian.js";
import { exportBatchReviewManualFormalWriteToObsidian } from "../application/exportBatchReviewManualFormalWriteToObsidian.js";
import { runBatchReviewDashboardPreview } from "../application/runBatchReviewDashboardPreview.js";
import { runBatchReviewManualBackfillPreview } from "../application/runBatchReviewManualBackfillPreview.js";
import { runBatchReviewManualTaskCardPreview } from "../application/runBatchReviewManualTaskCardPreview.js";
import { runBatchReviewManualWritebackDraftPreview } from "../application/runBatchReviewManualWritebackDraftPreview.js";
import { runBatchReviewManualSafeWritePreview } from "../application/runBatchReviewManualSafeWritePreview.js";
import { runBatchReviewManualFormalWriteReadinessPreview } from "../application/runBatchReviewManualFormalWriteReadinessPreview.js";
import { runManualConfirmationDraftValidationPreview } from "../application/runManualConfirmationDraftValidationPreview.js";
import { runManualConfirmationApplyPreviewStatus } from "../application/runManualConfirmationApplyPreviewStatus.js";
import { runManualConfirmationHandoffPacketStatus } from "../application/runManualConfirmationHandoffPacketStatus.js";
import { runManualConfirmationDecisionStatus } from "../application/runManualConfirmationDecisionStatus.js";
import { runManualConfirmationDecisionAdoptionPreviewStatus } from "../application/runManualConfirmationDecisionAdoptionPreviewStatus.js";
import { runManualConfirmationDecisionAdoptionPacketStatus } from "../application/runManualConfirmationDecisionAdoptionPacketStatus.js";
import { runManualConfirmationSafePreviewAdoptionPacketStatus } from "../application/runManualConfirmationSafePreviewAdoptionPacketStatus.js";
import { runManualConfirmationSafePreviewWritePrecheckStatus } from "../application/runManualConfirmationSafePreviewWritePrecheckStatus.js";
import { runManualConfirmationSafePreviewWriteProjectionStatus } from "../application/runManualConfirmationSafePreviewWriteProjectionStatus.js";
import { applyManualConfirmationSafePreviewWrite } from "../application/applyManualConfirmationSafePreviewWrite.js";
import { runManualFormalWriteExecutionPrecheckStatus } from "../application/runManualFormalWriteExecutionPrecheckStatus.js";
import { runManualFormalWriteExecutionPacketStatus } from "../application/runManualFormalWriteExecutionPacketStatus.js";
import { runManualFormalWritePostExecutionAcceptanceStatus } from "../application/runManualFormalWritePostExecutionAcceptanceStatus.js";
import { applyTitleSelectionWriteback } from "../application/applyTitleSelectionWriteback.js";
import { runPiEngineExecutionPositionAuditStatus } from "../application/runPiEngineExecutionPositionAuditStatus.js";
import { runFormalWriteFollowUpPlanStatus } from "../application/runFormalWriteFollowUpPlanStatus.js";
import { exportRealCaseBatchFillWorksheetToObsidian } from "../application/exportRealCaseBatchFillWorksheetToObsidian.js";
import { exportRealCaseBatchRunRecordToObsidian } from "../application/exportRealCaseBatchRunRecordToObsidian.js";
import { exportRealCaseFillSheetToObsidian } from "../application/exportRealCaseFillSheetToObsidian.js";
import { exportUiOptimizationReadinessToObsidian } from "../application/exportUiOptimizationReadinessToObsidian.js";
import { createRealCaseScaffoldPreview } from "../application/createRealCaseScaffoldPreview.js";
import { createLlmDraft } from "../application/createLlmDraft.js";
import { createPromptPreview } from "../application/createPromptPreview.js";
import { createRefinementSession } from "../application/createRefinementSession.js";
import { listAvailableCases } from "../application/listAvailableCases.js";
import { listSampleCases } from "../application/listSampleCases.js";
import { loadRealCaseBatchFillWorksheetHistory } from "../application/loadRealCaseBatchFillWorksheetHistory.js";
import { runBatchRunFrictionSummaryPreview } from "../application/runBatchRunFrictionSummaryPreview.js";
import { runRealCaseBatchFillPreview } from "../application/runRealCaseBatchFillPreview.js";
import { runRealCaseBatchRunRecordPreview } from "../application/runRealCaseBatchRunRecordPreview.js";
import { runRealCaseFillPreview } from "../application/runRealCaseFillPreview.js";
import { runPlatformCaseBatchReview } from "../application/runPlatformCaseBatchReview.js";
import { runPlatformCaseReview } from "../application/runPlatformCaseReview.js";
import { runPlatformSyncPreview } from "../application/runPlatformSyncPreview.js";
import { runCaseFlow } from "../application/runCaseFlow.js";
import { runSampleCaseFlow } from "../application/runSampleCaseFlow.js";
import { runUiOptimizationReadinessPreview } from "../application/runUiOptimizationReadinessPreview.js";
import { saveWorkspaceDecisionSession } from "../application/saveWorkspaceDecisionSession.js";
import { readJsonBody, sendJson, sendText } from "../shared/http.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..", "..", "..");
const publicDir = join(__dirname, "public");
const port = Number(process.env.PORT || 3080);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

async function serveStatic(req, res) {
  const path = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.split("?")[0];
  const filePath = join(publicDir, safePath);
  let content;

  try {
    content = await readFile(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return sendText(res, 404, "Not found");
    }

    throw error;
  }

  const contentType = mimeTypes[extname(filePath)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  res.end(content);
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || "/", `http://${req.headers.host || `${host}:${port}`}`);

    if (req.method === "GET" && requestUrl.pathname === "/api/health") {
      return sendJson(res, 200, { ok: true, service: "ai-cover-creative-assistant" });
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/sample-cases") {
      return sendJson(res, 200, { items: await listSampleCases() });
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/cases") {
      return sendJson(res, 200, { items: await listAvailableCases() });
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/platform-review") {
      return sendJson(
        res,
        200,
        await runPlatformCaseReview({
          platformCaseId: requestUrl.searchParams.get("platformCaseId") || "",
        }),
      );
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/platform-batch-review") {
      return sendJson(res, 200, await runPlatformCaseBatchReview());
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/platform-sync-preview") {
      return sendJson(
        res,
        200,
        await runPlatformSyncPreview({
          caseId: requestUrl.searchParams.get("caseId") || "",
        }),
      );
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/real-case-fill-preview") {
      return sendJson(
        res,
        200,
        await runRealCaseFillPreview({
          caseId: requestUrl.searchParams.get("caseId") || "",
        }),
      );
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/real-case-fill-export") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await exportRealCaseFillSheetToObsidian(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/real-case-batch-fill-preview") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await runRealCaseBatchFillPreview(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/real-case-batch-fill-export") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await exportRealCaseBatchFillWorksheetToObsidian(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/real-case-batch-fill-history") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await loadRealCaseBatchFillWorksheetHistory(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/real-case-batch-run-record-preview") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await runRealCaseBatchRunRecordPreview(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/real-case-batch-run-record-export") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await exportRealCaseBatchRunRecordToObsidian(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/batch-run-friction-summary-preview") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await runBatchRunFrictionSummaryPreview(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/batch-run-friction-summary-export") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await exportBatchRunFrictionSummaryToObsidian(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/batch-review-dashboard-preview") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await runBatchReviewDashboardPreview(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/batch-review-dashboard-export") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await exportBatchReviewDashboardToObsidian(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/batch-review-manual-task-card-preview") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await runBatchReviewManualTaskCardPreview(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/batch-review-manual-task-card-export") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await exportBatchReviewManualTaskCardToObsidian(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/batch-review-manual-backfill-preview") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await runBatchReviewManualBackfillPreview(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/batch-review-manual-backfill-export") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await exportBatchReviewManualBackfillToObsidian(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/batch-review-manual-writeback-draft-preview") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await runBatchReviewManualWritebackDraftPreview(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/batch-review-manual-writeback-draft-export") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await exportBatchReviewManualWritebackDraftToObsidian(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/batch-review-manual-safe-write-preview") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await runBatchReviewManualSafeWritePreview(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/batch-review-manual-safe-write-export") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await exportBatchReviewManualSafeWritePreviewToObsidian(payload));
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/batch-review-manual-formal-write-readiness") {
      return sendJson(res, 200, await runBatchReviewManualFormalWriteReadinessPreview());
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/batch-review-manual-confirmation-draft-validation") {
      return sendJson(res, 200, await runManualConfirmationDraftValidationPreview());
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/batch-review-manual-confirmation-apply-preview") {
      return sendJson(res, 200, await runManualConfirmationApplyPreviewStatus());
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/batch-review-manual-confirmation-handoff-packet") {
      return sendJson(res, 200, await runManualConfirmationHandoffPacketStatus());
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/batch-review-manual-confirmation-decision") {
      return sendJson(res, 200, await runManualConfirmationDecisionStatus());
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/batch-review-manual-confirmation-decision-adoption-preview") {
      return sendJson(res, 200, await runManualConfirmationDecisionAdoptionPreviewStatus());
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/batch-review-manual-confirmation-decision-adoption-packet") {
      return sendJson(res, 200, await runManualConfirmationDecisionAdoptionPacketStatus());
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/batch-review-manual-confirmation-safe-preview-adoption-packet") {
      return sendJson(res, 200, await runManualConfirmationSafePreviewAdoptionPacketStatus());
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/batch-review-manual-confirmation-safe-preview-write-precheck") {
      return sendJson(res, 200, await runManualConfirmationSafePreviewWritePrecheckStatus());
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/batch-review-manual-confirmation-safe-preview-write-projection") {
      return sendJson(res, 200, await runManualConfirmationSafePreviewWriteProjectionStatus());
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/batch-review-manual-confirmation-safe-preview-write-apply") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await applyManualConfirmationSafePreviewWrite(payload));
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/batch-review-manual-formal-write-execution-precheck") {
      return sendJson(res, 200, await runManualFormalWriteExecutionPrecheckStatus());
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/batch-review-manual-formal-write-execution-packet") {
      return sendJson(res, 200, await runManualFormalWriteExecutionPacketStatus());
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/batch-review-manual-formal-write-post-execution-acceptance") {
      return sendJson(res, 200, await runManualFormalWritePostExecutionAcceptanceStatus());
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/pi-engine-execution-position-audit") {
      return sendJson(res, 200, await runPiEngineExecutionPositionAuditStatus());
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/formal-write-follow-up-plan") {
      return sendJson(res, 200, await runFormalWriteFollowUpPlanStatus());
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/batch-review-manual-formal-write-export") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await exportBatchReviewManualFormalWriteToObsidian(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/title-selection-writeback-apply") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await applyTitleSelectionWriteback(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/batch-review-suite-export") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await exportBatchReviewSuiteToObsidian(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/ui-optimization-readiness-preview") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await runUiOptimizationReadinessPreview(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/ui-optimization-readiness-export") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await exportUiOptimizationReadinessToObsidian(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/analyze") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, createAnalysisSession(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/real-case-scaffold-preview") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await createRealCaseScaffoldPreview(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/real-case-scaffold-commit") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await commitRealCaseScaffold(payload));
    }

    if (
      req.method === "POST" &&
      requestUrl.pathname === "/api/real-case-batch-scaffold-preview"
    ) {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await createRealCaseBatchScaffoldPreview(payload));
    }

    if (
      req.method === "POST" &&
      requestUrl.pathname === "/api/real-case-batch-scaffold-commit"
    ) {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await commitRealCaseBatchScaffold(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/refine") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, createRefinementSession(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/action-workspace") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, createActionWorkspaceSession(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/workspace-decision") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await saveWorkspaceDecisionSession(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/prompt-preview") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, createPromptPreview(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/llm-draft") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await createLlmDraft(payload));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/sample-run") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await runSampleCaseFlow(payload.sampleCaseId));
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/case-run") {
      const payload = await readJsonBody(req);
      return sendJson(res, 200, await runCaseFlow(payload.caseId));
    }

    if (req.method === "GET") {
      return serveStatic(req, res);
    }

    return sendText(res, 404, "Not Found");
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "Unknown server error",
    });
  }
});

server.listen(port, host, () => {
  console.log(`AI Cover Creative Assistant running at http://${host}:${port}`);
});
