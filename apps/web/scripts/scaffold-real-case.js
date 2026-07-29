import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { prepareRealCaseScaffold } from "../src/application/prepareRealCaseScaffold.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..");
const realCasesDir = join(appRoot, "data", "real-cases");
const realCasesIndexPath = join(realCasesDir, "index.json");
const realCasesItemsDir = join(realCasesDir, "items");

function getArgValue(args, name) {
  const target = `--${name}`;
  const index = args.indexOf(target);
  return index >= 0 ? args[index + 1] : "";
}

function hasFlag(args, name) {
  return args.includes(`--${name}`);
}

function requireArg(args, name) {
  const value = getArgValue(args, name);

  if (!value) {
    throw new Error(`Missing required argument --${name}`);
  }

  return value;
}

function parseNumberArg(args, name, fallbackValue) {
  const raw = getArgValue(args, name);

  if (!raw) {
    return fallbackValue;
  }

  const value = Number(raw);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Argument --${name} must be a non-negative number`);
  }

  return value;
}

function parseCsvArg(args, name, fallbackValue = []) {
  const raw = getArgValue(args, name);

  if (!raw) {
    return fallbackValue;
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function readJson(path) {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw);
}

async function pathExists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const id = requireArg(args, "id");
  const title = getArgValue(args, "title") || `待补真实案例 ${id}`;
  const platform = getArgValue(args, "platform") || "抖音";
  const platformCaseId = requireArg(args, "platform-case-id");
  const obsidianCasePath = getArgValue(args, "obsidian-case-path");
  const sourceLink = getArgValue(args, "source-link");
  const screenshotPath = getArgValue(args, "screenshot-path");
  const status = getArgValue(args, "status") || "draft";
  const keyCaseRerunPriority = parseNumberArg(args, "rerun-priority", 1);
  const maintenanceTags = parseCsvArg(args, "maintenance-tags", [
    "real-case",
    "待确认是否纳入关键复跑",
  ]);
  const dryRun = hasFlag(args, "dry-run");
  const fileName = `${id}.json`;
  const itemPath = join(realCasesItemsDir, fileName);
  const index = await readJson(realCasesIndexPath);

  if (!Array.isArray(index)) {
    throw new Error("Real case index must be an array.");
  }

  if (!dryRun && (await pathExists(itemPath))) {
    throw new Error(`Real case file already exists: ${itemPath}`);
  }

  const prepared = prepareRealCaseScaffold({
    currentIndex: index,
    id,
    title,
    platform,
    platformCaseId,
    obsidianCasePath,
    sourceLink,
    screenshotPath,
    keyCaseRerunPriority,
    status,
    maintenanceTags,
  });

  const { record, indexEntry } = prepared;
  index.push(indexEntry);

  if (!dryRun) {
    await mkdir(realCasesItemsDir, { recursive: true });
    await writeFile(itemPath, `${JSON.stringify(record, null, 2)}\n`, "utf-8");
    await writeFile(realCasesIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf-8");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        id,
        dryRun,
        itemPath,
        indexEntry,
        record,
        nextSteps: [
          "补全生成出的 JSON 字段",
          "运行 npm run validate:cases",
          "再运行真实 case-run",
        ],
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
