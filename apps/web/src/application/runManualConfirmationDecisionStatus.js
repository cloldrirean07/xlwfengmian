import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildManualConfirmationDecisionValidationMarkdown,
  validateManualConfirmationDecision,
} from "../domain/review/validateManualConfirmationDecision.js";

const __filename = fileURLToPath(import.meta.url);
const appRoot = join(dirname(__filename), "..", "..");
const sourceDir = join(appRoot, "outputs", "batch-review-manual-safe-write-preview");
const decisionDir = join(sourceDir, "manual-confirmation-decision");
const handoffDir = join(sourceDir, "manual-confirmation-handoff-packet");
const decisionPath = join(decisionDir, "manual-confirmation-decision.md");
const handoffJsonPath = join(handoffDir, "manual-confirmation-handoff-packet.json");

export async function runManualConfirmationDecisionStatus() {
  const [decisionMarkdown, handoffPacket] = await Promise.all([
    readFile(decisionPath, "utf-8"),
    readFile(handoffJsonPath, "utf-8").then((content) => JSON.parse(content)),
  ]);
  const validation = validateManualConfirmationDecision(decisionMarkdown, { handoffPacket });

  return {
    ...validation,
    validationMarkdown: buildManualConfirmationDecisionValidationMarkdown(validation),
    sourcePath: decisionPath,
    outputPaths: {
      decision: decisionPath,
      handoffPacket: handoffJsonPath,
      validationJson: join(decisionDir, "manual-confirmation-decision-validation.json"),
      validationMarkdown: join(decisionDir, "manual-confirmation-decision-validation.md"),
    },
  };
}
