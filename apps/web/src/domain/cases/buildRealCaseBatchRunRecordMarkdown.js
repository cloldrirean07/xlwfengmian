export function buildRealCaseBatchRunRecordMarkdown({
  batchLabel,
  created,
  validationSummary,
  latestWorksheetHistory,
  frictionTemplate = [],
  manualReviewGuide = null,
  latestManualReviewStatus = null,
}) {
  const lines = [
    `# 批次试跑记录｜${batchLabel}`,
    "",
    "## 0. 本次批次",
    `- 案例数：${created.length}`,
    `- 案例编号：${created.map((item) => item.id).join(" / ") || "暂无"}`,
    "",
    "## 1. 当前结构质量",
    `- 待回填：${validationSummary.summary.pendingCount}`,
    `- 部分回填：${validationSummary.summary.partialCount}`,
    `- 可进入手动验证：${validationSummary.summary.readyCount}`,
    `- 缺失字段总数：${validationSummary.summary.totalMissingFields}`,
    `- 平均每条缺失：${validationSummary.summary.avgMissingFields}`,
    "",
    "## 2. 当前最值得先看的动作",
  ];

  if (validationSummary.recommendedBatchActions?.length) {
    for (const item of validationSummary.recommendedBatchActions.slice(0, 3)) {
      lines.push(`- ${item.label}（${item.priority}）`);
      lines.push(`  - 影响案例：${item.affectedCaseIds.join(" / ")}`);
      lines.push(`  - 为什么先做：${item.priorityReason}`);
    }
  } else {
    lines.push("- 当前没有明确的优先动作。");
  }

  lines.push("", "## 3. 工作单状态");

  if (latestWorksheetHistory?.latestExportStatus) {
    lines.push(`- 最近一次导出：${latestWorksheetHistory.latestExportStatus.exportedAt}`);
    lines.push(`- 导出动作：${latestWorksheetHistory.latestExportStatus.actionLabel}`);
    lines.push(`- 读回一致性：${latestWorksheetHistory.latestExportStatus.readbackOk ? "已确认" : "待确认"}`);
    lines.push(`- 工作单路径：${latestWorksheetHistory.latestExportStatus.targetPath}`);
  } else {
    lines.push("- 当前还没有这批案例的工作单导出记录。");
  }

  lines.push("", "## 4. 逐条案例观察入口");
  for (const row of validationSummary.rows || []) {
    lines.push(`- ${row.caseId}：${row.status} / 下一步 ${row.nextTask?.label || "待补"}`);
  }

  lines.push("", "## 5. 结构化摩擦点记录");

  if (frictionTemplate.length) {
    for (const category of frictionTemplate) {
      lines.push(`### ${category.label}`);
      lines.push(`- 为什么看这块：${category.whyItMatters}`);
      lines.push(`- 当前优先原因：${category.priorityReason}`);
      lines.push("- 观察信号：");
      for (const signal of category.signals || []) {
        lines.push(`  - ${signal}`);
      }
      lines.push("- 试跑记录：");
      for (const prompt of category.prompts || []) {
        lines.push(`  - ${prompt}`);
      }
      lines.push("- 本批结论：");
      lines.push("");
    }
  } else {
    lines.push("- 当前还没有结构化摩擦点模板。");
    lines.push("");
  }

  lines.push(
    "## 6. 人工试跑结论",
    `- 建议先填：${
      manualReviewGuide?.fillOrder?.map((item) => item.shortLabel).join(" / ") ||
      "最卡环节 / 问题类型 / 前置模块 / UI 时机"
    }`,
  );

  if (latestManualReviewStatus?.exportId) {
    lines.push(`- 最近一次人工结论导出：${latestManualReviewStatus.exportedAt || "待补"}`);
    lines.push(
      `- 最近一次人工结论覆盖：${
        latestManualReviewStatus.hasManualConclusion
          ? `已填写 ${latestManualReviewStatus.filledFieldCount} 项`
          : "上次导出仍未填写人工结论"
      }`,
    );
    lines.push(
      `- 关键字段还缺：${
        latestManualReviewStatus.missingKeyFields?.map((item) => item.label).join(" / ") || "无"
      }`,
    );
  } else {
    lines.push("- 最近还没有这批试跑记录的人工结论导出状态。");
  }

  lines.push(
    "- 这批案例最卡的环节：",
    "- 哪些字段最难补：",
    "- 哪个输出最有价值：",
    "- 和通用 AI 相比更有帮助的点：",
    "- 和通用 AI 相比仍然不够好的点：",
    "",
    "## 7. 对产品的影响",
    "- 哪个按钮或模块最该前置：",
    "- 哪段说明文字太多：",
    "- 哪个步骤最值得做成更强引导：",
    "- 当前更像功能问题，还是界面问题：",
    "",
    "## 8. 下一步动作",
    "- [ ] 继续补这批案例",
    "- [ ] 再跑一批真实案例",
    "- [ ] 记录 UI 摩擦点",
    "- [ ] 判断是否进入 UI 优化讨论",
    "",
  );

  return lines.join("\n");
}
