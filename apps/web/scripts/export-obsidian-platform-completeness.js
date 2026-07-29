import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildObsidianPlatformCaseCompletenessRecord } from "../src/domain/cases/buildObsidianPlatformCaseCompletenessRecord.js";
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
  const caseId = getArgValue(args, "platform-case-id");
  if (!caseId) {
    throw new Error("Missing required argument --platform-case-id");
  }

  const sourceMarkdownPath = join(
    appRoot,
    "outputs",
    "reports",
    "platform-case-completeness",
    `${caseId}.md`,
  );
  const completenessMarkdown = await readFile(sourceMarkdownPath, "utf-8");
  const timestamp = getTimestamp();
  const obsidianRoot = process.env.AI_COVER_OBSIDIAN_ROOT || defaultObsidianRoot;
  const targetPath = join(
    obsidianRoot,
    "05_验证与实验",
    "平台案例完整度",
    "已生成记录",
    `${caseId}_完整度_${timestamp}.md`,
  );
  const markdown = buildObsidianPlatformCaseCompletenessRecord({
    generatedAt: timestamp,
    sourceMarkdownPath,
    completenessMarkdown,
  });

  try {
    await writeTextFile(targetPath, `${markdown}\n`);
  } catch (error) {
    if (error && error.code === "EPERM") {
      throw new Error(
        `Cannot write to Obsidian path: ${targetPath}. ` +
          "The current environment does not have permission to write into the iCloud Obsidian directory. " +
          "Re-run this command in an environment with filesystem permission, or export to a writable path first.",
      );
    }
    throw error;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        platformCaseId: caseId,
        targetPath,
        basedOn: sourceMarkdownPath,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  if (error && error.code === "ENOENT") {
    console.error(
      `Platform completeness markdown not found. Run ` +
        "`npm run report:platform-case-completeness -- --platform-case-id <ID>` first.",
    );
    process.exitCode = 1;
    return;
  }
  console.error(error.message);
  process.exitCode = 1;
});
