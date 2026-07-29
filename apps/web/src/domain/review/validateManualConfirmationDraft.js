import { parseBatchReviewManualSafeWritePreviewNote } from "./parseBatchReviewManualSafeWritePreviewNote.js";

const draftBlockDefinitions = [
  {
    key: "suggested",
    label: "建议填写块",
    heading: "## 1. 建议填写块",
    expectedCanProceedToFormalWrite: true,
  },
  {
    key: "conservative",
    label: "保守填写块",
    heading: "## 2. 保守填写块",
    expectedCanProceedToFormalWrite: false,
  },
];

function extractFirstMarkdownFence(section = "") {
  const fenceStart = section.indexOf("```markdown");
  if (fenceStart < 0) {
    return "";
  }

  const contentStart = fenceStart + "```markdown".length;
  const fenceEnd = section.indexOf("```", contentStart);
  if (fenceEnd < 0) {
    return "";
  }

  return section.slice(contentStart, fenceEnd).trim();
}

function extractHeadingSection(markdown = "", heading = "", nextHeading = "") {
  const startIndex = markdown.indexOf(heading);
  if (startIndex < 0) {
    return "";
  }

  const contentStart = startIndex + heading.length;
  const rest = markdown.slice(contentStart);
  const endIndex = nextHeading ? rest.indexOf(nextHeading) : -1;

  return (endIndex >= 0 ? rest.slice(0, endIndex) : rest).trim();
}

export function extractManualConfirmationDraftBlocks(sourceMarkdown = "") {
  return draftBlockDefinitions.map((definition, index) => {
    const section = extractHeadingSection(
      sourceMarkdown,
      definition.heading,
      draftBlockDefinitions[index + 1]?.heading || "## 3.",
    );

    return {
      key: definition.key,
      label: definition.label,
      markdown: extractFirstMarkdownFence(section),
      expectedCanProceedToFormalWrite: definition.expectedCanProceedToFormalWrite,
    };
  });
}

function validateDraftBlock({ sourceMarkdown, definition, nextHeading }) {
  const section = extractHeadingSection(sourceMarkdown, definition.heading, nextHeading);
  const markdown = extractFirstMarkdownFence(section);
  const parsed = parseBatchReviewManualSafeWritePreviewNote(markdown);
  const ok = parsed.canProceedToFormalWrite === definition.expectedCanProceedToFormalWrite;

  return {
    key: definition.key,
    label: definition.label,
    ok,
    expectedCanProceedToFormalWrite: definition.expectedCanProceedToFormalWrite,
    canProceedToFormalWrite: parsed.canProceedToFormalWrite,
    hasManualConfirmation: parsed.hasManualConfirmation,
    manualReviewConclusionValidation: parsed.manualReviewConclusionValidation,
    readyDecision: parsed.parsed?.readyDecision || "",
    stillNeedsEdit: parsed.parsed?.stillNeedsEdit || "",
    confirmedLines: parsed.parsed?.confirmedLines || "",
    manualReviewConclusion: parsed.manualReviewConclusion,
  };
}

export function validateManualConfirmationDraft(sourceMarkdown = "") {
  const blocks = draftBlockDefinitions.map((definition, index) =>
    validateDraftBlock({
      sourceMarkdown,
      definition,
      nextHeading: draftBlockDefinitions[index + 1]?.heading || "## 3.",
    }),
  );

  return {
    ok: blocks.every((block) => block.ok),
    blocks,
    summary: blocks.every((block) => block.ok)
      ? "人工确认草稿门禁效果符合预期。"
      : "人工确认草稿门禁效果与预期不一致，请先修正草稿。",
  };
}

export function buildManualConfirmationDraftValidationMarkdown(result) {
  const lines = [
    "# 人工确认草稿门禁验证报告",
    "",
    `- 验证结论：${result.ok ? "通过" : "需修正"}`,
    `- 摘要：${result.summary}`,
    "",
    "## 1. 分块结果",
    "",
  ];

  result.blocks.forEach((block) => {
    lines.push(`### ${block.label}`);
    lines.push(`- 验证状态：${block.ok ? "通过" : "需修正"}`);
    lines.push(`- 预期是否放行：${block.expectedCanProceedToFormalWrite ? "是" : "否"}`);
    lines.push(`- 实际是否放行：${block.canProceedToFormalWrite ? "是" : "否"}`);
    lines.push(`- 是否包含人工确认：${block.hasManualConfirmation ? "是" : "否"}`);
    lines.push(
      `- 人工复盘结论校验：${block.manualReviewConclusionValidation.ok ? "通过" : block.manualReviewConclusionValidation.message}`,
    );
    lines.push(`- 仍需手改：${block.stillNeedsEdit || "无"}`);
    lines.push(`- 正式写回许可：${block.readyDecision || "未填写"}`);
    lines.push("");
  });

  lines.push("## 2. 结论");
  lines.push("");
  lines.push(
    result.ok
      ? "建议填写块会打开正式写回门禁，保守填写块会保持门禁锁定。正式写入前仍需要人工确认采用哪个版本。"
      : "当前草稿的门禁效果不稳定，暂不建议写入安全预览。",
  );

  return lines.join("\n");
}
