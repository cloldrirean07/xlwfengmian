import { compactText, includesAny } from "../../shared/text.js";
import { inferAssetSuggestion } from "./inferAssetSuggestion.js";

const contentTypeHints = {
  干货: ["方法", "技巧", "步骤", "攻略", "干货", "总结"],
  教程: ["怎么", "如何", "教程", "入门", "不会", "学不会"],
  观点: ["为什么", "其实", "本质", "判断", "看法"],
  冷知识: ["冷知识", "原来", "竟然", "你知道吗"],
  误区纠正: ["误区", "别再", "不要", "错", "避坑"],
  结果展示: ["提升", "结果", "收益", "变化", "前后"],
};

const driverHints = {
  看懂: ["讲清楚", "看懂", "直接", "明白", "重点"],
  收益: ["有用", "收益", "提升", "结果", "学会", "解决"],
  好奇: ["吸引", "好奇", "想点开", "悬念", "反常识"],
  冲击: ["冲击", "炸", "反差", "强烈", "记忆点"],
  信任: ["高级", "专业", "可信", "别像营销号", "质感"],
};

function inferContentType(text) {
  let bestType = "其他";
  let bestScore = -1;

  for (const [type, keywords] of Object.entries(contentTypeHints)) {
    const score = keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0);
    if (score > bestScore) {
      bestType = type;
      bestScore = score;
    }
  }

  return bestType;
}

function inferClickDriver(text, preference) {
  const pool = `${text} ${preference}`.trim();
  let bestDriver = "看懂";
  let bestScore = -1;

  for (const [driver, keywords] of Object.entries(driverHints)) {
    const score = keywords.reduce((sum, keyword) => sum + (pool.includes(keyword) ? 1 : 0), 0);
    if (score > bestScore) {
      bestDriver = driver;
      bestScore = score;
    }
  }

  if (bestScore <= 0) {
    if (includesAny(text, ["为什么", "总是", "卡住", "原来"])) {
      return "好奇";
    }
    if (includesAny(text, ["误区", "不要", "别再", "差距"])) {
      return "冲击";
    }
  }

  return bestDriver;
}

function inferStrength(condition) {
  if (condition === 2) {
    return "强";
  }
  if (condition === 1) {
    return "中";
  }
  return "弱";
}

function buildAssetContext(assetContext) {
  const hasLocalPreview = Boolean(assetContext?.hasLocalPreview);
  const items = Array.isArray(assetContext?.items) ? assetContext.items : [];
  const fileName = compactText(assetContext?.fileName);
  const mimeType = compactText(assetContext?.mimeType);
  const sizeLabel = compactText(assetContext?.sizeLabel);
  const dimensionsLabel = compactText(assetContext?.dimensionsLabel);
  const origin = compactText(assetContext?.origin) || "none";
  const fileCount = Number(assetContext?.fileCount || items.length || (hasLocalPreview ? 1 : 0));
  const summaryLabel = compactText(assetContext?.summaryLabel) || fileName;

  const visualDensityHint = hasLocalPreview
    ? includesAny(dimensionsLabel, ["1080", "1170", "1280", "1920"])
      ? "较完整画面"
      : "基础预览"
    : "无";
  const likelyOrientation = hasLocalPreview
    ? dimensionsLabel
      ? (() => {
          const [widthText, heightText] = dimensionsLabel.split("×").map((item) => item.trim());
          const width = Number(widthText);
          const height = Number(heightText);

          if (!Number.isFinite(width) || !Number.isFinite(height)) {
            return "未知";
          }
          if (height > width) {
            return "竖图";
          }
          if (width > height) {
            return "横图";
          }
          return "方图";
        })()
      : "未知"
    : "无";

  return {
    origin,
    hasLocalPreview,
    fileName,
    mimeType,
    sizeLabel,
    dimensionsLabel,
    fileCount,
    summaryLabel,
    items,
    visualDensityHint,
    likelyOrientation,
  };
}

