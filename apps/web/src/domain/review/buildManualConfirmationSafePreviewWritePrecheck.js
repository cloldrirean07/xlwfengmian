import { parseBatchReviewManualSafeWritePreviewNote } from "./parseBatchReviewManualSafeWritePreviewNote.js";

function buildFieldChange(label, beforeValue, afterValue) {
  const before = String(beforeValue || "").trim();
  const after = String(afterValue || "").trim();

  return {
    label,
    before,
    after,
    changed: before !== after,
  };
}

function countLines(markdown = "") {
  const normalized = String(markdown || "");

  if (!normalized) {
    return 0;
  }

  return normalized.split("\n").length;
}

export function buildManualConfirmationSafePreviewWritePrecheck({
  currentMarkdown = "",
  suggestedMarkdown = "",
  adoptionPacket = null,
  sourcePaths = {},
} = {}) {
  const current = parseBatchReviewManualSafeWritePreviewNote(currentMarkdown);
  const suggested = parseBatchReviewManualSafeWritePreviewNote(suggestedMarkdown);
  const normalizedCurrentMarkdown = String(currentMarkdown || "");
  const normalizedSuggestedMarkdown = String(suggestedMarkdown || "");
  const targetMatches = Boolean(
    adoptionPacket?.targetBatchLabel &&
      adoptionPacket.targetBatchLabel === suggested.targetBatchLabel &&
      (!current.targetBatchLabel || current.targetBatchLabel === suggested.targetBatchLabel),
  );
  const fieldChanges = [
    buildFieldChange("人工复盘结论", current.manualReviewConclusion, suggested.manualReviewConclusion),
    buildFieldChange("确认写回行", current.parsed?.confirmedLines, suggested.parsed?.confirmedLines),
    buildFieldChange("仍需手改", current.parsed?.stillNeedsEdit, suggested.parsed?.stillNeedsEdit),
    buildFieldChange("正式写回许可", current.parsed?.readyDecision, suggested.parsed?.readyDecision),
  ];
  const changedFieldCount = fieldChanges.filter((item) => item.changed).length;
  const ok = Boolean(
    adoptionPacket?.ok &&
      targetMatches &&
      suggested.hasManualConfirmation &&
      suggested.manualReviewConclusionValidation?.ok &&
      suggested.canProceedToFormalWrite,
  );

  return {
    ok,
    status: ok ? "safe-preview-write-precheck-ready" : "safe-preview-write-precheck-blocked",
    summary: ok
      ? "安全预览确认写入预检通过，建议版本可作为人工确认后的写入内容。"
      : "安全预览确认写入预检未通过，请先检查采用包、批次匹配或建议版本内容。",
    targetBatchLabel: suggested.targetBatchLabel || current.targetBatchLabel || adoptionPacket?.targetBatchLabel || "",
    targetSafePreviewPath: adoptionPacket?.targetSafePreviewPath || sourcePaths.currentSafePreview || "",
    suggestedPreviewPath: adoptionPacket?.suggestedPreviewPath || sourcePaths.suggestedPreview || "",
    confirmation: {
      requiredPhrase: "确认写入安全预览确认块",
      phraseRequiredBeforeWrite: true,
    },
    nextAction: {
      actionId: "apply-manual-confirmation-safe-preview-write",
      label: "写入安全预览确认块",
      requiredPhrase: "确认写入安全预览确认块",
      summary: "写入后会读回安全预览记录，并重新检查正式写回门禁。",
    },
    writePlan: {
      targetPath: adoptionPacket?.targetSafePreviewPath || sourcePaths.currentSafePreview || "",
      sourcePath: adoptionPacket?.suggestedPreviewPath || sourcePaths.suggestedPreview || "",
      currentContentLength: normalizedCurrentMarkdown.length,
      suggestedContentLength: normalizedSuggestedMarkdown.length,
      contentLengthDelta: normalizedSuggestedMarkdown.length - normalizedCurrentMarkdown.length,
      currentLineCount: countLines(normalizedCurrentMarkdown),
      suggestedLineCount: countLines(normalizedSuggestedMarkdown),
      lineCountDelta:
        countLines(normalizedSuggestedMarkdown) - countLines(normalizedCurrentMarkdown),
      changedFieldCount,
      requiredPhrase: "确认写入安全预览确认块",
      postWriteChecks: [
        "写入后读回安全预览记录并校验内容一致。",
        "读回失败时恢复写入前内容。",
        "读回通过后重新检查正式写回门禁。",
      ],
    },
    before: {
      hasManualConfirmation: current.hasManualConfirmation,
      canProceedToFormalWrite: current.canProceedToFormalWrite,
      manualReviewConclusionValidation: current.manualReviewConclusionValidation,
    },
    after: {
      hasManualConfirmation: suggested.hasManualConfirmation,
      canProceedToFormalWrite: suggested.canProceedToFormalWrite,
      manualReviewConclusionValidation: suggested.manualReviewConclusionValidation,
    },
    targetMatches,
    changedFieldCount,
    fieldChanges,
    sourcePaths,
    safetyBoundary: "仅生成项目内写入预检，不写入 Obsidian，不执行正式写回。",
    nextChecks: [
      "人工确认预检结果后，才可将建议版本写入安全预览记录。",
      "写入后重新读取正式写回 readiness，确认状态是否进入 ready-to-formal-write。",
      "正式写回仍需再次人工确认后执行。",
    ],
  };
}

