import { coverEffectCatalog, coverEffectOrder } from "../effects/coverEffectCatalog.js";
import { buildDirectionSignalChecklist } from "../directions/buildDirectionSignalChecklist.js";

const driverToDirection = {
  看懂: "information",
  收益: "result",
  好奇: "suspense",
  冲击: "conflict",
  信任: "texture",
};

function buildScenarioPool(fields) {
  return [
    fields.contentTopic,
    fields.contentGoal,
    fields.assetDescription,
    fields.assetNotes,
    fields.desiredCoverFeel,
    fields.userReferencePreference,
  ]
    .filter(Boolean)
    .join(" ");
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function detectMaterialScenario(fields) {
  const pool = buildScenarioPool(fields);

  if (
    includesAny(pool, ["口播", "人物", "正脸", "半身", "表情", "五官", "镜头表现力", "自媒体"]) &&
    includesAny(pool, ["训练", "剪辑", "流程", "不露脸", "新手", "建议", "标准流程", "封面", "教程"])
  ) {
    return "talking-head";
  }

  if (
    includesAny(pool, ["晚霞", "霞光", "落日", "云层", "天空", "风景"]) &&
    includesAny(pool, ["高级", "专业", "氛围", "治愈", "封面"])
  ) {
    return "sunset-sky";
  }

  if (
    includesAny(pool, ["螃蟹", "鱿鱼", "海鲜", "红油", "辣椒", "美食", "夜宵", "下饭"]) &&
    includesAny(pool, ["冲击", "食欲", "抓人眼球", "封面", "小红书"])
  ) {
    return "food-impact";
  }

  return "";
}

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
  const materialScenario = detectMaterialScenario(fields);

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

  if (materialScenario === "sunset-sky" && directionId === "texture") {
    content += 5;
  }
  if (materialScenario === "sunset-sky" && directionId === "suspense") {
    content += 1;
  }
  if (materialScenario === "food-impact" && directionId === "conflict") {
    content += 3;
  }
  if (materialScenario === "food-impact" && directionId === "result") {
    content += 1;
  }
  if (materialScenario === "talking-head" && directionId === "information") {
    content += 4;
  }
  if (materialScenario === "talking-head" && directionId === "result") {
    content += 2;
  }
  if (materialScenario === "talking-head" && directionId === "suspense") {
    content += 1;
  }

  const asset = buildAssetSupport(fields, directionId);
  let platform = fields.platform === "抖音" && ["suspense", "conflict", "result"].includes(directionId) ? 4 : 3;

  if (materialScenario === "sunset-sky" && directionId === "texture") {
    platform = 5;
  }
  if (materialScenario === "talking-head" && ["information", "result"].includes(directionId)) {
    platform = 5;
  }

  return {
    fitScoreContent: Math.min(content, 5),
    fitScoreAsset: Math.min(asset, 5),
    fitScorePlatform: platform,
  };
}

function buildFitReason(fields, directionId) {
  const catalog = coverEffectCatalog[directionId];
  const materialScenario = detectMaterialScenario(fields);
  const reasons = [`当前内容更靠「${catalog.clickDriver}」驱动点击`];

  if (materialScenario === "sunset-sky" && directionId === "texture") {
    reasons.push("晚霞和天空素材更依赖留白、色彩和完成度建立专业感");
  }
  if (materialScenario === "food-impact" && directionId === "conflict") {
    reasons.push("美食素材已有红油、海鲜和辣椒这类强食欲冲击点");
  }
  if (materialScenario === "talking-head" && directionId === "information") {
    reasons.push("口播截图需要先让人物、标题和对象痛点一眼看懂");
  }
  if (materialScenario === "talking-head" && directionId === "result") {
    reasons.push("口播教程更适合把训练结果和可执行方法前置");
  }
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
  const materialScenario = detectMaterialScenario(fields);

  if (directionId === "information") {
    return [
      materialScenario === "talking-head" ? "口播截图需要先稳住人物主体和大字标题区" : "",
      fields.requiresClarity !== "弱" ? "主题需要更快被看懂" : "",
      fields.userAssetType === "截图" ? "现有素材适合做清晰信息提炼" : "",
      fields.assetContext?.hasLocalPreview ? "当前已带本地图片上下文，可直接围绕现有画面做判断" : "",
    ].filter(Boolean);
  }

  if (directionId === "result") {
    return [
      materialScenario === "talking-head" ? "口播教程适合把对象痛点和训练结果前置" : "",
      fields.hasClearResult !== "弱" ? "内容本身存在明确收益或变化" : "",
      fields.contentGoal ? "目标表达里已经带有结果导向" : "",
      fields.assetContext?.hasLocalPreview ? "当前已有本地图片可作为结果画面的提炼基础" : "",
    ].filter(Boolean);
  }

  if (directionId === "suspense") {
    return [
      materialScenario === "talking-head" ? "不露脸、口播不自然等痛点可以形成点击钩子" : "",
      fields.hasCuriosityGap !== "弱" ? "内容里有异常点或可留白空间" : "",
      fields.desiredCoverFeel ? `偏好里带有「${fields.desiredCoverFeel}」这类抓眼诉求` : "",
      fields.assetContext?.hasLocalPreview ? "当前已带本地图片，适合先从现有画面里截异常点" : "",
    ].filter(Boolean);
  }

  if (directionId === "conflict") {
    return [
      materialScenario === "food-impact" ? "食物近景、红油和辣椒已经具备食欲冲击点" : "",
      fields.hasContrast !== "弱" ? "内容存在误区、反差或对立结构" : "",
      fields.contentTopic.includes("误区") ? "主题天然适合做对照冲突" : "",
      fields.assetContext?.hasLocalPreview && materialScenario !== "food-impact"
        ? "当前已带本地图片，后续更适合做前后或左右对照"
        : "",
    ].filter(Boolean);
  }

  return [
    materialScenario === "sunset-sky" ? "晚霞、云层和天空留白适合建立更专业的封面质感" : "",
    fields.requiresTrust !== "弱" ? "内容需要可信度和专业感支撑" : "",
    fields.desiredCoverFeel ? `用户偏好更靠近「${fields.desiredCoverFeel}」的克制表达` : "",
    fields.assetContext?.hasLocalPreview ? "当前已带本地图片上下文，更适合先稳住主体和质感" : "",
  ].filter(Boolean);
}

