import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildObsidianPlatformCaseReviewRecord } from "../src/domain/cases/buildObsidianPlatformCaseReviewRecord.js";
import { writeTextFile } from "../src/shared/fileSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..");
const defaultObsidianRoot =
  "/Users/xlw/Library/Mobile Documents/iCloud~md~obsidian/Documents/Xlwbrain/AI封面创意助手";

function getArgValue(args, name) {
  const target = `--${name}`;
  const index = args.indexOf(target);
  return index >= 0 ? args[index + 1] : "";
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function getTimestamp() {
  const now = new Date();
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join("-") + `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

async function main() {
  const args = process.argv.slice(2);
  const platformCaseId = getArgValue(args, "platform-case-id");
  if (!platformCaseId) {
    throw new Error("Missing required argument --platform-case-id");
  }

  const obsidianRoot =
    process.env.AI_COVER_OBSIDIAN_ROOT || getArgValue(args, "obsidian-root") || defaultObsidianRoot;
  const sourceMarkdownPath = join(
    appRoot,
    "outputs",
    "reports",
    "platform-case-review",
    `${platformCaseId}.md`,
  );
  const reviewMarkdown = await readFile(sourceMarkdownPath, "utf-8");
  const generatedAt = getTimestamp();
  const targetPath = join(
    obsidianRoot,
    "05_验证与实验",
    "平台案例复核总览",
    "已生成记录",
    `${platformCaseId}_复核总览_${generatedAt}.md`,
  );
  const markdown = buildObsidianPlatformCaseReviewRecord({
    generatedAt,
    platformCaseId,
    sourceMarkdownPath,
    reviewMarkdown,
  });

  await writeTextFile(targetPath, `${markdown}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        platformCaseId,
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
