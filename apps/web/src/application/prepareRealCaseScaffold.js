import { buildRealCaseTemplate } from "../domain/cases/buildRealCaseTemplate.js";
import { compactText } from "../shared/text.js";

const defaultObsidianCaseBase =
  "03_方法论与规则库/案例库/平台原生案例/第一批案例";

function ensureRealCaseIndex(currentIndex) {
  if (!Array.isArray(currentIndex)) {
    throw new Error("Real case index must be an array.");
  }
}

function resolveObsidianCasePath(platformCaseId, obsidianCasePath) {
  const normalizedPath = compactText(obsidianCasePath);

  if (normalizedPath) {
    return normalizedPath;
  }

  return `${defaultObsidianCaseBase}/${platformCaseId}_待补.md`;
}

export function prepareRealCaseScaffold({
  currentIndex,
  id,
  title,
  platform = "抖音",
  platformCaseId,
  obsidianCasePath = "",
  sourceLink = "",
  screenshotPath = "",
  status = "draft",
  keyCaseRerunPriority = 1,
  maintenanceTags = ["real-case", "待确认是否纳入关键复跑"],
}) {
  ensureRealCaseIndex(currentIndex);

  const normalizedId = compactText(id);
  const normalizedPlatformCaseId = compactText(platformCaseId);

  if (!normalizedId) {
    throw new Error('Real case scaffold requires "id".');
  }

  if (currentIndex.some((entry) => entry?.id === normalizedId)) {
    throw new Error(`Real case id already exists in index: ${normalizedId}`);
  }

  const record = buildRealCaseTemplate({
    id: normalizedId,
    title,
    platform,
    platformCaseId: normalizedPlatformCaseId,
    obsidianCasePath: resolveObsidianCasePath(
      normalizedPlatformCaseId,
      obsidianCasePath,
    ),
    sourceLink,
    screenshotPath,
    keyCaseRerunPriority,
    maintenanceTags,
  });

  return {
    id: normalizedId,
    fileName: `${normalizedId}.json`,
    indexEntry: {
      id: normalizedId,
      platformCaseId: normalizedPlatformCaseId,
      file: `items/${normalizedId}.json`,
      status: compactText(status) || "draft",
    },
    record,
  };
}
