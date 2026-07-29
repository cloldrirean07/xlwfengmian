function unique(values) {
  return [...new Set(values)];
}

function isRealCaseId(caseId) {
  return /^real-\d+$/u.test(caseId);
}

function buildCaseRow({ caseId, plannedEntries, indexedEntries, itemEntries, runIds, obsidianIds }) {
  const plannedEntry = plannedEntries.find((entry) => entry.id === caseId) || null;
  const indexedEntry = indexedEntries.find((entry) => entry.id === caseId) || null;
  const itemEntry = itemEntries.find((entry) => entry.id === caseId) || null;
  const inIndex = Boolean(indexedEntry);
  const hasItem = Boolean(itemEntry);
  const hasRunExport = runIds.includes(caseId);
  const hasObsidianDraft = obsidianIds.includes(caseId);
  const platformCaseId =
    plannedEntry?.platformCaseId ||
    indexedEntry?.platformCaseId ||
    itemEntry?.platformCaseId ||
    "";
  const mappingConsistent =
    (!plannedEntry || !indexedEntry || plannedEntry.platformCaseId === indexedEntry.platformCaseId) &&
    (!indexedEntry || !itemEntry || indexedEntry.platformCaseId === itemEntry.platformCaseId);

  let status = "未进入代码层";

  if (!inIndex && !hasItem && plannedEntry) {
    status = "索引已规划未入代码";
  } else if (inIndex && !hasItem) {
    status = "仅有索引";
  } else if (hasItem && !hasRunExport) {
    status = "已入代码未运行";
  } else if (hasRunExport && !hasObsidianDraft) {
    status = "已运行未回填";
  } else if (hasObsidianDraft) {
    status = "已生成 Obsidian 草稿";
  }

  return {
    caseId,
    platformCaseId,
    inIndex,
    hasItem,
    hasRunExport,
    hasObsidianDraft,
    mappingConsistent,
    status,
  };
}

export function buildCaseProgressReport({
  placeholderFiles,
  plannedEntries,
  indexedEntries,
  itemEntries,
  runIds,
  obsidianIds,
}) {
  const allCaseIds = unique([
    ...plannedEntries.map((entry) => entry.id),
    ...indexedEntries.map((entry) => entry.id),
    ...itemEntries.map((entry) => entry.id),
    ...runIds,
    ...obsidianIds,
  ])
    .filter((caseId) => isRealCaseId(caseId))
    .sort();
  const rows = allCaseIds.map((caseId) =>
    buildCaseRow({ caseId, plannedEntries, indexedEntries, itemEntries, runIds, obsidianIds }),
  );
  const sampleRunExportCount = runIds.filter((caseId) => !isRealCaseId(caseId)).length;
  const sampleObsidianDraftCount = obsidianIds.filter((caseId) => !isRealCaseId(caseId)).length;
  const mappingWarningRows = rows.filter((row) => !row.mappingConsistent);

  return {
    summary: {
      placeholderOpenCount: placeholderFiles.length,
      plannedRealCaseCount: plannedEntries.length,
      indexedRealCaseCount: indexedEntries.length,
      realCaseItemCount: itemEntries.length,
      runExportCount: rows.filter((row) => row.hasRunExport).length,
      obsidianDraftCount: rows.filter((row) => row.hasObsidianDraft).length,
      fullyBridgedCount: rows.filter((row) => row.hasObsidianDraft).length,
      sampleRunExportCount,
      sampleObsidianDraftCount,
      mappingWarningCount: mappingWarningRows.length,
    },
    placeholders: placeholderFiles,
    mappingWarnings: mappingWarningRows.map((row) => ({
      caseId: row.caseId,
      platformCaseId: row.platformCaseId,
    })),
    rows,
  };
}
