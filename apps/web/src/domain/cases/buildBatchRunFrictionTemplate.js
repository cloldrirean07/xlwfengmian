function countTopMissingFieldRows(rows = [], minimumMissingCount = 3) {
  return rows.filter((row) => Number(row.missingCount || 0) >= minimumMissingCount).length;
}

function buildCategory({
  id,
  label,
  whyItMatters,
  priorityReason,
  priorityScore,
  prompts,
  signals,
}) {
  return {
    id,
    label,
    whyItMatters,
    priorityReason,
    priorityScore,
    prompts,
    signals,
  };
}

export function buildBatchRunFrictionTemplate({
  validationSummary,
  latestWorksheetHistory,
}) {
  const rows = validationSummary?.rows || [];
  const topMissingFieldRows = countTopMissingFieldRows(rows);
  const averageMissing = Number(validationSummary?.summary?.avgMissingFields || 0);
  const totalMissingFields = Number(validationSummary?.summary?.totalMissingFields || 0);
  const recommendedActions = validationSummary?.recommendedBatchActions || [];
  const latestExportStatus = latestWorksheetHistory?.latestExportStatus || null;

  const categories = [
    buildCategory({
      id: "input-structure",
      label: "输入准备与案例结构",
      whyItMatters: "如果一开始输入就不稳定，后面的工作单、结果判断和 UI 讨论都会被噪音带偏。",
      priorityReason:
        totalMissingFields > 0
          ? `当前这批还有 ${totalMissingFields} 个缺失字段，先判断是不是输入结构本身太重或太散。`
          : "当前结构缺口不算重，但仍建议确认输入是否清楚、是否容易复用。",
      priorityScore: totalMissingFields > 0 ? 95 : 60,
      prompts: [
        "用户准备这一批案例输入时，最容易卡在哪一步？",
        "哪些字段其实用户不容易一次性想清楚？",
        "现在的输入结构里，哪一项最像“为了完整而完整”？",
      ],
      signals: [
        `平均每条缺失字段：${averageMissing}`,
        `缺失字段总数：${totalMissingFields}`,
        `缺失 3 项及以上的案例数：${topMissingFieldRows}`,
      ],
    }),
    buildCategory({
      id: "guidance-and-prioritization",
      label: "补写建议与优先顺序",
      whyItMatters: "如果系统给的“先补什么”不清楚，用户会觉得产品只是把问题重新抛回给他。",
      priorityReason: recommendedActions.length
        ? `当前已有 ${recommendedActions.length} 条批量推荐动作，需要验证这些动作是否真的帮助用户少想一步。`
        : "当前推荐动作还不明显，更要确认系统有没有真正给出下一步。",
      priorityScore: recommendedActions.length ? 90 : 70,
      prompts: [
        "你看到“建议先补什么”时，是否能立即理解并开始行动？",
        "哪些建议像真正帮你省脑力，哪些只是换一种说法复述问题？",
        "有没有哪一步更适合直接给模板或结果，而不是只给建议？",
      ],
      signals: [
        `推荐动作数：${recommendedActions.length}`,
        `最高优先动作：${recommendedActions[0]?.label || "暂无"}`,
        `最高优先动作原因：${recommendedActions[0]?.priorityReason || "待补"}`,
      ],
    }),
    buildCategory({
      id: "result-reading",
      label: "结果阅读与选择判断",
      whyItMatters: "如果用户看完结果还是不知道该先做什么，问题常常不在规则本身，而在结果组织方式。",
      priorityReason:
        rows.length > 0
          ? `当前这批共有 ${rows.length} 条案例，需要确认逐条结果是否容易扫描、容易选下一步。`
          : "当前结果量不大，但仍要判断结果区是否真的帮助用户快速做决定。",
      priorityScore: rows.length >= 3 ? 82 : 68,
      prompts: [
        "你看到逐条案例结果时，第一眼能不能知道哪条先做？",
        "现在的结果是更像“报告”，还是更像“可执行工作区”？",
        "有没有哪些说明其实可以折叠、合并或后置？",
      ],
      signals: [
        `案例条数：${rows.length}`,
        `可进入手动验证：${validationSummary?.summary?.readyCount || 0}`,
        `部分回填：${validationSummary?.summary?.partialCount || 0}`,
      ],
    }),
    buildCategory({
      id: "export-and-handoff",
      label: "导出沉淀与后续接力",
      whyItMatters: "如果导出后不能直接继续补写或复盘，整条链路就会断在最后一步。",
      priorityReason: latestExportStatus
        ? `最近一次工作单导出${latestExportStatus.readbackOk ? "已完成读回确认" : "还未读回确认"}，需要验证导出后的文档是否真能继续用。`
        : "当前还没有稳定导出记录，这会影响真实试跑闭环的可信度。",
      priorityScore: latestExportStatus?.readbackOk ? 55 : 88,
      prompts: [
        "导出后的文档，你是否愿意继续在里面补？",
        "导出结果更像“存档”，还是更像“下一步工作面板”？",
        "如果要把这份结果发给别人协作，哪里还不够清楚？",
      ],
      signals: [
        `最近导出动作：${latestExportStatus?.actionLabel || "暂无"}`,
        `最近读回一致性：${latestExportStatus ? (latestExportStatus.readbackOk ? "已确认" : "待确认") : "暂无"}`,
        `最近导出时间：${latestExportStatus?.exportedAt || "暂无"}`,
      ],
    }),
    buildCategory({
      id: "ui-decision-readiness",
      label: "是否进入 UI 优化讨论",
      whyItMatters: "不是所有不顺手都是 UI 问题，先分清是规则问题、输入问题，还是展示问题，能避免过早改版。",
      priorityReason:
        "这类记录的目标不是立即给 UI 方案，而是把“该不该开始做 UI”这件事说清楚。",
      priorityScore: 75,
      prompts: [
        "这批最卡的是功能逻辑、输入结构，还是界面组织？",
        "如果只能先改一个模块，你会先改哪里，为什么？",
        "现在讨论 UI 优化，是已经到时机，还是还会被更多真实试跑推翻？",
      ],
      signals: [
        `待回填：${validationSummary?.summary?.pendingCount || 0}`,
        `结构性推荐动作：${recommendedActions.length}`,
        `工作单导出状态：${latestExportStatus ? "已有记录" : "暂无记录"}`,
      ],
    }),
  ];

  return categories.sort((left, right) => right.priorityScore - left.priorityScore);
}
