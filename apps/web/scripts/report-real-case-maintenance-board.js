import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadAllCases } from "../src/infrastructure/cases/loadCases.js";
import { inspectRealCaseReadiness } from "../src/domain/cases/inspectRealCaseReadiness.js";
import { buildRealCaseMaintenanceBoardReport } from "../src/domain/cases/buildRealCaseMaintenanceBoardReport.js";
import { buildRealCaseMaintenanceBoardMarkdown } from "../src/domain/cases/buildRealCaseMaintenanceBoardMarkdown.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..");
const outputDir = join(appRoot, "outputs", "reports", "real-case-maintenance-board");

async function main() {
  const allCases = await loadAllCases();
  const realCases = allCases.filter((item) => item.sourceType === "real");
  const readinessRows = realCases.map((item) => inspectRealCaseReadiness(item));
  const report = buildRealCaseMaintenanceBoardReport(realCases, readinessRows);
  const markdown = buildRealCaseMaintenanceBoardMarkdown(report);
  const jsonPath = join(outputDir, "real-case-maintenance-board.json");
  const markdownPath = join(outputDir, "real-case-maintenance-board.md");

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, `${markdown}\n`, "utf-8");

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
