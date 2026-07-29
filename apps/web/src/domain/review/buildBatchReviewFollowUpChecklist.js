function buildChecklistItem(label, actionId = "", actionLabel = "") {
  if (!label) {
    return null;
  }

  return {
    label,
    actionId,
    actionLabel,
  };
}

function buildPhaseItems({
  label,
  items,
}) {
  return {
    label,
    items: (items || []).filter(Boolean),
  };
}

export function buildBatchReviewFollowUpChecklist(report = {}) {
  const priorityRows = report.priorityRows || [];
  const topRow = priorityRows[0] || null;
  const readyForUi =
    report.uiReadiness?.readinessLevel === "ready" &&
    report.coverageTrend?.status === "stabilizing";

  const phases = [
    buildPhaseItems({
      label: "先确认这轮复盘材料",
      items: [
        buildChecklistItem(
          "先回看跨批次摩擦点汇总，确认重复摩擦点有没有变化。",
          "preview-batch-run-friction-summary",
          "生成跨批次摩擦点预览",
        ),
        buildChecklistItem(
          "再回看 UI 优化进入条件报告，确认这轮到底是不是还不该进入 UI 讨论。",
          "preview-ui-optimization-readiness",
          "生成 UI 就绪度预览",
        ),
      ],
    }),
    buildPhaseItems({
      label: topRow ? "先补当前最关键缺口" : "继续补真实复盘样本",
      items: topRow
        ? [
            buildChecklistItem(
              `${topRow.batchLabel} 是当前优先级最高的批次，先处理：${topRow.urgencyLabel}。`,
              "preview-real-case-batch-run-record",
              "生成批次试跑记录",
            ),
            topRow.missingFieldLabels.length
              ? buildChecklistItem(
                  `先补这批的关键字段：${topRow.missingFieldLabels.join(" / ")}。`,
                  "preview-real-case-batch-run-record",
                  "回到批次试跑记录区",
                )
              : "",
            topRow.topCategoryLabels.length
              ? buildChecklistItem(
                  `补字段时重点回看这些摩擦点：${topRow.topCategoryLabels.join(" / ")}。`,
                  "preview-batch-run-friction-summary",
                  "对照跨批次摩擦点",
                )
              : "",
          ]
        : [
            buildChecklistItem("当前没有明显待补批次，继续新增真实试跑记录，避免只围绕旧样本做判断。"),
            buildChecklistItem("优先补能够代表真实使用路径的新批次，而不是继续堆零散备注。"),
          ],
    }),
    buildPhaseItems({
      label: "补完后立刻重跑复盘判断",
      items: [
        buildChecklistItem(
          "补完人工关键字段后，重新生成跨批次摩擦点汇总，确认重复信号有没有变化。",
          "preview-batch-run-friction-summary",
          "重跑跨批次摩擦点",
        ),
        buildChecklistItem(
          "再重新生成 UI 优化进入条件报告和批次复盘看板，检查完整覆盖批次数有没有增长。",
          "preview-ui-and-dashboard",
          "重跑 UI 报告和复盘看板",
        ),
      ],
    }),
    buildPhaseItems({
      label: readyForUi ? "进入 UI 讨论前的收口动作" : "暂不进入 UI 讨论",
      items: readyForUi
        ? [
            buildChecklistItem(
              "优先整理最该前置模块、结果区问题和高频路径，再开 UI 优化专题。",
              "export-batch-review-suite",
              "一键导出复盘套件",
            ),
            buildChecklistItem("将重复摩擦点整理为规则修订任务单，作为规则引擎下一轮调整依据。"),
            buildChecklistItem("从完整人工复盘批次中选择关键样例，进入规则调整后的复跑计划。"),
            buildChecklistItem("UI 讨论时只优先参考已完整覆盖人工结论的批次，不让零散样本主导方案。"),
          ]
        : [
            buildChecklistItem(
              `当前 UI 时机判断仍是：${report.uiReadiness?.readinessLabel || "暂不建议进入 UI 讨论"}。`,
              "preview-ui-optimization-readiness",
              "回看 UI 时机判断",
            ),
            buildChecklistItem("在新增完整人工复盘批次前，不优先做大规模视觉改版，先让判断证据继续增长。"),
          ],
    }),
  ].filter((phase) => phase.items.length);

  return {
    title: "复盘后操作清单",
    focusLabel: topRow ? `${topRow.batchLabel} 优先` : "继续补样本",
    readyForUi,
    phases,
  };
}