export function buildManualConfirmationSafePreviewWritePrecheckMarkdown(precheck) {
  const lines = [
    "# 安全预览确认写入预检",
    "",
    `- 预检状态：${precheck.ok ? "通过" : "需修正"}`,
    `- 状态码：${precheck.status}`,
    `- 摘要：${precheck.summary}`,
    `- 目标批次：${precheck.targetBatchLabel || "暂无"}`,
    `- 目标匹配：${precheck.targetMatches ? "是" : "否"}`,
    `- 变更字段数：${precheck.changedFieldCount}`,
    `- 写入后是否可进入正式写回复查：${precheck.after?.canProceedToFormalWrite ? "是" : "否"}`,
    `- 确认短语：${precheck.confirmation?.requiredPhrase || "确认写入安全预览确认块"}`,
    `- 推荐动作：${precheck.nextAction?.label || "待确认"}`,
    `- 安全边界：${precheck.safetyBoundary}`,
    "",
    "## 1. 写入来源",
    "",
    `- 当前安全预览：${precheck.targetSafePreviewPath || "暂无"}`,
    `- 建议版本预演：${precheck.suggestedPreviewPath || "暂无"}`,
    "",
    "## 2. 写入执行计划",
    "",
    `- 写入目标：${precheck.writePlan?.targetPath || "暂无"}`,
    `- 写入来源：${precheck.writePlan?.sourcePath || "暂无"}`,
    `- 当前内容长度：${precheck.writePlan?.currentContentLength ?? 0}`,
    `- 建议内容长度：${precheck.writePlan?.suggestedContentLength ?? 0}`,
    `- 内容长度变化：${precheck.writePlan?.contentLengthDelta ?? 0}`,
    `- 当前行数：${precheck.writePlan?.currentLineCount ?? 0}`,
    `- 建议行数：${precheck.writePlan?.suggestedLineCount ?? 0}`,
    `- 行数变化：${precheck.writePlan?.lineCountDelta ?? 0}`,
    `- 写入确认短语：${precheck.writePlan?.requiredPhrase || "确认写入安全预览确认块"}`,
    "",
    "## 3. 字段变化",
    "",
    "| 字段 | 写入前 | 写入后 | 是否变化 |",
    "| --- | --- | --- | --- |",
  ];

  precheck.fieldChanges.forEach((item) => {
    lines.push(
      `| ${item.label} | ${item.before || "空"} | ${item.after || "空"} | ${item.changed ? "是" : "否"} |`,
    );
  });

  lines.push("");
  lines.push("## 4. 写后校验");
  lines.push("");
  (precheck.writePlan?.postWriteChecks || []).forEach((item) => {
    lines.push(`- ${item}`);
  });

  lines.push("");
  lines.push("## 5. 后续复查");
  lines.push("");
  precheck.nextChecks.forEach((item) => {
    lines.push(`- ${item}`);
  });

  return lines.join("\n");
}
