import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRuleRevisionTaskSheetMarkdown } from "../src/domain/refinement/buildRuleRevisionTaskSheetMarkdown.js";
import { buildRuleRevisionTaskSheetReport } from "../src/domain/refinement/buildRuleRevisionTaskSheetReport.js";
import { writeTextFile } from "../src/shared/fileSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const appRoot = join(__dirname, "..");

async function readJson(path) {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw);
}

async function main() {
  const sourceJsonPath = join(
    appRoot,
    "outputs",
    "reports",
    "reviewed-misclassified",
    "reviewed-misclassified.json",
  );
  const reportDir = join(appRoot, "outputs", "reports", "rule-revision-task-sheet");
  const reviewedMisclassifiedReport = await readJson(sourceJsonPath);
  const report = buildRuleRevisionTaskSheetReport(reviewedMisclassifiedReport);
  const markdown = buildRuleRevisionTaskSheetMarkdown(report);
  const jsonPath = join(reportDir, "rule-revision-task-sheet.json");
  const markdownPath = join(reportDir, "rule-revision-task-sheet.md");

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
