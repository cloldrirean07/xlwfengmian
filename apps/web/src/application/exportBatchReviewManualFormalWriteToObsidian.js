import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  buildManualFormalWriteExecutionPacket,
} from "../domain/review/buildManualFormalWriteExecutionPacket.js";
import {
  buildManualFormalWritePostExecutionAcceptance,
  buildManualFormalWritePostExecutionAcceptanceMarkdown,
} from "../domain/review/buildManualFormalWritePostExecutionAcceptance.js";
import { readTextFile, writeTextFile } from "../shared/fileSystem.js";
import { runBatchReviewManualFormalWriteReadinessPreview } from "./runBatchReviewManualFormalWriteReadinessPreview.js";

export const BATCH_REVIEW_MANUAL_FORMAL_WRITE_PHRASE = "确认执行正式写回";

function buildExportId() {
  return `BRF-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
}

export function buildFormalWriteFollowUpTasks({
  targetBatchLabel = "",
  manualReviewConclusion = "",
  confirmedLines = "",
} = {}) {
  const batchLabel = String(targetBatchLabel || "").trim() || "最近完成写回的批次";
  const conclusion = String(manualReviewConclusion || "").trim() || "已完成人工复盘结论";
  const confirmedFields = String(confirmedLines || "").trim() || "已确认写回字段";

  return [
    {
      taskId: "rule-revision-task-sheet",
      taskType: "rule-revision",
      label: "规则修订任务单",
      status: "pending",
      executionMode: "manual-review-required",
      summary: `基于 ${batchLabel} 的正式写回结论，整理可进入规则引擎下一轮调整的重复摩擦点。`,
      evidence: [conclusion, confirmedFields],
    },
    {
      taskId: "key-case-rerun-plan",
      taskType: "key-case-rerun",
      label: "关键样例复跑",
      status: "pending",
      executionMode: "manual-review-required",
      summary: `将 ${batchLabel} 纳入规则调整后的关键样例复跑候选，验证写回判断对主链路的影响。`,
      evidence: [conclusion],
    },
  ];
}

export async function exportBatchReviewManualFormalWriteToObsidian({
  confirmationPhrase = "",
  fileSystem = { readTextFile, writeTextFile },
} = {}) {
  if (String(confirmationPhrase || "").trim() !== BATCH_REVIEW_MANUAL_FORMAL_WRITE_PHRASE) {
    throw new Error(`请输入确认短语：${BATCH_REVIEW_MANUAL_FORMAL_WRITE_PHRASE}`);
  }

  const readiness = await runBatchReviewManualFormalWriteReadinessPreview();

  if (readiness.status !== "ready-to-formal-write") {
    throw new Error(readiness.summary || "正式写回尚未满足前置条件。");
  }

  const safeWriteStatus = readiness.latestSafeWriteStatus;
  const safeWriteNotePath = safeWriteStatus?.targetPath || "";
  const targetPath = safeWriteStatus?.parsed?.targetPath || "";
  const patchedMarkdown = String(safeWriteStatus?.parsed?.patchedMarkdown || "").trim();
  const manualReviewConclusion = safeWriteStatus?.parsed?.manualReviewConclusion || "";
  const confirmedLines = safeWriteStatus?.parsed?.parsed?.confirmedLines || "";

  if (!safeWriteNotePath) {
    throw new Error("未找到最近一份安全写回预览记录，无法继续正式写回。");
  }

  if (!targetPath) {
    throw new Error("安全写回预览里缺少目标记录路径，无法继续正式写回。");
  }

  if (!patchedMarkdown) {
    throw new Error("安全写回预览里没有解析到“写回后预览”正文，无法继续正式写回。");
  }

  const previousMarkdown = await fileSystem.readTextFile(targetPath);
  const finalMarkdown = `${patchedMarkdown}\n`;
  const exportId = buildExportId();
  const exportedAt = new Date().toISOString();
  const sourceDir = join(process.cwd(), "outputs", "batch-review-manual-formal-write");
  const sourceJsonPath = join(sourceDir, "batch-review-manual-formal-write.json");
  const sourceMarkdownPath = join(sourceDir, "batch-review-manual-formal-write.md");
  const sourcePreviousMarkdownPath = join(
    sourceDir,
    "batch-review-manual-formal-write.previous.md",
  );
  const executionPacket = buildManualFormalWriteExecutionPacket({
    precheck: {
      ok: true,
      status: "formal-write-execution-precheck-ready",
      confirmation: {
        requiredPhrase: BATCH_REVIEW_MANUAL_FORMAL_WRITE_PHRASE,
      },
      blockers: [],
    },
    readiness,
    currentTargetMarkdown: previousMarkdown,
    patchedMarkdown,
    outputPaths: {
      sourceMarkdownPath,
      sourceJsonPath,
      sourcePreviousMarkdownPath,
      logDirectory: join(
        process.cwd(),
        "outputs",
        "obsidian-export-logs",
        "batch-review-manual-formal-write",
      ),
    },
  });
  const followUpTasks = buildFormalWriteFollowUpTasks({
    targetBatchLabel: safeWriteStatus?.targetBatchLabel || "",
    manualReviewConclusion,
    confirmedLines,
  });

  await mkdir(sourceDir, { recursive: true });
  await fileSystem.writeTextFile(sourcePreviousMarkdownPath, previousMarkdown);
  await fileSystem.writeTextFile(sourceMarkdownPath, finalMarkdown);
  await fileSystem.writeTextFile(
    sourceJsonPath,
    `${JSON.stringify(
      {
        ok: true,
        exportId,
        exportedAt,
        safeWriteNotePath,
        targetPath,
        sourceMarkdownPath,
        sourcePreviousMarkdownPath,
        sourceJsonPath,
        readback: {
          ok: true,
          matchedExpectedContent: true,
        },
        manualReviewConclusion,
        confirmedLines,
        readyDecision: safeWriteStatus?.parsed?.parsed?.readyDecision || "",
        followUpTasks,
      },
      null,
      2,
    )}\n`,
  );
  await fileSystem.writeTextFile(targetPath, finalMarkdown);
  const persistedContent = await fileSystem.readTextFile(targetPath);
  const matchedExpectedContent = persistedContent === finalMarkdown;

  if (!matchedExpectedContent) {
    await fileSystem.writeTextFile(targetPath, previousMarkdown);
    throw new Error("写回失败，请检查后重试");
  }

  const logDir = join(
    process.cwd(),
    "outputs",
    "obsidian-export-logs",
    "batch-review-manual-formal-write",
  );
  const logPath = join(logDir, `${exportId}.json`);
  await mkdir(logDir, { recursive: true });
  const result = {
    ok: true,
    exportId,
    exportedAt,
    safeWriteNotePath,
    targetPath,
    sourceMarkdownPath,
    sourcePreviousMarkdownPath,
    sourceJsonPath,
    readback: {
      ok: matchedExpectedContent,
      matchedExpectedContent,
    },
    patchedMarkdown,
    manualReviewConclusion,
    confirmedLines,
    readyDecision: safeWriteStatus?.parsed?.parsed?.readyDecision || "",
    followUpTasks,
  };
  const acceptanceDir = join(
    sourceDir,
    "manual-formal-write-post-execution-acceptance",
  );
  const acceptanceJsonPath = join(
    acceptanceDir,
    "manual-formal-write-post-execution-acceptance.json",
  );
  const acceptanceMarkdownPath = join(
    acceptanceDir,
    "manual-formal-write-post-execution-acceptance.md",
  );
  const postExecutionAcceptance = buildManualFormalWritePostExecutionAcceptance({
    executionPacket,
    formalWriteExport: result,
    outputPaths: {
      json: acceptanceJsonPath,
      markdown: acceptanceMarkdownPath,
    },
  });
  const postExecutionAcceptanceMarkdown =
    buildManualFormalWritePostExecutionAcceptanceMarkdown(postExecutionAcceptance);

  await mkdir(acceptanceDir, { recursive: true });
  await fileSystem.writeTextFile(
    acceptanceJsonPath,
    `${JSON.stringify(postExecutionAcceptance, null, 2)}\n`,
  );
  await fileSystem.writeTextFile(acceptanceMarkdownPath, `${postExecutionAcceptanceMarkdown}\n`);

  await writeFile(
    logPath,
    `${JSON.stringify(
      {
        exportId,
        exportedAt,
        safeWriteNotePath,
        targetPath,
        sourceMarkdownPath,
        sourcePreviousMarkdownPath,
        sourceJsonPath,
        followUpTasks,
        postExecutionAcceptance: {
          status: postExecutionAcceptance.status,
          passedCount: postExecutionAcceptance.passedCount,
          totalCount: postExecutionAcceptance.totalCount,
          jsonPath: acceptanceJsonPath,
          markdownPath: acceptanceMarkdownPath,
        },
        readback: {
          ok: matchedExpectedContent,
          matchedExpectedContent,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  return {
    ...result,
    postExecutionAcceptance,
  };
}
