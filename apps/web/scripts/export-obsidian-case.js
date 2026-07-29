import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildObsidianCaseRunRecord } from "../src/domain/cases/buildObsidianCaseRunRecord.js";
import { writeTextFile } from "../src/shared/fileSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const appRoot = join(__dirname, "..");
const exportsRoot = join(appRoot, "outputs", "case-runs");
const defaultObsidianRoot =
  "/Users/xlw/Library/Mobile Documents/iCloud~md~obsidian/Documents/Xlwbrain/AI封面创意助手";

function getArgValue(args, name) {
  const target = `--${name}`;
  const index = args.indexOf(target);
  return index >= 0 ? args[index + 1] : "";
}

function requireArg(args, name) {
  const value = getArgValue(args, name);

  if (!value) {
    throw new Error(`Missing required argument --${name}`);
  }

  return value;
}

function resolveGeneratedDate(value) {
  if (value) {
    return value;
  }

  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const args = process.argv.slice(2);
  const caseId = requireArg(args, "case-id");
  const generatedDate = resolveGeneratedDate(getArgValue(args, "date"));
  const obsidianRoot =
    process.env.AI_COVER_OBSIDIAN_ROOT || getArgValue(args, "obsidian-root") || defaultObsidianRoot;
  const runFolder = join(exportsRoot, caseId);
  const resultJsonPath = join(runFolder, "result.json");
  const summaryPath = join(runFolder, "summary.md");
  const summaryMarkdown = await readFile(summaryPath, "utf-8");
  const recordMarkdown = buildObsidianCaseRunRecord({
    caseId,
    generatedDate,
    resultJsonPath,
    summaryMarkdown,
  });
  const targetDir = join(obsidianRoot, "05_验证与实验", "端到端样例运行记录", "已生成记录");
  const targetPath = join(targetDir, `端到端样例_${generatedDate}_${caseId}.md`);

  await writeTextFile(targetPath, `${recordMarkdown}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        caseId,
        targetPath,
        basedOn: {
          resultJsonPath,
          summaryPath,
        },
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
