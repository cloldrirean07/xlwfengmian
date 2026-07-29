import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyRefinementExplanationReviewFields } from "../src/domain/refinement/applyRefinementExplanationReviewFields.js";
import { resolveObsidianRoot } from "../src/infrastructure/obsidian/resolveObsidianRoot.js";
import { writeTextFile } from "../src/shared/fileSystem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");

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

async function safeReadDir(path) {
  try {
    return await readdir(path, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function resolveTargetPath({ caseId, obsidianRoot, fileName = "" }) {
  const reviewDir = join(
    obsidianRoot,
    "05_验证与实验",
    "二轮解释验证记录",
    "已生成记录",
  );

  if (fileName) {
    return join(reviewDir, fileName);
  }

  const candidates = (await safeReadDir(reviewDir))
    .filter((entry) => entry.isFile() && entry.name.endsWith(`_${caseId}.md`))
    .map((entry) => entry.name)
    .sort();

  const latest = candidates.at(-1);

  if (!latest) {
    throw new Error(`No refinement review note found for case ${caseId}`);
  }

  return join(reviewDir, latest);
}

async function main() {
  const args = process.argv.slice(2);
  const caseId = requireArg(args, "case-id");
  const obsidianRoot = resolveObsidianRoot(getArgValue(args, "obsidian-root"));
  const targetPath = await resolveTargetPath({
    caseId,
    obsidianRoot,
    fileName: getArgValue(args, "file-name"),
  });
  const originalMarkdown = await readFile(targetPath, "utf-8");
  const nextMarkdown = applyRefinementExplanationReviewFields(originalMarkdown, {
    caseId,
    reviewStatus: getArgValue(args, "review-status"),
    explanationStatus: getArgValue(args, "explanation-status"),
    misclassified: getArgValue(args, "misclassified"),
    shouldExportToMisclassified: getArgValue(args, "should-export-to-misclassified"),
    actualIssue: getArgValue(args, "actual-issue"),
    suggestedKeyword: getArgValue(args, "suggested-keyword"),
    suggestedMappingId: getArgValue(args, "suggested-mapping-id"),
    suggestedPositiveSignalId: getArgValue(args, "suggested-positive-signal-id"),
    fallbackAdjustment: getArgValue(args, "fallback-adjustment"),
  });

  await writeTextFile(targetPath, `${nextMarkdown.replace(/\s*$/, "")}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        caseId,
        targetPath,
        updatedFields: {
          reviewStatus: getArgValue(args, "review-status") || null,
          explanationStatus: getArgValue(args, "explanation-status") || null,
          misclassified: getArgValue(args, "misclassified") || null,
          shouldExportToMisclassified: getArgValue(args, "should-export-to-misclassified") || null,
          suggestedMappingId: getArgValue(args, "suggested-mapping-id") || null,
          suggestedKeyword: getArgValue(args, "suggested-keyword") || null,
        },
        fileName: basename(targetPath),
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
