import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveObsidianRoot } from "../src/infrastructure/obsidian/resolveObsidianRoot.js";
import { parseRefinementExplanationReviewNote } from "../src/domain/refinement/parseRefinementExplanationReviewNote.js";
import { buildRefinementExplanationSummaryMarkdown } from "../src/domain/refinement/buildRefinementExplanationSummaryMarkdown.js";
import { buildRefinementExplanationSummaryReport } from "../src/domain/refinement/buildRefinementExplanationSummaryReport.js";
import { writeTextFile } from "../src/shared/fileSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const appRoot = join(__dirname, "..");

async function safeReadDir(path) {
  try {
    return await readdir(path, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function readJson(path) {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw);
}

function getArgValue(args, name) {
  const target = `--${name}`;
  const index = args.indexOf(target);
  return index >= 0 ? args[index + 1] : "";
}

async function main() {
  const args = process.argv.slice(2);
  const caseRunsDir = join(appRoot, "outputs", "case-runs");
  const reportDir = join(appRoot, "outputs", "reports", "refinement-explanations");
  const obsidianRoot = resolveObsidianRoot(getArgValue(args, "obsidian-root"));
  const reviewDir = join(
    obsidianRoot,
    "05_验证与实验",
    "二轮解释验证记录",
    "已生成记录",
  );
  const runFolders = (await safeReadDir(caseRunsDir)).filter((entry) => entry.isDirectory());
  const results = await Promise.all(
    runFolders.map((entry) => readJson(join(caseRunsDir, entry.name, "result.json"))),
  );
  const reviewFiles = (await safeReadDir(reviewDir)).filter(
    (entry) => entry.isFile() && entry.name.endsWith(".md"),
  );
  const reviewRows = await Promise.all(
    reviewFiles.map(async (entry) =>
      parseRefinementExplanationReviewNote(await readFile(join(reviewDir, entry.name), "utf-8")),
    ),
  );
  const report = buildRefinementExplanationSummaryReport(results, reviewRows);
  const markdown = buildRefinementExplanationSummaryMarkdown(report);
  const jsonPath = join(reportDir, "refinement-explanations.json");
  const markdownPath = join(reportDir, "refinement-explanations.md");

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
        reviewSourceCount: reviewRows.length,
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
