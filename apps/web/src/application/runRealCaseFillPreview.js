import { loadCaseById } from "../infrastructure/cases/loadCases.js";
import { inspectRealCaseReadiness } from "../domain/cases/inspectRealCaseReadiness.js";
import { buildRealCaseFillSheet } from "../domain/cases/buildRealCaseFillSheet.js";
import { buildRealCaseFillSheetMarkdown } from "../domain/cases/buildRealCaseFillSheetMarkdown.js";
import { createRealCaseFillObsidianPreview } from "./createRealCaseFillObsidianPreview.js";

export async function runRealCaseFillPreview({ caseId, obsidianRoot = "" }) {
  if (!caseId) {
    throw new Error('runRealCaseFillPreview requires "caseId".');
  }

  const record = await loadCaseById(caseId);
  if (!record) {
    throw new Error(`Case not found: ${caseId}`);
  }

  if (record.sourceType !== "real") {
    throw new Error(`Real case fill preview only supports real cases: ${caseId}`);
  }

  const readiness = inspectRealCaseReadiness(record);
  const fillSheet = buildRealCaseFillSheet({
    record,
    readiness,
  });
  const fillSheetMarkdown = buildRealCaseFillSheetMarkdown(fillSheet);
  const obsidianDraft = createRealCaseFillObsidianPreview({
    caseId: record.id,
    fillSheetMarkdown,
    obsidianRoot,
  });

  return {
    caseId: record.id,
    title: record.title,
    readiness,
    fillSheet,
    fillSheetMarkdown,
    obsidianDraft,
  };
}
