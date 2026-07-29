import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readTextFile, writeTextFile } from "../shared/fileSystem.js";
import { createBatchReviewManualWritebackDraftObsidianPreview } from "./createBatchReviewManualWritebackDraftObsidianPreview.js";
import { runBatchReviewManualWritebackDraftPreview } from "./runBatchReviewManualWritebackDraftPreview.js";

function buildExportId() {
  return `BRW-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
}

export async function exportBatchReviewManualWritebackDraftToObsidian({
  obsidianRoot = "",
} = {}) {
  const preview = await runBatchReviewManualWritebackDraftPreview({ obsidianRoot });
  const exportId = buildExportId();
  const obsidianDraft = createBatchReviewManualWritebackDraftObsidianPreview({
    writebackDraftMarkdown: preview.writebackDraftMarkdown,
    obsidianRoot,
  });
  const sourceDir = join(process.cwd(), "outputs", "batch-review-manual-writeback-draft");
  const sourceJsonPath = join(sourceDir, "batch-review-manual-writeback-draft.json");
  const sourceMarkdownPath = join(sourceDir, "batch-review-manual-writeback-draft.md");
  const targetPath = obsidianDraft.targetPath;
  const expectedContent = `${obsidianDraft.markdown}\n`;

  await mkdir(sourceDir, { recursive: true });
  await writeTextFile(sourceJsonPath, `${JSON.stringify(preview, null, 2)}\n`);
  await writeTextFile(sourceMarkdownPath, `${preview.writebackDraftMarkdown}\n`);
  await writeTextFile(targetPath, expectedContent);
  const persistedContent = await readTextFile(targetPath);
  const exportedAt = new Date().toISOString();

  const logDir = join(
    process.cwd(),
    "outputs",
    "obsidian-export-logs",
    "batch-review-manual-writeback-draft",
  );
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
    writebackDraftMarkdown: preview.writebackDraftMarkdown,
  };
}
