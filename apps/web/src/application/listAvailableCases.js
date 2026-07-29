import { loadAllCases } from "../infrastructure/cases/loadCases.js";
import { inspectRealCaseReadiness } from "../domain/cases/inspectRealCaseReadiness.js";
import { buildRealCaseOverviewMeta } from "../domain/cases/buildRealCaseOverviewMeta.js";
import { loadLatestRealCaseFillExportStatus } from "../infrastructure/exports/loadLatestRealCaseFillExportStatus.js";

export async function listAvailableCases() {
  const cases = await loadAllCases();
  const items = await Promise.all(
    cases.map(async (item) => ({
      ...(item.sourceType === "real"
        ? (() => {
            const readiness = inspectRealCaseReadiness(item);
            return {
              readinessStatus: readiness.status,
              readinessCompletedChecks: readiness.completedChecks,
              readinessTotalChecks: readiness.totalChecks,
            };
          })()
        : {}),
      id: item.id,
      title: item.title,
      platform: item.platform,
      platformCaseId: item.tracking?.platformCaseId || "",
      userAssetType: item.userAssetType,
      referencePreference: item.referencePreference,
      sourceType: item.sourceType,
      keyCaseRerunPriority: item.operations?.keyCaseRerunPriority || 0,
      maintenanceTags: item.operations?.maintenanceTags || [],
      latestExportStatus:
        item.sourceType === "real"
          ? await loadLatestRealCaseFillExportStatus(item.id)
          : null,
    })),
  );

  const enhancedItems = items.map((item) => {
    if (item.sourceType !== "real") {
      return item;
    }

    return {
      ...item,
      overviewMeta: buildRealCaseOverviewMeta({
        keyCaseRerunPriority: item.keyCaseRerunPriority,
        readinessStatus: item.readinessStatus,
        latestExportStatus: item.latestExportStatus,
      }),
    };
  });

  return enhancedItems.sort((a, b) => {
    if (a.sourceType !== b.sourceType) {
      return a.sourceType === "real" ? -1 : 1;
    }

    if (a.sourceType !== "real" || b.sourceType !== "real") {
      return a.id.localeCompare(b.id);
    }

    const scoreDiff = (a.overviewMeta?.priorityScore || 0) - (b.overviewMeta?.priorityScore || 0);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return b.keyCaseRerunPriority - a.keyCaseRerunPriority;
  });
}
