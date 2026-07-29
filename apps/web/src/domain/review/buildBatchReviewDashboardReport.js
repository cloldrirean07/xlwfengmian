import { buildBatchReviewFollowUpChecklist } from "./buildBatchReviewFollowUpChecklist.js";
import { buildBatchReviewManualTaskCard } from "./buildBatchReviewManualTaskCard.js";
import { buildUiOptimizationRecheckPlan } from "./buildUiOptimizationRecheckPlan.js";

function buildPriorityRows(crossBatchReport) {
  const pendingRows = crossBatchReport?.manualReview?.pendingBatchRows || [];
  const batchRows = crossBatchReport?.batchRows || [];

  return pendingRows.map((item, index) => {
    const batchRow = batchRows.find((row) => row.batchLabel === item.batchLabel);
    return {
      rank: index + 1,
      batchLabel: item.batchLabel,
      urgencyLabel: item.hasManualConclusion ? "补齐关键判断" : "先补人工结论",
      missingFieldLabels: item.missingKeyFields.map((field) => field.label),
      missingKeyFields: item.missingKeyFields || [],
      createdCount: Number(batchRow?.createdCount || 0),
      topCategoryLabels: batchRow?.topCategoryLabels || [],
      topActionLabels: batchRow?.topActionLabels || [],
      hasManualConclusion: item.hasManualConclusion,
    };
  });
}

function buildCoverageTrend(summary = {}) {
  const reviewedBatchCount = Number(summary.reviewedBatchCount || 0);
  const fullyCoveredBatchCount = Number(summary.fullyCoveredBatchCount || 0);
  const partiallyCoveredBatchCount = Number(summary.partiallyCoveredBatchCount || 0);
  const missingManualReviewCount = Number(summary.missingManualReviewCount || 0);

  if (fullyCoveredBatchCount >= 2) {
    return {
      status: "stabilizing",
      label: "人工复盘开始稳定",
      reason: "已经有至少 2 批关键人工判断字段补完整，后续 UI 判断更适合作为专题讨论输入。",
    };
  }

  if (fullyCoveredBatchCount >= 1 && reviewedBatchCount >= 2) {
    return {
      status: "emerging",
      label: "人工复盘开始成形",
      reason: "已经出现至少 1 批完整人工复盘，但还有批次停留在半填状态，下一步更适合先补齐缺口。",
    };
  }

  if (partiallyCoveredBatchCount >= 1 || missingManualReviewCount >= 1) {
    return {
      status: "fragmented",
      label: "人工复盘仍然零散",
      reason: "当前更多是零散观察或半填状态，先补齐关键人工字段比提前讨论 UI 更重要。",
    };
  }

  return {
    status: "not-started",
    label: "人工复盘还没形成信号",
    reason: "当前还没有足够的人工复盘样本，先让真实试跑结论开始积累。",
  };
}

function buildNextActions(crossBatchReport, uiReadinessReport, coverageTrend) {
  const pendingRows = crossBatchReport?.manualReview?.pendingBatchRows || [];

  if (uiReadinessReport?.readinessLevel === "ready" && coverageTrend.status === "stabilizing") {
    return [
      "开始整理最该前置模块和结果区问题，准备进入 UI 交互层优化讨论。",
      "把已完整覆盖的人工复盘批次作为 UI 方案的一手输入，不优先看零散批次。",
      "继续保留跨批次复盘节奏，避免 UI 方案脱离新增样本。",
    ];
  }

  if (pendingRows.length) {
    const topRow = pendingRows[0];
    return [
      `先补 ${topRow.batchLabel} 这一批：${topRow.hasManualConclusion ? `还缺 ${topRow.missingKeyFields.map((field) => field.label).join(" / ")}` : "整批人工结论还没写"}`,
      "补完后重新生成跨批次摩擦点汇总，确认关键人工字段完整覆盖批次有没有增长。",
      "等至少 1 批人工关键字段补完整后，再重新看 UI 就绪度报告。",
    ];
  }

  return [
    "继续补充真实试跑批次，让人工复盘完整覆盖批次继续增长。",
    "在复盘继续增长前，不优先启动大规模 UI 改版。",
  ];
}

