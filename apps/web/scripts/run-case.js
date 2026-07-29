import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCaseFlow } from "../src/application/runCaseFlow.js";
import { buildCaseRunMarkdown } from "../src/domain/cases/buildCaseRunMarkdown.js";
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

async function main() {
  const args = process.argv.slice(2);
  const caseId = requireArg(args, "case-id");
  const result = await runCaseFlow(caseId);
  const folder = join(exportsRoot, caseId);
  const jsonPath = join(folder, "result.json");
  const markdownPath = join(folder, "summary.md");
  const markdown = buildCaseRunMarkdown(result);

  await writeTextFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
  await writeTextFile(markdownPath, `${markdown}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        caseId,
        outputDir: folder,
        files: {
          json: jsonPath,
          markdown: markdownPath,
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
