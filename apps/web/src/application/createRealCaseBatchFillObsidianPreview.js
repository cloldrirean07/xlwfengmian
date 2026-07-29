import { join } from "node:path";
import { buildObsidianRealCaseBatchFillWorksheetRecord } from "../domain/cases/buildObsidianRealCaseBatchFillWorksheetRecord.js";
import { resolveObsidianRoot } from "../infrastructure/obsidian/resolveObsidianRoot.js";

const defaultOutputDir = "05_验证与实验/批量真实案例回填工作单/已生成记录";

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function createRealCaseBatchFillObsidianPreview({
  batchLabel,
  worksheetMarkdown,
  obsidianRoot = "",
}) {
  if (!batchLabel) {
    throw new Error('createRealCaseBatchFillObsidianPreview requires "batchLabel".');
  }

  if (!worksheetMarkdown) {
    throw new Error('createRealCaseBatchFillObsidianPreview requires "worksheetMarkdown".');
  }

  const generatedDate = getDateStamp();
  const resolvedObsidianRoot = resolveObsidianRoot(obsidianRoot);
  const normalizedLabel = batchLabel.replace(/[^\w\u4e00-\u9fa5-]+/gu, "_");
  const sourceMarkdownPath = join(
    process.cwd(),
    "outputs",
    "batch-fill-sheets",
    normalizedLabel,
    "fill-sheet.md",
  );
  const targetDir = join(resolvedObsidianRoot, defaultOutputDir);
  const targetPath = join(targetDir, `${normalizedLabel}_批量回填工作单_${generatedDate}.md`);
  const markdown = buildObsidianRealCaseBatchFillWorksheetRecord({
    generatedDate,
    sourceMarkdownPath,
    worksheetMarkdown,
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
