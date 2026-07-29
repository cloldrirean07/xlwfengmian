import { join } from "node:path";
import { buildObsidianBatchReviewDashboardRecord } from "../domain/review/buildObsidianBatchReviewDashboardRecord.js";
import { resolveObsidianRoot } from "../infrastructure/obsidian/resolveObsidianRoot.js";

const defaultOutputDir = "05_验证与实验/批次试跑记录/批次复盘看板";

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function createBatchReviewDashboardObsidianPreview({
  dashboardMarkdown,
  obsidianRoot = "",
}) {
  if (!dashboardMarkdown) {
    throw new Error('createBatchReviewDashboardObsidianPreview requires "dashboardMarkdown".');
  }

  const generatedDate = getDateStamp();
  const resolvedObsidianRoot = resolveObsidianRoot(obsidianRoot);
  const sourceMarkdownPath = join(
    process.cwd(),
    "outputs",
    "batch-review-dashboard",
    "batch-review-dashboard.md",
  );
  const targetDir = join(resolvedObsidianRoot, defaultOutputDir);
  const targetPath = join(targetDir, `批次复盘看板_${generatedDate}.md`);
  const markdown = buildObsidianBatchReviewDashboardRecord({
    generatedDate,
    sourceMarkdownPath,
    dashboardMarkdown,
  });

  return {
    generatedDate,
    sourceMarkdownPath,
    targetDir,
    targetPath,
    markdown,
  };
}
