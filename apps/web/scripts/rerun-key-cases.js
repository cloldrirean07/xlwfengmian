import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCaseFlow } from "../src/application/runCaseFlow.js";
import { buildCaseRunMarkdown } from "../src/domain/cases/buildCaseRunMarkdown.js";
import { buildKeyCaseRerunReport } from "../src/domain/cases/buildKeyCaseRerunReport.js";
import { buildKeyCaseRerunMarkdown } from "../src/domain/cases/buildKeyCaseRerunMarkdown.js";
import { buildKeyCaseRerunDiffReport } from "../src/domain/cases/buildKeyCaseRerunDiffReport.js";
import { buildKeyCaseRerunDiffMarkdown } from "../src/domain/cases/buildKeyCaseRerunDiffMarkdown.js";
import { buildReviewedMisclassifiedExportReport } from "../src/domain/refinement/buildReviewedMisclassifiedExportReport.js";
import { buildReviewedMisclassifiedExportMarkdown } from "../src/domain/refinement/buildReviewedMisclassifiedExportMarkdown.js";
import { buildRuleRevisionTaskSheetReport } from "../src/domain/refinement/buildRuleRevisionTaskSheetReport.js";
import { buildRuleRevisionTaskSheetMarkdown } from "../src/domain/refinement/buildRuleRevisionTaskSheetMarkdown.js";
import { parseRefinementExplanationReviewNote } from "../src/domain/refinement/parseRefinementExplanationReviewNote.js";
import { resolveObsidianRoot } from "../src/infrastructure/obsidian/resolveObsidianRoot.js";
import { writeTextFile } from "../src/shared/fileSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const appRoot = join(__dirname, "..");
const exportsRoot = join(appRoot, "outputs", "case-runs");
const reportsRoot = join(appRoot, "outputs", "reports");
const defaultPlanPath = join(
  appRoot,
  "data",
  "operations",
  "key-case-rerun-plan.generated.json",
);
const fallbackPlanPath = join(appRoot, "data", "operations", "key-case-rerun-plan.json");

function getArgValue(args, name) {
  const target = `--${name}`;
  const index = args.indexOf(target);
  return index >= 0 ? args[index + 1] : "";
}

async function readJson(path) {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw);
}

async function readJsonIfExists(path) {
  try {
    return await readJson(path);
  } catch {
    return null;
  }
}

async function loadReviewRows(obsidianRoot) {
  const reviewDir = join(
    obsidianRoot,
    "05_验证与实验",
    "二轮解释验证记录",
    "已生成记录",
  );
  const reviewFiles = (await readdir(reviewDir, { withFileTypes: true })).filter(
    (entry) => entry.isFile() && entry.name.endsWith(".md"),
  );

  return Promise.all(
    reviewFiles.map(async (entry) =>
      parseRefinementExplanationReviewNote(await readFile(join(reviewDir, entry.name), "utf-8")),
    ),
  );
}

function getGeneratedAt() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

