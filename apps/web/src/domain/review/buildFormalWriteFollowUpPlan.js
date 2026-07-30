function normalizeTaskType(taskType = "") {
  if (taskType === "rule-revision") {
    return "规则修订";
  }
  if (taskType === "key-case-rerun") {
    return "关键样例复跑";
  }
  return taskType || "承接任务";
}

function buildRuleRevisionSection({ formalWriteExport = null, ruleRevisionReport = null } = {}) {
  const task = (formalWriteExport?.followUpTasks || []).find(
    (item) => item.taskType === "rule-revision",
  );
  const reportTasks = Array.isArray(ruleRevisionReport?.tasks) ? ruleRevisionReport.tasks : [];
  const conclusion = formalWriteExport?.manualReviewConclusion || "";
  const confirmedLines = formalWriteExport?.confirmedLines || "";
  const firstReportTask = reportTasks[0] || null;

  return {
    status: task ? "ready-for-manual-review" : "waiting-for-formal-write-task",
    label: task ? "规则修订任务单已生成" : "等待规则修订任务",
    taskId: task?.taskId || "rule-revision-task-sheet",
    taskType: normalizeTaskType(task?.taskType || "rule-revision"),
    summary:
      task?.summary ||
      "正式写回后应整理重复摩擦点，再决定是否进入规则引擎调整。",
    evidence: [
      conclusion,
      confirmedLines,
      ...(Array.isArray(task?.evidence) ? task.evidence : []),
    ].filter(Boolean),
    existingReport: ruleRevisionReport
      ? {
          taskCount: ruleRevisionReport.summary?.taskCount ?? reportTasks.length,
          sourceSampleCount: ruleRevisionReport.summary?.sourceSampleCount ?? 0,
          p1Count: ruleRevisionReport.summary?.p1Count ?? 0,
          p2Count: ruleRevisionReport.summary?.p2Count ?? 0,
          p3Count: ruleRevisionReport.summary?.p3Count ?? 0,
          topTask: firstReportTask
            ? {
                taskId: firstReportTask.taskId || "",
                taskTitle: firstReportTask.taskTitle || "",
                priority: firstReportTask.priority || "",
                caseIds: firstReportTask.caseIds || [],
              }
            : null,
        }
      : null,
    nextStep: {
      label: "整理规则修订任务单",
      command: "npm run report:rule-revision-task-sheet",
      summary: "把本次写回暴露的输入准备摩擦点合并进规则修订任务单，保持人工复核边界。",
    },
  };
}

function buildKeyCaseRerunSection({
  formalWriteExport = null,
  keyCaseRerunPlan = null,
  keyCaseRerunReport = null,
  keyCaseRerunDiff = null,
} = {}) {
  const task = (formalWriteExport?.followUpTasks || []).find(
    (item) => item.taskType === "key-case-rerun",
  );
  const plannedCaseIds = keyCaseRerunPlan?.caseIds || keyCaseRerunReport?.plan?.caseIds || [];
  const formalWriteCandidateBatches = keyCaseRerunPlan?.formalWriteCandidateBatches || [];
  const completedCaseCount = keyCaseRerunReport?.summary?.rerunCaseCount ??
    keyCaseRerunReport?.summary?.caseCount ??
    keyCaseRerunReport?.results?.length ??
    0;
  const changedCaseCount = keyCaseRerunDiff?.summary?.changedCaseCount ??
    keyCaseRerunDiff?.changedCases?.length ??
    0;

  return {
    status: task ? "ready-for-rerun-plan" : "waiting-for-formal-write-task",
    label: task ? "关键样例复跑计划已生成" : "等待关键样例复跑任务",
    taskId: task?.taskId || "key-case-rerun-plan",
    taskType: normalizeTaskType(task?.taskType || "key-case-rerun"),
    summary:
      task?.summary ||
      "正式写回后应选择关键样例复跑，验证规则判断链路是否保持稳定。",
    evidence: Array.isArray(task?.evidence) ? task.evidence : [],
    plan: keyCaseRerunPlan
      ? {
          planId: keyCaseRerunPlan.planId || "",
          caseIds: plannedCaseIds,
          formalWriteCandidateBatches,
          downstreamRefreshTargets: keyCaseRerunPlan.downstreamRefreshTargets || [],
        }
      : null,
    latestRun: keyCaseRerunReport
      ? {
          status: keyCaseRerunReport.status || "available",
          completedCaseCount,
          changedCaseCount,
          planId: keyCaseRerunReport.plan?.planId || keyCaseRerunPlan?.planId || "",
        }
      : null,
    diff: keyCaseRerunDiff
      ? {
          changedCaseCount,
          summary: keyCaseRerunDiff.summary?.summary || keyCaseRerunDiff.summary || "",
        }
      : null,
    nextStep: {
      label: "生成关键样例复跑计划",
      command: "npm run generate:key-case-rerun-plan",
      summary: "将正式写回批次纳入关键样例复跑候选，验证写回结论对主链路的影响。",
    },
  };
}

