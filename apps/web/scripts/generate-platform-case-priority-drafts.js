import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPlatformCasePriorityDrafts } from "../src/application/runPlatformCasePriorityDrafts.js";
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
  const platformCaseId = getArgValue(args, "platform-case-id");
  if (!platformCaseId) {
    throw new Error("Missing required argument --platform-case-id");
  }

  const obsidianRoot =
    process.env.AI_COVER_OBSIDIAN_ROOT || getArgValue(args, "obsidian-root") || defaultObsidianRoot;
  const result = await runPlatformCasePriorityDrafts({
    platformCaseId,
    obsidianRoot,
  });
  const outputDir = join(appRoot, "outputs", "draft-cards", "platform-cases");
  const markdownPath = join(outputDir, `${platformCaseId}.md`);
  const jsonPath = join(outputDir, `${platformCaseId}.json`);

  await writeTextFile(markdownPath, `${result.draftsMarkdown}\n`);
  await writeTextFile(
    jsonPath,
    `${JSON.stringify(
      {
        platformCaseId,
        cards: result.drafts.cards,
      },
      null,
      2,
    )}\n`,
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        platformCaseId,
        outputs: {
          markdown: markdownPath,
          json: jsonPath,
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
