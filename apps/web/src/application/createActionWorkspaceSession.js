import {
  buildActionWorkspace,
  isSupportedWorkspaceId,
} from "../domain/workspace/buildActionWorkspace.js";
import { buildActionWorkspaceSuggestion } from "../domain/workspace/buildActionWorkspaceSuggestion.js";

export function createActionWorkspaceSession(payload) {
  const analysis = payload.analysis;

  if (!analysis?.fields) {
    throw new Error("Action workspace requires an analysis payload.");
  }

  if (!payload.selectedCardId) {
    throw new Error("请先选择一个封面方向");
  }

  const selectedCard = analysis.cards?.find((card) => card.cardId === payload.selectedCardId);

  if (!selectedCard) {
    throw new Error("当前方向已失效，请重新选择");
  }

  if (payload.workspaceId && !isSupportedWorkspaceId(payload.workspaceId)) {
    throw new Error("工作区路径不可用，请重新选择");
  }

  const workspace = buildActionWorkspace({
    fields: analysis.fields,
    primaryCard: selectedCard,
    workspaceId: payload.workspaceId || selectedCard.actionWorkspace?.workspaceId,
  });

  const suggestion = buildActionWorkspaceSuggestion({
    analysis,
    workspace: {
      ...workspace,
      linkedCardDirection: selectedCard.directionLabelUserFacing,
    },
    inputs: payload.workspaceInputs || {},
  });

  return {
    workspace: {
      ...workspace,
      linkedCardDirection: selectedCard.directionLabelUserFacing,
    },
    suggestion,
  };
}
