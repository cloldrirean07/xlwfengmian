export function buildBatchReviewManualBackfillMarkdown({
  backfillPreview = {},
  latestTaskCardStatus = null,
  latestRunRecordStatus = null,
} = {}) {
  const lines = [
    "# 人工复盘回流预览",
    "",
    "## 1. 当前状态",
    `- 当前状态：${backfillPreview.statusLabel || "待补"}`,
    `- 目标批次：${backfillPreview.targetBatchLabel || "暂无"}`,
    `- 当前结论：${backfillPreview.summary || "当前还没有可回流的人工判断。"}`,
  ];

  if (latestTaskCardStatus?.targetPath) {
    lines.push(`- 最近任务草稿：${latestTaskCardStatus.targetPath}`);
  }

  if (latestRunRecordStatus?.targetPath) {
    lines.push(`- 最近批次试跑记录：${latestRunRecordStatus.targetPath}`);
  }

  lines.push("", "## 2. 已填写字段");
  if (backfillPreview.filledFieldLabels?.length) {
    for (const label of backfillPreview.filledFieldLabels) {
      lines.push(`- ${label}`);
    }
  } else {
    lines.push("- 当前还没有已填写字段。");
  }

  lines.push("", "## 3. 仍缺字段");
  if (backfillPreview.missingFieldLabels?.length) {
    for (const label of backfillPreview.missingFieldLabels) {
      lines.push(`- ${label}`);
    }
  } else {
    lines.push("- 当前 4 个关键字段都已填写。");
  }

  const reviewPatch = backfillPreview.reviewPatch || {};
  lines.push("", "## 4. 可回流批次试跑结论 patch");
  lines.push(`- 这批案例最卡的环节：${reviewPatch.bottleneckStep || ""}`);
  lines.push(`- 当前更像功能问题，还是界面问题：${reviewPatch.issueType || ""}`);
  lines.push(`- 哪个按钮或模块最该前置：${reviewPatch.prioritizedModule || ""}`);
  lines.push(`- UI 优化是否已经到时机：${reviewPatch.uiOptimizationTiming || ""}`);

  lines.push("", "## 5. 可写回草稿");
  lines.push(`- 这批案例最卡的环节：${reviewPatch.bottleneckStep || ""}`);
  lines.push("- 哪些字段最难补：");
  lines.push("- 哪个输出最有价值：");
  lines.push("- 和通用 AI 相比更有帮助的点：");
  lines.push("- 和通用 AI 相比仍然不够好的点：");
  lines.push("");
  lines.push(`- 哪个按钮或模块最该前置：${reviewPatch.prioritizedModule || ""}`);
  lines.push("- 哪段说明文字太多：");
  lines.push("- 哪个步骤最值得做成更强引导：");
  lines.push(`- 当前更像功能问题，还是界面问题：${reviewPatch.issueType || ""}`);
  lines.push("");
  lines.push("- 这批试跑最关键的结论：");
  lines.push("- 下一批还要不要继续同样赛道：");
  lines.push(`- UI 优化是否已经到时机：${reviewPatch.uiOptimizationTiming || ""}`);

  return lines.join("\n");
}
