export function buildKeyCaseRerunPlan(cases, existingPlan = {}) {
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
    generatedFromCaseOperations: prioritizedCases.map((item) => ({
      caseId: item.id,
      title: item.title,
      sourceType: item.sourceType,
      keyCaseRerunPriority: item.operations?.keyCaseRerunPriority || 0,
      maintenanceTags: item.operations?.maintenanceTags || [],
    })),
  };
}