function buildRuleRevisionSignal(ruleRevisionReport) {
  const summary = ruleRevisionReport?.summary || {};
  const tasks = ruleRevisionReport?.tasks || [];
  const topTasks = tasks.slice(0, 3);
  const taskCount = Number(summary.taskCount || tasks.length || 0);

  if (!taskCount) {
    return {
      status: "no-rule-task",
      label: "暂无规则修订任务",
      taskCount: 0,
      sourceSampleCount: Number(summary.sourceSampleCount || 0),
      prioritySummary: "P1 0 / P2 0 / P3 0",
      topTasks: [],
    };
  }

  return {
    status: "has-rule-task",
    label: "已有规则修订任务",
    taskCount,
    sourceSampleCount: Number(summary.sourceSampleCount || 0),
    prioritySummary: `P1 ${Number(summary.p1Count || 0)} / P2 ${Number(summary.p2Count || 0)} / P3 ${Number(summary.p3Count || 0)}`,
    topTasks,
  };
}

function buildKeyCaseRerunHandoff(ruleRevisionSignal, keyCaseRerunReport, keyCaseRerunDiffReport) {
  const candidateCaseIds = [
    ...new Set(
      (ruleRevisionSignal.topTasks || [])
        .flatMap((task) => task.caseIds || [])
        .filter(Boolean),
    ),
  ];
  const rerunSummary = keyCaseRerunReport?.summary || {};
  const rerunDiffSummary = keyCaseRerunDiffReport?.summary || {};
  const rerunCaseIds = keyCaseRerunReport?.meta?.caseIds || keyCaseRerunReport?.rows?.map((row) => row.caseId) || [];

  if (Number(rerunSummary.rerunCaseCount || 0) > 0) {
    return {
      status: "rerun-complete",
      label: "关键样例复跑已完成",
      candidateCaseIds: candidateCaseIds.length ? candidateCaseIds : rerunCaseIds,
      summary: `已完成 ${Number(rerunSummary.rerunCaseCount || 0)} 个关键样例复跑，差异样例 ${Number(rerunDiffSummary.changedCaseCount || 0)} 个，下游变化 ${Number(rerunDiffSummary.downstreamChangedCount || 0)} 项。`,
      commandSequence: [
        "npm run generate:key-case-rerun-plan",
        "npm run export:obsidian-key-case-rerun-plan",
        "npm run rerun:key-cases",
        "npm run export:obsidian-key-case-rerun",
        "npm run export:obsidian-key-case-rerun-diff",
      ],
      downstreamRefreshTargets:
        keyCaseRerunReport?.meta?.downstreamRefreshTargets || [
          "reviewed-misclassified",
          "rule-revision-task-sheet",
        ],
      latestRun: {
        planId: keyCaseRerunReport?.meta?.planId || "unknown",
        generatedAt: keyCaseRerunReport?.meta?.generatedAt || "",
        rerunCaseCount: Number(rerunSummary.rerunCaseCount || 0),
        changedCaseCount: Number(rerunDiffSummary.changedCaseCount || 0),
        downstreamChangedCount: Number(rerunDiffSummary.downstreamChangedCount || 0),
      },
    };
  }

  if (!ruleRevisionSignal.taskCount) {
    return {
      status: "awaiting-rule-task",
      label: "等待规则任务后再安排复跑",
      candidateCaseIds: [],
      summary: "当前还没有规则修订任务，关键样例复跑先保持待命。",
      commandSequence: [],
      downstreamRefreshTargets: [],
    };
  }

  return {
    status: "ready-to-plan",
    label: "可生成关键样例复跑计划",
    candidateCaseIds,
    summary:
      "规则修订任务已形成，可优先用关联样本生成复跑计划，并在复跑后刷新误判样本和规则修订任务单。",
    commandSequence: [
      "npm run generate:key-case-rerun-plan",
      "npm run export:obsidian-key-case-rerun-plan",
      "npm run rerun:key-cases",
      "npm run export:obsidian-key-case-rerun",
      "npm run export:obsidian-key-case-rerun-diff",
    ],
    downstreamRefreshTargets: ["reviewed-misclassified", "rule-revision-task-sheet"],
  };
}

