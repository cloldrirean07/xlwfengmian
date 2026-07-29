import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildManualConfirmationDecisionAdoptionPreview,
  buildManualConfirmationDecisionAdoptionPreviewMarkdown,
} from "../domain/review/buildManualConfirmationDecisionAdoptionPreview.js";

const __filename = fileURLToPath(import.meta.url);
const appRoot = join(dirname(__filename), "..", "..");
const sourceDir = join(appRoot, "outputs", "batch-review-manual-safe-write-preview");
const decisionDir = join(sourceDir, "manual-confirmation-decision");
const handoffDir = join(sourceDir, "manual-confirmation-handoff-packet");
const outputDir = join(sourceDir, "manual-confirmation-decision-adoption-preview");
const decisionPath = join(decisionDir, "manual-confirmation-decision.md");
const handoffJsonPath = join(handoffDir, "manual-confirmation-handoff-packet.json");

export async function runManualConfirmationDecisionAdoptionPreviewStatus() {
  const [decisionMarkdown, handoffPacket] = await Promise.all([
    readFile(decisionPath, "utf-8"),
    readFile(handoffJsonPath, "utf-8").then((content) => JSON.parse(content)),
  ]);
  const preview = buildManualConfirmationDecisionAdoptionPreview({
    decisionMarkdown,
    handoffPacket,
  });

  return {
    ...preview,
    previewMarkdown: buildManualConfirmationDecisionAdoptionPreviewMarkdown(preview),
    outputPaths: {
      json: join(outputDir, "manual-confirmation-decision-adoption-preview.json"),
      markdown: join(outputDir, "manual-confirmation-decision-adoption-preview.md"),
    },
  };
}
