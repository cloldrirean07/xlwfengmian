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

function buildCreatorRecommendationReason({ fields, config, direction, materialKeywords, topExecutionStrategy }) {
  const keywordText = materialKeywords.length ? `素材里已经有「${materialKeywords.join("、")}」` : "";

  if (config.id === "conflict" && materialKeywords.some((keyword) => ["螃蟹", "辣炒鱿鱼", "鱿鱼", "海鲜", "红油", "辣椒"].includes(keyword))) {
    return `${keywordText}这类强食欲信号，适合先做近景冲击和清晰标题，让封面第一眼有点击理由。`;
  }

  if (config.id === "texture" && materialKeywords.some((keyword) => ["晚霞", "夏日晚霞", "霞光", "云层", "落日", "天空"].includes(keyword))) {
    return `${keywordText}这类情绪画面，适合用留白、色彩和标题区做得更专业，避免只像普通风景分享。`;
  }

  if (
    config.id === "information" &&
    materialKeywords.some((keyword) => ["口播", "人物", "镜头表现力", "自媒体", "不露脸"].includes(keyword))
  ) {
    return `${keywordText}这类口播人物信号，适合先把人物主体、对象痛点和大字标题区讲清楚。`;
  }

  if (config.id === "information") {
    return "这张卡优先解决看不清主题的问题，适合把教程任务、封面大字和素材主体先讲明白。";
  }

  if (topExecutionStrategy?.priorityReason) {
    return topExecutionStrategy.priorityReason;
  }

  return `${config.userLabel}更贴合当前内容的点击机制：${direction.directionFitReason}。`;
}

function resolveImageDirection({ imageDirection, direction, materialKeywords }) {
  if (
    direction.directionId === "conflict" &&
    materialKeywords.some((keyword) => ["螃蟹", "辣炒鱿鱼", "鱿鱼", "海鲜", "红油", "辣椒"].includes(keyword))
  ) {
    return "优先放大食物近景、红油、海鲜和辣椒，让食欲冲击点成为封面主视觉。";
  }

  if (
    direction.directionId === "texture" &&
    materialKeywords.some((keyword) => ["晚霞", "夏日晚霞", "霞光", "云层", "落日", "天空"].includes(keyword))
  ) {
    return "优先保留天空留白、云层方向和落日色彩，把标题放进低干扰区域。";
  }

  return direction.visualStrategy || imageDirection;
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
    const recommendationReason = buildCreatorRecommendationReason({
      fields,
      config,
      direction,
      materialKeywords,
      topExecutionStrategy,
    });

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
      imageDirection: resolveImageDirection({ imageDirection, direction, materialKeywords }),
      imageDirectionCandidates,
      rankedImageStrategies,
      suggestedAssetType: fields.suggestedAssetType,
      suggestedAssetReason: fields.suggestedAssetReason,
      assetUsageStatus: fields.assetUsageStatus,
      assetUsageReason: fields.assetUsageReason,
      assetUsageNextAction: fields.assetUsageNextAction,
      primaryAssetActionLabel: topExecutionStrategy?.executionTag || fields.primaryAssetActionLabel,
      primaryAssetActionReason: topExecutionStrategy?.priorityReason || fields.primaryAssetActionReason,
      recommendationReason,
      visualStrategy: direction.visualStrategy,
      copyStrategy: direction.copyStrategy,
      compositionStrategy: direction.compositionStrategy,
      compositionDirection: direction.compositionStrategy || config.compositionHints[0],
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
