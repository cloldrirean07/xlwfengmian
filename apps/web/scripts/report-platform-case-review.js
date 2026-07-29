import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPlatformCaseReview } from "../src/application/runPlatformCaseReview.js";
import { buildPlatformCaseReviewMarkdown } from "../src/domain/cases/buildPlatformCaseReviewMarkdown.js";
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
  const review = await runPlatformCaseReview({
    platformCaseId,
    obsidianRoot,
  });
  const reviewMarkdown = buildPlatformCaseReviewMarkdown(review);
  const outputDir = join(appRoot, "outputs", "reports", "platform-case-review");
  const jsonPath = join(outputDir, `${platformCaseId}.json`);
  const markdownPath = join(outputDir, `${platformCaseId}.md`);

  await writeTextFile(jsonPath, `${JSON.stringify(review, null, 2)}\n`);
  await writeTextFile(markdownPath, `${reviewMarkdown}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        platformCaseId,
        outputs: {
          json: jsonPath,
          markdown: markdownPath,
        },
        summary: review.summary,
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