async function main() {
  const args = process.argv.slice(2);
  const planPath = getArgValue(args, "plan-path");
  const obsidianRoot = resolveObsidianRoot(getArgValue(args, "obsidian-root"));
  const plan = planPath
    ? await readJson(planPath)
    : (await readJsonIfExists(defaultPlanPath)) || (await readJson(fallbackPlanPath));
  const rerunResults = [];
  const beforeResultsByCaseId = {};
  const outputDirsByCaseId = {};
  const reviewedMisclassifiedJsonPath = join(
    reportsRoot,
    "reviewed-misclassified",
    "reviewed-misclassified.json",
  );
  const ruleRevisionTaskSheetJsonPath = join(
    reportsRoot,
    "rule-revision-task-sheet",
    "rule-revision-task-sheet.json",
  );
  const downstreamBefore = {
    reviewedMisclassified: await readJsonIfExists(reviewedMisclassifiedJsonPath),
    ruleRevisionTaskSheet: await readJsonIfExists(ruleRevisionTaskSheetJsonPath),
  };

  for (const caseId of plan.caseIds || []) {
    const folder = join(exportsRoot, caseId);
    const jsonPath = join(folder, "result.json");
    const markdownPath = join(folder, "summary.md");
    beforeResultsByCaseId[caseId] = await readJsonIfExists(jsonPath);
    const result = await runCaseFlow(caseId);
    const markdown = buildCaseRunMarkdown(result);

    await writeTextFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
    await writeTextFile(markdownPath, `${markdown}\n`);

    outputDirsByCaseId[caseId] = folder;
    rerunResults.push({
      caseId,
      result,
      outputDir: folder,
    });
  }

  const runFolders = (await readdir(exportsRoot, { withFileTypes: true })).filter((entry) =>
    entry.isDirectory(),
  );
  const allResults = await Promise.all(
    runFolders.map((entry) => readJson(join(exportsRoot, entry.name, "result.json"))),
  );
  const reviewRows = await loadReviewRows(obsidianRoot);
  const reviewedMisclassifiedReport = buildReviewedMisclassifiedExportReport(allResults, reviewRows);
  const reviewedMisclassifiedMarkdown =
    buildReviewedMisclassifiedExportMarkdown(reviewedMisclassifiedReport);
  const reviewedMisclassifiedMarkdownPath = join(
    reportsRoot,
    "reviewed-misclassified",
    "reviewed-misclassified.md",
  );

  await writeTextFile(
    reviewedMisclassifiedJsonPath,
    `${JSON.stringify(reviewedMisclassifiedReport, null, 2)}\n`,
  );
  await writeTextFile(reviewedMisclassifiedMarkdownPath, `${reviewedMisclassifiedMarkdown}\n`);

  const ruleRevisionTaskSheetReport =
    buildRuleRevisionTaskSheetReport(reviewedMisclassifiedReport);
  const ruleRevisionTaskSheetMarkdown =
    buildRuleRevisionTaskSheetMarkdown(ruleRevisionTaskSheetReport);
  const ruleRevisionTaskSheetMarkdownPath = join(
    reportsRoot,
    "rule-revision-task-sheet",
    "rule-revision-task-sheet.md",
  );

  await writeTextFile(
    ruleRevisionTaskSheetJsonPath,
    `${JSON.stringify(ruleRevisionTaskSheetReport, null, 2)}\n`,
  );
  await writeTextFile(ruleRevisionTaskSheetMarkdownPath, `${ruleRevisionTaskSheetMarkdown}\n`);

  const generatedAt = getGeneratedAt();
  const rerunReport = buildKeyCaseRerunReport({
    generatedAt,
    plan,
    rerunResults,
    downstreamReports: {
      reviewedMisclassified: reviewedMisclassifiedReport,
      ruleRevisionTaskSheet: ruleRevisionTaskSheetReport,
    },
  });
  const rerunReportMarkdown = buildKeyCaseRerunMarkdown(rerunReport);
  const rerunReportJsonPath = join(reportsRoot, "key-case-rerun", "key-case-rerun.json");
  const rerunReportMarkdownPath = join(reportsRoot, "key-case-rerun", "key-case-rerun.md");

  await writeTextFile(rerunReportJsonPath, `${JSON.stringify(rerunReport, null, 2)}\n`);
  await writeTextFile(rerunReportMarkdownPath, `${rerunReportMarkdown}\n`);

  const afterResultsByCaseId = Object.fromEntries(
    rerunResults.map((item) => [item.caseId, item.result]),
  );
  const rerunDiffReport = buildKeyCaseRerunDiffReport({
    generatedAt,
    plan,
    beforeResultsByCaseId,
    afterResultsByCaseId,
    outputDirsByCaseId,
    downstreamBefore,
    downstreamAfter: {
      reviewedMisclassified: reviewedMisclassifiedReport,
      ruleRevisionTaskSheet: ruleRevisionTaskSheetReport,
    },
  });
  const rerunDiffMarkdown = buildKeyCaseRerunDiffMarkdown(rerunDiffReport);
  const rerunDiffJsonPath = join(reportsRoot, "key-case-rerun", "key-case-rerun-diff.json");
  const rerunDiffMarkdownPath = join(reportsRoot, "key-case-rerun", "key-case-rerun-diff.md");

  await writeTextFile(rerunDiffJsonPath, `${JSON.stringify(rerunDiffReport, null, 2)}\n`);
  await writeTextFile(rerunDiffMarkdownPath, `${rerunDiffMarkdown}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        planId: plan.planId || "unknown",
        rerunCaseIds: rerunResults.map((item) => item.caseId),
        outputs: {
          rerunReportJson: rerunReportJsonPath,
          rerunReportMarkdown: rerunReportMarkdownPath,
          rerunDiffJson: rerunDiffJsonPath,
          rerunDiffMarkdown: rerunDiffMarkdownPath,
          reviewedMisclassifiedJson: reviewedMisclassifiedJsonPath,
          ruleRevisionTaskSheetJson: ruleRevisionTaskSheetJsonPath,
        },
        summary: rerunReport.summary,
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
