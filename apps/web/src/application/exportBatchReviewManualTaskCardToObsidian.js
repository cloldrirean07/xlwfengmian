import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readTextFile, writeTextFile } from "../shared/fileSystem.js";
import { createBatchReviewManualTaskCardObsidianPreview } from "./createBatchReviewManualTaskCardObsidianPreview.js";
import { runBatchReviewManualTaskCardPreview } from "./runBatchReviewManualTaskCardPreview.js";

function buildExportId() {
  return `BRM-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
}

export async function exportBatchReviewManualTaskCardToObsidian({
  obsidianRoot = "",
} = {}) {
  const preview = await runBatchReviewManualTaskCardPreview({ obsidianRoot });
  const exportId = buildExportId();
  const obsidianDraft = createBatchReviewManualTaskCardObsidianPreview({
    taskCardMarkdown: preview.taskCardMarkdown,
    obsidianRoot,
  });
  const sourceDir = join(process.cwd(), "outputs", "batch-review-manual-task-card");
  const sourceJsonPath = join(sourceDir, "batch-review-manual-task-card.json");
  const sourceMarkdownPath = join(sourceDir, "batch-review-manual-task-card.md");
  const targetPath = obsidianDraft.targetPath;
  const expectedContent = `${obsidianDraft.markdown}\n`;

  await mkdir(sourceDir, { recursive: true });
  await writeTextFile(sourceJsonPath, `${JSON.stringify(preview, null, 2)}\n`);
  await writeTextFile(sourceMarkdownPath, `${preview.taskCardMarkdown}\n`);
  await writeTextFile(targetPath, expectedContent);
  const persistedContent = await readTextFile(targetPath);
  const exportedAt = new Date().toISOString();

  const logDir = join(process.cwd(), "outputs", "obsidian-export-logs", "batch-review-manual-task-card");
  const logPath = join(logDir, `${exportId}.json`);
  await mkdir(logDir, { recursive: true });
  await writeFile(
    logPath,
    `${JSON.stringify(
      {
        exportId,
        exportedAt,
        targetPath,
        sourceMarkdownPath,
        sourceJsonPath,
        readback: {
          ok: persistedContent === expectedContent,
          matchedExpectedContent: persistedContent === expectedContent,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  return {
    ok: true,
    exportId,
    exportedAt,
    targetPath,
    sourceMarkdownPath,
    sourceJsonPath,
    obsidianDraft,
    readback: {
      ok: persistedContent === expectedContent,
      matchedExpectedContent: persistedContent === expectedContent,
    },
    report: preview.report,
    taskCardMarkdown: preview.taskCardMarkdown,
  };
}
