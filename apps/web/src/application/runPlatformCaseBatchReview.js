import { loadAllCases } from "../infrastructure/cases/loadCases.js";
import { runPlatformCaseReview } from "./runPlatformCaseReview.js";

function sortRows(a, b) {
  if (a.summary.topPriorityItems.length !== b.summary.topPriorityItems.length) {
    return b.summary.topPriorityItems.length - a.summary.topPriorityItems.length;
  }

  return a.platformCaseId.localeCompare(b.platformCaseId, "zh-CN");
}

export async function runPlatformCaseBatchReview({ obsidianRoot = "" } = {}) {
  const allCases = await loadAllCases();
  const platformCaseIds = [
    ...new Set(
      allCases
        .filter((item) => item.sourceType === "real" && item.tracking?.platformCaseId)
        .map((item) => item.tracking.platformCaseId),
    ),
  ].sort((a, b) => a.localeCompare(b, "zh-CN"));

  const rows = await Promise.all(
    platformCaseIds.map((platformCaseId) =>
      runPlatformCaseReview({
        platformCaseId,
        obsidianRoot,
      }),
    ),
  );

  const sortedRows = [...rows].sort(sortRows);
  const pendingCount = rows.filter((item) => item.summary.completenessStatus === "待回填").length;
  const partialCount = rows.filter((item) => item.summary.completenessStatus === "部分回填").length;
  const readyCount = rows.filter((item) => item.summary.completenessStatus === "可进入同步").length;

  return {
    summary: {
      totalCases: rows.length,
      pendingCount,
      partialCount,
      readyCount,
    },
    topPriorityRows: sortedRows.slice(0, 3).map((item) => ({
      platformCaseId: item.platformCaseId,
      completenessStatus: item.summary.completenessStatus,
      topPriorityItems: item.summary.topPriorityItems,
    })),
    rows: sortedRows,
  };
}
