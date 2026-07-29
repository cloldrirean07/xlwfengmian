import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const defaultObsidianRoot =
  "/Users/xlw/Library/Mobile Documents/iCloud~md~obsidian/Documents/Xlwbrain/AI封面创意助手";
const defaultOutputDir =
  "05_验证与实验/真实案例回填工作单/已生成记录";

function getArgValue(args, name) {
  const target = `--${name}`;
  const index = args.indexOf(target);
  return index >= 0 ? args[index + 1] : "";
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

async function main() {
  const args = process.argv.slice(2);
  const caseId = getArgValue(args, "case-id");
  if (!caseId) {
    throw new Error("Missing required argument --case-id");
  }

  const obsidianRoot = process.env.AI_COVER_OBSIDIAN_ROOT || defaultObsidianRoot;
  const sourceMarkdownPath = join(
    process.cwd(),
    "outputs",
    "fill-sheets",
    caseId,
    "fill-sheet.md",
  );
  const { buildObsidianRealCaseFillSheetRecord } = await import(
    "../src/domain/cases/buildObsidianRealCaseFillSheetRecord.js"
  );
  const fillSheetMarkdown = await readFile(sourceMarkdownPath, "utf-8");
  const generatedDate = getDateStamp();
  const outputDir = join(obsidianRoot, defaultOutputDir);
  const targetPath = join(outputDir, `${caseId}_回填工作单_${generatedDate}.md`);
  const markdown = buildObsidianRealCaseFillSheetRecord({
    generatedDate,
    sourceMarkdownPath,
    fillSheetMarkdown,
  });

  await mkdir(outputDir, { recursive: true });
  await writeFile(targetPath, `${markdown}\n`, "utf-8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        caseId,
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
