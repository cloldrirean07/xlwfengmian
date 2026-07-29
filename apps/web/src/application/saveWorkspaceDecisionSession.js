import { join } from "node:path";
import { writeTextFile } from "../shared/fileSystem.js";
import { buildWorkspaceDecisionMarkdown } from "../domain/workspace/buildWorkspaceDecisionMarkdown.js";

function buildDecisionId() {
  const stamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
  return `WS-${stamp}`;
}

export async function saveWorkspaceDecisionSession(payload) {
  const analysis = payload.analysis;
  const workspace = payload.workspace;
  const suggestion = payload.suggestion;
  const decision = payload.decision;

  if (!analysis?.fields) {
    throw new Error("Workspace decision save requires analysis.");
  }
  if (!workspace?.workspaceId) {
    throw new Error("Workspace decision save requires workspace.");
  }
  if (!suggestion?.summary) {
    throw new Error("Workspace decision save requires suggestion.");
  }
  if (!["accept", "reject"].includes(decision)) {
    throw new Error("Workspace decision must be accept or reject.");
  }

  const generatedAt = new Date().toISOString();
  const decisionId = buildDecisionId();
  const appRoot = new URL("../../", import.meta.url).pathname;
  const outputDir = join(appRoot, "outputs", "workspace-decisions", decisionId);
  const jsonPath = join(outputDir, "result.json");
  const markdownPath = join(outputDir, "summary.md");

  const record = {
    decisionId,
    generatedAt,
    decision,
    analysisMeta: {
      contentTopic: analysis.fields.contentTopic,
      contentGoal: analysis.fields.contentGoal,
      primaryAssetActionLabel: analysis.fields.primaryAssetActionLabel,
      suggestedAssetType: analysis.fields.suggestedAssetType,
    },
    workspace,
    suggestion,
  };

  const markdownBody = buildWorkspaceDecisionMarkdown({
    decisionId,
    generatedAt,
    decision,
    analysis,
    workspace,
    suggestion,
  });

  await writeTextFile(jsonPath, `${JSON.stringify(record, null, 2)}\n`);
  await writeTextFile(markdownPath, `${markdownBody}\n`);

  return {
    ok: true,
    decisionId,
    generatedAt,
    decision,
    jsonPath,
    markdownPath,
    record,
  };
}
