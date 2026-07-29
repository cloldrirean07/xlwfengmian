import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildObsidianReviewedMisclassifiedExportRecord } from "../src/domain/refinement/buildObsidianReviewedMisclassifiedExportRecord.js";
import { resolveObsidianRoot } from "../src/infrastructure/obsidian/resolveObsidianRoot.js";
import { writeTextFile } from "../src/shared/fileSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const appRoot = join(__dirname, "..");

function getArgValue(args, name) {
  const target = `--${name}`;
  const index = args.indexOf(target);
  return index >= 0 ? args[index + 1] : "";
}

function resolveGeneratedDate(value) {
  return value || new Date().toISOString().slice(0, 10);
}

async function main() {
  const args = process.argv.slice(2);
  const generatedDate = resolveGeneratedDate(getArgValue(args, "date"));
  const obsidianRoot = resolveObsidianRoot(getArgValue(args, "obsidian-root"));
  const sourceMarkdownPath = join(
    appRoot,
    "outputs",
    "reports",
    "reviewed-misclassified",
    "reviewed-misclassified.md",
  );
  const summaryMarkdown = await readFile(sourceMarkdownPath, "utf-8");
  const recordMarkdown = buildObsidianReviewedMisclassifiedExportRecord({
    generatedDate,
    sourceMarkdownPath,
    summaryMarkdown,
  });
  const targetDir = join(obsidianRoot, "05_验证与实验", "二轮误判样本导出", "已生成记录");
  const targetPath = join(targetDir, `二轮误判样本导出_${generatedDate}.md`);

  await writeTextFile(targetPath, `${recordMarkdown}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        targetPath,
        basedOn: sourceMarkdownPath,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
