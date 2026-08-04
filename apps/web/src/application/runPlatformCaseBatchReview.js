import { loadAllCases } from "../infrastructure/cases/loadCases.js";
import { runPlatformCaseReview } from "./runPlatformCaseReview.js";

function sortRows(a, b) {
  const noteAvailabilityDiff = Number(Boolean(b.noteAvailable)) - Number(Boolean(a.noteAvailable));

  if (noteAvailabilityDiff !== 0) {
    return noteAvailabilityDiff;
  }

  if (a.summary.topPriorityItems.length !== b.summary.topPriorityItems.length) {
    return b.summary.topPriorityItems.length - a.summary.topPriorityItems.length;
  }

  return a.platformCaseId.localeCompare(b.platformCaseId, "zh-CN");
}

function buildLinkedCases(allCases, platformCaseId) {
  return allCases
    .filter((item) => item.sourceType === "real" && item.tracking?.platformCaseId === platformCaseId)
    .map((item) => ({
      caseId: item.id,
      title: item.title,
      sourceType: item.sourceType,
      platform: item.platform,
      trackingStatus: "已映射",
    }));
}

function buildMissingPlatformNoteRow(platformCaseId, allCases, error) {
  const linkedCases = buildLinkedCases(allCases, platformCaseId);

  return {
    platformCaseId,
    notePath: "",
    noteAvailable: false,
    missingReason: error.message,
    parsedNote: {},
    completeness: {
      platformCaseId,
      status: "待回填",
      totalChecks: 0,
      completedChecks: 0,
      missingFields: ["平台原生案例笔记"],
      checks: [],
    },
    quality: {
      platformCaseId,
      status: "待回填",
      totalChecks: 0,
      usableCount: 0,
      missingFields: ["平台原生案例笔记"],
      weakFields: [],
      checks: [],
    },
    actionPlan: {
      tasks: [
        {
          label: "平台原生案例笔记",
          priority: "P0",
          reason: "真实案例已建档，但对应平台笔记还未创建或不可读取。",
        },
      ],
    },
    linkedCases,
    syncPreview: null,
    summary: {
      completenessStatus: "待回填",
      qualityStatus: "待回填",
      completedChecks: 0,
      totalChecks: 0,
      linkedCaseCount: linkedCases.length,
      readyToSync: false,
      topPriorityItems: ["平台原生案例笔记"],
    },
  };
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
    platformCaseIds.map(async (platformCaseId) => {
      try {
        const row = await runPlatformCaseReview({
          platformCaseId,
          obsidianRoot,
        });

        return {
          noteAvailable: true,
          ...row,
        };
      } catch (error) {
        if (error?.code === "ENOENT") {
          return buildMissingPlatformNoteRow(platformCaseId, allCases, error);
        }

        throw error;
      }
    }),
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
