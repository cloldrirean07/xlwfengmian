import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildManualConfirmationApplyPreview } from "../domain/review/buildManualConfirmationApplyPreview.js";
import { buildManualConfirmationHandoffPacket } from "../domain/review/buildManualConfirmationHandoffPacket.js";

const __filename = fileURLToPath(import.meta.url);
const appRoot = join(dirname(__filename), "..", "..");
const sourceDir = join(appRoot, "outputs", "batch-review-manual-safe-write-preview");
const outputDir = join(sourceDir, "manual-confirmation-handoff-packet");
const safeWritePreviewPath = join(sourceDir, "batch-review-manual-safe-write-preview.md");
const draftPath = join(sourceDir, "manual-confirmation-draft.md");

export async function runManualConfirmationHandoffPacketStatus() {
  const [safeWriteMarkdown, draftMarkdown] = await Promise.all([
    readFile(safeWritePreviewPath, "utf-8"),
    readFile(draftPath, "utf-8"),
  ]);
  const applyPreview = buildManualConfirmationApplyPreview({
    safeWriteMarkdown,
    draftMarkdown,
  });
  const packet = buildManualConfirmationHandoffPacket({
    applyPreview,
    draftMarkdown,
    sourcePaths: {
      safeWritePreview: safeWritePreviewPath,
      manualConfirmationDraft: draftPath,
    },
  });

  return {
    ...packet,
    outputPaths: {
      json: join(outputDir, "manual-confirmation-handoff-packet.json"),
      markdown: join(outputDir, "manual-confirmation-handoff-packet.md"),
    },
  };
}