function inferAssetUsage(fields) {
  const assetPool = compactText(
    [
      fields.userAssetType,
      fields.assetDescription,
      fields.assetNotes,
      fields.assetContext?.summaryLabel,
      fields.assetContext?.fileName,
    ].join(" "),
  );

  if (!fields.assetContext?.hasLocalPreview && fields.userAssetType === "无图只有想法") {
    return {
      status: "建议补图",
      reason: "当前没有本地图片，首轮方案会先给出更适合内容的封面图题材。",
      nextAction: "优先补一张能承载点击机制的主图。",
    };
  }

  if (includesAny(assetPool, ["不适合", "只是参考", "内容参考", "模糊", "随手拍"])) {
    return {
      status: "仅作内容参考",
      reason: "当前素材更适合帮助理解内容，不宜直接作为最终封面主图。",
      nextAction: "按方案中的图像题材重新补图或找图。",
    };
  }

  if (includesAny(assetPool, ["封面", "主图", "成片", "可直接", "已经选好"])) {
    return {
      status: "可直接使用",
      reason: "当前素材已经接近封面候选，可优先围绕标题区、主体突出和裁切做优化。",
      nextAction: "先用当前图做封面草稿，再按方向卡调整标题和构图。",
    };
  }

  if (fields.assetContext?.hasLocalPreview) {
    return {
      status: "建议裁切优化",
      reason:
        fields.assetContext.fileCount > 1
          ? "当前有多张参考图，可先选主图，再围绕主体、标题区和点击重点裁切优化。"
          : "当前已有本地参考图，可先围绕主体、标题区和点击重点裁切优化。",
      nextAction: "先选出最能代表内容的一张，再按方案调整画面重心。",
    };
  }

  return {
    status: "建议补图",
    reason: "当前素材线索主要来自文字描述，需要补充更贴合内容的封面图题材。",
    nextAction: "按方案中的推荐图像题材补充素材。",
  };
}

export function extractInputFields(payload) {
  const contentTopic = compactText(payload.contentTopic);
  const contentGoal = compactText(payload.contentGoal);
  const referencePreference = compactText(payload.referencePreference || payload.desiredCoverFeel);
  const assetDescription = compactText(payload.assetDescription || payload.assetNotes);
  const assetNotes = compactText(payload.assetNotes || payload.assetDescription);
  const assetContext = buildAssetContext(payload.assetContext);
  const contentText = `${contentTopic} ${contentGoal} ${assetDescription} ${assetNotes}`.trim();

  const contentTypePrimary = inferContentType(contentText);
  const clickDriverPrimary = inferClickDriver(contentText, referencePreference);

  const hasClearResult = inferStrength(
    Number(includesAny(contentText, ["提升", "结果", "收获", "解决", "更好"])) +
      Number(contentTypePrimary === "结果展示" || contentTypePrimary === "教程"),
  );
  const hasContrast = inferStrength(
    Number(includesAny(contentText, ["误区", "别再", "差距", "前后", "反差"])) +
      Number(includesAny(referencePreference, ["更炸", "更有冲击", "拉开差距"])),
  );
  const hasCuriosityGap = inferStrength(
    Number(includesAny(contentText, ["为什么", "原来", "总是", "卡住", "反常识"])) +
      Number(includesAny(referencePreference, ["更吸引人", "更有好奇心", "更想点开"])),
  );
  const requiresClarity = inferStrength(
    Number(contentTypePrimary === "教程" || contentTypePrimary === "干货") +
      Number(includesAny(referencePreference, ["直接", "清楚", "讲明白"])),
  );
  const requiresTrust = inferStrength(
    Number(includesAny(referencePreference, ["高级", "专业", "别像营销号"])) +
      Number(includesAny(contentText, ["判断", "专业", "知识", "观点"])),
  );
  const assetSuggestion = inferAssetSuggestion({
    userAssetType: payload.userAssetType || "截图",
    assetDescription,
    assetNotes,
    desiredCoverFeel: referencePreference,
    contentTopic,
    assetContext,
  });
  const assetUsage = inferAssetUsage({
    userAssetType: payload.userAssetType || "截图",
    assetDescription,
    assetNotes,
    assetContext,
  });

  return {
    caseId: compactText(payload.id || payload.caseId),
    contentTopic,
    contentGoal,
    userAssetType: payload.userAssetType || "截图",
    platform: payload.platform || "抖音",
    minimumInputMode: assetContext.hasLocalPreview
      ? assetDescription
        ? "内容说明+素材描述+本地图片"
        : "内容说明+本地图片"
      : assetDescription
        ? "内容说明+素材描述"
        : "内容说明",
    contentTypePrimary,
    clickDriverPrimary,
    hasClearResult,
    hasContrast,
    hasCuriosityGap,
    requiresClarity,
    requiresTrust,
    desiredCoverFeel: referencePreference,
    userReferencePreference: referencePreference,
    assetDescription,
    assetNotes,
    copyReview: payload.copyReview || {},
    assetContext,
    hasLocalAssetContext: assetContext.hasLocalPreview ? "是" : "否",
    assetUsageStatus: assetUsage.status,
    assetUsageReason: assetUsage.reason,
    assetUsageNextAction: assetUsage.nextAction,
    suggestedAssetType: assetSuggestion.suggestedAssetType,
    suggestedAssetReason: assetSuggestion.suggestedAssetReason,
    primaryAssetActionId: assetSuggestion.primaryAction.actionId,
    primaryAssetActionLabel: assetSuggestion.primaryAction.actionLabel,
    primaryAssetActionReason: assetSuggestion.primaryAction.actionReason,
  };
}
