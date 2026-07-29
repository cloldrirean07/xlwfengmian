import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCaseById } from "../src/infrastructure/cases/loadCases.js";
import { inspectRealCaseReadiness } from "../src/domain/cases/inspectRealCaseReadiness.js";
import { buildRealCaseFillSheet } from "../src/domain/cases/buildRealCaseFillSheet.js";
import { buildRealCaseFillSheetMarkdown } from "../src/domain/cases/buildRealCaseFillSheetMarkdown.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..");

function getArgValue(args, name) {
  const target = `--${name}`;
  const index = args.indexOf(target);
  return index >= 0 ? args[index + 1] : "";
}

async function main() {
  const args = process.argv.slice(2);
  const caseId = getArgValue(args, "case-id");

  if (!caseId) {
    throw new Error("Missing required argument --case-id");
  }

  const record = await loadCaseById(caseId);
  if (!record) {
    throw new Error(`Case not found: ${caseId}`);
  }

  if (record.sourceType !== "real") {
    throw new Error(`Case is not a real-case: ${caseId}`);
  }

  const readiness = inspectRealCaseReadiness(record);
  const fillSheet = buildRealCaseFillSheet({ record, readiness });
  const markdown = buildRealCaseFillSheetMarkdown(fillSheet);
  const outputDir = join(appRoot, "outputs", "fill-sheets", caseId);
  const jsonPath = join(outputDir, "fill-sheet.json");
  const markdownPath = join(outputDir, "fill-sheet.md");

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(fillSheet, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, `${markdown}\n`, "utf-8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        caseId,
        outputs: {
          json: jsonPath,
          markdown: markdownPath,
        },
        missingCount: fillSheet.missingCount,
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
