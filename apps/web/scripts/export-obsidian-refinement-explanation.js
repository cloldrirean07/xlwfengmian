import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRefinementExplanationMarkdown } from "../src/domain/refinement/buildRefinementExplanationMarkdown.js";
import { buildObsidianRefinementExplanationRecord } from "../src/domain/refinement/buildObsidianRefinementExplanationRecord.js";
import { resolveObsidianRoot } from "../src/infrastructure/obsidian/resolveObsidianRoot.js";
import { writeTextFile } from "../src/shared/fileSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const appRoot = join(__dirname, "..");
const exportsRoot = join(appRoot, "outputs", "case-runs");

function getArgValue(args, name) {
  const target = `--${name}`;
  const index = args.indexOf(target);
  return index >= 0 ? args[index + 1] : "";
}

function requireArg(args, name) {
  const value = getArgValue(args, name);

  if (!value) {
    throw new Error(`Missing required argument --${name}`);
  }

  return value;
}

function resolveGeneratedDate(value) {
  return value || new Date().toISOString().slice(0, 10);
}

async function main() {
  const args = process.argv.slice(2);
  const caseId = requireArg(args, "case-id");
  const generatedDate = resolveGeneratedDate(getArgValue(args, "date"));
  const obsidianRoot = resolveObsidianRoot(getArgValue(args, "obsidian-root"));
  const runFolder = join(exportsRoot, caseId);
  const resultJsonPath = join(runFolder, "result.json");
  const raw = await readFile(resultJsonPath, "utf-8");
  const result = JSON.parse(raw);
  const summaryMarkdown = buildRefinementExplanationMarkdown(result);
  const recordMarkdown = buildObsidianRefinementExplanationRecord({
    caseId,
    generatedDate,
    resultJsonPath,
    summaryMarkdown,
  });
  const targetDir = join(obsidianRoot, "05_验证与实验", "二轮解释验证记录", "已生成记录");
  const targetPath = join(targetDir, `二轮解释验证_${generatedDate}_${caseId}.md`);

  await writeTextFile(targetPath, `${recordMarkdown}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        caseId,
        targetPath,
        basedOn: {
          resultJsonPath,
        },
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
