import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildManualConfirmationDecisionTemplate,
  buildManualConfirmationDecisionValidationMarkdown,
  validateManualConfirmationDecision,
} from "../src/domain/review/validateManualConfirmationDecision.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..");
const sourceDir = join(appRoot, "outputs", "batch-review-manual-safe-write-preview");
const handoffDir = join(sourceDir, "manual-confirmation-handoff-packet");
const outputDir = join(sourceDir, "manual-confirmation-decision");
const handoffJsonPath = join(handoffDir, "manual-confirmation-handoff-packet.json");
const handoffMarkdownPath = join(handoffDir, "manual-confirmation-handoff-packet.md");
const decisionPath = join(outputDir, "manual-confirmation-decision.md");
const validationJsonPath = join(outputDir, "manual-confirmation-decision-validation.json");
const validationMarkdownPath = join(outputDir, "manual-confirmation-decision-validation.md");

async function main() {
  const handoffPacket = JSON.parse(await readFile(handoffJsonPath, "utf-8"));
  const decisionMarkdown = buildManualConfirmationDecisionTemplate({
    handoffPacket,
    sourcePaths: {
      manualConfirmationHandoffPacket: handoffMarkdownPath,
    },
  });
  const validation = validateManualConfirmationDecision(decisionMarkdown, { handoffPacket });
  const validationMarkdown = buildManualConfirmationDecisionValidationMarkdown(validation);

  await mkdir(outputDir, { recursive: true });
  await writeFile(decisionPath, `${decisionMarkdown}\n`, "utf-8");
  await writeFile(validationJsonPath, `${JSON.stringify(validation, null, 2)}\n`, "utf-8");
  await writeFile(validationMarkdownPath, `${validationMarkdown}\n`, "utf-8");

  console.log(
    JSON.stringify(
      {
        ok: validation.ok,
        status: validation.status,
        canProceedToSafePreviewWrite: validation.canProceedToSafePreviewWrite,
        outputs: {
          decision: decisionPath,
          validationJson: validationJsonPath,
          validationMarkdown: validationMarkdownPath,
        },
        summary: validation.summary,
      },
      null,
      2,
    ),
  );

  if (!validation.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
