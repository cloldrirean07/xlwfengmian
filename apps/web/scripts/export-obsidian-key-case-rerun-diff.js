import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildObsidianKeyCaseRerunDiffRecord } from "../src/domain/cases/buildObsidianKeyCaseRerunDiffRecord.js";
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

function getGeneratedDate() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const args = process.argv.slice(2);
  const obsidianRoot = resolveObsidianRoot(getArgValue(args, "obsidian-root"));
  const sourceMarkdownPath = join(
    appRoot,
    "outputs",
    "reports",
    "key-case-rerun",
    "key-case-rerun-diff.md",
  );
  const summaryMarkdown = await readFile(sourceMarkdownPath, "utf-8");
  const generatedDate = getGeneratedDate();
  const targetDir = join(obsidianRoot, "05_验证与实验", "关键样例复跑差异报告", "已生成记录");
  const targetPath = join(targetDir, `关键样例复跑差异报告_${generatedDate}.md`);
  const markdown = buildObsidianKeyCaseRerunDiffRecord({
    generatedDate,
    sourceMarkdownPath,
    summaryMarkdown,
  });

  await writeTextFile(targetPath, `${markdown}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        targetPath,
        basedOn: sourceMarkdownPath,
        fileName: basename(targetPath),
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
