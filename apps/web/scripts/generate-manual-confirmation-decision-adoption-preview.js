import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildManualConfirmationDecisionAdoptionPreview,
  buildManualConfirmationDecisionAdoptionPreviewMarkdown,
} from "../src/domain/review/buildManualConfirmationDecisionAdoptionPreview.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..");
const sourceDir = join(appRoot, "outputs", "batch-review-manual-safe-write-preview");
const decisionDir = join(sourceDir, "manual-confirmation-decision");
const handoffDir = join(sourceDir, "manual-confirmation-handoff-packet");
const outputDir = join(sourceDir, "manual-confirmation-decision-adoption-preview");
const decisionPath = join(decisionDir, "manual-confirmation-decision.md");
const handoffJsonPath = join(handoffDir, "manual-confirmation-handoff-packet.json");
const jsonPath = join(outputDir, "manual-confirmation-decision-adoption-preview.json");
const markdownPath = join(outputDir, "manual-confirmation-decision-adoption-preview.md");

async function main() {
  const [decisionMarkdown, handoffPacket] = await Promise.all([
    readFile(decisionPath, "utf-8"),
    readFile(handoffJsonPath, "utf-8").then((content) => JSON.parse(content)),
  ]);
  const preview = buildManualConfirmationDecisionAdoptionPreview({
    decisionMarkdown,
    handoffPacket,
  });
  const markdown = buildManualConfirmationDecisionAdoptionPreviewMarkdown(preview);

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, `${markdown}\n`, "utf-8");

  console.log(
    JSON.stringify(
      {
        ok: preview.ok,
        status: preview.status,
        canProceedToSafePreviewWriteAfterAdoption: preview.canProceedToSafePreviewWriteAfterAdoption,
        outputs: {
          json: jsonPath,
          markdown: markdownPath,
        },
        summary: preview.summary,
      },
      null,
      2,
    ),
  );

  if (!preview.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
