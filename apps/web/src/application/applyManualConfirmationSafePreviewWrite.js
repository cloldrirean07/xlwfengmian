import { readTextFile, writeTextFile } from "../shared/fileSystem.js";
import { runManualConfirmationSafePreviewWritePrecheckStatus } from "./runManualConfirmationSafePreviewWritePrecheckStatus.js";

export const MANUAL_CONFIRMATION_SAFE_PREVIEW_WRITE_PHRASE = "确认写入安全预览确认块";

function assertReadyPrecheck(precheck) {
  if (!precheck?.ok || precheck.status !== "safe-preview-write-precheck-ready") {
    throw new Error(precheck?.summary || "安全预览确认写入预检未通过。");
  }

  if (!precheck.targetSafePreviewPath) {
    throw new Error("缺少安全预览记录路径，无法写入确认块。");
  }

  if (!precheck.suggestedPreviewPath) {
    throw new Error("缺少建议版本预演路径，无法写入确认块。");
  }
}

export async function applyManualConfirmationSafePreviewWrite({
  confirmationPhrase = "",
  fileSystem = { readTextFile, writeTextFile },
  runPrecheckStatus = runManualConfirmationSafePreviewWritePrecheckStatus,
} = {}) {
  if (String(confirmationPhrase || "").trim() !== MANUAL_CONFIRMATION_SAFE_PREVIEW_WRITE_PHRASE) {
    throw new Error(`请输入确认短语：${MANUAL_CONFIRMATION_SAFE_PREVIEW_WRITE_PHRASE}`);
  }

  const precheck = await runPrecheckStatus();
  assertReadyPrecheck(precheck);

  const previousMarkdown = await fileSystem.readTextFile(precheck.targetSafePreviewPath);
  const suggestedMarkdown = await fileSystem.readTextFile(precheck.suggestedPreviewPath);
  const finalMarkdown = `${String(suggestedMarkdown || "").trimEnd()}\n`;
  const appliedAt = new Date().toISOString();

  await fileSystem.writeTextFile(precheck.targetSafePreviewPath, finalMarkdown);

  const persistedMarkdown = await fileSystem.readTextFile(precheck.targetSafePreviewPath);
  const matchedExpectedContent = persistedMarkdown === finalMarkdown;

  if (!matchedExpectedContent) {
    await fileSystem.writeTextFile(precheck.targetSafePreviewPath, previousMarkdown);
    throw new Error("确认块写入后读回校验失败，已恢复写入前内容。");
  }

  return {
    ok: true,
    status: "safe-preview-confirmation-applied",
    summary: "安全预览确认块已写入，可重新检查正式写回门禁。",
    appliedAt,
    targetBatchLabel: precheck.targetBatchLabel || "",
    targetSafePreviewPath: precheck.targetSafePreviewPath,
    suggestedPreviewPath: precheck.suggestedPreviewPath,
    changedFieldCount: precheck.changedFieldCount || 0,
    readback: {
      ok: matchedExpectedContent,
      matchedExpectedContent,
    },
    nextChecks: [
      "重新检查正式写回门禁。",
      "门禁通过后，再由人工确认是否执行正式写回。",
    ],
  };
}