function buildManualReviewTaskHandoff(manualReviewTaskCard, latestManualTaskCardStatus) {
  if (!manualReviewTaskCard?.targetBatchLabel) {
    return {
      status: "no-manual-task",
      label: "暂无人工复盘待补任务",
      targetBatchLabel: "",
      exportedAt: "",
      targetPath: "",
      filledFieldCount: 0,
      readbackOk: false,
      summary: "当前没有需要优先处理的人工复盘待补任务。",
    };
  }

  const sameTarget =
    latestManualTaskCardStatus?.targetBatchLabel === manualReviewTaskCard.targetBatchLabel;

  if (sameTarget && latestManualTaskCardStatus?.hasManualInput) {
    return {
      status: "manual-input-detected",
      label: "人工复盘草稿已有填写",
      targetBatchLabel: manualReviewTaskCard.targetBatchLabel,
      exportedAt: latestManualTaskCardStatus.exportedAt || "",
      targetPath: latestManualTaskCardStatus.targetPath || "",
      filledFieldCount: Number(latestManualTaskCardStatus.filledFieldCount || 0),
      readbackOk: Boolean(latestManualTaskCardStatus.readbackOk),
      summary: "人工复盘待补任务已有填写内容，可继续生成回流预览。",
    };
  }

  if (sameTarget && latestManualTaskCardStatus?.targetPath) {
    return {
      status: "draft-exported",
      label: "人工复盘草稿已导出",
      targetBatchLabel: manualReviewTaskCard.targetBatchLabel,
      exportedAt: latestManualTaskCardStatus.exportedAt || "",
      targetPath: latestManualTaskCardStatus.targetPath || "",
      filledFieldCount: 0,
      readbackOk: Boolean(latestManualTaskCardStatus.readbackOk),
      summary: "人工复盘待补任务已导出，等待补齐字段后再生成回流预览。",
    };
  }

  return {
    status: "ready-to-export",
    label: "可导出人工复盘草稿",
    targetBatchLabel: manualReviewTaskCard.targetBatchLabel,
    exportedAt: "",
    targetPath: "",
    filledFieldCount: 0,
    readbackOk: false,
    summary: "当前批次仍缺人工复盘字段，可先导出待补任务草稿。",
  };
}

function buildFormalWriteGate(latestManualSafeWriteStatus) {
  if (!latestManualSafeWriteStatus?.targetPath) {
    return {
      status: "safe-preview-missing",
      label: "安全写回预览待生成",
      targetBatchLabel: "",
      targetPath: "",
      patchSourceLabel: "暂无",
      readbackOk: false,
      matchedExpectedContent: false,
      manualReviewConclusionStatus: "待补",
      formalWritePermission: "待生成安全预览",
      confirmationChecklist: [
        {
          label: "生成安全写回预览",
          status: "current",
          detail: "先导出安全写回预览，并完成读回一致性确认。",
        },
      ],
      summary: "当前还没有可读回的安全写回预览，正式写回保持关闭。",
    };
  }

  const parsed = latestManualSafeWriteStatus.parsed?.parsed || {};
  const manualReviewConclusion = String(
    latestManualSafeWriteStatus.manualReviewConclusion ||
      latestManualSafeWriteStatus.parsed?.manualReviewConclusion ||
      "",
  ).trim();
  const confirmedLines = String(parsed.confirmedLines || "").trim();
  const stillNeedsEdit = String(parsed.stillNeedsEdit || "").trim();
  const readyDecision = String(parsed.readyDecision || "").trim();
  const readbackOk = Boolean(latestManualSafeWriteStatus.readbackOk);
  const matchedExpectedContent = Boolean(latestManualSafeWriteStatus.matchedExpectedContent);
  const canProceedToFormalWrite = Boolean(latestManualSafeWriteStatus.canProceedToFormalWrite);
  const confirmationChecklist = [
    {
      label: "安全写回预览读回",
      status: readbackOk && matchedExpectedContent ? "done" : "current",
      detail: readbackOk && matchedExpectedContent
        ? "安全写回预览已完成读回一致性确认。"
        : "需要重新生成安全写回预览，并确认读回内容一致。",
    },
    {
      label: "人工复盘结论",
      status: manualReviewConclusion ? "done" : "current",
      detail: manualReviewConclusion
        ? "人工复盘结论已填写。"
        : "在安全写回预览底部补一句本轮人工复盘结论。",
    },
    {
      label: "确认可写回字段",
      status: confirmedLines ? "done" : "pending",
      detail: confirmedLines
        ? `已确认字段：${confirmedLines}`
        : "填写可正式写回的字段，例如：最卡环节 / 前置模块。",
    },
    {
      label: "仍需手改字段",
      status: stillNeedsEdit ? "blocked" : "done",
      detail: stillNeedsEdit
        ? `仍需手改：${stillNeedsEdit}`
        : "当前未声明仍需手改字段。",
    },
    {
      label: "进入正式写回确认",
      status: canProceedToFormalWrite ? "done" : "pending",
      detail: readyDecision
        ? `当前确认：${readyDecision}`
        : "确认无误后，将“是否已经可以进入正式写回”填写为“可以”。",
    },
  ];

  if (!readbackOk || !matchedExpectedContent) {
    return {
      status: "safe-preview-readback-mismatch",
      label: "安全预览读回待确认",
      targetBatchLabel: latestManualSafeWriteStatus.targetBatchLabel || "",
      targetPath: latestManualSafeWriteStatus.targetPath || "",
      patchSourceLabel:
        latestManualSafeWriteStatus.patchSourceLabel ||
        latestManualSafeWriteStatus.parsed?.patchSourceLabel ||
        "暂无",
      readbackOk,
      matchedExpectedContent,
      manualReviewConclusionStatus: manualReviewConclusion ? "已填写" : "待补",
      formalWritePermission: "待复查安全预览",
      confirmationChecklist,
      summary: "最近一份安全写回预览未完成读回一致性确认，请重新生成写回预览并确认内容。",
    };
  }

  return {
    status: canProceedToFormalWrite
      ? "ready-for-formal-write"
      : "awaiting-safe-write-confirmation",
    label: canProceedToFormalWrite ? "可进入正式写回" : "先补安全写回确认",
    targetBatchLabel: latestManualSafeWriteStatus.targetBatchLabel || "",
    targetPath: latestManualSafeWriteStatus.targetPath || "",
    patchSourceLabel:
      latestManualSafeWriteStatus.patchSourceLabel ||
      latestManualSafeWriteStatus.parsed?.patchSourceLabel ||
      "暂无",
    readbackOk,
    matchedExpectedContent,
    manualReviewConclusionStatus: manualReviewConclusion ? "已填写" : "待补",
    formalWritePermission: canProceedToFormalWrite ? "可进入正式写回" : "待人工确认",
    confirmationChecklist,
    summary: canProceedToFormalWrite
      ? "安全写回预览已完成确认，可进入真实批次试跑记录正式写回。"
      : "安全写回预览已读回，但人工复盘结论或写回确认仍未补齐。",
  };
}

