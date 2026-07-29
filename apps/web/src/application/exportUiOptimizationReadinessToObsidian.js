import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readTextFile, writeTextFile } from "../shared/fileSystem.js";
import { runUiOptimizationReadinessPreview } from "./runUiOptimizationReadinessPreview.js";

function buildExportId() {
  return `UIR-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
}

export async function exportUiOptimizationReadinessToObsidian({
  obsidianRoot = "",
} = {}) {
  const preview = await runUiOptimizationReadinessPreview({ obsidianRoot });
  const exportId = buildExportId();
  const sourceDir = join(process.cwd(), "outputs", "ui-readiness");
  const sourceJsonPath = join(sourceDir, "ui-readiness-report.json");
  const sourceMarkdownPath = join(sourceDir, "ui-readiness-report.md");
  const targetPath = preview.obsidianDraft.targetPath;
  const expectedContent = `${preview.obsidianDraft.markdown}\n`;

  await mkdir(sourceDir, { recursive: true });
  await writeTextFile(sourceJsonPath, `${JSON.stringify(preview, null, 2)}\n`);
  await writeTextFile(sourceMarkdownPath, `${preview.readinessMarkdown}\n`);
  await writeTextFile(targetPath, expectedContent);
  const persistedContent = await readTextFile(targetPath);
  const exportedAt = new Date().toISOString();

  const logDir = join(
    process.cwd(),
    "outputs",
    "obsidian-export-logs",
    "ui-readiness",
  );
  const logPath = join(logDir, `${exportId}.json`);
  await mkdir(logDir, { recursive: true });
  await writeFile(
    logPath,
    `${JSON.stringify(
      {
        exportId,
        exportedAt,
        targetPath,
        sourceMarkdownPath,
        sourceJsonPath,
        readback: {
          ok: persistedContent === expectedContent,
          matchedExpectedContent: persistedContent === expectedContent,
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );

  return {
    ok: true,
    exportId,
    exportedAt,
    targetPath,
    sourceMarkdownPath,
    sourceJsonPath,
    obsidianDraft: preview.obsidianDraft,
    readback: {
      ok: persistedContent === expectedContent,
      matchedExpectedContent: persistedContent === expectedContent,
    },
    report: preview.report,
    readinessMarkdown: preview.readinessMarkdown,
  };
}
