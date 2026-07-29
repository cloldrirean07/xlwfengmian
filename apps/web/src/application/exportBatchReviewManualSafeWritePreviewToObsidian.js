import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readTextFile, writeTextFile } from "../shared/fileSystem.js";
import { createBatchReviewManualSafeWritePreviewObsidianPreview } from "./createBatchReviewManualSafeWritePreviewObsidianPreview.js";
import { runBatchReviewManualSafeWritePreview } from "./runBatchReviewManualSafeWritePreview.js";

function buildExportId() {
  return `BRS-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
}

export async function exportBatchReviewManualSafeWritePreviewToObsidian({
  obsidianRoot = "",
} = {}) {
  const preview = await runBatchReviewManualSafeWritePreview({ obsidianRoot });
  const exportId = buildExportId();
  const obsidianDraft = createBatchReviewManualSafeWritePreviewObsidianPreview({
    safeWritePreviewMarkdown: preview.safeWritePreviewMarkdown,
    patch: preview.patch,
    obsidianRoot,
  });
  const sourceDir = join(process.cwd(), "outputs", "batch-review-manual-safe-write-preview");
  const sourceJsonPath = join(sourceDir, "batch-review-manual-safe-write-preview.json");
  const sourceMarkdownPath = join(sourceDir, "batch-review-manual-safe-write-preview.md");
  const targetPath = obsidianDraft.targetPath;
  const expectedContent = `${obsidianDraft.markdown}\n`;

  await mkdir(sourceDir, { recursive: true });
  await writeTextFile(sourceJsonPath, `${JSON.stringify(preview, null, 2)}\n`);
  await writeTextFile(sourceMarkdownPath, `${preview.safeWritePreviewMarkdown}\n`);
  await writeTextFile(targetPath, expectedContent);
  const persistedContent = await readTextFile(targetPath);
  const exportedAt = new Date().toISOString();

  const logDir = join(
    process.cwd(),
    "outputs",
    "obsidian-export-logs",
    "batch-review-manual-safe-write-preview",
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
    patch: preview.patch,
    safeWritePreviewMarkdown: preview.safeWritePreviewMarkdown,
  };
}
