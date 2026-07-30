export function buildGeneratedKeyCaseRerunPlanMarkdown(plan) {
  const lines = [
    "# 自动生成的关键样例复跑计划",
    "",
    "## 汇总",
    `- 计划 ID：${plan.planId}`,
    `- 样例数：${(plan.caseIds || []).length}`,
    `- 正式写回候选批次：${(plan.formalWriteCandidateBatches || []).length}`,
    `- 下游刷新目标：${(plan.downstreamRefreshTargets || []).join(" / ") || "暂无"}`,
    "",
    "## 样例列表",
  ];

  if (!plan.generatedFromCaseOperations?.length) {
    lines.push("- 当前没有命中的关键复跑样例");
    lines.push("");
    return lines.join("\n");
  }

  for (const item of plan.generatedFromCaseOperations) {
    lines.push(`### ${item.caseId}`);
    lines.push(`- 标题：${item.title}`);
    lines.push(`- 来源类型：${item.sourceType}`);
    lines.push(`- 关键复跑优先级：${item.keyCaseRerunPriority}`);
    lines.push(`- 维护标签：${item.maintenanceTags.join(" / ") || "暂无"}`);
    lines.push("");
  }

  if (plan.formalWriteCandidateBatches?.length) {
    lines.push("## 正式写回候选批次", "");
    for (const item of plan.formalWriteCandidateBatches) {
      lines.push(`### ${item.batchLabel}`);
      lines.push(`- 任务：${item.taskId}`);
      lines.push(`- 状态：${item.status}`);
      lines.push(`- 执行方式：${item.executionMode}`);
      lines.push(`- 说明：${item.summary}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}
