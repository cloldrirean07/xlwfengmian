export function buildManualFormalWritePostExecutionAcceptance({
  executionPacket = null,
  formalWriteExport = null,
  outputPaths = {},
} = {}) {
  const exportCompleted = Boolean(formalWriteExport?.ok && formalWriteExport?.readback?.ok);
  const matchedExpectedContent = Boolean(formalWriteExport?.readback?.matchedExpectedContent);
  const followUpTasks = Array.isArray(formalWriteExport?.followUpTasks)
    ? formalWriteExport.followUpTasks
    : [];
  const expectedFollowUpTaskCount = 2;
  const acceptanceChecks = [
    {
      checkId: "target-readback",
      label: "目标记录读回",
      status: matchedExpectedContent ? "passed" : "pending",
      expectedEvidence: formalWriteExport?.targetPath || executionPacket?.target?.targetRecordPath || "",
      summary: "正式写回后，目标记录内容必须与最终 Markdown 完全一致。",
    },
    {
      checkId: "final-markdown-snapshot",
      label: "写入后快照",
      status: formalWriteExport?.sourceMarkdownPath ? "passed" : "pending",
      expectedEvidence:
        formalWriteExport?.sourceMarkdownPath || executionPacket?.writePlan?.sourceMarkdownPath || "",
      summary: "正式写回应保存写入后的 Markdown 快照，便于后续复核。",
    },
    {
      checkId: "previous-markdown-snapshot",
      label: "写入前快照",
      status: formalWriteExport?.sourcePreviousMarkdownPath ? "passed" : "pending",
      expectedEvidence:
        formalWriteExport?.sourcePreviousMarkdownPath ||
        executionPacket?.rollback?.previousSnapshotPath ||
        "",
      summary: "正式写回前应保存旧版本快照，读回异常时可恢复。",
    },
    {
      checkId: "formal-write-metadata",
      label: "写回元数据",
      status: formalWriteExport?.sourceJsonPath ? "passed" : "pending",
      expectedEvidence:
        formalWriteExport?.sourceJsonPath || executionPacket?.writePlan?.sourceJsonPath || "",
      summary: "正式写回应保存 exportId、时间、来源和目标路径等元数据。",
    },
    {
      checkId: "follow-up-tasks",
      label: "承接任务生成",
      status: followUpTasks.length >= expectedFollowUpTaskCount ? "passed" : "pending",
      expectedEvidence: followUpTasks.map((task) => task.label).join(" / "),
      summary: "正式写回后应生成规则修订任务单和关键样例复跑两个承接任务。",
    },
  ];
  const passedCount = acceptanceChecks.filter((item) => item.status === "passed").length;
  const ok = Boolean(exportCompleted && passedCount === acceptanceChecks.length);

  return {
    ok,
    status: ok
      ? "formal-write-post-execution-acceptance-passed"
      : "formal-write-post-execution-acceptance-waiting",
    summary: ok
      ? "正式写回后验收通过，目标读回、快照、元数据和承接任务均已确认。"
      : "正式写回后验收包已生成，等待执行正式写回后自动复核。",
    target: {
      batchLabel: executionPacket?.target?.batchLabel || formalWriteExport?.targetBatchLabel || "",
      targetRecordPath:
        formalWriteExport?.targetPath || executionPacket?.target?.targetRecordPath || "",
      safePreviewPath:
        formalWriteExport?.safeWriteNotePath || executionPacket?.target?.safePreviewPath || "",
    },
    executionPacket: {
      status: executionPacket?.status || "unknown",
      lineDiff: executionPacket?.lineDiff || null,
      confirmationPhrase: executionPacket?.confirmation?.requiredPhrase || "确认执行正式写回",
    },
    formalWriteExport: formalWriteExport
      ? {
          exportId: formalWriteExport.exportId || "",
          exportedAt: formalWriteExport.exportedAt || "",
          readback: formalWriteExport.readback || null,
          followUpTaskCount: followUpTasks.length,
        }
      : null,
    acceptanceChecks,
    passedCount,
    totalCount: acceptanceChecks.length,
    nextAction: ok
      ? {
          actionId: "review-formal-write-follow-up",
          label: "复核写回后承接任务",
          summary: "检查规则修订任务单和关键样例复跑是否进入下一轮处理。",
        }
      : {
          actionId: "export-manual-review-formal-write",
          label: "执行正式写回",
          requiredPhrase: executionPacket?.confirmation?.requiredPhrase || "确认执行正式写回",
          summary: "执行正式写回后，重新生成验收包并检查读回结果。",
        },
    outputPaths,
    safetyBoundary: "仅生成正式写回后验收包，不写入 Obsidian，不执行正式写回。",
  };
}

export function buildManualFormalWritePostExecutionAcceptanceMarkdown(acceptance) {
  const lines = [
    "# 正式写回后验收包",
    "",
    `- 验收状态：${acceptance.ok ? "通过" : "等待正式写回"}`,
    `- 状态码：${acceptance.status}`,
    `- 摘要：${acceptance.summary}`,
    `- 目标批次：${acceptance.target.batchLabel || "暂无"}`,
    `- 目标记录：${acceptance.target.targetRecordPath || "暂无"}`,
    `- 安全预览：${acceptance.target.safePreviewPath || "暂无"}`,
    `- 执行包状态：${acceptance.executionPacket.status}`,
    `- 差异块数：${acceptance.executionPacket.lineDiff?.hunkCount ?? "暂无"}`,
    `- 验收进度：${acceptance.passedCount} / ${acceptance.totalCount}`,
    `- 安全边界：${acceptance.safetyBoundary}`,
    "",
    "## 1. 验收项",
    "",
  ];

  acceptance.acceptanceChecks.forEach((item) => {
    lines.push(`- ${item.label}：[${item.status}] ${item.summary}`);
    lines.push(`  - 证据：${item.expectedEvidence || "等待正式写回后生成"}`);
  });

  lines.push(
    "",
    "## 2. 下一步",
    "",
    `- 推荐动作：${acceptance.nextAction.label}`,
    `- 动作说明：${acceptance.nextAction.summary}`,
  );

  if (acceptance.nextAction.requiredPhrase) {
    lines.push(`- 动作短语：${acceptance.nextAction.requiredPhrase}`);
  }

  return lines.join("\n");
}
