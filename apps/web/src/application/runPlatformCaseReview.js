import { loadAllCases } from "../infrastructure/cases/loadCases.js";
import { loadPlatformCaseNote } from "../infrastructure/obsidian/loadPlatformCaseNote.js";
import { buildPlatformCaseActionPlan } from "../domain/cases/buildPlatformCaseActionPlan.js";
import { inspectPlatformCaseCompleteness } from "../domain/cases/inspectPlatformCaseCompleteness.js";
import { inspectPlatformCaseFieldQuality } from "../domain/cases/inspectPlatformCaseFieldQuality.js";
import { runPlatformSyncPreview } from "./runPlatformSyncPreview.js";

function buildLinkedCaseSummary(record) {
  return {
    caseId: record.id,
    title: record.title,
    sourceType: record.sourceType,
    platform: record.platform,
    trackingStatus: record.tracking?.platformCaseId ? "已映射" : "未映射",
  };
}

export async function runPlatformCaseReview({
  platformCaseId,
  obsidianRoot = "",
  notePath = "",
}) {
  if (!platformCaseId) {
    throw new Error('runPlatformCaseReview requires "platformCaseId".');
  }

  const note = await loadPlatformCaseNote({
    platformCaseId,
    notePath,
    obsidianRoot,
  });
  const completeness = inspectPlatformCaseCompleteness({
    platformCaseId,
    parsedNote: note.parsedNote,
  });
  const quality = inspectPlatformCaseFieldQuality({
    platformCaseId,
    parsedNote: note.parsedNote,
  });
  const actionPlan = buildPlatformCaseActionPlan({
    completeness,
    quality,
  });
  const allCases = await loadAllCases();
  const linkedCases = allCases.filter(
    (item) => item.sourceType === "real" && item.tracking?.platformCaseId === platformCaseId,
  );

  let syncPreview = null;
  if (linkedCases[0]) {
    syncPreview = await runPlatformSyncPreview({
      caseId: linkedCases[0].id,
      notePath: note.notePath,
      obsidianRoot,
    });
  }

  return {
    platformCaseId,
    notePath: note.notePath,
    parsedNote: note.parsedNote,
    completeness,
    quality,
    actionPlan,
    linkedCases: linkedCases.map(buildLinkedCaseSummary),
    syncPreview,
    summary: {
      completenessStatus: completeness.status,
      qualityStatus: quality.status,
      completedChecks: completeness.completedChecks,
      totalChecks: completeness.totalChecks,
      linkedCaseCount: linkedCases.length,
      readyToSync:
        completeness.missingFields.length === 0 &&
        quality.missingFields.length === 0 &&
        quality.weakFields.length === 0 &&
        linkedCases.length > 0,
      topPriorityItems: actionPlan.tasks.map((item) => item.label).slice(0, 3),
    },
  };
}
