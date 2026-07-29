import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { join } from "node:path";
import { writeTextFile } from "../../shared/fileSystem.js";
import { defaultRealCaseStoragePaths } from "./resolveRealCaseStoragePaths.js";

async function pathExists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function savePreparedRealCaseBatchScaffold({
  currentIndex,
  preparedBatch,
  storagePaths = defaultRealCaseStoragePaths,
}) {
  if (!Array.isArray(currentIndex)) {
    throw new Error("Real case index must be an array.");
  }

  if (!preparedBatch?.created?.length) {
    throw new Error("Prepared real case batch is empty.");
  }

  const itemPaths = [];

  for (const prepared of preparedBatch.created) {
    const itemPath = join(storagePaths.realCasesItemsDir, prepared.fileName);

    if (await pathExists(itemPath)) {
      throw new Error(`Real case file already exists: ${itemPath}`);
    }

    itemPaths.push(itemPath);
  }

  for (let index = 0; index < preparedBatch.created.length; index += 1) {
    const prepared = preparedBatch.created[index];
    await writeTextFile(itemPaths[index], `${JSON.stringify(prepared.record, null, 2)}\n`);
  }

  await writeTextFile(
    storagePaths.realCasesIndexPath,
    `${JSON.stringify(preparedBatch.nextIndex, null, 2)}\n`,
  );

  return {
    itemPaths,
    indexPath: storagePaths.realCasesIndexPath,
    nextIndex: preparedBatch.nextIndex,
  };
}
