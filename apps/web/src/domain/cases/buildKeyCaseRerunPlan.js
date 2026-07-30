function getFormalWriteCandidateBatches(formalWriteExport = null) {
  const task = (formalWriteExport?.followUpTasks || []).find(
    (item) => item.taskType === "key-case-rerun",
  );

  if (!task) {
    return [];
  }

  const targetFileName = formalWriteExport?.targetPath?.split("/").pop() || "";
  const targetBatchLabel = targetFileName.replace(/_批次试跑记录_.+$/, "");

  return [
    {
      batchLabel: targetBatchLabel || task.taskId || "待确认批次",
      taskId: task.taskId || "key-case-rerun-plan",
      status: task.status || "pending",
      executionMode: task.executionMode || "manual-review-required",
      summary: task.summary || "正式写回后待拆解为关键样例复跑候选。",
      evidence: Array.isArray(task.evidence) ? task.evidence : [],
    },
  ];
}

export function buildKeyCaseRerunPlan(cases, existingPlan = {}, options = {}) {
  const prioritizedCases = [...(cases || [])]
    .filter((item) => (item.operations?.keyCaseRerunPriority || 0) > 0)
    .sort((left, right) => {
      const priorityDiff =
        (right.operations?.keyCaseRerunPriority || 0) -
        (left.operations?.keyCaseRerunPriority || 0);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return left.id.localeCompare(right.id, "zh-CN");
    });

  return {
    planId: existingPlan.planId || "key-case-rerun-generated",
    description:
      existingPlan.description ||
      "根据案例元数据自动生成的关键样例复跑清单，用于规则升级后的优先复跑与下游刷新。",
    caseIds: prioritizedCases.map((item) => item.id),
    downstreamRefreshTargets: existingPlan.downstreamRefreshTargets || [
      "reviewed-misclassified",
      "rule-revision-task-sheet",
    ],
    formalWriteCandidateBatches:
      existingPlan.formalWriteCandidateBatches ||
      getFormalWriteCandidateBatches(options.formalWriteExport),
    generatedFromCaseOperations: prioritizedCases.map((item) => ({
      caseId: item.id,
      title: item.title,
      sourceType: item.sourceType,
      keyCaseRerunPriority: item.operations?.keyCaseRerunPriority || 0,
      maintenanceTags: item.operations?.maintenanceTags || [],
    })),
  };
}
