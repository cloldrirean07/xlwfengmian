import { prepareRealCaseScaffold } from "./prepareRealCaseScaffold.js";

export function prepareRealCaseBatchScaffold({ currentIndex, batchItems }) {
  if (!Array.isArray(batchItems) || batchItems.length === 0) {
    throw new Error("Batch file must be a non-empty array.");
  }

  const nextIndex = Array.isArray(currentIndex) ? [...currentIndex] : currentIndex;
  const created = [];

  for (const item of batchItems) {
    if (!item?.id) {
      throw new Error("Batch item is missing id");
    }

    const prepared = prepareRealCaseScaffold({
      currentIndex: nextIndex,
      id: item.id,
      title: item.title,
      platform: item.platform,
      platformCaseId: item.platformCaseId,
      obsidianCasePath: item.obsidianCasePath,
      sourceLink: item.sourceLink,
      screenshotPath: item.screenshotPath,
      status: item.status,
      keyCaseRerunPriority: item.keyCaseRerunPriority,
      maintenanceTags: item.maintenanceTags,
    });

    nextIndex.push(prepared.indexEntry);
    created.push(prepared);
  }

  return {
    created,
    nextIndex,
  };
}
