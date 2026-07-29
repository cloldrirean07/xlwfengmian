export function buildPlatformCaseReviewMarkdown(review) {
  const lines = [
    `# 平台案例复核总览｜${review.platformCaseId}`,
    "",
    "## 汇总",
    `- 完整度状态：${review.summary.completenessStatus}（${review.summary.completedChecks}/${review.summary.totalChecks}）`,
    `- 质量状态：${review.summary.qualityStatus}（可用 ${review.quality.usableCount}/${review.quality.totalChecks}）`,
    `- 已映射真实案例数：${review.summary.linkedCaseCount}`,
    `- 当前是否建议进入 sync：${review.summary.readyToSync ? "是" : "否"}`,
    `- 当前最优先补：${review.summary.topPriorityItems.join(" / ") || "暂无"}`,
    "",
    "## 完整度检查",
  ];

  for (const item of review.completeness.checks) {
    lines.push(`- ${item.label}：${item.complete ? "已填" : "待填"}`);
  }

  lines.push("", "## 质量检查");

  for (const item of review.quality.checks) {
    const suffix = item.issue ? `｜${item.issue}` : "";
    lines.push(`- ${item.label}：${item.status}${suffix}`);
  }

  lines.push("", "## 补全顺序建议");

  if ((review.actionPlan?.tasks || []).length === 0) {
    lines.push("- 当前没有待补任务");
  } else {
    for (const item of review.actionPlan.tasks) {
      const issueSuffix = item.issue ? `｜当前问题：${item.issue}` : "";
      lines.push(
        `- ${item.order}. ${item.label}｜${item.priority}${issueSuffix}`,
      );
      lines.push(`  为什么先补：${item.reason}`);
      lines.push(`  Obsidian 位置：${item.obsidianField || "待补映射"}`);
      lines.push(`  怎么补：${item.prompt}`);
      if (item.example) {
        lines.push(`  参考写法：${item.example}`);
      }
    }
  }

  lines.push("", "## 映射真实案例");

  if ((review.linkedCases || []).length === 0) {
    lines.push("- 当前未映射真实案例");
  } else {
    for (const item of review.linkedCases) {
      lines.push(`- ${item.caseId}｜${item.title}｜${item.platform}`);
    }
  }

  lines.push("", "## Sync 预览");

  if (!review.syncPreview) {
    lines.push("- 当前无可预览的真实案例映射");
  } else {
    lines.push(
      `- 变化字段：${review.syncPreview.syncSummary.changedFields.join(" / ") || "暂无"}`,
    );
    lines.push(
      `- 同步前：${review.syncPreview.syncSummary.readinessBefore.status}（${review.syncPreview.syncSummary.readinessBefore.completedChecks}/${review.syncPreview.syncSummary.readinessBefore.totalChecks}）`,
    );
    lines.push(
      `- 同步后：${review.syncPreview.syncSummary.readinessAfter.status}（${review.syncPreview.syncSummary.readinessAfter.completedChecks}/${review.syncPreview.syncSummary.readinessAfter.totalChecks}）`,
    );
  }

  lines.push("");
  return lines.join("\n");
}
