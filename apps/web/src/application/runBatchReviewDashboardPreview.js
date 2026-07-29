import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { buildBatchReviewDashboardMarkdown } from "../domain/review/buildBatchReviewDashboardMarkdown.js";
import { buildBatchReviewDashboardReport } from "../domain/review/buildBatchReviewDashboardReport.js";
import { loadLatestBatchReviewManualSafeWritePreviewStatus } from "./loadLatestBatchReviewManualSafeWritePreviewStatus.js";
import { loadLatestBatchReviewManualTaskCardStatus } from "./loadLatestBatchReviewManualTaskCardStatus.js";
import { runBatchRunFrictionSummaryPreview } from "./runBatchRunFrictionSummaryPreview.js";
import { runUiOptimizationReadinessPreview } from "./runUiOptimizationReadinessPreview.js";

async function loadRuleRevisionTaskSheetReport() {
  return readJsonReport(
    join(process.cwd(), "outputs", "reports", "rule-revision-task-sheet", "rule-revision-task-sheet.json"),
  );
}

async function loadKeyCaseRerunReport() {
  return readJsonReport(
    join(process.cwd(), "outputs", "reports", "key-case-rerun", "key-case-rerun.json"),
  );
}

async function loadKeyCaseRerunDiffReport() {
  return readJsonReport(
    join(process.cwd(), "outputs", "reports", "key-case-rerun", "key-case-rerun-diff.json"),
  );
}

async function readJsonReport(path) {
  try {
    const raw = await readFile(path, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function runBatchReviewDashboardPreview({ obsidianRoot = "" } = {}) {
  const crossBatchFrictionSummaryPreview = await runBatchRunFrictionSummaryPreview({ obsidianRoot });
  const uiOptimizationReadinessPreview = await runUiOptimizationReadinessPreview({
    obsidianRoot,
    crossBatchFrictionSummaryPreview,
  });
  const ruleRevisionTaskSheetReport = await loadRuleRevisionTaskSheetReport();
  const keyCaseRerunReport = await loadKeyCaseRerunReport();
  const keyCaseRerunDiffReport = await loadKeyCaseRerunDiffReport();
  const latestManualTaskCardStatus = await loadLatestBatchReviewManualTaskCardStatus();
  const latestManualSafeWriteStatus = await loadLatestBatchReviewManualSafeWritePreviewStatus();
  const report = buildBatchReviewDashboardReport({
    crossBatchReport: crossBatchFrictionSummaryPreview.report,
    uiReadinessReport: uiOptimizationReadinessPreview.report,
    ruleRevisionReport: ruleRevisionTaskSheetReport,
    keyCaseRerunReport,
    keyCaseRerunDiffReport,
    latestManualTaskCardStatus,
    latestManualSafeWriteStatus,
  });
  const dashboardMarkdown = buildBatchReviewDashboardMarkdown(report);

  return {
    report,
    dashboardMarkdown,
    crossBatchFrictionSummary: crossBatchFrictionSummaryPreview,
    uiOptimizationReadiness: uiOptimizationReadinessPreview,
    ruleRevisionTaskSheet: ruleRevisionTaskSheetReport,
    keyCaseRerun: keyCaseRerunReport,
    keyCaseRerunDiff: keyCaseRerunDiffReport,
    latestManualTaskCardStatus,
    latestManualSafeWriteStatus,
  };
}
