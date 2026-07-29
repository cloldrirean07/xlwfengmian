import { join } from "node:path";
import { buildObsidianBatchReviewSuiteRecord } from "../domain/review/buildObsidianBatchReviewSuiteRecord.js";
import { resolveObsidianRoot } from "../infrastructure/obsidian/resolveObsidianRoot.js";

const defaultOutputDir = "05_验证与实验/批次试跑记录/批次复盘套件";

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function createBatchReviewSuiteObsidianPreview({
  suiteMarkdown,
  obsidianRoot = "",
}) {
  if (!suiteMarkdown) {
    throw new Error('createBatchReviewSuiteObsidianPreview requires "suiteMarkdown".');
  }

  const generatedDate = getDateStamp();
  const resolvedObsidianRoot = resolveObsidianRoot(obsidianRoot);
  const sourceMarkdownPath = join(
    process.cwd(),
    "outputs",
    "batch-review-suite",
    "batch-review-suite.md",
  );
  const targetDir = join(resolvedObsidianRoot, defaultOutputDir);
  const targetPath = join(targetDir, `批次复盘套件_${generatedDate}.md`);
  const markdown = buildObsidianBatchReviewSuiteRecord({
    generatedDate,
    sourceMarkdownPath,
    suiteMarkdown,
  });

  return {
    generatedDate,
    sourceMarkdownPath,
    targetDir,
    targetPath,
    markdown,
  };
}
