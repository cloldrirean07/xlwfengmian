import { compactText, includesAny } from "../../shared/text.js";

function normalizeAssetText(fields) {
  return compactText(
    [
      fields.userAssetType,
      fields.assetDescription,
      fields.assetNotes,
      fields.assetContext?.fileName,
      fields.assetContext?.summaryLabel,
      ...(fields.assetContext?.items || []).map((item) => item.fileName),
      fields.assetContext?.dimensionsLabel,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function inferSuggestedAssetType(fields, assetText) {
  if (fields.userAssetType && fields.userAssetType !== "无图只有想法") {
    return fields.userAssetType;
  }

  if (includesAny(assetText, ["截图", "界面", "口播", "封面"])) {
    return "截图";
  }
  if (includesAny(assetText, ["人物", "人像", "表情", "自拍"])) {
    return "人像";
  }
  if (includesAny(assetText, ["风景", "场景", "环境", "空间"])) {
    return "场景图";
  }
  if (includesAny(assetText, ["商品", "产品", "包装", "实物"])) {
    return "商品图";
  }

  return fields.assetContext?.hasLocalPreview ? "截图" : "无图只有想法";
}

function inferPrimaryAction(fields, assetText) {
  const wantsCreative = includesAny(fields.desiredCoverFeel, ["创意", "抓眼", "更炸", "更有冲击"]);
  const wantsContentFit = includesAny(
    `${fields.assetDescription} ${fields.assetNotes}`,
    ["贴内容", "不够贴", "普通", "太平", "背景空"],
  );

  if (fields.assetContext?.hasLocalPreview || fields.userAssetType !== "无图只有想法") {
    if (wantsContentFit) {
      return {
        actionId: "optimize-current",
        actionLabel: "先优化现有图",
        actionReason: "当前已经有图片上下文，先围绕现有画面提炼主体、标题区和构图通常成本最低。",
      };
    }

    return {
      actionId: "optimize-current",
      actionLabel: "先优化现有图",
      actionReason: "当前已经带图进入流程，先优化现有素材通常是最快形成结果的路径。",
    };
  }

  if (wantsCreative) {
    return {
      actionId: "concept-first",
      actionLabel: "先做概念图",
      actionReason: "当前没有可用现成图，而且封面倾向更抓眼或更有创意，先确定概念主体更合适。",
    };
  }

  if (fields.contentTopic || wantsContentFit || assetText) {
    return {
      actionId: "search-matched",
      actionLabel: "先补贴内容的图",
      actionReason: "当前主题已经明确，但没有足够可用素材，先补一张更贴内容的图最容易提升点击面。",
    };
  }

  return {
    actionId: "concept-first",
    actionLabel: "先做概念图",
    actionReason: "当前输入里几乎没有可用素材，先确定能承载点击机制的主体更稳妥。",
  };
}

export function inferAssetSuggestion(fields) {
  const assetText = normalizeAssetText(fields);
  const suggestedAssetType = inferSuggestedAssetType(fields, assetText);
  const primaryAction = inferPrimaryAction(fields, assetText);

  return {
    suggestedAssetType,
    suggestedAssetReason:
      suggestedAssetType === fields.userAssetType
        ? "当前素材类型与输入状态基本一致，可直接沿用这条路径继续判断。"
        : `根据当前描述和图片上下文，系统更建议把这次素材理解为「${suggestedAssetType}」。`,
    primaryAction,
  };
}
