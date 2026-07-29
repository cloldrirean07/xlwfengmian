import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readTextFile, writeTextFile } from "../shared/fileSystem.js";
import { runRealCaseBatchFillPreview } from "./runRealCaseBatchFillPreview.js";

function buildExportId() {
  return `RBFE-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
}

function resolveExportMode(mode = "") {
  return mode === "copy" ? "copy" : "overwrite";
}

function buildTargetPath({ previewTargetPath, exportMode, exportId }) {
  if (exportMode !== "copy") {
    return previewTargetPath;
  }

  return previewTargetPath.replace(/\.md$/u, `__副本_${exportId}.md`);
}

async function readExistingTarget(path) {
  try {
    const content = await readTextFile(path);
    const lines = content.split("\n");

    return {
      exists: true,
      content,
      heading: lines[0] || "",
      length: content.length,
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {
        exists: false,
        content: "",
        heading: "",
        length: 0,
      };
    }

    throw error;
  }
}

async function writeExportLog({ batchLabel, record }) {
  const logsDir = join(
    process.cwd(),
    "outputs",
    "obsidian-export-logs",
    "real-case-batch-fill-sheets",
    batchLabel,
  );
  const logPath = join(logsDir, `${record.exportId}.json`);

  await mkdir(logsDir, { recursive: true });
  await writeFile(logPath, `${JSON.stringify(record, null, 2)}\n`, "utf-8");

  return {
    logsDir,
    logPath,
  };
}

async function loadRecentExportHistory(batchLabel, limit = 5) {
  const logsDir = join(
    process.cwd(),
    "outputs",
    "obsidian-export-logs",
    "real-case-batch-fill-sheets",
    batchLabel,
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
          actionLabel: record.overwrite.actionLabel,
          targetPath: record.targetPath,
          matchedExpectedContent: record.readback.matchedExpectedContent,
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

export async function exportRealCaseBatchFillWorksheetToObsidian({
  batchItems,
  batchLabel = "",
  obsidianRoot = "",
  exportMode = "overwrite",
}) {
  const preview = await runRealCaseBatchFillPreview({
    batchItems,
    batchLabel,
    obsidianRoot,
  });

  const resolvedExportMode = resolveExportMode(exportMode);
  const exportId = buildExportId();
  const sourceDir = join(
    process.cwd(),
    "outputs",
    "batch-fill-sheets",
    preview.obsidianDraft.normalizedLabel,
  );
  const sourceJsonPath = join(sourceDir, "fill-sheet.json");
  const sourceMarkdownPath = join(sourceDir, "fill-sheet.md");
  const targetPath = buildTargetPath({
    previewTargetPath: preview.obsidianDraft.targetPath,
    exportMode: resolvedExportMode,
    exportId,
  });
  const expectedContent = `${preview.obsidianDraft.markdown}\n`;
  const existingTarget = await readExistingTarget(targetPath);

  await writeTextFile(sourceJsonPath, `${JSON.stringify(preview, null, 2)}\n`);
  await writeTextFile(sourceMarkdownPath, `${preview.worksheetMarkdown}\n`);
  await writeTextFile(targetPath, expectedContent);

  const persistedContent = await readTextFile(targetPath);
  const persistedLines = persistedContent.split("\n");
  const persistedHeading = persistedLines[0] || "";
  const exportedAt = new Date().toISOString();
  const overwrite = {
    requestedMode: resolvedExportMode,
    targetAlreadyExisted: existingTarget.exists,
    actionLabel:
      resolvedExportMode === "copy"
        ? "新建副本草稿"
        : existingTarget.exists
          ? "覆盖现有草稿"
          : "新建草稿",
    previousHeading: existingTarget.heading,
    previousLength: existingTarget.length,
    previousMatchedExpectedContent: existingTarget.content === expectedContent,
  };
  const readback = {
    ok: persistedContent === expectedContent,
    persistedHeading,
    persistedLength: persistedContent.length,
    matchedExpectedContent: persistedContent === expectedContent,
  };
  const exportRecord = {
    exportId,
    exportedAt,
    batchLabel: preview.batchLabel,
    normalizedLabel: preview.obsidianDraft.normalizedLabel,
    createdCount: preview.createdCount,
    targetPath,
    sourceMarkdownPath,
    sourceJsonPath,
    generatedDate: preview.obsidianDraft.generatedDate,
    overwrite,
    readback,
  };
  const logWrite = await writeExportLog({
    batchLabel: preview.obsidianDraft.normalizedLabel,
    record: exportRecord,
  });
  const history = await loadRecentExportHistory(preview.obsidianDraft.normalizedLabel);

  return {
    ok: true,
    exportId,
    exportedAt,
    batchLabel: preview.batchLabel,
    createdCount: preview.createdCount,
    targetPath,
    sourceMarkdownPath,
    sourceJsonPath,
    generatedDate: preview.obsidianDraft.generatedDate,
    obsidianDraft: preview.obsidianDraft,
    overwrite,
    readback,
    history: {
      logsDir: history.logsDir,
      latestLogPath: logWrite.logPath,
      recentExports: history.rows,
    },
  };
}
