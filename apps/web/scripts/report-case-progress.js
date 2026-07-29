import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCaseProgressMarkdown } from "../src/domain/cases/buildCaseProgressMarkdown.js";
import { buildCaseProgressReport } from "../src/domain/cases/buildCaseProgressReport.js";
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

async function readJson(path) {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw);
}

async function safeReadDir(path) {
  try {
    return await readdir(path, { withFileTypes: true });
  } catch {
    return [];
  }
}

function parseCaseIdFromGeneratedRecord(fileName) {
  const match = fileName.match(/^端到端样例_\d{4}-\d{2}-\d{2}_(.+)\.md$/);
  return match?.[1] || "";
}

function parsePlannedEntriesFromIndex(markdown) {
  return markdown
    .split("\n")
    .filter((line) => /^\|\s*P-\d+/u.test(line))
    .map((line) => line.split("|").map((part) => part.trim()))
    .map((parts) => ({
      platformCaseId: parts[1] || "",
      id: parts[2] || "",
    }))
    .filter((entry) => entry.platformCaseId && entry.id);
}

async function main() {
  const args = process.argv.slice(2);
  const obsidianRoot =
    process.env.AI_COVER_OBSIDIAN_ROOT || getArgValue(args, "obsidian-root") || defaultObsidianRoot;
  const realCaseIndexPath = join(appRoot, "data", "real-cases", "index.json");
  const realCaseItemsDir = join(appRoot, "data", "real-cases", "items");
  const runOutputsDir = join(appRoot, "outputs", "case-runs");
  const reportDir = join(appRoot, "outputs", "reports", "case-progress");
  const placeholderDir = join(
    obsidianRoot,
    "03_方法论与规则库",
    "案例库",
    "平台原生案例",
    "第一批案例",
  );
  const generatedRecordDir = join(
    obsidianRoot,
    "05_验证与实验",
    "端到端样例运行记录",
    "已生成记录",
  );
  const platformIndexPath = join(
    obsidianRoot,
    "03_方法论与规则库",
    "案例库",
    "平台原生案例索引_v0.1.md",
  );

  const realCaseIndex = await readJson(realCaseIndexPath);
  const platformIndexMarkdown = await readFile(platformIndexPath, "utf-8");
  const plannedEntries = parsePlannedEntriesFromIndex(platformIndexMarkdown);
  const indexedEntries = realCaseIndex
    .map((entry) => ({
      id: entry.id || "",
      platformCaseId: entry.platformCaseId || "",
    }))
    .filter((entry) => entry.id);
  const itemEntries = await Promise.all(
    (await safeReadDir(realCaseItemsDir))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map(async (entry) => {
      const path = join(realCaseItemsDir, entry.name);
      const item = await readJson(path);

      return {
        id: basename(entry.name, ".json"),
        platformCaseId: item?.tracking?.platformCaseId || "",
      };
    }),
  );
  const runIds = (await safeReadDir(runOutputsDir))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const placeholderFiles = (await safeReadDir(placeholderDir))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();
  const obsidianIds = (await safeReadDir(generatedRecordDir))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => parseCaseIdFromGeneratedRecord(entry.name))
    .filter(Boolean);

  const report = buildCaseProgressReport({
    placeholderFiles,
    plannedEntries,
    indexedEntries,
    itemEntries,
    runIds,
    obsidianIds,
  });
  const markdown = buildCaseProgressMarkdown(report);
  const jsonPath = join(reportDir, "case-progress.json");
  const markdownPath = join(reportDir, "case-progress.md");

  await writeTextFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeTextFile(markdownPath, `${markdown}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        outputs: {
          json: jsonPath,
          markdown: markdownPath,
        },
        summary: report.summary,
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
