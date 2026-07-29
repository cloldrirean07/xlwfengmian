import { join } from "node:path";
import { buildObsidianBatchReviewManualBackfillRecord } from "../domain/review/buildObsidianBatchReviewManualBackfillRecord.js";
import { resolveObsidianRoot } from "../infrastructure/obsidian/resolveObsidianRoot.js";

const defaultOutputDir = "05_验证与实验/批次试跑记录/人工复盘回流预览";

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function createBatchReviewManualBackfillObsidianPreview({
  backfillMarkdown,
  obsidianRoot = "",
}) {
  if (!backfillMarkdown) {
    throw new Error('createBatchReviewManualBackfillObsidianPreview requires "backfillMarkdown".');
  }

  const generatedDate = getDateStamp();
  const resolvedObsidianRoot = resolveObsidianRoot(obsidianRoot);
  const sourceMarkdownPath = join(
    process.cwd(),
    "outputs",
    "batch-review-manual-backfill",
    "batch-review-manual-backfill.md",
  );
  const targetDir = join(resolvedObsidianRoot, defaultOutputDir);
  const targetPath = join(targetDir, `人工复盘回流预览_${generatedDate}.md`);
  const markdown = buildObsidianBatchReviewManualBackfillRecord({
    generatedDate,
    sourceMarkdownPath,
    backfillMarkdown,
  });

  return {
    generatedDate,
    sourceMarkdownPath,
    targetDir,
    targetPath,
    markdown,
  };
}
