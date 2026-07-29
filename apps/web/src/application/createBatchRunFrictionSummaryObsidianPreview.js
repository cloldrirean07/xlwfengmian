import { join } from "node:path";
import { buildObsidianBatchRunFrictionSummaryRecord } from "../domain/cases/buildObsidianBatchRunFrictionSummaryRecord.js";
import { resolveObsidianRoot } from "../infrastructure/obsidian/resolveObsidianRoot.js";

const defaultOutputDir = "05_验证与实验/批次试跑记录/跨批次摩擦点汇总";

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function createBatchRunFrictionSummaryObsidianPreview({
  summaryMarkdown,
  obsidianRoot = "",
}) {
  if (!summaryMarkdown) {
    throw new Error('createBatchRunFrictionSummaryObsidianPreview requires "summaryMarkdown".');
  }

  const generatedDate = getDateStamp();
  const resolvedObsidianRoot = resolveObsidianRoot(obsidianRoot);
  const sourceMarkdownPath = join(
    process.cwd(),
    "outputs",
    "batch-run-friction-summary",
    "batch-run-friction-summary.md",
  );
  const targetDir = join(resolvedObsidianRoot, defaultOutputDir);
  const targetPath = join(targetDir, `跨批次摩擦点汇总_${generatedDate}.md`);
  const markdown = buildObsidianBatchRunFrictionSummaryRecord({
    generatedDate,
    sourceMarkdownPath,
    summaryMarkdown,
  });

  return {
    generatedDate,
    sourceMarkdownPath,
    targetDir,
    targetPath,
    markdown,
  };
}
