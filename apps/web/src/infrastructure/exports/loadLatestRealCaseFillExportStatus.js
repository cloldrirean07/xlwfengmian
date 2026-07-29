import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..", "..", "..");

function getLogsDir(caseId) {
  return join(
    appRoot,
    "outputs",
    "obsidian-export-logs",
    "real-case-fill-sheets",
    caseId,
  );
}

export async function loadLatestRealCaseFillExportStatus(caseId) {
  if (!caseId) {
    return null;
  }

  const logsDir = getLogsDir(caseId);

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
      targetPath: record.targetPath,
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
