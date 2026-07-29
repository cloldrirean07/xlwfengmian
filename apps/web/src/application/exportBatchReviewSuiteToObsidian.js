import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readTextFile, writeTextFile } from "../shared/fileSystem.js";
import { buildBatchReviewSuiteMarkdown } from "../domain/review/buildBatchReviewSuiteMarkdown.js";
import { createBatchReviewSuiteObsidianPreview } from "./createBatchReviewSuiteObsidianPreview.js";
import { exportBatchReviewDashboardToObsidian } from "./exportBatchReviewDashboardToObsidian.js";
import { exportBatchRunFrictionSummaryToObsidian } from "./exportBatchRunFrictionSummaryToObsidian.js";
import { exportUiOptimizationReadinessToObsidian } from "./exportUiOptimizationReadinessToObsidian.js";

function buildExportId() {
  return `BRS-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
}

export async function exportBatchReviewSuiteToObsidian({
  obsidianRoot = "",
} = {}) {
  const frictionSummaryExport = await exportBatchRunFrictionSummaryToObsidian({ obsidianRoot });
  const uiReadinessExport = await exportUiOptimizationReadinessToObsidian({ obsidianRoot });
  const dashboardExport = await exportBatchReviewDashboardToObsidian({ obsidianRoot });
  const suiteMarkdown = buildBatchReviewSuiteMarkdown({
    frictionSummaryExport,
    uiReadinessExport,
    dashboardExport,
  });
  const exportId = buildExportId();
  const obsidianDraft = createBatchReviewSuiteObsidianPreview({
    suiteMarkdown,
    obsidianRoot,
  });
  const sourceDir = join(process.cwd(), "outputs", "batch-review-suite");
  const sourceJsonPath = join(sourceDir, "batch-review-suite.json");
  const sourceMarkdownPath = join(sourceDir, "batch-review-suite.md");
  const targetPath = obsidianDraft.targetPath;
  const expectedContent = `${obsidianDraft.markdown}\n`;

  const suitePayload = {
    frictionSummaryExport,
    uiReadinessExport,
    dashboardExport,
    suiteMarkdown,
  };

  await mkdir(sourceDir, { recursive: true });
  await writeTextFile(sourceJsonPath, `${JSON.stringify(suitePayload, null, 2)}\n`);
  await writeTextFile(sourceMarkdownPath, `${suiteMarkdown}\n`);
  await writeTextFile(targetPath, expectedContent);
  const persistedContent = await readTextFile(targetPath);
  const exportedAt = new Date().toISOString();

  const logDir = join(process.cwd(), "outputs", "obsidian-export-logs", "batch-review-suite");
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
    suiteMarkdown,
    frictionSummaryExport,
    uiReadinessExport,
    dashboardExport,
  };
}
