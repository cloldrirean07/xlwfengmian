export function buildPlatformSyncActions({ caseId, refreshArtifacts, exportObsidian }) {
  const actions = [];

  if (!refreshArtifacts) {
    return actions;
  }

  actions.push({
    id: "validate-cases",
    script: "validate-cases.js",
    args: [],
  });
  actions.push({
    id: "report-real-case-readiness",
    script: "report-real-case-readiness.js",
    args: [],
  });
  actions.push({
    id: "generate-real-case-fill-sheet",
    script: "generate-real-case-fill-sheet.js",
    args: ["--case-id", caseId],
  });

  if (exportObsidian) {
    actions.push({
      id: "export-obsidian-readiness",
      script: "export-obsidian-readiness.js",
      args: [],
    });
    actions.push({
      id: "export-obsidian-fill-sheet",
      script: "export-obsidian-fill-sheet.js",
      args: ["--case-id", caseId],
    });
  }

  return actions;
}
