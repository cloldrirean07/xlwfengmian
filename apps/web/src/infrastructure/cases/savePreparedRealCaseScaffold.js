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

export async function savePreparedRealCaseScaffold({
  currentIndex,
  prepared,
  storagePaths = defaultRealCaseStoragePaths,
}) {
  if (!Array.isArray(currentIndex)) {
    throw new Error("Real case index must be an array.");
  }

  const nextIndex = [...currentIndex, prepared.indexEntry];
  const itemPath = join(storagePaths.realCasesItemsDir, prepared.fileName);

  if (await pathExists(itemPath)) {
    throw new Error(`Real case file already exists: ${itemPath}`);
  }

  await writeTextFile(itemPath, `${JSON.stringify(prepared.record, null, 2)}\n`);
  await writeTextFile(
    storagePaths.realCasesIndexPath,
    `${JSON.stringify(nextIndex, null, 2)}\n`,
  );

  return {
    itemPath,
    indexPath: storagePaths.realCasesIndexPath,
    nextIndex,
  };
}
