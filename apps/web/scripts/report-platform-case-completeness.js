import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parsePlatformCaseNote } from "../src/domain/cases/parsePlatformCaseNote.js";
import { inspectPlatformCaseCompleteness } from "../src/domain/cases/inspectPlatformCaseCompleteness.js";
import { buildPlatformCaseCompletenessMarkdown } from "../src/domain/cases/buildPlatformCaseCompletenessMarkdown.js";
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

async function main() {
  const args = process.argv.slice(2);
  const caseId = getArgValue(args, "platform-case-id");
  const notePath = getArgValue(args, "note-path");
  if (!caseId) {
    throw new Error("Missing required argument --platform-case-id");
  }

  const obsidianRoot = process.env.AI_COVER_OBSIDIAN_ROOT || defaultObsidianRoot;
  const resolvedNotePath =
    notePath ||
    join(
      obsidianRoot,
      "03_方法论与规则库/案例库/平台原生案例/第一批案例",
      `${caseId}_待补.md`,
    );

  const markdown = await readFile(resolvedNotePath, "utf-8");
  const parsedNote = parsePlatformCaseNote(markdown);
  const result = inspectPlatformCaseCompleteness({
    platformCaseId: caseId,
    parsedNote,
  });
  const reportMarkdown = buildPlatformCaseCompletenessMarkdown(result);
  const outputDir = join(appRoot, "outputs", "reports", "platform-case-completeness");
  const jsonPath = join(outputDir, `${caseId}.json`);
  const markdownPath = join(outputDir, `${caseId}.md`);

  await writeTextFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
  await writeTextFile(markdownPath, `${reportMarkdown}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        platformCaseId: caseId,
        notePath: resolvedNotePath,
        outputs: {
          json: jsonPath,
          markdown: markdownPath,
        },
        summary: {
          status: result.status,
          completedChecks: result.completedChecks,
          totalChecks: result.totalChecks,
          missingFields: result.missingFields,
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
