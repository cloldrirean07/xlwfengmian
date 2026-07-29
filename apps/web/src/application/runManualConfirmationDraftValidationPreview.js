import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateManualConfirmationDraft } from "../domain/review/validateManualConfirmationDraft.js";

const __filename = fileURLToPath(import.meta.url);
const appRoot = join(dirname(__filename), "..", "..");
const draftPath = join(
  appRoot,
  "outputs",
  "batch-review-manual-safe-write-preview",
  "manual-confirmation-draft.md",
);

export async function runManualConfirmationDraftValidationPreview() {
  const sourceMarkdown = await readFile(draftPath, "utf-8");
  return {
    ...validateManualConfirmationDraft(sourceMarkdown),
    sourcePath: draftPath,
  };
}
