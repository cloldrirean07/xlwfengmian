import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildManualConfirmationDraftValidationMarkdown,
  validateManualConfirmationDraft,
} from "../src/domain/review/validateManualConfirmationDraft.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..");
const outputDir = join(appRoot, "outputs", "batch-review-manual-safe-write-preview");
const draftPath = join(outputDir, "manual-confirmation-draft.md");
const jsonPath = join(outputDir, "manual-confirmation-draft-validation.json");
const markdownPath = join(outputDir, "manual-confirmation-draft-validation.md");

async function main() {
  const sourceMarkdown = await readFile(draftPath, "utf-8");
  const result = validateManualConfirmationDraft(sourceMarkdown);
  const markdown = buildManualConfirmationDraftValidationMarkdown(result);

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, `${markdown}\n`, "utf-8");

  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        outputs: {
          json: jsonPath,
          markdown: markdownPath,
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