function buildDirectionStrategies(directionId, fields) {
  const materialScenario = detectMaterialScenario(fields);

  if (directionId === "information") {
    if (materialScenario === "talking-head") {
      return {
        visualStrategy: "放大人物主体，保留正脸、表情和手势",
        copyStrategy: "对象痛点前置，标题直接说明口播问题",
        compositionStrategy: "标题放在胸口下方、侧边或背景留白区，避开五官",
      };
    }

    return {
      visualStrategy: "突出信息块和清晰主体",
      copyStrategy: "主题词前置，直接点题",
      compositionStrategy: "中心信息区稳定布局",
    };
  }
  if (directionId === "result") {
    if (materialScenario === "talking-head") {
      return {
        visualStrategy: "用人物表情建立信任，再放大训练后的结果感",
        copyStrategy: "对象 + 方法 + 结果，避免只写抽象表现力",
        compositionStrategy: "人物居中，标题承接在下方大字区，保留眼睛和嘴部",
      };
    }

    return {
      visualStrategy: "放大结果状态或变化感",
      copyStrategy: "收益词前置",
      compositionStrategy: "让结果成为视觉中心",
    };
  }
  if (directionId === "suspense") {
    if (materialScenario === "talking-head") {
      return {
        visualStrategy: "保留人物表情和痛点钩子，不遮挡关键五官",
        copyStrategy: "用口播痛点做半揭示标题",
        compositionStrategy: "人物与标题分区，避免把大字压在眼睛和嘴部",
      };
    }

    return {
      visualStrategy: "保留异常点，不把答案说满",
      copyStrategy: "半揭示表达",
      compositionStrategy: "单焦点 + 适度留白",
    };
  }
  if (directionId === "conflict") {
    if (materialScenario === "food-impact") {
      return {
        visualStrategy: "放大食物近景、红油和辣椒冲击点",
        copyStrategy: "具体食材 + 食欲感 + 封面任务",
        compositionStrategy: "食物主体占画面中心，标题避开蟹壳、鱿鱼和红油高光",
      };
    }

    return {
      visualStrategy: "强化对立关系和前后差异",
      copyStrategy: "对立句式或反差表达",
      compositionStrategy: "左右/前后对照布局",
    };
  }
  return {
    visualStrategy:
      materialScenario === "sunset-sky" ? "保留天空留白、云层方向和落日色彩" : "统一配色和氛围，减少噪音",
    copyStrategy:
      materialScenario === "sunset-sky" ? "情绪记忆点 + 封面构思任务" : "克制表达，保留分量感",
    compositionStrategy:
      materialScenario === "sunset-sky"
        ? "标题放在低干扰天空区，地平线和暗部稳定画面"
        : "留白更稳，主体更有分量",
  };
}

function buildDirectionRisk(fields, directionId) {
  const materialScenario = detectMaterialScenario(fields);

  if (materialScenario === "talking-head" && ["information", "result", "suspense"].includes(directionId)) {
    return {
      directionRisk: "标题不能遮挡眼睛、嘴部和关键表情，结果承诺需要有内容支撑",
      directionBoundary: "避免只写抽象表现力，也避免使用无依据的暴涨、绝杀类承诺",
    };
  }

  return {
    directionRisk: coverEffectCatalog[directionId].defaultRisks[0],
    directionBoundary: coverEffectCatalog[directionId].defaultRisks[1],
  };
}

export function rankDirectionCandidates(fields) {
  return coverEffectOrder
    .map((directionId) => {
      const scores = scoreDirection(fields, directionId);
      const total = scores.fitScoreContent + scores.fitScoreAsset + scores.fitScorePlatform;
      const directionSignalChecklist = buildDirectionSignalChecklist(fields, directionId);
      const risks = buildDirectionRisk(fields, directionId);

      return {
        directionId,
        directionType: coverEffectCatalog[directionId].internalName,
        directionRole: "candidate",
        fitScoreContent: scores.fitScoreContent,
        fitScoreAsset: scores.fitScoreAsset,
        fitScorePlatform: scores.fitScorePlatform,
        fitScoreTotal: total,
        directionFitReason: buildFitReason(fields, directionId),
        directionRisk: risks.directionRisk,
        directionBoundary: risks.directionBoundary,
        signalMatches: buildSignalMatches(fields, directionId),
        directionSignalChecklist,
        ...buildDirectionStrategies(directionId, fields),
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
