export function buildPlatformSyncLogMarkdown(log) {
  const lines = [
    `# 平台案例同步日志｜${log.caseId}`,
    "",
    "## 基本信息",
    `- 运行时间：${log.generatedAt}`,
    `- 模式：${log.dryRun ? "dry-run" : "write"}`,
    `- 平台案例路径：${log.obsidianPath}`,
    `- 目标 real-case：${log.targetPath}`,
    `- 提取字段数：${log.extractedFieldCount}`,
    `- 实际变更字段数：${log.changedFieldCount}`,
    "",
    "## 字段变化",
  ];

  if (!log.changedFields.length) {
    lines.push("- 本次没有字段变化");
  } else {
    for (const label of log.changedFields) {
      lines.push(`- ${label}`);
    }
  }

  lines.push("", "## Readiness 变化");
  lines.push(
    `- 同步前：${log.readinessBefore.status}（${log.readinessBefore.completedChecks}/${log.readinessBefore.totalChecks}）`,
  );
  lines.push(
    `- 同步后：${log.readinessAfter.status}（${log.readinessAfter.completedChecks}/${log.readinessAfter.totalChecks}）`,
  );

  if (log.readinessAfter.missingFields.length) {
    lines.push(`- 同步后仍缺：${log.readinessAfter.missingFields.join("、")}`);
  } else {
    lines.push("- 同步后已经没有缺失项");
  }

  lines.push("", "## 后续动作");

  if (!log.postSyncActions.length) {
    lines.push("- 当前未配置后续动作");
  } else {
    for (const action of log.postSyncActions) {
      const executed = log.executedActions.includes(action) ? "已执行" : "未执行";
      lines.push(`- ${action}：${executed}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}
