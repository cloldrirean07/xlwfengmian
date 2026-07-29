function resolveReadinessLevel(summary, crossBatchSignalStatus = "") {
  const conditions = [
    summary.batchRunRecordBatchCount >= 2,
    summary.batchFillWorksheetBatchCount >= 2,
    summary.batchFillReadbackConfirmedCount >= 2,
    summary.batchRunReadbackConfirmedCount >= 1,
    summary.manualReviewFullyCoveredBatchCount >= 1,
  ];
  const passedCount = conditions.filter(Boolean).length;

  if (passedCount >= 5 && crossBatchSignalStatus === "strong-signal") {
    return "ready";
  }

  if (passedCount >= 3 && crossBatchSignalStatus !== "insufficient-signal") {
    return "near-ready";
  }

  return "not-ready";
}

function buildNextActions(summary, readinessLevel, crossBatchSignal) {
  if (readinessLevel === "ready") {
    return [
      "开始整理 2-3 批真实案例中重复出现的 UI 摩擦点。",
      "按信息结构、交互路径、视觉层三层拆开讨论 UI 优化。",
      "优先收敛最该前置的模块和最适合合并的区块。",
      "把已完整覆盖的人工结论批次单独抽出来，作为 UI 方案优先输入。",
    ];
  }

  if (readinessLevel === "near-ready") {
    return [
      "至少再补 1 批真实案例试跑记录。",
      "确认每批至少有一份可读回的批量工作单导出。",
      `重点盯住跨批次重复出现的摩擦点：${crossBatchSignal?.topRepeatedCategoryLabel || "待补充"}`,
      "把最卡步骤写成一句结论，后续 UI 讨论时直接使用。",
      "至少补齐 1 批关键人工判断字段，再重新生成 UI 就绪报告。",
    ];
  }

  return [
    "先继续跑真实批次，不优先做大规模 UI 优化。",
    "优先补齐批量工作单和试跑记录的真实使用样本。",
    "先让跨批次重复摩擦点更稳定，再重新生成 UI 就绪报告。",
    "先让至少 1 批人工关键字段补完整，再讨论 UI 是否真的到时机。",
    "等至少 2 批真实案例跑通后，再重新生成 UI 就绪报告。",
  ];
}

function buildRisks(summary, crossBatchSignal) {
  const risks = [];

  if (summary.batchRunRecordBatchCount < 2) {
    risks.push("真实批次试跑记录数量还不够，UI 讨论容易脱离真实使用。");
  }

  if (summary.batchFillReadbackConfirmedCount < 2) {
    risks.push("批量工作单导出读回确认样本不足，工作流稳定性证据偏弱。");
  }

  if (summary.batchRunReadbackConfirmedCount < 1) {
    risks.push("批次试跑记录导出还缺少稳定样本，复盘链路证据不完整。");
  }

  if (summary.manualReviewReviewedBatchCount < 1) {
    risks.push("虽然已有试跑记录，但还没有人工复盘结论，UI 讨论缺少主观最卡点证据。");
  }

  if (summary.manualReviewFullyCoveredBatchCount < 1) {
    risks.push("人工关键判断字段还没有至少一批补完整，当前更像零散观察，UI 讨论容易判断失真。");
  }

  if (crossBatchSignal?.status === "insufficient-signal") {
    risks.push("跨批次重复摩擦点还不够明显，当前更像单批次现象，UI 讨论容易被偶然样本带偏。");
  }

  return risks;
}

export function buildUiOptimizationReadinessReport({
  batchFillWorksheetStatuses,
  batchRunRecordStatuses,
  crossBatchFrictionSummary = null,
}) {
  const fillStatuses = batchFillWorksheetStatuses || [];
  const runStatuses = batchRunRecordStatuses || [];

  const summary = {
    batchFillWorksheetBatchCount: fillStatuses.length,
    batchFillReadbackConfirmedCount: fillStatuses.filter((item) => item.readbackOk).length,
    batchRunRecordBatchCount: runStatuses.length,
    batchRunReadbackConfirmedCount: runStatuses.filter((item) => item.readbackOk).length,
    manualReviewReviewedBatchCount: Number(
      crossBatchFrictionSummary?.summary?.reviewedBatchCount || 0,
    ),
    manualReviewMissingBatchCount: Number(
      crossBatchFrictionSummary?.summary?.missingManualReviewCount || 0,
    ),
    manualReviewFullyCoveredBatchCount: Number(
      crossBatchFrictionSummary?.summary?.fullyCoveredBatchCount || 0,
    ),
    manualReviewPartiallyCoveredBatchCount: Number(
      crossBatchFrictionSummary?.summary?.partiallyCoveredBatchCount || 0,
    ),
  };

  const crossBatchSignal = {
    status: crossBatchFrictionSummary?.uiDiscussionSignal?.status || "insufficient-signal",
    label: crossBatchFrictionSummary?.uiDiscussionSignal?.label || "暂不建议正式讨论 UI 优化",
    reason: crossBatchFrictionSummary?.uiDiscussionSignal?.reason || "当前还没有足够的跨批次重复摩擦点证据。",
    repeatedCategories: Number(crossBatchFrictionSummary?.summary?.repeatedCategories || 0),
    totalBatches: Number(crossBatchFrictionSummary?.summary?.totalBatches || 0),
    topRepeatedCategoryLabel: crossBatchFrictionSummary?.topCategories?.[0]?.label || "",
  };
  const readinessLevel = resolveReadinessLevel(summary, crossBatchSignal.status);

  return {
    summary,
    crossBatchSignal,
    readinessLevel,
    readinessLabel:
      readinessLevel === "ready"
        ? "可以进入 UI 讨论"
        : readinessLevel === "near-ready"
          ? "接近可以进入 UI 讨论"
          : "暂不建议进入 UI 讨论",
    passedChecks: [
      {
        label: "至少 2 批批量工作单导出",
        passed: summary.batchFillWorksheetBatchCount >= 2,
      },
      {
        label: "至少 2 批批量工作单读回确认",
        passed: summary.batchFillReadbackConfirmedCount >= 2,
      },
      {
        label: "至少 2 批真实批次试跑记录",
        passed: summary.batchRunRecordBatchCount >= 2,
      },
      {
        label: "至少 1 批试跑记录读回确认",
        passed: summary.batchRunReadbackConfirmedCount >= 1,
      },
      {
        label: "至少 1 批关键人工判断字段补完整",
        passed: summary.manualReviewFullyCoveredBatchCount >= 1,
      },
      {
        label: "跨批次重复摩擦点信号至少达到 emerging-signal",
        passed: crossBatchSignal.status !== "insufficient-signal",
      },
    ],
    risks: buildRisks(summary, crossBatchSignal),
    nextActions: buildNextActions(summary, readinessLevel, crossBatchSignal),
    evidence: {
      batchFillWorksheetStatuses: fillStatuses,
      batchRunRecordStatuses: runStatuses,
      crossBatchFrictionSummary,
    },
  };
}
