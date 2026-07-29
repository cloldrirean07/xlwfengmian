import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildObsidianWorkspaceDecisionRecord } from "../src/domain/workspace/buildObsidianWorkspaceDecisionRecord.js";
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
  const decisionId = requireArg(args, "decision-id");
  const generatedDate = resolveGeneratedDate(getArgValue(args, "date"));
  const obsidianRoot =
    process.env.AI_COVER_OBSIDIAN_ROOT || getArgValue(args, "obsidian-root") || defaultObsidianRoot;
  const sourceDir = join(appRoot, "outputs", "workspace-decisions", decisionId);
  const sourceJsonPath = join(sourceDir, "result.json");
  const sourceMarkdownPath = join(sourceDir, "summary.md");
  const markdownBody = await readFile(sourceMarkdownPath, "utf-8");
  const recordMarkdown = buildObsidianWorkspaceDecisionRecord({
    decisionId,
    generatedDate,
    sourceJsonPath,
    markdownBody,
  });
  const targetDir = join(obsidianRoot, "05_验证与实验", "工作区建议记录", "已生成记录");
  const targetPath = join(targetDir, `工作区建议记录_${generatedDate}_${decisionId}.md`);

  await writeTextFile(targetPath, `${recordMarkdown}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        decisionId,
        targetPath,
        basedOn: {
          sourceJsonPath,
          sourceMarkdownPath,
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
