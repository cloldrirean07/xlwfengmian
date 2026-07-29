import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildManualConfirmationApplyPreview } from "../src/domain/review/buildManualConfirmationApplyPreview.js";
import {
  buildManualConfirmationHandoffPacket,
  buildManualConfirmationHandoffPacketMarkdown,
} from "../src/domain/review/buildManualConfirmationHandoffPacket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..");
const sourceDir = join(appRoot, "outputs", "batch-review-manual-safe-write-preview");
const outputDir = join(sourceDir, "manual-confirmation-handoff-packet");
const safeWritePreviewPath = join(sourceDir, "batch-review-manual-safe-write-preview.md");
const draftPath = join(sourceDir, "manual-confirmation-draft.md");
const jsonPath = join(outputDir, "manual-confirmation-handoff-packet.json");
const markdownPath = join(outputDir, "manual-confirmation-handoff-packet.md");

async function main() {
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
  const markdown = buildManualConfirmationHandoffPacketMarkdown(packet);

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(packet, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, `${markdown}\n`, "utf-8");

  console.log(
    JSON.stringify(
      {
        ok: packet.ok,
        status: packet.status,
        outputs: {
          json: jsonPath,
          markdown: markdownPath,
        },
        summary: packet.summary,
      },
      null,
      2,
    ),
  );

  if (!packet.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
