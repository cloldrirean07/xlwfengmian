import { directionSignalCatalog } from "./directionSignalCatalog.js";

function yesLike(value) {
  return value === "强" || value === "中" || value === "是" || value === "高";
}

function buildDynamicMatchedSignals(fields, directionId) {
  if (directionId === "information") {
    return [
      yesLike(fields.requiresClarity) ? "当前内容需要更快讲明白" : "",
      fields.userAssetType === "截图" ? "现有素材是截图，更适合先做信息提炼" : "",
      fields.contentTypePrimary?.includes("教程") || fields.contentTypePrimary?.includes("清单")
        ? "内容类型偏教程/清单，更适合强信息方向"
        : "",
    ].filter(Boolean);
  }

  if (directionId === "result") {
    return [
      yesLike(fields.hasClearResult) ? "内容目标里已经带明确结果导向" : "",
      fields.contentGoal ? "用户描述了希望用户获得什么收获" : "",
      ["场景图", "商品图"].includes(fields.userAssetType) ? "当前素材类型适合突出完成态或收益感" : "",
    ].filter(Boolean);
  }

  if (directionId === "suspense") {
    return [
      yesLike(fields.hasCuriosityGap) ? "内容里存在异常点或可留白空间" : "",
      fields.desiredCoverFeel ? `用户偏好里已有「${fields.desiredCoverFeel}」这类抓眼诉求` : "",
      fields.assetContext?.hasLocalPreview ? "已有本地画面，可先从局部截异常点" : "",
    ].filter(Boolean);
  }

  if (directionId === "conflict") {
    return [
      yesLike(fields.hasContrast) ? "内容有误区、对立或前后差异结构" : "",
      (fields.contentTopic || "").includes("误区") ? "标题主题天然带误区信号" : "",
      fields.assetContext?.hasLocalPreview ? "当前已有本地画面，适合做对照改法" : "",
    ].filter(Boolean);
  }

  return [
    yesLike(fields.requiresTrust) ? "内容需要更强可信度和专业感" : "",
    fields.desiredCoverFeel ? `用户明确提到了更稳、更高级一类偏好` : "",
    fields.assetContext?.hasLocalPreview ? "已有现成画面，更适合先稳住质感和秩序感" : "",
  ].filter(Boolean);
}

export function buildDirectionSignalChecklist(fields, directionId) {
  const config = directionSignalCatalog[directionId];

  if (!config) {
    return {
      signalGroups: [],
      feedbackTriggers: [],
      boundaryRules: [],
      matchedSignals: [],
    };
  }

  return {
    signalGroups: config.signalGroups,
    feedbackTriggers: config.feedbackTriggers,
    boundaryRules: config.boundaryRules,
    matchedSignals: buildDynamicMatchedSignals(fields, directionId),
  };
}
