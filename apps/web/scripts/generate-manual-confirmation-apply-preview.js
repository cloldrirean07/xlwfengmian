import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildManualConfirmationApplyPreview,
  buildManualConfirmationApplyPreviewMarkdown,
} from "../src/domain/review/buildManualConfirmationApplyPreview.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..");
const sourceDir = join(appRoot, "outputs", "batch-review-manual-safe-write-preview");
const outputDir = join(sourceDir, "manual-confirmation-apply-preview");
const safeWritePreviewPath = join(sourceDir, "batch-review-manual-safe-write-preview.md");
const draftPath = join(sourceDir, "manual-confirmation-draft.md");
const jsonPath = join(outputDir, "manual-confirmation-apply-preview.json");
const markdownPath = join(outputDir, "manual-confirmation-apply-preview.md");

const variantFileMap = {
  suggested: "suggested-safe-write-preview.md",
  conservative: "conservative-safe-write-preview.md",
};

async function main() {
  const [safeWriteMarkdown, draftMarkdown] = await Promise.all([
    readFile(safeWritePreviewPath, "utf-8"),
    readFile(draftPath, "utf-8"),
  ]);
  const result = buildManualConfirmationApplyPreview({
    safeWriteMarkdown,
    draftMarkdown,
  });
  const reportMarkdown = buildManualConfirmationApplyPreviewMarkdown(result);

  await mkdir(outputDir, { recursive: true });

  await Promise.all(
    result.variants.map((variant) =>
      writeFile(join(outputDir, variantFileMap[variant.key]), variant.markdown, "utf-8"),
    ),
  );

  await writeFile(
    jsonPath,
    `${JSON.stringify(
      {
        ...result,
        variants: result.variants.map(({ markdown, ...variant }) => ({
          ...variant,
          outputPath: join(outputDir, variantFileMap[variant.key]),
        })),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  await writeFile(markdownPath, `${reportMarkdown}\n`, "utf-8");

  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        outputs: {
          report: markdownPath,
          json: jsonPath,
          variants: Object.fromEntries(
            result.variants.map((variant) => [
              variant.key,
              join(outputDir, variantFileMap[variant.key]),
            ]),
          ),
        },
        summary: result.summary,
      },
      null,
      2,
    ),
  );

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
