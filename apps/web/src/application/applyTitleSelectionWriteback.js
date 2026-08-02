import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { writeTextFile } from "../shared/fileSystem.js";
import { loadRealCaseIndex } from "../infrastructure/cases/loadRealCaseIndex.js";
import { resetCaseCache } from "../infrastructure/cases/loadCases.js";
import { defaultRealCaseStoragePaths } from "../infrastructure/cases/resolveRealCaseStoragePaths.js";

export const TITLE_SELECTION_WRITEBACK_PHRASE = "确认写入优选标题";

function compactText(value) {
  return String(value || "").trim();
}

function findRealCaseIndexEntry(currentIndex, caseId) {
  return currentIndex.find((entry) => entry?.id === caseId) || null;
}

function resolveRealCaseItemPath({ indexPath, entry }) {
  if (!entry?.file) {
    throw new Error("当前真实案例索引缺少文件路径，无法执行标题写回。");
  }

  return join(dirname(indexPath), entry.file);
}

function buildNextCopyReview({ currentCopyReview, copyReviewDraft }) {
  const preferredTitle = compactText(copyReviewDraft?.preferredTitle);
  const titleRationale = compactText(
    copyReviewDraft?.titleSelectionReason || copyReviewDraft?.titleRationale,
  );

  if (!preferredTitle) {
    throw new Error("标题写回缺少优选标题。");
  }

  if (!titleRationale) {
    throw new Error("标题写回缺少选择理由。");
  }

  return {
    ...(currentCopyReview && typeof currentCopyReview === "object" ? currentCopyReview : {}),
    preferredTitle,
    titleRationale,
  };
}

export function buildTitleSelectionWritebackPatch({ record, copyReviewDraft }) {
  if (!record || typeof record !== "object") {
    throw new Error("标题写回缺少真实案例记录。");
  }

  const nextCopyReview = buildNextCopyReview({
    currentCopyReview: record.copyReview || {},
    copyReviewDraft,
  });

  return {
    nextRecord: {
      ...record,
      copyReview: nextCopyReview,
    },
    writtenFields: [
      {
        fieldPath: "copyReview.preferredTitle",
        currentValue: compactText(record.copyReview?.preferredTitle) || "待补充",
        nextValue: nextCopyReview.preferredTitle,
      },
      {
        fieldPath: "copyReview.titleRationale",
        currentValue: compactText(record.copyReview?.titleRationale) || "待补充",
        nextValue: nextCopyReview.titleRationale,
      },
    ],
  };
}

export async function applyTitleSelectionWriteback(
  payload,
  {
    loadIndex = loadRealCaseIndex,
    readJsonFile = async (path) => JSON.parse(await readFile(path, "utf-8")),
    writeJsonFile = async (path, record) => writeTextFile(path, `${JSON.stringify(record, null, 2)}\n`),
    storagePaths = defaultRealCaseStoragePaths,
    onCommitted = resetCaseCache,
  } = {},
) {
  const caseId = compactText(payload?.caseId);
  const confirmationPhrase = compactText(payload?.confirmationPhrase);

  if (!caseId) {
    throw new Error("标题写回缺少真实案例 ID。");
  }

  if (confirmationPhrase !== TITLE_SELECTION_WRITEBACK_PHRASE) {
    throw new Error(`请输入确认短语：${TITLE_SELECTION_WRITEBACK_PHRASE}`);
  }

  const currentIndex = await loadIndex(storagePaths.realCasesIndexPath);
  const entry = findRealCaseIndexEntry(currentIndex, caseId);

  if (!entry) {
    throw new Error(`未找到真实案例索引：${caseId}`);
  }

  const itemPath = resolveRealCaseItemPath({
    indexPath: storagePaths.realCasesIndexPath,
    entry,
  });
  const currentRecord = await readJsonFile(itemPath);

  if (currentRecord.id !== caseId) {
    throw new Error(`真实案例文件 ID 不匹配：${currentRecord.id || "unknown"}`);
  }

  if (currentRecord.sourceType !== "real") {
    throw new Error(`标题写回仅支持真实案例：${caseId}`);
  }

  const { nextRecord, writtenFields } = buildTitleSelectionWritebackPatch({
    record: currentRecord,
    copyReviewDraft: payload?.copyReviewDraft,
  });

  await writeJsonFile(itemPath, nextRecord);

  if (typeof onCommitted === "function") {
    onCommitted();
  }

  const readbackRecord = await readJsonFile(itemPath);
  const readbackOk =
    compactText(readbackRecord.copyReview?.preferredTitle) ===
      compactText(nextRecord.copyReview?.preferredTitle) &&
    compactText(readbackRecord.copyReview?.titleRationale) ===
      compactText(nextRecord.copyReview?.titleRationale);

  return {
    ok: true,
    statusLabel: readbackOk ? "写回完成" : "读回不一致",
    caseId,
    itemPath,
    appliedAt: new Date().toISOString(),
    confirmationPhrase,
    writtenFields,
    readback: {
      ok: readbackOk,
      preferredTitle: compactText(readbackRecord.copyReview?.preferredTitle),
      titleRationale: compactText(readbackRecord.copyReview?.titleRationale),
    },
    nextSteps: [
      "复跑关键样例，观察标题优先级是否符合人工判断",
      "将稳定标题规则沉淀进标题风格库",
    ],
  };
}
