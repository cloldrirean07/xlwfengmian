import { readFile } from "node:fs/promises";
import { defaultRealCaseStoragePaths } from "./resolveRealCaseStoragePaths.js";

export async function loadRealCaseIndex(indexPath = defaultRealCaseStoragePaths.realCasesIndexPath) {
  const raw = await readFile(indexPath, "utf-8");
  return JSON.parse(raw);
}
