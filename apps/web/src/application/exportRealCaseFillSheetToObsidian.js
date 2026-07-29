import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readTextFile, writeTextFile } from "../shared/fileSystem.js";
import { runRealCaseFillPreview } from "./runRealCaseFillPreview.js";

function buildExportId() {
  return `RFE-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
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

async function writeExportLog({ caseId, record }) {
  const logsDir = join(
    process.cwd(),
    "outputs",
    "obsidian-export-logs",
    "real-case-fill-sheets",
    caseId,
  );
  const logPath = join(logsDir, `${record.exportId}.json`);

  await mkdir(logsDir, { recursive: true });
  await writeFile(logPath, `${JSON.stringify(record, null, 2)}\n`, "utf-8");

  return {
    logsDir,
    logPath,
  };
}

async function loadRecentExportHistory(caseId, limit = 5) {
  const logsDir = join(
    process.cwd(),
    "outputs",
    "obsidian-export-logs",
    "real-case-fill-sheets",
    caseId,
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

export async function exportRealCaseFillSheetToObsidian({
  caseId,
  obsidianRoot = "",
  exportMode = "overwrite",
}) {
  if (!caseId) {
    throw new Error('exportRealCaseFillSheetToObsidian requires "caseId".');
  }

  const preview = await runRealCaseFillPreview({
    caseId,
    obsidianRoot,
  });

  const resolvedExportMode = resolveExportMode(exportMode);
  const exportId = buildExportId();
  const targetPath = buildTargetPath({
    previewTargetPath: preview.obsidianDraft.targetPath,
    exportMode: resolvedExportMode,
    exportId,
  });
  const expectedContent = `${preview.obsidianDraft.markdown}\n`;
  const existingTarget = await readExistingTarget(targetPath);
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
    caseId: preview.caseId,
    title: preview.title,
    targetPath,
    sourceMarkdownPath: preview.obsidianDraft.sourceMarkdownPath,
    generatedDate: preview.obsidianDraft.generatedDate,
    overwrite,
    readback,
  };
  const logWrite = await writeExportLog({
    caseId: preview.caseId,
    record: exportRecord,
  });
  const history = await loadRecentExportHistory(preview.caseId);

  return {
    ok: true,
    exportId,
    exportedAt,
    caseId: preview.caseId,
    title: preview.title,
    targetPath,
    sourceMarkdownPath: preview.obsidianDraft.sourceMarkdownPath,
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
