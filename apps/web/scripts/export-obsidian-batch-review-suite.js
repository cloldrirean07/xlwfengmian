import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { exportBatchReviewSuiteToObsidian } from "../src/application/exportBatchReviewSuiteToObsidian.js";

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
  process.chdir(appRoot);

  const args = process.argv.slice(2);
  const obsidianRoot =
    process.env.AI_COVER_OBSIDIAN_ROOT || getArgValue(args, "obsidian-root") || defaultObsidianRoot;
  const result = await exportBatchReviewSuiteToObsidian({ obsidianRoot });

  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        targetPath: result.targetPath,
        sourceMarkdownPath: result.sourceMarkdownPath,
        sourceJsonPath: result.sourceJsonPath,
        exportId: result.exportId,
        exportedAt: result.exportedAt,
        readback: result.readback,
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
