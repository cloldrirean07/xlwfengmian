import { coverEffectCatalog, coverEffectOrder } from "../effects/coverEffectCatalog.js";
import { buildDirectionSignalChecklist } from "../directions/buildDirectionSignalChecklist.js";

const driverToDirection = {
  看懂: "information",
  收益: "result",
  好奇: "suspense",
  冲击: "conflict",
  信任: "texture",
};

function scoreStrength(value) {
  if (value === "强" || value === "是" || value === "高") {
    return 2;
  }
  if (value === "中") {
    return 1;
  }
  if (value === "弱") {
    return 0;
  }
  return value === "否" ? 0 : 0;
}

function buildAssetSupport(fields, directionId) {
  const hasLocalPreviewBonus = fields.assetContext?.hasLocalPreview ? 1 : 0;

  if (directionId === "information") {
    return (fields.userAssetType === "截图" ? 4 : 3) + hasLocalPreviewBonus;
  }
  if (directionId === "result") {
    return scoreStrength(fields.hasClearResult) + 2 + hasLocalPreviewBonus;
  }
  if (directionId === "suspense") {
    return scoreStrength(fields.hasCuriosityGap) + 2 + hasLocalPreviewBonus;
  }
  if (directionId === "conflict") {
    return scoreStrength(fields.hasContrast) + 2 + hasLocalPreviewBonus;
  }
  return scoreStrength(fields.requiresTrust) + 2 + hasLocalPreviewBonus;
}

function scoreDirection(fields, directionId) {
  let content = 1;
  const primaryDirection = driverToDirection[fields.clickDriverPrimary] || "information";

  if (directionId === primaryDirection) {
    content += 3;
  }

  if (directionId === "information") {
    content += scoreStrength(fields.requiresClarity);
  }
  if (directionId === "result") {
    content += scoreStrength(fields.hasClearResult);
  }
  if (directionId === "suspense") {
    content += scoreStrength(fields.hasCuriosityGap);
  }
  if (directionId === "conflict") {
    content += scoreStrength(fields.hasContrast);
  }
  if (directionId === "texture") {
    content += scoreStrength(fields.requiresTrust);
  }

  const asset = buildAssetSupport(fields, directionId);
  const platform = fields.platform === "抖音" && ["suspense", "conflict", "result"].includes(directionId) ? 4 : 3;

  return {
    fitScoreContent: Math.min(content, 5),
    fitScoreAsset: Math.min(asset, 5),
    fitScorePlatform: platform,
  };
}

function buildFitReason(fields, directionId) {
  const catalog = coverEffectCatalog[directionId];
  const reasons = [`当前内容更靠「${catalog.clickDriver}」驱动点击`];

  if (directionId === "information" && fields.requiresClarity !== "弱") {
    reasons.push("内容需要更快讲明白");
  }
  if (directionId === "result" && fields.hasClearResult !== "弱") {
    reasons.push("内容里有明确收获或结果");
  }
  if (directionId === "suspense" && fields.hasCuriosityGap !== "弱") {
    reasons.push("内容本身有异常点或未说完的空间");
  }
  if (directionId === "conflict" && fields.hasContrast !== "弱") {
    reasons.push("内容里存在对立、反差或误区结构");
  }
  if (directionId === "texture" && fields.requiresTrust !== "弱") {
    reasons.push("用户更在意专业感和可信度");
  }

  return reasons.join("，");
}

