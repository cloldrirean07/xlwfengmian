import { loadCaseById } from "../infrastructure/cases/loadCases.js";
import { loadPlatformCaseNote } from "../infrastructure/obsidian/loadPlatformCaseNote.js";
import { buildRealCaseUpdateFromPlatformNote } from "../domain/cases/buildRealCaseUpdateFromPlatformNote.js";
import { buildPlatformSyncSummary } from "../domain/cases/buildPlatformSyncSummary.js";

export async function runPlatformSyncPreview({
  caseId,
  notePath = "",
  obsidianRoot = "",
}) {
  if (!caseId) {
    throw new Error('runPlatformSyncPreview requires "caseId".');
  }

  const record = await loadCaseById(caseId);
  if (!record) {
    throw new Error(`Case not found: ${caseId}`);
  }

  if (record.sourceType !== "real") {
    throw new Error(`Platform sync preview only supports real cases: ${caseId}`);
  }

  const note = await loadPlatformCaseNote({
    platformCaseId: record.tracking.platformCaseId,
    notePath: notePath || record.tracking.obsidianCasePath,
    obsidianRoot,
  });
  const updatePayload = buildRealCaseUpdateFromPlatformNote(record, note.parsedNote);
  const preview = {
    ...record,
    ...updatePayload.updates,
  };
  const syncSummary = buildPlatformSyncSummary(record, preview);

  return {
    caseId: record.id,
    title: record.title,
    platformCaseId: record.tracking.platformCaseId,
    notePath: note.notePath,
    targetPath: record.tracking.obsidianCasePath,
    extracted: updatePayload.extracted,
    preview,
    syncSummary,
  };
}
