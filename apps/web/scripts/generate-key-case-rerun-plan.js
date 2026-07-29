import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadAllCases } from "../src/infrastructure/cases/loadCases.js";
import { buildKeyCaseRerunPlan } from "../src/domain/cases/buildKeyCaseRerunPlan.js";
import { buildGeneratedKeyCaseRerunPlanMarkdown } from "../src/domain/cases/buildGeneratedKeyCaseRerunPlanMarkdown.js";
import { writeTextFile } from "../src/shared/fileSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const appRoot = join(__dirname, "..");
const defaultPlanPath = join(appRoot, "data", "operations", "key-case-rerun-plan.json");
const generatedPlanPath = join(
  appRoot,
  "data",
  "operations",
  "key-case-rerun-plan.generated.json",
);

async function readJson(path) {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw);
}

async function main() {
  const basePlan = await readJson(defaultPlanPath);
  const cases = await loadAllCases();
  const plan = buildKeyCaseRerunPlan(cases, basePlan);
  const markdown = buildGeneratedKeyCaseRerunPlanMarkdown(plan);
  const planMarkdownPath = join(
    appRoot,
    "outputs",
    "reports",
    "key-case-rerun",
    "key-case-rerun-plan.generated.md",
  );

  await writeTextFile(generatedPlanPath, `${JSON.stringify(plan, null, 2)}\n`);
  await writeTextFile(planMarkdownPath, `${markdown}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        planId: plan.planId,
        caseIds: plan.caseIds,
        outputs: {
          generatedPlanJson: generatedPlanPath,
          generatedPlanMarkdown: planMarkdownPath,
        },
        fileName: basename(generatedPlanPath),
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
