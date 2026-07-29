import { dirname, join } from "node:path";
import { validateCaseRecord } from "../../domain/cases/validateCaseRecord.js";

async function loadReferencedCase(entry, index, indexPath, readJson) {
  const file = entry?.file;

  if (!file) {
    throw new Error(`Real case index item at ${index} is missing "file".`);
  }

  const resolvedPath = join(dirname(indexPath), file);
  const item = await readJson(resolvedPath);
  const normalized = validateCaseRecord(item, "real");

  if (entry.id && entry.id !== normalized.id) {
    throw new Error(
      `Real case index item at ${index} has id "${entry.id}" but file contains "${normalized.id}".`,
    );
  }

  return normalized;
}

export async function resolveRealCaseEntries({
  items,
  indexPath,
  readJson,
}) {
  if (!Array.isArray(items)) {
    throw new Error("Real case index must be an array.");
  }

  const records = [];

  for (const [index, entry] of items.entries()) {
    try {
      if (entry?.file) {
        records.push(await loadReferencedCase(entry, index, indexPath, readJson));
        continue;
      }

      records.push(validateCaseRecord(entry, "real"));
    } catch (error) {
      throw new Error(`Invalid real case at index ${index}: ${error.message}`);
    }
  }

  return records;
}
