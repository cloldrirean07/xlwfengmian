import { coverEffectCatalog } from "../effects/coverEffectCatalog.js";
import { shortenText } from "../../shared/text.js";
import { buildImageDirectionCandidates } from "./buildImageDirectionCandidates.js";
import { buildRankedImageStrategies } from "./buildRankedImageStrategies.js";
import {
  buildMaterialAwareTitleOptionDetails,
  extractMaterialKeywords,
  injectMaterialKeywordsIntoCopy,
} from "../copy/materialKeywordCopy.js";

function fillTemplate(template, fields) {
  const goalShort = shortenText(fields.contentGoal || fields.contentTopic || "内容表达", 10);
  return template
    .replaceAll("{topic}", shortenText(fields.contentTopic || "当前主题", 12))
    .replaceAll("{goalShort}", goalShort || "更容易被点开");
}

export function buildFirstRoundCards(fields, rankedDirections) {
  const materialKeywords = extractMaterialKeywords(fields);

  return rankedDirections.map((direction, index) => {
    const config = coverEffectCatalog[direction.directionId];
    const imageDirection =
      config.imageStrategies[fields.userAssetType] || config.imageStrategies["无图只有想法"];
    const imageDirectionCandidates = buildImageDirectionCandidates({
      fields,
      effectConfig: config,
    });
    const rankedImageStrategies = buildRankedImageStrategies({
      fields,
      effectConfig: config,
      candidates: imageDirectionCandidates,
    });
    const topExecutionStrategy = rankedImageStrategies[0];
    const titleOptionDetails = buildMaterialAwareTitleOptionDetails(
      config.titleTemplates.map((template) => fillTemplate(template, fields)),
      fields,
    ).slice(0, 3);

    return {
      cardId: direction.cardId,
      effectId: config.id,
      directionTypeInternal: config.internalName,
      directionLabelUserFacing: config.userLabel,
      directionDescription: `${config.effectSummary} ${direction.directionFitReason}。`,
      coverCopyMain: injectMaterialKeywordsIntoCopy(
        fillTemplate(config.coverCopyTemplates[index % config.coverCopyTemplates.length], fields),
        fields,
      ),
      titleOptions: titleOptionDetails.map((item) => item.title),
      titleOptionDetails,
      materialKeywords,
      imageDirection,
      imageDirectionCandidates,
      rankedImageStrategies,
      suggestedAssetType: fields.suggestedAssetType,
      suggestedAssetReason: fields.suggestedAssetReason,
      primaryAssetActionLabel: topExecutionStrategy?.executionTag || fields.primaryAssetActionLabel,
      primaryAssetActionReason: topExecutionStrategy?.priorityReason || fields.primaryAssetActionReason,
      compositionDirection: config.compositionHints[0],
      colorMoodDirection: config.compositionHints[1],
      clickReason: `${config.userLabel}，更贴合这条内容当前的点击机制。`,
      fitReason: direction.directionFitReason,
      riskNote: direction.directionRisk,
      boundaryRule: direction.directionBoundary,
      bestFor: config.bestFor.slice(0, 3),
      signalMatches: direction.signalMatches,
      directionSignalChecklist: direction.directionSignalChecklist,
      role: direction.directionRole,
    };
  });
}
