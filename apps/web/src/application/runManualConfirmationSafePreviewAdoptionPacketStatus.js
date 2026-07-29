import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildManualConfirmationSafePreviewAdoptionPacket,
  buildManualConfirmationSafePreviewAdoptionPacketMarkdown,
} from "../domain/review/buildManualConfirmationSafePreviewAdoptionPacket.js";
import { loadLatestBatchReviewManualSafeWritePreviewStatus } from "./loadLatestBatchReviewManualSafeWritePreviewStatus.js";
import { runManualConfirmationApplyPreviewStatus } from "./runManualConfirmationApplyPreviewStatus.js";
import { runManualConfirmationDecisionStatus } from "./runManualConfirmationDecisionStatus.js";

const __filename = fileURLToPath(import.meta.url);
const appRoot = join(dirname(__filename), "..", "..");
const outputDir = join(
  appRoot,
  "outputs",
  "batch-review-manual-safe-write-preview",
  "manual-confirmation-safe-preview-adoption-packet",
);
const jsonPath = join(outputDir, "manual-confirmation-safe-preview-adoption-packet.json");
const markdownPath = join(outputDir, "manual-confirmation-safe-preview-adoption-packet.md");

export async function runManualConfirmationSafePreviewAdoptionPacketStatus() {
  const [applyPreview, decision, latestSafeWriteStatus] = await Promise.all([
    runManualConfirmationApplyPreviewStatus(),
    runManualConfirmationDecisionStatus(),
    loadLatestBatchReviewManualSafeWritePreviewStatus(),
  ]);
  const packet = buildManualConfirmationSafePreviewAdoptionPacket({
    applyPreview,
    decision,
    sourcePaths: {
      latestSafeWritePreview: latestSafeWriteStatus?.targetPath || "",
      applyPreview: applyPreview?.sourcePaths?.safeWritePreview || "",
      manualConfirmationDraft: applyPreview?.sourcePaths?.manualConfirmationDraft || "",
      decision: decision?.outputPaths?.decision || decision?.sourcePath || "",
      json: jsonPath,
      markdown: markdownPath,
    },
  });
  const markdown = buildManualConfirmationSafePreviewAdoptionPacketMarkdown(packet);

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(packet, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, `${markdown}\n`, "utf-8");

  return packet;
}
