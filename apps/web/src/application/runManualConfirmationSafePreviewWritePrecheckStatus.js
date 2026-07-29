import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildManualConfirmationSafePreviewWritePrecheck,
  buildManualConfirmationSafePreviewWritePrecheckMarkdown,
} from "../domain/review/buildManualConfirmationSafePreviewWritePrecheck.js";
import { readTextFile } from "../shared/fileSystem.js";
import { runManualConfirmationSafePreviewAdoptionPacketStatus } from "./runManualConfirmationSafePreviewAdoptionPacketStatus.js";

const __filename = fileURLToPath(import.meta.url);
const appRoot = join(dirname(__filename), "..", "..");
const outputDir = join(
  appRoot,
  "outputs",
  "batch-review-manual-safe-write-preview",
  "manual-confirmation-safe-preview-write-precheck",
);
const jsonPath = join(outputDir, "manual-confirmation-safe-preview-write-precheck.json");
const markdownPath = join(outputDir, "manual-confirmation-safe-preview-write-precheck.md");

export async function runManualConfirmationSafePreviewWritePrecheckStatus() {
  const adoptionPacket = await runManualConfirmationSafePreviewAdoptionPacketStatus();
  const [currentMarkdown, suggestedMarkdown] = await Promise.all([
    readTextFile(adoptionPacket.targetSafePreviewPath),
    readTextFile(adoptionPacket.suggestedPreviewPath),
  ]);
  const precheck = buildManualConfirmationSafePreviewWritePrecheck({
    currentMarkdown,
    suggestedMarkdown,
    adoptionPacket,
    sourcePaths: {
      currentSafePreview: adoptionPacket.targetSafePreviewPath,
      suggestedPreview: adoptionPacket.suggestedPreviewPath,
      adoptionPacket: adoptionPacket.sourcePaths?.markdown || "",
      json: jsonPath,
      markdown: markdownPath,
    },
  });
  const markdown = buildManualConfirmationSafePreviewWritePrecheckMarkdown(precheck);

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(precheck, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, `${markdown}\n`, "utf-8");

  return precheck;
}
