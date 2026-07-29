export function buildKeyCaseRerunMarkdown(report) {
  const lines = [
    "# 关键样例复跑报告",
    "",
    "## 汇总",
    `- 生成时间：${report.meta.generatedAt}`,
    `- 复跑计划：${report.meta.planId}`,
    `- 计划样例数：${report.summary.plannedCaseCount}`,
    `- 实际复跑数：${report.summary.rerunCaseCount}`,
    `- sample 数：${report.summary.sampleCaseCount}`,
    `- real 数：${report.summary.realCaseCount}`,
    "",
    "## 本次计划说明",
    `- ${report.meta.description || "暂无"}`,
    `- 下游刷新目标：${(report.meta.downstreamRefreshTargets || []).join(" / ") || "暂无"}`,
    "",
    "## 样例结果",
  ];

  if (!report.rows.length) {
    lines.push("- 当前没有复跑结果");
  } else {
    for (const row of report.rows) {
      lines.push(`### ${row.caseId}`);
      lines.push(`- 标题：${row.title}`);
      lines.push(`- 来源类型：${row.sourceType}`);
      lines.push(`- 平台：${row.platform}`);
      lines.push(`- 规则版本：${row.ruleVersion}`);
      lines.push(`- 首轮主方向：${row.topDirectionLabel || row.topDirectionType || "待补充"}`);
      lines.push(
        `- 首轮命中信号：${row.topMatchedSignals.length ? row.topMatchedSignals.join(" / ") : "待补充"}`,
      );
      lines.push(`- 二轮选中卡片：${row.selectedCardId || "待补充"}`);
      lines.push(`- 二轮选中方向：${row.selectedDirectionLabel || "待补充"}`);
      lines.push(`- 当前负向映射：${row.refinementMappingId || "待补充"}`);
      lines.push(`- 输出目录：${row.outputDir}`);
      lines.push("");
    }
  }

  lines.push("## 下游刷新结果");
  lines.push(
    `- reviewed-misclassified：${
      report.downstreamReports.reviewedMisclassified?.summary?.eligibleExportCount ?? "待补充"
    } 条可导出误判样本`,
  );
  lines.push(
    `- rule-revision-task-sheet：${
      report.downstreamReports.ruleRevisionTaskSheet?.summary?.taskCount ?? "待补充"
    } 条规则修订任务`,
  );
  lines.push("");

  return lines.join("\n");
}
