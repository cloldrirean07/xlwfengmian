import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readTextFile, writeTextFile } from "../shared/fileSystem.js";
import { createBatchReviewDashboardObsidianPreview } from "./createBatchReviewDashboardObsidianPreview.js";
import { runBatchReviewDashboardPreview } from "./runBatchReviewDashboardPreview.js";

function buildExportId() {
  return `BRD-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
}

export async function exportBatchReviewDashboardToObsidian({
  obsidianRoot = "",
} = {}) {
  const preview = await runBatchReviewDashboardPreview({ obsidianRoot });
  const exportId = buildExportId();
  const obsidianDraft = createBatchReviewDashboardObsidianPreview({
    dashboardMarkdown: preview.dashboardMarkdown,
    obsidianRoot,
  });
  const sourceDir = join(process.cwd(), "outputs", "batch-review-dashboard");
  const sourceJsonPath = join(sourceDir, "batch-review-dashboard.json");
  const sourceMarkdownPath = join(sourceDir, "batch-review-dashboard.md");
  const targetPath = obsidianDraft.targetPath;
  const expectedContent = `${obsidianDraft.markdown}\n`;

  await mkdir(sourceDir, { recursive: true });
  await writeTextFile(sourceJsonPath, `${JSON.stringify(preview, null, 2)}\n`);
  await writeTextFile(sourceMarkdownPath, `${preview.dashboardMarkdown}\n`);
  await writeTextFile(targetPath, expectedContent);
  const persistedContent = await readTextFile(targetPath);
  const exportedAt = new Date().toISOString();

  const logDir = join(process.cwd(), "outputs", "obsidian-export-logs", "batch-review-dashboard");
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
    dashboardMarkdown: preview.dashboardMarkdown,
  };
}
