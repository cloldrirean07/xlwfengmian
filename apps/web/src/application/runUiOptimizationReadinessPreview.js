import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { buildUiOptimizationReadinessReport } from "../domain/ui/buildUiOptimizationReadinessReport.js";
import { buildUiOptimizationReadinessMarkdown } from "../domain/ui/buildUiOptimizationReadinessMarkdown.js";
import { runBatchRunFrictionSummaryPreview } from "./runBatchRunFrictionSummaryPreview.js";
import { createUiOptimizationReadinessObsidianPreview } from "./createUiOptimizationReadinessObsidianPreview.js";

async function loadStatusesFromLogs(logsRoot) {
  try {
    const batchDirs = await readdir(logsRoot);
    const rows = [];

    for (const dirName of batchDirs) {
      const dirPath = join(logsRoot, dirName);
      const fileNames = (await readdir(dirPath))
        .filter((item) => item.endsWith(".json"))
        .sort()
        .reverse();

      if (!fileNames.length) {
        continue;
      }

      const raw = await readFile(join(dirPath, fileNames[0]), "utf-8");
      const record = JSON.parse(raw);

      rows.push({
        batchLabel: record.batchLabel || dirName,
        normalizedLabel: record.normalizedLabel || dirName,
        exportedAt: record.exportedAt,
        readbackOk: Boolean(record.readback?.ok),
        actionLabel: record.overwrite?.actionLabel || "待补充",
        targetPath: record.targetPath,
      });
    }

    return rows.sort((left, right) => String(right.exportedAt).localeCompare(String(left.exportedAt)));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

export async function runUiOptimizationReadinessPreview({
  obsidianRoot = "",
  crossBatchFrictionSummaryPreview = null,
} = {}) {
  const logsRoot = join(process.cwd(), "outputs", "obsidian-export-logs");
  const batchFillWorksheetStatuses = await loadStatusesFromLogs(
    join(logsRoot, "real-case-batch-fill-sheets"),
  );
  const batchRunRecordStatuses = await loadStatusesFromLogs(
    join(logsRoot, "real-case-batch-run-records"),
  );
  const resolvedCrossBatchFrictionSummaryPreview =
    crossBatchFrictionSummaryPreview || (await runBatchRunFrictionSummaryPreview({ obsidianRoot }));
  const report = buildUiOptimizationReadinessReport({
    batchFillWorksheetStatuses,
    batchRunRecordStatuses,
    crossBatchFrictionSummary: resolvedCrossBatchFrictionSummaryPreview.report,
  });
  const readinessMarkdown = buildUiOptimizationReadinessMarkdown(report);
  const obsidianDraft = createUiOptimizationReadinessObsidianPreview({
    readinessMarkdown,
    obsidianRoot,
  });

  return {
    report,
    readinessMarkdown,
    crossBatchFrictionSummary: resolvedCrossBatchFrictionSummaryPreview,
    obsidianDraft,
  };
}
