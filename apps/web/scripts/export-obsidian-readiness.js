import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildObsidianRealCaseReadinessRecord } from "../src/domain/cases/buildObsidianRealCaseReadinessRecord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..");
const sourceMarkdownPath = join(
  appRoot,
  "outputs",
  "reports",
  "real-case-readiness",
  "real-case-readiness.md",
);
const defaultObsidianRoot =
  "/Users/xlw/Library/Mobile Documents/iCloud~md~obsidian/Documents/Xlwbrain/AI封面创意助手";
const defaultOutputDir =
  "05_验证与实验/真实案例就绪度/已生成记录";

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

async function main() {
  const obsidianRoot = process.env.AI_COVER_OBSIDIAN_ROOT || defaultObsidianRoot;
  const targetDir = join(obsidianRoot, defaultOutputDir);
  const generatedDate = getDateStamp();
  const targetPath = join(targetDir, `真实案例就绪度_${generatedDate}.md`);
  const readinessMarkdown = await readFile(sourceMarkdownPath, "utf-8");
  const obsidianMarkdown = buildObsidianRealCaseReadinessRecord({
    generatedDate,
    sourceMarkdownPath,
    readinessMarkdown,
  });

  await mkdir(targetDir, { recursive: true });
  await writeFile(targetPath, `${obsidianMarkdown}\n`, "utf-8");

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
