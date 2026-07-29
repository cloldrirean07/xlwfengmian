import { extractInputFields } from "../domain/analysis/extractInputFields.js";
import { rankDirectionCandidates } from "../domain/analysis/rankDirectionCandidates.js";
import { buildFirstRoundCards } from "../domain/cards/buildFirstRoundCards.js";
import { buildActionWorkspace } from "../domain/workspace/buildActionWorkspace.js";
import { getRuleCatalogMeta } from "../infrastructure/rules/loadRuleCatalog.js";

const workspaceIds = ["optimize-current", "search-matched", "concept-first"];

function buildActionWorkspaces(fields, card) {
  return workspaceIds.map((workspaceId) =>
    buildActionWorkspace({
      fields,
      primaryCard: card,
      workspaceId,
    }),
  );
}

export function createAnalysisSession(payload) {
  const fields = extractInputFields(payload);
  const rankedDirections = rankDirectionCandidates(fields);
  const cards = buildFirstRoundCards(fields, rankedDirections).map((card) => {
    const actionWorkspace = buildActionWorkspace({
      fields,
      primaryCard: card,
    });

    return {
      ...card,
      actionWorkspace,
      actionWorkspaces: buildActionWorkspaces(fields, card),
    };
  });
  const actionWorkspace = buildActionWorkspace({
    fields,
    primaryCard: cards[0],
  });

  return {
    fields,
    ruleMeta: getRuleCatalogMeta(),
    rankedDirections,
    cards,
    actionWorkspace,
  };
}