export function buildBatchReviewDashboardReport({
  crossBatchReport = null,
  uiReadinessReport = null,
  ruleRevisionReport = null,
  keyCaseRerunReport = null,
  keyCaseRerunDiffReport = null,
  latestManualTaskCardStatus = null,
  latestManualSafeWriteStatus = null,
}) {
  const summary = crossBatchReport?.summary || {};
  const coverageTrend = buildCoverageTrend(summary);
  const priorityRows = buildPriorityRows(crossBatchReport);
  const uiReadiness = {
    readinessLevel: uiReadinessReport?.readinessLevel || "not-ready",
    readinessLabel: uiReadinessReport?.readinessLabel || "暂不建议进入 UI 讨论",
  };
  const ruleRevisionSignal = buildRuleRevisionSignal(ruleRevisionReport);
  const manualReviewTaskCard = buildBatchReviewManualTaskCard(priorityRows);

  return {
    summary: {
      totalBatches: Number(summary.totalBatches || 0),
      reviewedBatchCount: Number(summary.reviewedBatchCount || 0),
      fullyCoveredBatchCount: Number(summary.fullyCoveredBatchCount || 0),
      partiallyCoveredBatchCount: Number(summary.partiallyCoveredBatchCount || 0),
      missingManualReviewCount: Number(summary.missingManualReviewCount || 0),
      repeatedCategories: Number(summary.repeatedCategories || 0),
    },
    crossBatchSignal: {
      status: crossBatchReport?.uiDiscussionSignal?.status || "insufficient-signal",
      label: crossBatchReport?.uiDiscussionSignal?.label || "暂不建议正式讨论 UI 优化",
      reason: crossBatchReport?.uiDiscussionSignal?.reason || "当前还没有足够的跨批次信号。",
    },
    uiReadiness,
    ruleRevisionSignal,
    keyCaseRerunHandoff: buildKeyCaseRerunHandoff(
      ruleRevisionSignal,
      keyCaseRerunReport,
      keyCaseRerunDiffReport,
    ),
    coverageTrend,
    priorityRows,
    manualReviewTaskCard,
    manualReviewTaskHandoff: buildManualReviewTaskHandoff(
      manualReviewTaskCard,
      latestManualTaskCardStatus,
    ),
    formalWriteGate: buildFormalWriteGate(latestManualSafeWriteStatus),
    uiRecheckPlan: buildUiOptimizationRecheckPlan({
      priorityRows,
      uiReadiness,
      coverageTrend,
      crossBatchSignal: {
        status: crossBatchReport?.uiDiscussionSignal?.status || "insufficient-signal",
        label: crossBatchReport?.uiDiscussionSignal?.label || "暂不建议正式讨论 UI 优化",
      },
    }),
    nextActions: buildNextActions(crossBatchReport, uiReadinessReport, coverageTrend),
    followUpChecklist: buildBatchReviewFollowUpChecklist({
      uiReadiness,
      coverageTrend,
      priorityRows,
    }),
  };
}
