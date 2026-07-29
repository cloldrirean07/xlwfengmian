import { parseBatchReviewManualSafeWritePreviewNote } from "./parseBatchReviewManualSafeWritePreviewNote.js";
import {
  extractManualConfirmationDraftBlocks,
  validateManualConfirmationDraft,
} from "./validateManualConfirmationDraft.js";

function stripManualConfirmationSection(markdown = "") {
  const source = String(markdown || "").trimEnd();
  const startIndex = source.search(/\n## 4\. 人工补充/u);

  if (startIndex < 0) {
    return source;
  }

  const rest = source.slice(startIndex + 1);
  const nextSectionIndex = rest.search(/\n##\s+(?!4\. 人工补充)/u);

  if (nextSectionIndex < 0) {
    return source.slice(0, startIndex).trimEnd();
  }

  return `${source.slice(0, startIndex).trimEnd()}\n\n${rest.slice(nextSectionIndex + 1).trimStart()}`.trimEnd();
}

function buildVariant({ baseMarkdown, block }) {
  const markdown = `${stripManualConfirmationSection(baseMarkdown)}\n\n${block.markdown.trim()}\n`;
  const parsed = parseBatchReviewManualSafeWritePreviewNote(markdown);
  const ok = parsed.canProceedToFormalWrite === block.expectedCanProceedToFormalWrite;

  return {
    key: block.key,
    label: block.label,
    ok,
    expectedCanProceedToFormalWrite: block.expectedCanProceedToFormalWrite,
    canProceedToFormalWrite: parsed.canProceedToFormalWrite,
    hasManualConfirmation: parsed.hasManualConfirmation,
    targetBatchLabel: parsed.targetBatchLabel,
    targetPath: parsed.targetPath,
    patchSourceLabel: parsed.patchSourceLabel,
    manualReviewConclusionValidation: parsed.manualReviewConclusionValidation,
    confirmedLines: parsed.parsed?.confirmedLines || "",
    stillNeedsEdit: parsed.parsed?.stillNeedsEdit || "",
    readyDecision: parsed.parsed?.readyDecision || "",
    manualReviewConclusion: parsed.manualReviewConclusion,
    markdown,
  };
}

export function buildManualConfirmationApplyPreview({
  safeWriteMarkdown = "",
  draftMarkdown = "",
} = {}) {
  const draftValidation = validateManualConfirmationDraft(draftMarkdown);
  const blocks = extractManualConfirmationDraftBlocks(draftMarkdown);
  const variants = blocks.map((block) =>
    buildVariant({
      baseMarkdown: safeWriteMarkdown,
      block,
    }),
  );

  return {
    ok: draftValidation.ok && variants.every((variant) => variant.ok),
    summary:
      draftValidation.ok && variants.every((variant) => variant.ok)
        ? "人工确认写入前预演通过。建议版本会打开门禁，保守版本会保持门禁锁定。"
        : "人工确认写入前预演未通过，请先修正草稿或安全写回预览。",
    draftValidation,
    variants,
    safetyBoundary: "仅生成项目内预演副本，不写入 Obsidian，不执行正式写回。",
  };
}

export function buildManualConfirmationApplyPreviewMarkdown(result) {
  const lines = [
    "# 人工确认写入前预演报告",
    "",
    `- 预演结论：${result.ok ? "通过" : "需修正"}`,
    `- 摘要：${result.summary}`,
    `- 安全边界：${result.safetyBoundary}`,
    "",
    "## 1. 预演结果",
    "",
  ];

  result.variants.forEach((variant) => {
    lines.push(`### ${variant.label}`);
    lines.push(`- 验证状态：${variant.ok ? "通过" : "需修正"}`);
    lines.push(`- 预期是否放行：${variant.expectedCanProceedToFormalWrite ? "是" : "否"}`);
    lines.push(`- 合并后是否放行：${variant.canProceedToFormalWrite ? "是" : "否"}`);
    lines.push(`- 是否包含人工确认：${variant.hasManualConfirmation ? "是" : "否"}`);
    lines.push(
      `- 人工复盘结论校验：${variant.manualReviewConclusionValidation.ok ? "通过" : variant.manualReviewConclusionValidation.message}`,
    );
    lines.push(`- 仍需手改：${variant.stillNeedsEdit || "无"}`);
    lines.push(`- 正式写回许可：${variant.readyDecision || "未填写"}`);
    lines.push("");
  });

  lines.push("## 2. 下一步");
  lines.push("");
  lines.push(
    result.ok
      ? "如需进入正式写回，仍需人工确认采用建议版本，并先写入安全预览记录后重新检查门禁。"
      : "当前预演结果不足以支撑安全写回，请先修正人工确认草稿。",
  );

  return lines.join("\n");
}
