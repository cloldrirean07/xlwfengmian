function splitMarkdownLines(markdown = "") {
  const normalized = String(markdown || "").replaceAll("\r\n", "\n");
  const lines = normalized.split("\n");

  if (lines.at(-1) === "") {
    return lines.slice(0, -1);
  }

  return lines;
}

function buildLineOperations(previousLines, finalLines) {
  const rowCount = previousLines.length;
  const columnCount = finalLines.length;
  const table = Array.from({ length: rowCount + 1 }, () => Array(columnCount + 1).fill(0));

  for (let row = rowCount - 1; row >= 0; row -= 1) {
    for (let column = columnCount - 1; column >= 0; column -= 1) {
      table[row][column] =
        previousLines[row] === finalLines[column]
          ? table[row + 1][column + 1] + 1
          : Math.max(table[row + 1][column], table[row][column + 1]);
    }
  }

  const operations = [];
  let row = 0;
  let column = 0;

  while (row < rowCount && column < columnCount) {
    if (previousLines[row] === finalLines[column]) {
      operations.push({ type: "equal", line: previousLines[row] });
      row += 1;
      column += 1;
    } else if (table[row + 1][column] >= table[row][column + 1]) {
      operations.push({ type: "remove", line: previousLines[row] });
      row += 1;
    } else {
      operations.push({ type: "add", line: finalLines[column] });
      column += 1;
    }
  }

  while (row < rowCount) {
    operations.push({ type: "remove", line: previousLines[row] });
    row += 1;
  }

  while (column < columnCount) {
    operations.push({ type: "add", line: finalLines[column] });
    column += 1;
  }

  return operations;
}

export function buildManualFormalWriteLineDiff({
  previousMarkdown = "",
  finalMarkdown = "",
  maxHunks = 6,
} = {}) {
  const previousLines = splitMarkdownLines(previousMarkdown);
  const finalLines = splitMarkdownLines(finalMarkdown);
  const operations = buildLineOperations(previousLines, finalLines);
  const hunks = [];
  let previousContext = "";

  for (let index = 0; index < operations.length; index += 1) {
    const operation = operations[index];

    if (operation.type === "equal") {
      previousContext = operation.line;
      continue;
    }

    const removedLines = [];
    const addedLines = [];
    const contextBefore = previousContext;

    while (index < operations.length && operations[index].type !== "equal") {
      if (operations[index].type === "remove") {
        removedLines.push(operations[index].line);
      } else {
        addedLines.push(operations[index].line);
      }

      index += 1;
    }

    const contextAfter = operations[index]?.type === "equal" ? operations[index].line : "";
    previousContext = contextAfter || previousContext;
    hunks.push({
      hunkId: `hunk-${hunks.length + 1}`,
      contextBefore,
      removedLines,
      addedLines,
      contextAfter,
    });
  }

  const removedLineCount = operations.filter((item) => item.type === "remove").length;
  const addedLineCount = operations.filter((item) => item.type === "add").length;

  return {
    hasChanges: removedLineCount + addedLineCount > 0,
    removedLineCount,
    addedLineCount,
    hunkCount: hunks.length,
    visibleHunkCount: Math.min(hunks.length, maxHunks),
    truncated: hunks.length > maxHunks,
    hunks: hunks.slice(0, maxHunks),
  };
}

