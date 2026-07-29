import { join } from "node:path";
import { buildObsidianUiOptimizationReadinessRecord } from "../domain/ui/buildObsidianUiOptimizationReadinessRecord.js";
import { resolveObsidianRoot } from "../infrastructure/obsidian/resolveObsidianRoot.js";

const defaultOutputDir = "06_PRD与版本记录/UI优化进入条件报告/已生成记录";

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function createUiOptimizationReadinessObsidianPreview({
  readinessMarkdown,
  obsidianRoot = "",
}) {
  if (!readinessMarkdown) {
    throw new Error('createUiOptimizationReadinessObsidianPreview requires "readinessMarkdown".');
  }

  const generatedDate = getDateStamp();
  const resolvedObsidianRoot = resolveObsidianRoot(obsidianRoot);
  const sourceMarkdownPath = join(
    process.cwd(),
    "outputs",
    "ui-readiness",
    "ui-readiness-report.md",
  );
  const targetDir = join(resolvedObsidianRoot, defaultOutputDir);
  const targetPath = join(targetDir, `UI优化进入条件报告_${generatedDate}.md`);
  const markdown = buildObsidianUiOptimizationReadinessRecord({
    generatedDate,
    sourceMarkdownPath,
    readinessMarkdown,
  });

  return {
    generatedDate,
    sourceMarkdownPath,
    targetDir,
    targetPath,
    markdown,
  };
}
