import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPlatformCasePlaceholder } from "../src/domain/cases/buildPlatformCasePlaceholder.js";
import { buildRealCaseTemplate } from "../src/domain/cases/buildRealCaseTemplate.js";
import { isPlatformCasePlaceholder } from "../src/domain/cases/isPlatformCasePlaceholder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..");
const realCasesDir = join(appRoot, "data", "real-cases");
const realCasesIndexPath = join(realCasesDir, "index.json");
const realCasesItemsDir = join(realCasesDir, "items");
const defaultObsidianRoot =
  "/Users/xlw/Library/Mobile Documents/iCloud~md~obsidian/Documents/Xlwbrain/AI封面创意助手";
const defaultObsidianCaseBase =
  "03_方法论与规则库/案例库/平台原生案例/第一批案例";

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
  const platformCaseId = requireArg(args, "platform-case-id");
  const title = getArgValue(args, "title") || `待补真实案例 ${id}`;
  const platform = getArgValue(args, "platform") || "抖音";
  const contentTopic = getArgValue(args, "content-topic");
  const sourceLink = getArgValue(args, "source-link");
  const screenshotPath = getArgValue(args, "screenshot-path");
  const dryRun = hasFlag(args, "dry-run");
  const obsidianRoot =
    process.env.AI_COVER_OBSIDIAN_ROOT || getArgValue(args, "obsidian-root") || defaultObsidianRoot;
  const obsidianCasePath =
    getArgValue(args, "obsidian-case-path") ||
    `${defaultObsidianCaseBase}/${platformCaseId}_待补.md`;
  const realCaseFileName = `${id}.json`;
  const realCaseItemPath = join(realCasesItemsDir, realCaseFileName);
  const realCaseIndex = await readJson(realCasesIndexPath);
  const obsidianAbsolutePath = join(obsidianRoot, obsidianCasePath);
  const hasExistingObsidianFile = await pathExists(obsidianAbsolutePath);
  let obsidianFileAction = "create";

  if (!Array.isArray(realCaseIndex)) {
    throw new Error("Real case index must be an array.");
  }

  if (!dryRun && (await pathExists(realCaseItemPath))) {
    throw new Error(`Real case file already exists: ${realCaseItemPath}`);
  }

  if (!dryRun && hasExistingObsidianFile) {
    const existingContent = await readFile(obsidianAbsolutePath, "utf-8");

    if (isPlatformCasePlaceholder(existingContent)) {
      obsidianFileAction = "reuse-existing-placeholder";
    } else {
      throw new Error(`Obsidian case file already exists and is not a placeholder: ${obsidianAbsolutePath}`);
    }
  }

  if (dryRun && hasExistingObsidianFile) {
    const existingContent = await readFile(obsidianAbsolutePath, "utf-8");
    obsidianFileAction = isPlatformCasePlaceholder(existingContent)
      ? "would-reuse-existing-placeholder"
      : "would-conflict-with-existing-note";
  }

  if (realCaseIndex.some((entry) => entry?.id === id)) {
    throw new Error(`Real case id already exists in index: ${id}`);
  }

  const realCaseRecord = buildRealCaseTemplate({
    id,
    title,
    platform,
    platformCaseId,
    obsidianCasePath,
    sourceLink,
    screenshotPath,
  });
  const obsidianPlaceholder = buildPlatformCasePlaceholder({
    platformCaseId,
    platform,
    contentTopic,
    sourceLink,
  });

  const indexEntry = {
    id,
    platformCaseId,
    file: `items/${realCaseFileName}`,
    status: "draft",
  };

  if (!dryRun) {
    await mkdir(realCasesItemsDir, { recursive: true });
    await writeFile(realCaseItemPath, `${JSON.stringify(realCaseRecord, null, 2)}\n`, "utf-8");
    await writeFile(
      realCasesIndexPath,
      `${JSON.stringify([...realCaseIndex, indexEntry], null, 2)}\n`,
      "utf-8",
    );

    if (obsidianFileAction === "create") {
      await mkdir(dirname(obsidianAbsolutePath), { recursive: true });
      await writeFile(obsidianAbsolutePath, `${obsidianPlaceholder}\n`, "utf-8");
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        platformCaseId,
        realCaseId: id,
        obsidianCasePath,
        obsidianFileAction,
        outputs: {
          realCaseItemPath,
          obsidianAbsolutePath,
        },
        indexEntry,
        nextSteps: [
          "补 Obsidian 单条平台案例内容",
          "补代码侧 real-case JSON 字段",
          "运行 validate:cases / run:case / export:obsidian-case",
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