export function buildManualFormalWriteExecutionPacket({
  precheck = null,
  readiness = null,
  currentTargetMarkdown = "",
  patchedMarkdown = "",
  outputPaths = {},
} = {}) {
  const safeWriteStatus = readiness?.latestSafeWriteStatus || null;
  const finalMarkdown = `${String(patchedMarkdown || "").trim()}\n`;
  const previousMarkdown = String(currentTargetMarkdown || "");
  const finalLineCount = finalMarkdown ? finalMarkdown.split("\n").length - 1 : 0;
  const previousLineCount = previousMarkdown ? previousMarkdown.split("\n").length : 0;
  const ok = Boolean(precheck?.ok && safeWriteStatus?.parsed?.targetPath && finalMarkdown.trim());
  const lineDiff = buildManualFormalWriteLineDiff({
    previousMarkdown,
    finalMarkdown,
  });

  return {
    ok,
    status: ok ? "formal-write-execution-packet-ready" : "formal-write-execution-packet-blocked",
    summary: ok
      ? "正式写回执行包已生成，可作为人工确认前的最后审计材料。"
      : "正式写回执行包未就绪，请先完成执行前预检。",
    target: {
      batchLabel: safeWriteStatus?.targetBatchLabel || "",
      safePreviewPath: safeWriteStatus?.targetPath || "",
      targetRecordPath: safeWriteStatus?.parsed?.targetPath || "",
      manualReviewConclusion:
        safeWriteStatus?.manualReviewConclusion ||
        safeWriteStatus?.parsed?.manualReviewConclusion ||
        "",
      confirmedLines: safeWriteStatus?.parsed?.parsed?.confirmedLines || "",
      readyDecision: safeWriteStatus?.parsed?.parsed?.readyDecision || "",
    },
    confirmation: {
      requiredPhrase: precheck?.confirmation?.requiredPhrase || "确认执行正式写回",
      phraseRequiredBeforeWrite: true,
    },
    writePlan: {
      willOverwriteTargetRecord: ok,
      sourceMarkdownPath: outputPaths.sourceMarkdownPath || "",
      sourceJsonPath: outputPaths.sourceJsonPath || "",
      sourcePreviousMarkdownPath: outputPaths.sourcePreviousMarkdownPath || "",
      logDirectory: outputPaths.logDirectory || "",
      previousContentLength: previousMarkdown.length,
      finalContentLength: finalMarkdown.length,
      contentLengthDelta: finalMarkdown.length - previousMarkdown.length,
      previousLineCount,
      finalLineCount,
      lineCountDelta: finalLineCount - previousLineCount,
    },
    lineDiff,
    rollback: {
      previousSnapshotPath: outputPaths.sourcePreviousMarkdownPath || "",
      restoreWhenReadbackMismatch: true,
      readbackMustMatchFinalMarkdown: true,
      summary: "正式写回执行时会先保存目标记录旧版本；读回不一致时恢复旧版本并报错。",
    },
    precheck: {
      status: precheck?.status || "unknown",
      ok: Boolean(precheck?.ok),
      blockers: Array.isArray(precheck?.blockers) ? precheck.blockers : [],
    },
    nextAction: ok
      ? {
          actionId: "export-manual-review-formal-write",
          label: "执行正式写回",
          requiredPhrase: precheck?.confirmation?.requiredPhrase || "确认执行正式写回",
          summary: "人工确认后执行正式写回，并读回校验目标记录。",
        }
      : {
          actionId: "check-manual-review-formal-write-readiness",
          label: "重新检查写回门禁",
          requiredPhrase: "",
          summary: "补齐执行前阻塞项后重新生成执行包。",
        },
    outputPaths,
    safetyBoundary: "仅生成正式写回执行包，不写入 Obsidian，不执行正式写回。",
    nextChecks: [
      "复核目标记录路径和安全预览来源。",
      "复核写入前后内容长度与行数变化。",
      "确认回滚快照路径和读回校验策略。",
      "输入正式写回确认短语后再执行正式写回。",
    ],
  };
}

