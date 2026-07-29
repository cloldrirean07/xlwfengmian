import { join } from "node:path";
import { buildObsidianRealCaseFillSheetRecord } from "../domain/cases/buildObsidianRealCaseFillSheetRecord.js";
import { resolveObsidianRoot } from "../infrastructure/obsidian/resolveObsidianRoot.js";

const defaultOutputDir = "05_验证与实验/真实案例回填工作单/已生成记录";

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function createRealCaseFillObsidianPreview({
  caseId,
  fillSheetMarkdown,
  obsidianRoot = "",
}) {
  if (!caseId) {
    throw new Error('createRealCaseFillObsidianPreview requires "caseId".');
  }

  if (!fillSheetMarkdown) {
    throw new Error('createRealCaseFillObsidianPreview requires "fillSheetMarkdown".');
  }

  const generatedDate = getDateStamp();
  const resolvedObsidianRoot = resolveObsidianRoot(obsidianRoot);
  const sourceMarkdownPath = join(
    process.cwd(),
    "outputs",
    "fill-sheets",
    caseId,
    "fill-sheet.md",
  );
  const targetDir = join(resolvedObsidianRoot, defaultOutputDir);
  const targetPath = join(targetDir, `${caseId}_回填工作单_${generatedDate}.md`);
  const markdown = buildObsidianRealCaseFillSheetRecord({
    generatedDate,
    sourceMarkdownPath,
    fillSheetMarkdown,
  });

  return {
    generatedDate,
    sourceMarkdownPath,
    targetDir,
    targetPath,
    markdown,
  };
}
