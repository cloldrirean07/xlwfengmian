import { buildBatchReviewManualTaskCardMarkdown } from "../domain/review/buildBatchReviewManualTaskCardMarkdown.js";
import { buildBatchReviewManualTaskBackfillPreview } from "../domain/review/buildBatchReviewManualTaskBackfillPreview.js";
import { loadLatestBatchReviewManualTaskCardStatus } from "./loadLatestBatchReviewManualTaskCardStatus.js";
import { runBatchReviewDashboardPreview } from "./runBatchReviewDashboardPreview.js";

export async function runBatchReviewManualTaskCardPreview({ obsidianRoot = "" } = {}) {
  const dashboardPreview = await runBatchReviewDashboardPreview({ obsidianRoot });
  const taskCard = dashboardPreview.report?.manualReviewTaskCard || {};
  const latestTaskCardStatus = await loadLatestBatchReviewManualTaskCardStatus();
  const taskCardMarkdown = buildBatchReviewManualTaskCardMarkdown(taskCard);
  const backfillPreview = buildBatchReviewManualTaskBackfillPreview(latestTaskCardStatus);

  return {
    report: taskCard,
    taskCardMarkdown,
    latestTaskCardStatus,
    backfillPreview,
    dashboardReport: dashboardPreview.report,
    dashboardMarkdown: dashboardPreview.dashboardMarkdown,
  };
}
