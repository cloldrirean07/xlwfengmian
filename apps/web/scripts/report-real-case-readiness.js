import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadAllCases } from "../src/infrastructure/cases/loadCases.js";
import { inspectRealCaseReadiness } from "../src/domain/cases/inspectRealCaseReadiness.js";
import { buildRealCaseReadinessReport } from "../src/domain/cases/buildRealCaseReadinessReport.js";
import { buildRealCaseReadinessMarkdown } from "../src/domain/cases/buildRealCaseReadinessMarkdown.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = join(__dirname, "..");
const outputDir = join(appRoot, "outputs", "reports", "real-case-readiness");

async function main() {
  const allCases = await loadAllCases();
  const realCases = allCases.filter((item) => item.sourceType === "real");
  const report = buildRealCaseReadinessReport(realCases.map((item) => inspectRealCaseReadiness(item)));
  const markdown = buildRealCaseReadinessMarkdown(report);
  const jsonPath = join(outputDir, "real-case-readiness.json");
  const markdownPath = join(outputDir, "real-case-readiness.md");

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