export function buildFormalWriteFollowUpPlan({
  formalWriteExport = null,
  postExecutionAcceptance = null,
  piEngineExecutionPositionAudit = null,
  ruleRevisionReport = null,
  keyCaseRerunPlan = null,
  keyCaseRerunReport = null,
  keyCaseRerunDiff = null,
  outputPaths = {},
} = {}) {
  const acceptancePassed = postExecutionAcceptance?.status ===
    "formal-write-post-execution-acceptance-passed";
  const goalComplete = piEngineExecutionPositionAudit?.goalCompletion?.status === "complete";
  const ruleRevision = buildRuleRevisionSection({ formalWriteExport, ruleRevisionReport });
  const keyCaseRerun = buildKeyCaseRerunSection({
    formalWriteExport,
    keyCaseRerunPlan,
    keyCaseRerunReport,
    keyCaseRerunDiff,
  });
  const ok = Boolean(formalWriteExport?.exportId && acceptancePassed && goalComplete);

  return {
    ok,
    status: ok ? "formal-write-follow-up-plan-ready" : "formal-write-follow-up-plan-waiting",
    summary: ok
      ? "正式写回后承接计划已生成，规则修订任务单与关键样例复跑计划进入人工复核。"
      : "正式写回后承接计划等待正式写回、验收和 PI Engine 完成态证据。",
    source: {
      exportId: formalWriteExport?.exportId || "",
      targetPath: formalWriteExport?.targetPath || "",
      acceptanceStatus: postExecutionAcceptance?.status || "unknown",
      piEngineStatus: piEngineExecutionPositionAudit?.status || "unknown",
      goalCompletion: `${piEngineExecutionPositionAudit?.goalCompletion?.completedCount ?? 0} / ${
        piEngineExecutionPositionAudit?.goalCompletion?.totalCount ?? 0
      }`,
    },
    sections: {
      ruleRevision,
      keyCaseRerun,
    },
    commandChain: [
      "npm run report:rule-revision-task-sheet",
      "npm run generate:key-case-rerun-plan",
      "npm run rerun:key-cases",
      "npm run export:obsidian-key-case-rerun",
      "npm run export:obsidian-key-case-rerun-diff",
    ],
    nextAction: {
      actionId: "review-formal-write-follow-up-plan",
      label: "复核承接计划",
      summary: "先确认规则修订任务单，再执行关键样例复跑计划。",
    },
    outputPaths,
    safetyBoundary: "仅生成正式写回后承接计划，不自动修改规则，不自动执行复跑，不写入 Obsidian。",
  };
}

export function buildFormalWriteFollowUpPlanMarkdown(plan) {
  const lines = [
    "# 正式写回后承接计划",
    "",
    `- 状态码：${plan.status}`,
    `- 摘要：${plan.summary}`,
    `- 写回记录：${plan.source.exportId || "暂无"}`,
    `- 目标记录：${plan.source.targetPath || "暂无"}`,
    `- 写回后验收：${plan.source.acceptanceStatus}`,
    `- PI Engine 位点：${plan.source.piEngineStatus}`,
    `- 目标完成度：${plan.source.goalCompletion}`,
    `- 安全边界：${plan.safetyBoundary}`,
    "",
    "## 1. 规则修订任务单",
    "",
    `- 当前状态：${plan.sections.ruleRevision.label}`,
    `- 任务类型：${plan.sections.ruleRevision.taskType}`,
    `- 任务说明：${plan.sections.ruleRevision.summary}`,
    `- 下一步：${plan.sections.ruleRevision.nextStep.label}`,
    `- 命令：${plan.sections.ruleRevision.nextStep.command}`,
  ];

  if (plan.sections.ruleRevision.existingReport) {
    lines.push(
      `- 已有任务数：${plan.sections.ruleRevision.existingReport.taskCount}`,
      `- 来源样本数：${plan.sections.ruleRevision.existingReport.sourceSampleCount}`,
    );
    if (plan.sections.ruleRevision.existingReport.topTask) {
      lines.push(
        `- 优先任务：${plan.sections.ruleRevision.existingReport.topTask.taskTitle}`,
        `- 关联案例：${plan.sections.ruleRevision.existingReport.topTask.caseIds.join(" / ") || "暂无"}`,
      );
    }
  }

  lines.push(
    "",
    "## 2. 关键样例复跑计划",
    "",
    `- 当前状态：${plan.sections.keyCaseRerun.label}`,
    `- 任务类型：${plan.sections.keyCaseRerun.taskType}`,
    `- 任务说明：${plan.sections.keyCaseRerun.summary}`,
    `- 下一步：${plan.sections.keyCaseRerun.nextStep.label}`,
    `- 命令：${plan.sections.keyCaseRerun.nextStep.command}`,
  );

  if (plan.sections.keyCaseRerun.plan) {
    lines.push(
      `- 计划 ID：${plan.sections.keyCaseRerun.plan.planId || "暂无"}`,
      `- 候选案例：${plan.sections.keyCaseRerun.plan.caseIds.join(" / ") || "暂无"}`,
      `- 正式写回候选批次：${
        plan.sections.keyCaseRerun.plan.formalWriteCandidateBatches
          ?.map((item) => item.batchLabel)
          .join(" / ") || "暂无"
      }`,
      `- 下游刷新：${plan.sections.keyCaseRerun.plan.downstreamRefreshTargets.join(" / ") || "暂无"}`,
    );
  }

  if (plan.sections.keyCaseRerun.latestRun) {
    lines.push(
      `- 最近复跑：${plan.sections.keyCaseRerun.latestRun.planId || "暂无"}`,
      `- 已复跑案例数：${plan.sections.keyCaseRerun.latestRun.completedCaseCount}`,
      `- 差异案例数：${plan.sections.keyCaseRerun.latestRun.changedCaseCount}`,
    );
  }

  lines.push("", "## 3. 推荐命令链", "");
  plan.commandChain.forEach((command) => {
    lines.push(`- ${command}`);
  });

  lines.push(
    "",
    "## 4. 下一步",
    "",
    `- 推荐动作：${plan.nextAction.label}`,
    `- 动作说明：${plan.nextAction.summary}`,
  );

  return lines.join("\n");
}
