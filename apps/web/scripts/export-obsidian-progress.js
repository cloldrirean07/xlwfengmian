import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildObsidianCaseProgressRecord } from "../src/domain/cases/buildObsidianCaseProgressRecord.js";
import { writeTextFile } from "../src/shared/fileSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const appRoot = join(__dirname, "..");
const defaultObsidianRoot =
  "/Users/xlw/Library/Mobile Documents/iCloud~md~obsidian/Documents/Xlwbrain/AI封面创意助手";

function getArgValue(args, name) {
  const target = `--${name}`;
  const index = args.indexOf(target);
  return index >= 0 ? args[index + 1] : "";
}

function resolveGeneratedDate(value) {
  if (value) {
    return value;
  }

  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const args = process.argv.slice(2);
  const generatedDate = resolveGeneratedDate(getArgValue(args, "date"));
  const obsidianRoot =
    process.env.AI_COVER_OBSIDIAN_ROOT || getArgValue(args, "obsidian-root") || defaultObsidianRoot;
  const sourceMarkdownPath = join(
    appRoot,
    "outputs",
    "reports",
    "case-progress",
    "case-progress.md",
  );
  const progressMarkdown = await readFile(sourceMarkdownPath, "utf-8");
  const recordMarkdown = buildObsidianCaseProgressRecord({
    generatedDate,
    sourceMarkdownPath,
    progressMarkdown,
  });
  const targetDir = join(obsidianRoot, "07_项目推进与记录", "已生成状态记录");
  const targetPath = join(targetDir, `案例进度状态_${generatedDate}.md`);

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
