function buildStep(label, status, note = "") {
  return {
    label,
    status,
    note,
  };
}

export function buildUiOptimizationRecheckPlan({
  priorityRows = [],
  uiReadiness = {},
  coverageTrend = {},
  crossBatchSignal = {},
} = {}) {
  const topRow = priorityRows[0] || null;
  const readyForUi =
    uiReadiness.readinessLevel === "ready" &&
    coverageTrend.status === "stabilizing";

  if (readyForUi) {
    return {
      title: "人工复盘补齐后的再判断链路",
      status: "ready-for-ui",
      statusLabel: "可进入首页系统 UI 讨论",
      summary:
        "UI readiness 和人工复盘覆盖趋势都已经达标，下一步应该基于完整人工结论，进入首页主链路 UI 讨论。",
      blockers: [],
      steps: [
        buildStep("整理已完整覆盖批次的最卡环节、最该前置模块和 UI 时机判断。", "done"),
        buildStep(
          "优先围绕首页主链路开 UI 讨论，不先扩散到整站统一视觉改版。",
          "current",
          "先讨论输入区、结果区、下一步工作区这三段主链路。",
        ),
        buildStep(
          "继续保留跨批次复盘节奏，让后续新增样本可以反过来校正 UI 方案。",
          "upcoming",
        ),
      ],
    };
  }

  if (topRow) {
    const missingFields = topRow.missingFieldLabels.join(" / ") || "关键人工字段";
    return {
      title: "人工复盘补齐后的再判断链路",
      status: "awaiting-manual-fill",
      statusLabel: "先补人工复盘，再重跑判断",
      summary:
        "当前最关键的前置动作仍然是补齐人工复盘字段。只有先把人真实卡点写清楚，再重跑 UI readiness，后续 UI 讨论才不会偏成审美猜测。",
      blockers: [
        `${topRow.batchLabel} 仍缺：${missingFields}`,
        `当前 UI readiness 还是：${uiReadiness.readinessLabel || "暂不建议进入 UI 讨论"}`,
        `当前人工复盘趋势还是：${coverageTrend.label || "人工复盘仍然不足"}`,
      ],
      steps: [
        buildStep(
          `先补 ${topRow.batchLabel} 的人工复盘字段：${missingFields}。`,
          "current",
          `这批当前最强摩擦点：${topRow.topCategoryLabels.join(" / ") || "待补"}`,
        ),
        buildStep(
          "补完后重新生成跨批次摩擦点汇总，确认重复信号是否更稳定。",
          "upcoming",
          `当前跨批次信号：${crossBatchSignal.label || "待补"}`,
        ),
        buildStep(
          "再重新生成 UI readiness 和批次复盘看板，确认完整覆盖批次数有没有增长。",
          "upcoming",
        ),
        buildStep(
          "只有当人工复盘开始稳定后，再进入首页系统 UI 讨论。",
          "upcoming",
        ),
      ],
    };
  }

  return {
    title: "人工复盘补齐后的再判断链路",
    status: "grow-more-evidence",
    statusLabel: "继续补样本并积累人工复盘",
    summary:
      "当前还没有明确的待补优先批次，但人工复盘和 UI readiness 仍未形成足够稳定的信号。下一步更适合继续补真实样本，而不是提前开大规模 UI 改版。",
    blockers: [
      `当前 UI readiness：${uiReadiness.readinessLabel || "暂不建议进入 UI 讨论"}`,
      `当前人工复盘趋势：${coverageTrend.label || "人工复盘仍然不足"}`,
    ],
    steps: [
      buildStep("继续新增真实试跑批次，并保持每批都有可读回的试跑记录。", "current"),
      buildStep("优先让至少 1 批人工关键字段补完整，而不是继续堆零散备注。", "upcoming"),
      buildStep("再重新生成跨批次摩擦点汇总、UI readiness 和复盘看板。", "upcoming"),
    ],
  };
}
