import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { parsePlatformCaseNote } from "../../domain/cases/parsePlatformCaseNote.js";
import { resolveObsidianRoot } from "./resolveObsidianRoot.js";

const defaultPlatformCaseDir = [
  "03_方法论与规则库",
  "案例库",
  "平台原生案例",
  "第一批案例",
];

function resolveNotePath({ platformCaseId, notePath, obsidianRoot }) {
  if (notePath) {
    return isAbsolute(notePath) ? notePath : join(obsidianRoot, notePath);
  }

  return join(obsidianRoot, ...defaultPlatformCaseDir, `${platformCaseId}_待补.md`);
}

export async function loadPlatformCaseNote({
  platformCaseId,
  notePath = "",
  obsidianRoot = "",
}) {
  if (!platformCaseId) {
    throw new Error('loadPlatformCaseNote requires "platformCaseId".');
  }

  const resolvedObsidianRoot = resolveObsidianRoot(obsidianRoot);
  const resolvedNotePath = resolveNotePath({
    platformCaseId,
    notePath,
    obsidianRoot: resolvedObsidianRoot,
  });
  const markdown = await readFile(resolvedNotePath, "utf-8");

  return {
    platformCaseId,
    obsidianRoot: resolvedObsidianRoot,
    notePath: resolvedNotePath,
    markdown,
    parsedNote: parsePlatformCaseNote(markdown),
  };
}
