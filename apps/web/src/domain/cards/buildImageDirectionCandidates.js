export function buildImageDirectionCandidates({ fields, effectConfig }) {
  const currentAssetStrategy =
    effectConfig.imageStrategies[fields.userAssetType] || effectConfig.imageStrategies["无图只有想法"];

  const candidates = [
    {
      candidateId: "current-asset-optimize",
      label: "优化现有素材",
      assetSource: fields.userAssetType,
      description: currentAssetStrategy,
      usageCondition: fields.assetContext?.hasLocalPreview
        ? "适合当前已经带本地图片上下文时，先围绕现有画面做提炼。"
        : "适合用户已经有截图、口播画面或基础素材时先做提炼。",
    },
  ];

  if (fields.userAssetType !== "无图只有想法") {
    candidates.push({
      candidateId: "content-matched-search",
      label: "补内容贴合图",
      assetSource: "补充图库",
      description: `围绕「${fields.contentTopic}」去补一张更贴内容的辅助图，再按 ${effectConfig.userLabel} 方式排版。`,
      usageCondition: "适合现有素材不够强，但内容主题已经明确时。",
    });
  }

  candidates.push({
    candidateId: "creative-concept-asset",
    label: "做创意概念图",
    assetSource: "概念化方向",
    description: `先确定一个能承载「${effectConfig.clickDriver}」点击机制的主体，再把内容信息补进去。`,
    usageCondition: "适合用户只有内容想法，或想要明显拉开和普通封面的差距时。",
  });

  return candidates;
}
