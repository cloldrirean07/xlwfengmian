import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { prepareRealCaseBatchScaffold } from "./prepareRealCaseBatchScaffold.js";
import { loadRealCaseIndex } from "../infrastructure/cases/loadRealCaseIndex.js";
import { loadLatestRealCaseBatchFillExportStatus } from "../infrastructure/exports/loadLatestRealCaseBatchFillExportStatus.js";

function buildDefaultBatchLabel(preparedBatch) {
  const ids = (preparedBatch.created || []).map((item) => item.id);

  if (!ids.length) {
    return "real-case-batch";
  }

  if (ids.length === 1) {
    return ids[0];
  }

  return `${ids[0]}_to_${ids.at(-1)}`;
}

function normalizeBatchLabel(label) {
  return label.replace(/[^\w\u4e00-\u9fa5-]+/gu, "_");
}

async function loadRecentExportHistory(normalizedLabel, limit = 5) {
  const logsDir = join(
    process.cwd(),
    "outputs",
    "obsidian-export-logs",
    "real-case-batch-fill-sheets",
    normalizedLabel,
  );

  try {
    const fileNames = (await readdir(logsDir))
      .filter((item) => item.endsWith(".json"))
      .sort()
      .reverse()
      .slice(0, limit);

    const rows = await Promise.all(
      fileNames.map(async (fileName) => {
        const raw = await readFile(join(logsDir, fileName), "utf-8");
        const record = JSON.parse(raw);

        return {
          exportId: record.exportId,
          exportedAt: record.exportedAt,
          actionLabel: record.overwrite?.actionLabel || "待补充",
          targetPath: record.targetPath,
          matchedExpectedContent: Boolean(record.readback?.matchedExpectedContent),
          readbackOk: Boolean(record.readback?.ok),
        };
      }),
    );

    return {
      logsDir,
      rows,
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {
        logsDir,
        rows: [],
      };
    }

    throw error;
  }
}

export async function loadRealCaseBatchFillWorksheetHistory({
  batchItems,
  batchLabel = "",
}) {
  const currentIndex = await loadRealCaseIndex();
  const preparedBatch = prepareRealCaseBatchScaffold({
    currentIndex,
    batchItems,
  });
  const resolvedBatchLabel = batchLabel || buildDefaultBatchLabel(preparedBatch);
  const normalizedLabel = normalizeBatchLabel(resolvedBatchLabel);
  const latestExportStatus = await loadLatestRealCaseBatchFillExportStatus(normalizedLabel);
  const history = await loadRecentExportHistory(normalizedLabel);

  return {
    batchLabel: resolvedBatchLabel,
    normalizedLabel,
    createdCount: preparedBatch.created.length,
    createdIds: preparedBatch.created.map((item) => item.id),
    latestExportStatus,
    history,
  };
}
