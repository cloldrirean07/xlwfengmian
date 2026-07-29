import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPlatformCasePriorityDrafts } from "../src/application/runPlatformCasePriorityDrafts.js";
import { applyPlatformCaseDraftUpdates } from "../src/domain/cases/applyPlatformCaseDraftUpdates.js";
import { buildPlatformCaseApplyLogMarkdown } from "../src/domain/cases/buildPlatformCaseApplyLogMarkdown.js";
import { getPlatformCaseFieldKey } from "../src/domain/cases/platformCaseFieldKeyMap.js";
import { writeTextFile } from "../src/shared/fileSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const defaultObsidianRoot =
  "/Users/xlw/Library/Mobile Documents/iCloud~md~obsidian/Documents/Xlwbrain/AI封面创意助手";

function getArgValue(args, name) {
  const target = `--${name}`;
  const index = args.indexOf(target);
  return index >= 0 ? args[index + 1] : "";
}

function buildDraftValue(card) {
  return `[待确认草稿] ${card.draftText}`;
}

function readCurrentFieldLine(markdown, fieldKey) {
  const prefix = `- ${fieldKey}`;
  return String(markdown || "")
    .split("\n")
    .find((line) => line.startsWith(prefix)) || "";
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
  const notePath = result.review.notePath;
  const originalMarkdown = await readFile(notePath, "utf-8");
  const updateEntries = result.drafts.cards
    .map((card) => [getPlatformCaseFieldKey(card.label), buildDraftValue(card)])
    .filter(([fieldKey]) => Boolean(fieldKey));
  const updates = Object.fromEntries(updateEntries);
  const nextMarkdown = applyPlatformCaseDraftUpdates(originalMarkdown, updates);
  const updatedFields = updateEntries.map(([fieldKey]) => ({
    fieldKey,
    before: readCurrentFieldLine(originalMarkdown, fieldKey),
    after: readCurrentFieldLine(nextMarkdown, fieldKey),
  }));

  await writeTextFile(notePath, `${nextMarkdown}\n`);

  const logMarkdown = buildPlatformCaseApplyLogMarkdown({
    platformCaseId,
    notePath,
    updatedFields,
  });
  const logDir = join(__dirname, "..", "outputs", "apply-logs", "platform-cases");
  const logPath = join(logDir, `${platformCaseId}.md`);
  await writeTextFile(logPath, `${logMarkdown}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        platformCaseId,
        notePath,
        updatedFields: Object.keys(updates),
        logPath,
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
