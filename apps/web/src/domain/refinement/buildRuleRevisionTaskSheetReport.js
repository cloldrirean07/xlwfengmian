function buildTaskKey(row) {
  return [
    row.suggestedMappingId || "no-mapping",
    row.suggestedKeyword || "no-keyword",
    row.fallbackAdjustment || "no-fallback",
  ].join("::");
}

function buildTaskTitle(row) {
  if (row.suggestedMappingId && row.suggestedKeyword) {
    return `补强 ${row.suggestedMappingId} 相关关键词：${row.suggestedKeyword}`;
  }

  if (row.suggestedMappingId) {
    return `复核并补强映射：${row.suggestedMappingId}`;
  }

  if (row.fallbackAdjustment) {
    return `调整默认兜底策略：${row.fallbackAdjustment}`;
  }

  return "复核未明确归类的误判样本";
}

function buildPriority(sampleCount) {
  if (sampleCount >= 3) {
    return "P1";
  }
  if (sampleCount === 2) {
    return "P2";
  }
  return "P3";
}

export function buildRuleRevisionTaskSheetReport(reviewedMisclassifiedReport) {
  const sourceRows = reviewedMisclassifiedReport?.rows || [];
  const grouped = new Map();

  for (const row of sourceRows) {
    const key = buildTaskKey(row);
    const task = grouped.get(key) || {
      taskKey: key,
      taskTitle: buildTaskTitle(row),
      suggestedMappingId: row.suggestedMappingId || "",
      suggestedKeyword: row.suggestedKeyword || "",
      fallbackAdjustment: row.fallbackAdjustment || "",
      caseIds: [],
      sourceNegativeMappingIds: [],
      sourceDirectionLabels: [],
      sourceMatchedSignals: [],
      sourceBoundaryRules: [],
      actualIssues: [],
      titles: [],
    };

    task.caseIds.push(row.caseId);
    if (row.negativeMappingId) {
      task.sourceNegativeMappingIds.push(row.negativeMappingId);
    }
    if (row.sourceDirectionLabel) {
      task.sourceDirectionLabels.push(row.sourceDirectionLabel);
    }
    if (row.sourceMatchedSignals?.length) {
      task.sourceMatchedSignals.push(...row.sourceMatchedSignals);
    }
    if (row.sourceBoundaryRules?.length) {
      task.sourceBoundaryRules.push(...row.sourceBoundaryRules);
    }
    if (row.actualIssue) {
      task.actualIssues.push(row.actualIssue);
    }
    if (row.title) {
      task.titles.push(row.title);
    }

    grouped.set(key, task);
  }

  const tasks = [...grouped.values()]
    .map((task, index) => {
      const sampleCount = task.caseIds.length;
      return {
        taskId: `REV-${String(index + 1).padStart(3, "0")}`,
        taskTitle: task.taskTitle,
        priority: buildPriority(sampleCount),
        sampleCount,
        caseIds: [...new Set(task.caseIds)].sort(),
        sourceNegativeMappingIds: [...new Set(task.sourceNegativeMappingIds)].sort(),
        sourceDirectionLabels: [...new Set(task.sourceDirectionLabels)].sort(),
        sourceMatchedSignals: [...new Set(task.sourceMatchedSignals)].sort(),
        sourceBoundaryRules: [...new Set(task.sourceBoundaryRules)].sort(),
        actualIssues: [...new Set(task.actualIssues)].sort(),
        titles: [...new Set(task.titles)].sort(),
        suggestedMappingId: task.suggestedMappingId,
        suggestedKeyword: task.suggestedKeyword,
        fallbackAdjustment: task.fallbackAdjustment,
      };
    })
    .sort((left, right) => {
      const priorityWeight = { P1: 3, P2: 2, P3: 1 };
      return (
        priorityWeight[right.priority] - priorityWeight[left.priority] ||
        right.sampleCount - left.sampleCount ||
        left.taskTitle.localeCompare(right.taskTitle, "zh-CN")
      );
    });

  return {
    summary: {
      sourceSampleCount: sourceRows.length,
      taskCount: tasks.length,
      p1Count: tasks.filter((task) => task.priority === "P1").length,
      p2Count: tasks.filter((task) => task.priority === "P2").length,
      p3Count: tasks.filter((task) => task.priority === "P3").length,
    },
    tasks,
  };
}
