import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildManualConfirmationApplyPreview } from "../domain/review/buildManualConfirmationApplyPreview.js";

const __filename = fileURLToPath(import.meta.url);
const appRoot = join(dirname(__filename), "..", "..");
const sourceDir = join(appRoot, "outputs", "batch-review-manual-safe-write-preview");
const outputDir = join(sourceDir, "manual-confirmation-apply-preview");
const safeWritePreviewPath = join(sourceDir, "batch-review-manual-safe-write-preview.md");
const draftPath = join(sourceDir, "manual-confirmation-draft.md");

const variantFileMap = {
  suggested: "suggested-safe-write-preview.md",
  conservative: "conservative-safe-write-preview.md",
};

export async function runManualConfirmationApplyPreviewStatus() {
  const [safeWriteMarkdown, draftMarkdown] = await Promise.all([
    readFile(safeWritePreviewPath, "utf-8"),
    readFile(draftPath, "utf-8"),
  ]);
  const result = buildManualConfirmationApplyPreview({
    safeWriteMarkdown,
    draftMarkdown,
  });

  return {
    ok: result.ok,
    summary: result.summary,
    safetyBoundary: result.safetyBoundary,
    sourcePaths: {
      safeWritePreview: safeWritePreviewPath,
      manualConfirmationDraft: draftPath,
    },
    variants: result.variants.map(({ markdown, ...variant }) => ({
      ...variant,
      outputPath: join(outputDir, variantFileMap[variant.key]),
    })),
  };
}
