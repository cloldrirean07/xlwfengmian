import { join } from "node:path";
import { buildObsidianRealCaseBatchRunRecord } from "../domain/cases/buildObsidianRealCaseBatchRunRecord.js";
import { resolveObsidianRoot } from "../infrastructure/obsidian/resolveObsidianRoot.js";

const defaultOutputDir = "05_验证与实验/批次试跑记录/已生成记录";

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function createRealCaseBatchRunRecordObsidianPreview({
  batchLabel,
  runRecordMarkdown,
  obsidianRoot = "",
}) {
  if (!batchLabel) {
    throw new Error('createRealCaseBatchRunRecordObsidianPreview requires "batchLabel".');
  }

  if (!runRecordMarkdown) {
    throw new Error('createRealCaseBatchRunRecordObsidianPreview requires "runRecordMarkdown".');
  }

  const generatedDate = getDateStamp();
  const resolvedObsidianRoot = resolveObsidianRoot(obsidianRoot);
  const normalizedLabel = batchLabel.replace(/[^\w\u4e00-\u9fa5-]+/gu, "_");
  const sourceMarkdownPath = join(
    process.cwd(),
    "outputs",
    "batch-run-records",
    normalizedLabel,
    "run-record.md",
  );
  const targetDir = join(resolvedObsidianRoot, defaultOutputDir);
  const targetPath = join(targetDir, `${normalizedLabel}_批次试跑记录_${generatedDate}.md`);
  const markdown = buildObsidianRealCaseBatchRunRecord({
    generatedDate,
    sourceMarkdownPath,
    runRecordMarkdown,
  });

  return {
    generatedDate,
    normalizedLabel,
    sourceMarkdownPath,
    targetDir,
    targetPath,
    markdown,
  };
}
