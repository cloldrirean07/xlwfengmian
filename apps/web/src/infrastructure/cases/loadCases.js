import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCaseRecord } from "../../domain/cases/validateCaseRecord.js";
import { resolveRealCaseEntries } from "./resolveRealCaseEntries.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..", "..", "..", "..");
const sampleCasesPath = join(__dirname, "data", "sample-cases.json");
const realCasesIndexPath = join(__dirname, "data", "real-cases", "index.json");

let caseCache = null;

async function readJson(path) {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw);
}

function normalizeCaseItem(item, sourceType, index) {
  try {
    return validateCaseRecord(item, sourceType);
  } catch (error) {
    throw new Error(
      `Invalid ${sourceType} case at index ${index}: ${error.message}`,
    );
  }
}

async function readRealCases() {
  const realCaseIndex = await readJson(realCasesIndexPath);
  return resolveRealCaseEntries({
    items: realCaseIndex,
    indexPath: realCasesIndexPath,
    readJson,
  });
}

export async function loadAllCases() {
  if (caseCache) {
    return caseCache;
  }

  const [sampleCases, realCases] = await Promise.all([
    readJson(sampleCasesPath),
    readRealCases(),
  ]);

  caseCache = [
    ...sampleCases.map((item, index) => normalizeCaseItem(item, "sample", index)),
    ...realCases,
  ];

  return caseCache;
}

export async function loadCaseById(id) {
  const cases = await loadAllCases();
  return cases.find((item) => item.id === id) || null;
}

export function resetCaseCache() {
  caseCache = null;
}
