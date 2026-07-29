import { join } from "node:path";
import { buildObsidianBatchReviewManualWritebackDraftRecord } from "../domain/review/buildObsidianBatchReviewManualWritebackDraftRecord.js";
import { resolveObsidianRoot } from "../infrastructure/obsidian/resolveObsidianRoot.js";

const defaultOutputDir = "05_验证与实验/批次试跑记录/人工复盘写回草稿";

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function createBatchReviewManualWritebackDraftObsidianPreview({
  writebackDraftMarkdown,
  obsidianRoot = "",
}) {
  if (!writebackDraftMarkdown) {
    throw new Error(
      'createBatchReviewManualWritebackDraftObsidianPreview requires "writebackDraftMarkdown".',
    );
  }

  const generatedDate = getDateStamp();
  const resolvedObsidianRoot = resolveObsidianRoot(obsidianRoot);
  const sourceMarkdownPath = join(
    process.cwd(),
    "outputs",
    "batch-review-manual-writeback-draft",
    "batch-review-manual-writeback-draft.md",
  );
  const targetDir = join(resolvedObsidianRoot, defaultOutputDir);
  const targetPath = join(targetDir, `真实批次试跑结论写回草稿_${generatedDate}.md`);
  const markdown = buildObsidianBatchReviewManualWritebackDraftRecord({
    generatedDate,
    sourceMarkdownPath,
    writebackDraftMarkdown,
  });

  return {
    generatedDate,
    sourceMarkdownPath,
    targetDir,
    targetPath,
    markdown,
  };
}
