import { join } from "node:path";
import { buildObsidianBatchReviewManualTaskCardRecord } from "../domain/review/buildObsidianBatchReviewManualTaskCardRecord.js";
import { resolveObsidianRoot } from "../infrastructure/obsidian/resolveObsidianRoot.js";

const defaultOutputDir = "05_验证与实验/批次试跑记录/人工复盘待补任务";

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function createBatchReviewManualTaskCardObsidianPreview({
  taskCardMarkdown,
  obsidianRoot = "",
}) {
  if (!taskCardMarkdown) {
    throw new Error('createBatchReviewManualTaskCardObsidianPreview requires "taskCardMarkdown".');
  }

  const generatedDate = getDateStamp();
  const resolvedObsidianRoot = resolveObsidianRoot(obsidianRoot);
  const sourceMarkdownPath = join(
    process.cwd(),
    "outputs",
    "batch-review-manual-task-card",
    "batch-review-manual-task-card.md",
  );
  const targetDir = join(resolvedObsidianRoot, defaultOutputDir);
  const targetPath = join(targetDir, `人工复盘待补任务_${generatedDate}.md`);
  const markdown = buildObsidianBatchReviewManualTaskCardRecord({
    generatedDate,
    sourceMarkdownPath,
    taskCardMarkdown,
  });

  return {
    generatedDate,
    sourceMarkdownPath,
    targetDir,
    targetPath,
    markdown,
  };
}
