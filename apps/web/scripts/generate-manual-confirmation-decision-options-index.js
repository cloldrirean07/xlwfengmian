import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildManualConfirmationDecisionOptionsIndex,
  buildManualConfirmationDecisionOptionsIndexMarkdown,
} from "../src/domain/review/buildManualConfirmationDecisionOptionsIndex.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..");
const sourceDir = join(appRoot, "outputs", "batch-review-manual-safe-write-preview");
const outputDir = join(sourceDir, "manual-confirmation-decision-options-index");
const jsonPath = join(outputDir, "manual-confirmation-decision-options-index.json");
const markdownPath = join(outputDir, "manual-confirmation-decision-options-index.md");
const adoptionPacketMarkdownPath = join(
  sourceDir,
  "manual-confirmation-decision-adoption-packet",
  "manual-confirmation-decision-adoption-packet.md",
);
const rejectionPacketMarkdownPath = join(
  sourceDir,
  "manual-confirmation-decision-rejection-packet",
  "manual-confirmation-decision-rejection-packet.md",
);

async function readJson(path) {
  return readFile(path, "utf-8").then((content) => JSON.parse(content));
}

async function main() {
  const [
    decision,
    adoptionPreview,
    adoptionPacket,
    rejectionPreview,
    rejectionPacket,
  ] = await Promise.all([
    readJson(join(sourceDir, "manual-confirmation-decision", "manual-confirmation-decision-validation.json")),
    readJson(join(sourceDir, "manual-confirmation-decision-adoption-preview", "manual-confirmation-decision-adoption-preview.json")),
    readJson(join(sourceDir, "manual-confirmation-decision-adoption-packet", "manual-confirmation-decision-adoption-packet.json")).then((packet) => ({
      ...packet,
      outputPaths: {
        ...(packet.outputPaths || {}),
        markdown: packet.outputPaths?.markdown || adoptionPacketMarkdownPath,
      },
    })),
    readJson(join(sourceDir, "manual-confirmation-decision-rejection-preview", "manual-confirmation-decision-rejection-preview.json")),
    readJson(join(sourceDir, "manual-confirmation-decision-rejection-packet", "manual-confirmation-decision-rejection-packet.json")).then((packet) => ({
      ...packet,
      outputPaths: {
        ...(packet.outputPaths || {}),
        markdown: packet.outputPaths?.markdown || rejectionPacketMarkdownPath,
      },
    })),
  ]);
  const index = buildManualConfirmationDecisionOptionsIndex({
    decision,
    adoptionPreview,
    adoptionPacket,
    adoptionPacketPath: adoptionPacketMarkdownPath,
    rejectionPreview,
    rejectionPacket,
    rejectionPacketPath: rejectionPacketMarkdownPath,
    outputPaths: {
      json: jsonPath,
      markdown: markdownPath,
    },
  });
  const markdown = buildManualConfirmationDecisionOptionsIndexMarkdown(index);

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(index, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, `${markdown}\n`, "utf-8");

  console.log(
    JSON.stringify(
      {
        ok: index.ok,
        status: index.status,
        decisionStatus: index.decisionStatus,
        outputs: {
          json: jsonPath,
          markdown: markdownPath,
        },
        summary: index.summary,
      },
      null,
      2,
    ),
  );

  if (!index.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
