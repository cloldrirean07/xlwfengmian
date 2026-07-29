export function buildBatchReviewDashboardMarkdown(report) {
  const lines = [
    "# 批次复盘看板",
    "",
    "## 1. 当前判断",
    `- UI 时机：${report.uiReadiness.readinessLabel}`,
    `- 跨批次信号：${report.crossBatchSignal.label}`,
    `- 人工复盘趋势：${report.coverageTrend.label}`,
    `- 规则修订信号：${report.ruleRevisionSignal?.label || "暂无规则修订任务"}`,
    `- 关键样例复跑：${report.keyCaseRerunHandoff?.label || "等待规则任务后再安排复跑"}`,
    `- 当前原因：${report.coverageTrend.reason}`,
    "",
    "## 2. 复盘覆盖汇总",
    `- 批次数：${report.summary.totalBatches}`,
    `- 已写人工结论批次数：${report.summary.reviewedBatchCount}`,
    `- 人工完整覆盖批次数：${report.summary.fullyCoveredBatchCount}`,
    `- 人工半填批次数：${report.summary.partiallyCoveredBatchCount}`,
    `- 完全未写人工结论批次数：${report.summary.missingManualReviewCount}`,
    `- 重复摩擦点类别数：${report.summary.repeatedCategories}`,
    "",
    "## 3. 规则修订任务信号",
    `- 任务数量：${report.ruleRevisionSignal?.taskCount ?? 0}`,
    `- 来源样本：${report.ruleRevisionSignal?.sourceSampleCount ?? 0}`,
    `- 优先级分布：${report.ruleRevisionSignal?.prioritySummary || "P1 0 / P2 0 / P3 0"}`,
  ];

  if (report.ruleRevisionSignal?.topTasks?.length) {
    for (const task of report.ruleRevisionSignal.topTasks) {
      lines.push(`- ${task.taskId}｜${task.priority}｜${task.taskTitle}`);
      lines.push(`  - 建议映射：${task.suggestedMappingId || "待确认"}`);
      lines.push(`  - 关联样本：${(task.caseIds || []).join(" / ") || "暂无"}`);
    }
  } else {
    lines.push("- 当前没有可展示的规则修订任务。");
  }

  lines.push(
    "",
    "## 4. 关键样例复跑承接",
    `- 当前状态：${report.keyCaseRerunHandoff?.label || "等待规则任务后再安排复跑"}`,
    `- 候选样例：${(report.keyCaseRerunHandoff?.candidateCaseIds || []).join(" / ") || "暂无"}`,
    `- 下游刷新：${(report.keyCaseRerunHandoff?.downstreamRefreshTargets || []).join(" / ") || "暂无"}`,
    `- 说明：${report.keyCaseRerunHandoff?.summary || "当前还没有规则任务可进入复跑。"}`,
  );

  if (report.keyCaseRerunHandoff?.latestRun) {
    lines.push(`- 最近复跑计划：${report.keyCaseRerunHandoff.latestRun.planId}`);
    lines.push(`- 最近复跑时间：${report.keyCaseRerunHandoff.latestRun.generatedAt || "待确认"}`);
    lines.push(`- 最近复跑样例数：${report.keyCaseRerunHandoff.latestRun.rerunCaseCount}`);
    lines.push(`- 最近变化样例数：${report.keyCaseRerunHandoff.latestRun.changedCaseCount}`);
    lines.push(`- 最近下游变化数：${report.keyCaseRerunHandoff.latestRun.downstreamChangedCount}`);
  }

  if (report.keyCaseRerunHandoff?.commandSequence?.length) {
    lines.push("- 建议命令顺序：");
    for (const command of report.keyCaseRerunHandoff.commandSequence) {
      lines.push(`  - ${command}`);
    }
  }

  lines.push("", "## 5. 当前最该补的批次");

  if (report.priorityRows.length) {
    for (const item of report.priorityRows.slice(0, 5)) {
      lines.push(`- ${item.batchLabel}：${item.urgencyLabel}`);
      lines.push(`  - 缺口：${item.missingFieldLabels.join(" / ") || "待确认"}`);
      lines.push(`  - 案例数：${item.createdCount}`);
      lines.push(`  - 当前最强摩擦点：${item.topCategoryLabels.join(" / ") || "暂无"}`);
    }
  } else {
    lines.push("- 当前没有待补批次，说明人工复盘已经相对完整。");
  }

  lines.push("", "## 6. 下一步动作");
  for (const item of report.nextActions) {
    lines.push(`- ${item}`);
  }

  const uiRecheckPlan = report.uiRecheckPlan;
  if (uiRecheckPlan?.steps?.length) {
    lines.push("", "## 7. 人工复盘补齐后的再判断链路");
    lines.push(`- 当前状态：${uiRecheckPlan.statusLabel}`);
    lines.push(`- 当前结论：${uiRecheckPlan.summary}`);

    if (uiRecheckPlan.blockers?.length) {
      lines.push("- 当前阻塞：");
      for (const blocker of uiRecheckPlan.blockers) {
        lines.push(`  - ${blocker}`);
      }
    }

    lines.push("- 建议顺序：");
    for (const step of uiRecheckPlan.steps) {
      lines.push(`  - [${step.status}] ${step.label}`);
      if (step.note) {
        lines.push(`    - ${step.note}`);
      }
    }
  }

  const manualReviewTaskCard = report.manualReviewTaskCard;
  if (manualReviewTaskCard?.fieldTasks?.length) {
    lines.push("", "## 8. 人工复盘待补任务");
    lines.push(`- 当前状态：${manualReviewTaskCard.statusLabel}`);
    lines.push(`- 目标批次：${manualReviewTaskCard.targetBatchLabel}`);
    lines.push(`- 当前结论：${manualReviewTaskCard.summary}`);
    if (report.manualReviewTaskHandoff) {
      lines.push(`- 草稿状态：${report.manualReviewTaskHandoff.label}`);
      lines.push(`- 草稿读回：${report.manualReviewTaskHandoff.readbackOk ? "已确认" : "待生成"}`);
      if (report.manualReviewTaskHandoff.targetPath) {
        lines.push(`- 草稿路径：${report.manualReviewTaskHandoff.targetPath}`);
      }
    }
    if (manualReviewTaskCard.topCategoryLabels?.length) {
      lines.push(`- 当前最强摩擦点：${manualReviewTaskCard.topCategoryLabels.join(" / ")}`);
    }
    if (manualReviewTaskCard.topActionLabels?.length) {
      lines.push(`- 当前最该先补的信息：${manualReviewTaskCard.topActionLabels.join(" / ")}`);
    }
    lines.push("- 待补字段：");
    for (const task of manualReviewTaskCard.fieldTasks) {
      lines.push(`  - ${task.label}：${task.prompt}`);
      lines.push(`    - 填写提示：${task.answerHint}`);
    }
  }

  const formalWriteGate = report.formalWriteGate;
  if (formalWriteGate) {
    lines.push("", "## 9. 正式写回门禁");
    lines.push(`- 当前状态：${formalWriteGate.label}`);
    lines.push(`- 目标批次：${formalWriteGate.targetBatchLabel || "暂无"}`);
    lines.push(`- 改写来源：${formalWriteGate.patchSourceLabel || "暂无"}`);
    lines.push(`- 安全预览读回：${formalWriteGate.readbackOk ? "已确认" : "待确认"}`);
    lines.push(`- 内容一致性：${formalWriteGate.matchedExpectedContent ? "已确认" : "待复查"}`);
    lines.push(`- 人工结论：${formalWriteGate.manualReviewConclusionStatus || "待补"}`);
    lines.push(`- 写回许可：${formalWriteGate.formalWritePermission || "待确认"}`);
    lines.push(`- 说明：${formalWriteGate.summary || "待补"}`);
    if (formalWriteGate.targetPath) {
      lines.push(`- 安全预览路径：${formalWriteGate.targetPath}`);
    }
    if (formalWriteGate.confirmationChecklist?.length) {
      lines.push("- 确认清单：");
      for (const item of formalWriteGate.confirmationChecklist) {
        lines.push(`  - [${item.status}] ${item.label}：${item.detail}`);
      }
    }
  }

  const checklist = report.followUpChecklist;
  if (checklist?.phases?.length) {
    lines.push("", "## 10. 复盘后操作清单");
    for (const phase of checklist.phases) {
      lines.push(`- ${phase.label}`);
      for (const item of phase.items) {
        lines.push(`  - ${item.label}`);
        if (item.actionLabel) {
          lines.push(`    - 页面入口：${item.actionLabel}`);
        }
      }
    }
  }
  lines.push("");

  return lines.join("\n");
}
