import { join } from "node:path";
import { buildObsidianBatchReviewManualSafeWritePreviewRecord } from "../domain/review/buildObsidianBatchReviewManualSafeWritePreviewRecord.js";
import { resolveObsidianRoot } from "../infrastructure/obsidian/resolveObsidianRoot.js";

const defaultOutputDir = "05_验证与实验/批次试跑记录/人工复盘安全写回预览";
const confirmationFieldLabelMap = {
  bottleneckStep: "这批案例最卡的环节",
  prioritizedModule: "哪个按钮或模块最该前置",
  issueType: "当前更像功能问题，还是界面问题",
  batchCriticalConclusion: "这批试跑最关键的结论",
  nextBatchSameTrack: "下一批还要不要继续同样赛道",
  uiOptimizationTiming: "UI 优化是否已经到时机",
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function buildConfirmationHints(patch = {}) {
  const confirmedLinesHint = Object.entries(confirmationFieldLabelMap)
    .filter(([key]) => String(patch[key] || "").trim())
    .map(([, label]) => label)
    .join(" / ");

  return {
    manualConclusionHint:
      patch.patchSource === "suggested-draft"
        ? "本轮采用系统建议初稿作为安全预览，人工确认后再进入正式写回。"
        : "本轮已包含人工填写内容，确认改写结果可代表真实试跑观察。",
    confirmedLinesHint: confirmedLinesHint || "先列出本次拟写回字段中已认可的字段",
    stillNeedsEditHint:
      patch.patchSource === "suggested-draft"
        ? "建议稿中仍不准确的内容，请填写对应字段名"
        : "如需继续微调，请填写仍需调整的字段名",
    readyDecisionHint:
      patch.patchSource === "suggested-draft"
        ? "建议稿可接受，且“仍需手改”为空时，可填写“可以”"
        : "当前版本无须再改，且“仍需手改”为空时，可填写“可以”",
  };
}

export function createBatchReviewManualSafeWritePreviewObsidianPreview({
  safeWritePreviewMarkdown,
  patch = null,
  obsidianRoot = "",
}) {
  if (!safeWritePreviewMarkdown) {
    throw new Error(
      'createBatchReviewManualSafeWritePreviewObsidianPreview requires "safeWritePreviewMarkdown".',
    );
  }

  const generatedDate = getDateStamp();
  const resolvedObsidianRoot = resolveObsidianRoot(obsidianRoot);
  const sourceMarkdownPath = join(
    process.cwd(),
    "outputs",
    "batch-review-manual-safe-write-preview",
    "batch-review-manual-safe-write-preview.md",
  );
  const targetDir = join(resolvedObsidianRoot, defaultOutputDir);
  const targetPath = join(targetDir, `真实批次试跑记录安全写回预览_${generatedDate}.md`);
  const markdown = buildObsidianBatchReviewManualSafeWritePreviewRecord({
    generatedDate,
    sourceMarkdownPath,
    safeWritePreviewMarkdown,
    confirmationHints: buildConfirmationHints(patch || {}),
  });

  return {
    generatedDate,
    sourceMarkdownPath,
    targetDir,
    targetPath,
    markdown,
  };
}
