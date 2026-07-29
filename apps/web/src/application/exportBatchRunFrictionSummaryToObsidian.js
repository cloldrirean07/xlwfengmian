import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readTextFile, writeTextFile } from "../shared/fileSystem.js";
import { runBatchRunFrictionSummaryPreview } from "./runBatchRunFrictionSummaryPreview.js";

function buildExportId() {
  return `BRFS-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
}

export async function exportBatchRunFrictionSummaryToObsidian({
  obsidianRoot = "",
} = {}) {
  const preview = await runBatchRunFrictionSummaryPreview({ obsidianRoot });
  const exportId = buildExportId();
  const sourceDir = join(process.cwd(), "outputs", "batch-run-friction-summary");
  const sourceJsonPath = join(sourceDir, "batch-run-friction-summary.json");
  const sourceMarkdownPath = join(sourceDir, "batch-run-friction-summary.md");
  const targetPath = preview.obsidianDraft.targetPath;
  const expectedContent = `${preview.obsidianDraft.markdown}\n`;

  await mkdir(sourceDir, { recursive: true });
  await writeTextFile(sourceJsonPath, `${JSON.stringify(preview, null, 2)}\n`);
  await writeTextFile(sourceMarkdownPath, `${preview.summaryMarkdown}\n`);
  await writeTextFile(targetPath, expectedContent);
  const persistedContent = await readTextFile(targetPath);
  const exportedAt = new Date().toISOString();

  const logDir = join(process.cwd(), "outputs", "obsidian-export-logs", "batch-run-friction-summary");
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
    obsidianDraft: preview.obsidianDraft,
    readback: {
      ok: persistedContent === expectedContent,
      matchedExpectedContent: persistedContent === expectedContent,
    },
    report: preview.report,
    summaryMarkdown: preview.summaryMarkdown,
  };
}
