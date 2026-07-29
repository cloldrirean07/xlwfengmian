import { readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { loadCaseById, resetCaseCache } from "../src/infrastructure/cases/loadCases.js";
import { parsePlatformCaseNote } from "../src/domain/cases/parsePlatformCaseNote.js";
import { buildRealCaseUpdateFromPlatformNote } from "../src/domain/cases/buildRealCaseUpdateFromPlatformNote.js";
import { buildPlatformSyncActions } from "../src/domain/cases/buildPlatformSyncActions.js";
import { buildPlatformSyncSummary } from "../src/domain/cases/buildPlatformSyncSummary.js";
import { buildPlatformSyncLogMarkdown } from "../src/domain/cases/buildPlatformSyncLogMarkdown.js";
import { buildObsidianPlatformSyncLogRecord } from "../src/domain/cases/buildObsidianPlatformSyncLogRecord.js";
import { writeTextFile } from "../src/shared/fileSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const defaultObsidianRoot =
  "/Users/xlw/Library/Mobile Documents/iCloud~md~obsidian/Documents/Xlwbrain/AI封面创意助手";
const appRoot = join(__dirname, "..");
const runExecFile = promisify(execFile);

function getArgValue(args, name) {
  const target = `--${name}`;
  const index = args.indexOf(target);
  return index >= 0 ? args[index + 1] : "";
}

function hasFlag(args, name) {
  return args.includes(`--${name}`);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function getTimestamp() {
  const now = new Date();
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join("-") + `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

async function main() {
  const args = process.argv.slice(2);
  const caseId = getArgValue(args, "case-id");
  const dryRun = !hasFlag(args, "write");
  const refreshArtifacts = hasFlag(args, "refresh-artifacts");
  const exportObsidian = hasFlag(args, "export-obsidian");

  if (!caseId) {
    throw new Error("Missing required argument --case-id");
  }

  resetCaseCache();
  const record = await loadCaseById(caseId);
  if (!record) {
    throw new Error(`Case not found: ${caseId}`);
  }
  if (record.sourceType !== "real") {
    throw new Error(`Case is not a real-case: ${caseId}`);
  }

  const obsidianRoot = process.env.AI_COVER_OBSIDIAN_ROOT || defaultObsidianRoot;
  const obsidianPath = join(obsidianRoot, record.tracking.obsidianCasePath);
  const noteMarkdown = await readFile(obsidianPath, "utf-8");
  const parsedNote = parsePlatformCaseNote(noteMarkdown);
  const updateResult = buildRealCaseUpdateFromPlatformNote(record, parsedNote);
  const targetPath = join(appRoot, "data", "real-cases", "items", `${caseId}.json`);
  const nextRecord = {
    ...record,
    ...updateResult.updates,
    evidence: updateResult.updates.evidence,
    mockUserSelection: updateResult.updates.mockUserSelection,
  };
  const syncSummary = buildPlatformSyncSummary(record, nextRecord);
  const timestamp = getTimestamp();

  if (!dryRun) {
    await writeFile(targetPath, `${JSON.stringify(nextRecord, null, 2)}\n`, "utf-8");
  }

  const postSyncActions = buildPlatformSyncActions({
    caseId,
    refreshArtifacts,
    exportObsidian,
  });
  const executedActions = [];

  if (!dryRun) {
    for (const action of postSyncActions) {
      const scriptPath = join(appRoot, "scripts", action.script);
      await runExecFile(process.execPath, [scriptPath, ...action.args], {
        cwd: appRoot,
        env: process.env,
      });
      executedActions.push(action.id);
    }
  }

  const syncLog = {
    caseId,
    generatedAt: timestamp,
    dryRun,
    obsidianPath,
    targetPath,
    extractedFieldCount: Object.values(updateResult.extracted).filter(Boolean).length,
    changedFieldCount: syncSummary.changedFields.length,
    changedFields: syncSummary.changedFields,
    readinessBefore: syncSummary.readinessBefore,
    readinessAfter: syncSummary.readinessAfter,
    postSyncActions: postSyncActions.map((item) => item.id),
    executedActions,
  };
  const syncLogDir = join(appRoot, "outputs", "sync-logs", caseId);
  const syncLogJsonPath = join(syncLogDir, `${timestamp}.json`);
  const syncLogMarkdownPath = join(syncLogDir, `${timestamp}.md`);
  const syncLogMarkdown = buildPlatformSyncLogMarkdown(syncLog);
  await writeTextFile(syncLogJsonPath, `${JSON.stringify(syncLog, null, 2)}\n`);
  await writeTextFile(syncLogMarkdownPath, `${syncLogMarkdown}\n`);

  let obsidianSyncLogPath = "";
  if (exportObsidian) {
    const obsidianSyncDir = join(obsidianRoot, "05_验证与实验", "平台案例同步记录", "已生成记录");
    const obsidianMarkdown = buildObsidianPlatformSyncLogRecord({
      generatedAt: timestamp,
      sourceMarkdownPath: syncLogMarkdownPath,
      syncLogMarkdown,
    });
    obsidianSyncLogPath = join(obsidianSyncDir, `${caseId}_同步记录_${timestamp}.md`);
    await writeTextFile(obsidianSyncLogPath, `${obsidianMarkdown}\n`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        caseId,
        dryRun,
        obsidianPath,
        targetPath,
        extracted: updateResult.extracted,
        preview: nextRecord,
        syncSummary,
        syncLog: {
          json: syncLogJsonPath,
          markdown: syncLogMarkdownPath,
          obsidian: obsidianSyncLogPath,
        },
        refreshArtifacts,
        exportObsidian,
        postSyncActions: postSyncActions.map((item) => item.id),
        executedActions,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
