export function buildPlatformCaseBatchReviewMarkdown(review) {
  const lines = [
    "# 平台案例批量复核看板",
    "",
    "## 汇总",
    `- 平台案例总数：${review.summary.totalCases}`,
    `- 待回填：${review.summary.pendingCount}`,
    `- 部分回填：${review.summary.partialCount}`,
    `- 可进入同步：${review.summary.readyCount}`,
    "",
    "## 优先处理",
  ];

  if ((review.topPriorityRows || []).length === 0) {
    lines.push("- 当前暂无平台案例");
  } else {
    for (const item of review.topPriorityRows) {
      lines.push(
        `- ${item.platformCaseId}｜${item.completenessStatus}｜优先补：${item.topPriorityItems.join(" / ") || "暂无"}`,
      );
    }
  }

  lines.push("", "## 全量行");

  if ((review.rows || []).length === 0) {
    lines.push("- 当前暂无平台案例");
  } else {
    for (const row of review.rows) {
      lines.push(
        `- ${row.platformCaseId}｜${row.summary.completenessStatus}｜${row.summary.completedChecks}/${row.summary.totalChecks}｜映射真实案例 ${row.summary.linkedCaseCount} 个`,
      );

      if (row.summary.topPriorityItems.length) {
        lines.push(`  优先补：${row.summary.topPriorityItems.join(" / ")}`);
      }

      if (row.syncPreview?.syncSummary?.changedFields?.length) {
        lines.push(
          `  Sync 预览变化：${row.syncPreview.syncSummary.changedFields.join(" / ")}`,
        );
      }
    }
  }

  lines.push("");
  return lines.join("\n");
}
