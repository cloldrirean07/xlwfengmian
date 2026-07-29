import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFormalWriteFollowUpPlan,
  buildFormalWriteFollowUpPlanMarkdown,
} from "../domain/review/buildFormalWriteFollowUpPlan.js";
import { runManualFormalWritePostExecutionAcceptanceStatus } from "./runManualFormalWritePostExecutionAcceptanceStatus.js";
import { runPiEngineExecutionPositionAuditStatus } from "./runPiEngineExecutionPositionAuditStatus.js";

const __filename = fileURLToPath(import.meta.url);
const appRoot = join(dirname(__filename), "..", "..");
const outputDir = join(appRoot, "outputs", "batch-review-manual-formal-write", "formal-write-follow-up-plan");
const jsonPath = join(outputDir, "formal-write-follow-up-plan.json");
const markdownPath = join(outputDir, "formal-write-follow-up-plan.md");

const paths = {
  formalWriteExport: join(appRoot, "outputs", "batch-review-manual-formal-write", "batch-review-manual-formal-write.json"),
  ruleRevisionReport: join(appRoot, "outputs", "reports", "rule-revision-task-sheet", "rule-revision-task-sheet.json"),
  keyCaseRerunPlan: join(appRoot, "data", "operations", "key-case-rerun-plan.generated.json"),
  keyCaseRerunReport: join(appRoot, "outputs", "reports", "key-case-rerun", "key-case-rerun.json"),
  keyCaseRerunDiff: join(appRoot, "outputs", "reports", "key-case-rerun", "key-case-rerun-diff.json"),
};

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf-8"));
  } catch {
    return null;
  }
}

export async function runFormalWriteFollowUpPlanStatus() {
  const [
    formalWriteExport,
    postExecutionAcceptance,
    piEngineExecutionPositionAudit,
    ruleRevisionReport,
    keyCaseRerunPlan,
    keyCaseRerunReport,
    keyCaseRerunDiff,
  ] = await Promise.all([
    readJson(paths.formalWriteExport),
    runManualFormalWritePostExecutionAcceptanceStatus().catch(() => null),
    runPiEngineExecutionPositionAuditStatus().catch(() => null),
    readJson(paths.ruleRevisionReport),
    readJson(paths.keyCaseRerunPlan),
    readJson(paths.keyCaseRerunReport),
    readJson(paths.keyCaseRerunDiff),
  ]);
  const plan = buildFormalWriteFollowUpPlan({
    formalWriteExport,
    postExecutionAcceptance,
    piEngineExecutionPositionAudit,
    ruleRevisionReport,
    keyCaseRerunPlan,
    keyCaseRerunReport,
    keyCaseRerunDiff,
    outputPaths: {
      json: jsonPath,
      markdown: markdownPath,
    },
  });
  const markdown = buildFormalWriteFollowUpPlanMarkdown(plan);

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(plan, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, `${markdown}\n`, "utf-8");

  return plan;
}
