import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { prepareRealCaseBatchScaffold } from "../src/application/prepareRealCaseBatchScaffold.js";
import { writeTextFile } from "../src/shared/fileSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..");
const realCasesDir = join(appRoot, "data", "real-cases");
const realCasesIndexPath = join(realCasesDir, "index.json");
const realCasesItemsDir = join(realCasesDir, "items");
const defaultBatchPath = join(realCasesDir, "scaffold-batch.template.json");

function getArgValue(args, name) {
  const target = `--${name}`;
  const index = args.indexOf(target);
  return index >= 0 ? args[index + 1] : "";
}

function hasFlag(args, name) {
  return args.includes(`--${name}`);
}

async function readJson(path) {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw);
}

async function main() {
  const args = process.argv.slice(2);
  const batchPath = getArgValue(args, "batch-path") || defaultBatchPath;
  const dryRun = hasFlag(args, "dry-run");
  const batchItems = await readJson(batchPath);
  const index = await readJson(realCasesIndexPath);

  if (!Array.isArray(batchItems) || batchItems.length === 0) {
    throw new Error("Batch file must be a non-empty array.");
  }

  const { created, nextIndex } = prepareRealCaseBatchScaffold({
    currentIndex: index,
    batchItems,
  });

  if (!dryRun) {
    for (const item of created) {
      await writeTextFile(
        join(realCasesItemsDir, item.fileName),
        `${JSON.stringify(item.record, null, 2)}\n`,
      );
    }

    await writeTextFile(realCasesIndexPath, `${JSON.stringify(nextIndex, null, 2)}\n`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        batchPath,
        createdCount: created.length,
        created: created.map((item) => ({
          id: item.id,
          fileName: item.fileName,
          indexEntry: item.indexEntry,
          operations: item.record.operations,
        })),
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
