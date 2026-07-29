import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..", "..", "..");

function getLogsDir(batchLabel) {
  return join(
    appRoot,
    "outputs",
    "obsidian-export-logs",
    "real-case-batch-fill-sheets",
    batchLabel,
  );
}

export async function loadLatestRealCaseBatchFillExportStatus(batchLabel) {
  if (!batchLabel) {
    return null;
  }

  const logsDir = getLogsDir(batchLabel);

  try {
    const fileNames = (await readdir(logsDir))
      .filter((item) => item.endsWith(".json"))
      .sort()
      .reverse();

    if (!fileNames.length) {
      return null;
    }

    const latestFileName = fileNames[0];
    const latestPath = join(logsDir, latestFileName);
    const raw = await readFile(latestPath, "utf-8");
    const record = JSON.parse(raw);

    return {
      exportId: record.exportId,
      exportedAt: record.exportedAt,
      batchLabel: record.batchLabel,
      normalizedLabel: record.normalizedLabel || batchLabel,
      targetPath: record.targetPath,
      sourceMarkdownPath: record.sourceMarkdownPath,
      sourceJsonPath: record.sourceJsonPath,
      actionLabel: record.overwrite?.actionLabel || "待补充",
      requestedMode: record.overwrite?.requestedMode || "overwrite",
      readbackOk: Boolean(record.readback?.ok),
      matchedExpectedContent: Boolean(record.readback?.matchedExpectedContent),
      logPath: latestPath,
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}
