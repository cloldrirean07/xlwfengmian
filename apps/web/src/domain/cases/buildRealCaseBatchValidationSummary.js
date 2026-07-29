import { inspectRealCaseReadiness } from "./inspectRealCaseReadiness.js";
import { buildRealCaseReadinessReport } from "./buildRealCaseReadinessReport.js";
import { buildRealCaseFillSheet } from "./buildRealCaseFillSheet.js";

function buildMissingFieldStats(rows) {
  const counts = new Map();

  for (const row of rows) {
    for (const field of row.missingFields || []) {
      counts.set(field, (counts.get(field) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.label.localeCompare(right.label);
    });
}

function buildRecommendedBatchActions(fillSheets) {
  const grouped = new Map();

  for (const sheet of fillSheets) {
    const candidateTasks = [
      ...(sheet.topPriorityItems || []),
      ...((sheet.missingItems || []).filter((item) => item.priority === "P1").slice(0, 1)),
    ];

    for (const task of candidateTasks) {
      const existing = grouped.get(task.label) || {
        label: task.label,
        priority: task.priority,
        priorityScore: task.priorityScore,
        codeField: task.codeField,
        obsidianField: task.obsidianField,
        prompt: task.prompt,
        priorityReason: task.priorityReason,
        affectedCaseIds: [],
      };

      if (!existing.affectedCaseIds.includes(sheet.caseId)) {
        existing.affectedCaseIds.push(sheet.caseId);
      }

      if (task.priorityScore > existing.priorityScore) {
        existing.priority = task.priority;
        existing.priorityScore = task.priorityScore;
        existing.priorityReason = task.priorityReason;
      }

      grouped.set(task.label, existing);
    }
  }

  return [...grouped.values()]
    .map((item) => ({
      ...item,
      affectedCaseCount: item.affectedCaseIds.length,
    }))
    .sort((left, right) => {
      if (right.affectedCaseCount !== left.affectedCaseCount) {
        return right.affectedCaseCount - left.affectedCaseCount;
      }

      return right.priorityScore - left.priorityScore;
    })
    .slice(0, 5);
}

export function buildRealCaseBatchValidationSummary(preparedBatch) {
  const rowEntries = (preparedBatch?.created || []).map((item) => {
    const readiness = inspectRealCaseReadiness(item.record);
    const fillSheet = buildRealCaseFillSheet({
      record: item.record,
      readiness,
    });

    return {
      record: item.record,
      readiness,
      fillSheet,
    };
  });
  const rows = rowEntries.map((item) => item.readiness);
  const readinessReport = buildRealCaseReadinessReport(rows);
  const missingFieldStats = buildMissingFieldStats(rows);
  const recommendedBatchActions = buildRecommendedBatchActions(
    rowEntries.map((item) => item.fillSheet),
  );

  return {
    summary: {
      ...readinessReport.summary,
      totalMissingFields: rows.reduce(
        (accumulator, item) => accumulator + item.missingFields.length,
        0,
      ),
      avgMissingFields:
        rows.length > 0
          ? Number(
              (
                rows.reduce(
                  (accumulator, item) => accumulator + item.missingFields.length,
                  0,
                ) / rows.length
              ).toFixed(1),
            )
          : 0,
    },
    missingFieldStats,
    recommendedBatchActions,
    rows: rowEntries.map(({ readiness, fillSheet }) => ({
      caseId: readiness.caseId,
      title: readiness.title,
      platformCaseId: readiness.platformCaseId,
      status: readiness.status,
      missingCount: readiness.missingFields.length,
      missingFields: readiness.missingFields,
      topMissingFields: readiness.missingFields.slice(0, 3),
      nextTask:
        fillSheet.topPriorityItems?.[0] ||
        fillSheet.missingItems?.[0] ||
        null,
    })),
  };
}
