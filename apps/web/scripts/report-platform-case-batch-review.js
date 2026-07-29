import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { runPlatformCaseBatchReview } from "../src/application/runPlatformCaseBatchReview.js";
import { buildPlatformCaseBatchReviewMarkdown } from "../src/domain/cases/buildPlatformCaseBatchReviewMarkdown.js";
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
  const obsidianRoot =
    process.env.AI_COVER_OBSIDIAN_ROOT || getArgValue(args, "obsidian-root") || defaultObsidianRoot;
  const review = await runPlatformCaseBatchReview({ obsidianRoot });
  const reportMarkdown = buildPlatformCaseBatchReviewMarkdown(review);
  const outputDir = join(appRoot, "outputs", "reports", "platform-case-batch-review");
  const jsonPath = join(outputDir, "platform-case-batch-review.json");
  const markdownPath = join(outputDir, "platform-case-batch-review.md");

  await writeTextFile(jsonPath, `${JSON.stringify(review, null, 2)}\n`);
  await writeTextFile(markdownPath, `${reportMarkdown}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
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