function buildSignalMatches(fields, directionId) {
  if (directionId === "information") {
    return [
      fields.requiresClarity !== "弱" ? "主题需要更快被看懂" : "",
      fields.userAssetType === "截图" ? "现有素材适合做清晰信息提炼" : "",
      fields.assetContext?.hasLocalPreview ? "当前已带本地图片上下文，可直接围绕现有画面做判断" : "",
    ].filter(Boolean);
  }

  if (directionId === "result") {
    return [
      fields.hasClearResult !== "弱" ? "内容本身存在明确收益或变化" : "",
      fields.contentGoal ? "目标表达里已经带有结果导向" : "",
      fields.assetContext?.hasLocalPreview ? "当前已有本地图片可作为结果画面的提炼基础" : "",
    ].filter(Boolean);
  }

  if (directionId === "suspense") {
    return [
      fields.hasCuriosityGap !== "弱" ? "内容里有异常点或可留白空间" : "",
      fields.desiredCoverFeel ? `偏好里带有「${fields.desiredCoverFeel}」这类抓眼诉求` : "",
      fields.assetContext?.hasLocalPreview ? "当前已带本地图片，适合先从现有画面里截异常点" : "",
    ].filter(Boolean);
  }

  if (directionId === "conflict") {
    return [
      fields.hasContrast !== "弱" ? "内容存在误区、反差或对立结构" : "",
      fields.contentTopic.includes("误区") ? "主题天然适合做对照冲突" : "",
      fields.assetContext?.hasLocalPreview ? "当前已带本地图片，后续更适合做前后或左右对照" : "",
    ].filter(Boolean);
  }

  return [
    fields.requiresTrust !== "弱" ? "内容需要可信度和专业感支撑" : "",
    fields.desiredCoverFeel ? `用户偏好更靠近「${fields.desiredCoverFeel}」的克制表达` : "",
    fields.assetContext?.hasLocalPreview ? "当前已带本地图片上下文，更适合先稳住主体和质感" : "",
  ].filter(Boolean);
}

function buildDirectionStrategies(directionId) {
  if (directionId === "information") {
    return {
      visualStrategy: "突出信息块和清晰主体",
      copyStrategy: "主题词前置，直接点题",
      compositionStrategy: "中心信息区稳定布局",
    };
  }
  if (directionId === "result") {
    return {
      visualStrategy: "放大结果状态或变化感",
      copyStrategy: "收益词前置",
      compositionStrategy: "让结果成为视觉中心",
    };
  }
  if (directionId === "suspense") {
    return {
      visualStrategy: "保留异常点，不把答案说满",
      copyStrategy: "半揭示表达",
      compositionStrategy: "单焦点 + 适度留白",
    };
  }
  if (directionId === "conflict") {
    return {
      visualStrategy: "强化对立关系和前后差异",
      copyStrategy: "对立句式或反差表达",
      compositionStrategy: "左右/前后对照布局",
    };
  }
  return {
    visualStrategy: "统一配色和氛围，减少噪音",
    copyStrategy: "克制表达，保留分量感",
    compositionStrategy: "留白更稳，主体更有分量",
  };
}

export function rankDirectionCandidates(fields) {
  return coverEffectOrder
    .map((directionId) => {
      const scores = scoreDirection(fields, directionId);
      const total = scores.fitScoreContent + scores.fitScoreAsset + scores.fitScorePlatform;
      const directionSignalChecklist = buildDirectionSignalChecklist(fields, directionId);

      return {
        directionId,
        directionType: coverEffectCatalog[directionId].internalName,
        directionRole: "candidate",
        fitScoreContent: scores.fitScoreContent,
        fitScoreAsset: scores.fitScoreAsset,
        fitScorePlatform: scores.fitScorePlatform,
        fitScoreTotal: total,
        directionFitReason: buildFitReason(fields, directionId),
        directionRisk: coverEffectCatalog[directionId].defaultRisks[0],
        directionBoundary: coverEffectCatalog[directionId].defaultRisks[1],
        signalMatches: buildSignalMatches(fields, directionId),
        directionSignalChecklist,
        ...buildDirectionStrategies(directionId),
      };
    })
    .sort((left, right) => right.fitScoreTotal - left.fitScoreTotal)
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      directionRole: index === 0 ? "primary" : "secondary",
      cardId: ["A", "B", "C"][index],
    }));
}