export function buildManualFormalWriteExecutionPacketMarkdown(packet) {
  const lines = [
    "# 正式写回执行包",
    "",
    `- 执行包状态：${packet.ok ? "通过" : "需修正"}`,
    `- 状态码：${packet.status}`,
    `- 摘要：${packet.summary}`,
    `- 目标批次：${packet.target.batchLabel || "暂无"}`,
    `- 目标记录：${packet.target.targetRecordPath || "暂无"}`,
    `- 安全预览：${packet.target.safePreviewPath || "暂无"}`,
    `- 确认短语：${packet.confirmation.requiredPhrase}`,
    `- 下一动作：${packet.nextAction?.label || "待确认"}`,
    `- 安全边界：${packet.safetyBoundary}`,
    "",
    "## 1. 写入计划",
    "",
    `- 是否覆盖目标记录：${packet.writePlan.willOverwriteTargetRecord ? "是" : "否"}`,
    `- 写入后 Markdown：${packet.writePlan.sourceMarkdownPath || "暂无"}`,
    `- 写入前快照：${packet.writePlan.sourcePreviousMarkdownPath || "暂无"}`,
    `- 写回元数据：${packet.writePlan.sourceJsonPath || "暂无"}`,
    `- 写回日志目录：${packet.writePlan.logDirectory || "暂无"}`,
    `- 写入前内容长度：${packet.writePlan.previousContentLength}`,
    `- 写入后内容长度：${packet.writePlan.finalContentLength}`,
    `- 内容长度变化：${packet.writePlan.contentLengthDelta}`,
    `- 写入前行数：${packet.writePlan.previousLineCount}`,
    `- 写入后行数：${packet.writePlan.finalLineCount}`,
    `- 行数变化：${packet.writePlan.lineCountDelta}`,
    "",
    "## 2. 回滚策略",
    "",
    `- 旧版本快照：${packet.rollback.previousSnapshotPath || "暂无"}`,
    `- 读回不一致时恢复：${packet.rollback.restoreWhenReadbackMismatch ? "是" : "否"}`,
    `- 读回必须匹配最终内容：${packet.rollback.readbackMustMatchFinalMarkdown ? "是" : "否"}`,
    `- 策略说明：${packet.rollback.summary}`,
    "",
    "## 3. 行级差异审计",
    "",
    `- 是否存在变化：${packet.lineDiff.hasChanges ? "是" : "否"}`,
    `- 新增行数：${packet.lineDiff.addedLineCount}`,
    `- 移除行数：${packet.lineDiff.removedLineCount}`,
    `- 差异块数：${packet.lineDiff.hunkCount}`,
    `- 展示差异块数：${packet.lineDiff.visibleHunkCount}`,
    `- 是否截断：${packet.lineDiff.truncated ? "是" : "否"}`,
    "",
  ];

  packet.lineDiff.hunks.forEach((hunk) => {
    lines.push(`### ${hunk.hunkId}`, "");

    if (hunk.contextBefore) {
      lines.push(`  ${hunk.contextBefore}`);
    }

    hunk.removedLines.forEach((line) => {
      lines.push(`- ${line || "空行"}`);
    });

    hunk.addedLines.forEach((line) => {
      lines.push(`+ ${line || "空行"}`);
    });

    if (hunk.contextAfter) {
      lines.push(`  ${hunk.contextAfter}`);
    }

    lines.push("");
  });

  lines.push(
    "## 4. 人工确认信息",
    "",
    `- 人工复盘结论：${packet.target.manualReviewConclusion || "暂无"}`,
    `- 确认写回行：${packet.target.confirmedLines || "暂无"}`,
    `- 正式写回许可：${packet.target.readyDecision || "暂无"}`,
    `- 动作短语：${packet.nextAction?.requiredPhrase || "暂无"}`,
    "",
    "## 5. 执行前检查",
    "",
    `- 预检状态：${packet.precheck.status}`,
    `- 预检是否通过：${packet.precheck.ok ? "是" : "否"}`,
  );

  if (packet.precheck.blockers.length) {
    packet.precheck.blockers.forEach((item) => {
      lines.push(`- 阻塞点：${item.label || "待复查"} / ${item.detail || "待补充"}`);
    });
  } else {
    lines.push("- 阻塞点：当前无阻塞点。");
  }

  lines.push("", "## 6. 后续检查", "");
  packet.nextChecks.forEach((item) => {
    lines.push(`- ${item}`);
  });

  return lines.join("\n");
}
