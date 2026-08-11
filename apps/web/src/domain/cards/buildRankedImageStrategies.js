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
    includesAny(pool, ["螃蟹", "鱿鱼", "海鲜", "红油", "辣椒", "美食", "夜宵", "下饭"]) &&
    includesAny(pool, ["冲击", "食欲", "抓人眼球", "封面", "小红书"])
  ) {
    return "food-impact";
  }

  if (
    includesAny(pool, ["晚霞", "霞光", "落日", "云层", "天空", "风景"]) &&
    includesAny(pool, ["高级", "专业", "氛围", "治愈", "封面"])
  ) {
    return "sunset-sky";
  }

  return "";
}

function scoreCurrentAsset(fields) {
  let score = 2;

  if (fields.userAssetType !== "无图只有想法") {
    score += 2;
  }

  if (fields.assetDescription.includes("截图") || fields.assetDescription.includes("口播")) {
    score += 1;
  }

  return score;
}

function scoreContentMatched(fields) {
  let score = 2;

  if (fields.contentTopic) {
    score += 1;
  }

  if (fields.assetDescription.includes("普通") || fields.assetNotes.includes("普通")) {
    score += 1;
  }

  if (fields.assetDescription.includes("贴内容") || fields.assetNotes.includes("贴内容")) {
    score += 1;
  }

  return score;
}

function scoreCreativeConcept(fields, effectConfig) {
  let score = 2;

  if (fields.userAssetType === "无图只有想法") {
    score += 2;
  }

  if (["好奇", "冲击"].includes(effectConfig.clickDriver)) {
    score += 2;
  }

  if (fields.desiredCoverFeel.includes("创意") || fields.desiredCoverFeel.includes("抓眼")) {
    score += 1;
  }

  return score;
}

function buildPriorityReason(candidateId, fields, effectConfig) {
  const materialScenario = detectMaterialScenario(fields);

  if (candidateId === "current-asset-optimize") {
    if (materialScenario === "food-impact") {
      return "当前美食素材已经有红油、海鲜、辣椒和近景主体，优先放大食欲冲击点，比重做对照结构更快。";
    }
    if (materialScenario === "sunset-sky") {
      return "当前晚霞素材已经有天空留白、云层和落日色彩，优先裁切出标题区和情绪主视觉。";
    }

    return fields.userAssetType === "无图只有想法"
      ? "当前没有现成素材，该方向可做但优先级不应最高。"
      : "当前已经有基础素材，先优化现有画面通常是最快形成结果的路径。";
  }

  if (candidateId === "content-matched-search") {
    return "现有素材不一定足够强时，补一张更贴内容的图最容易提升贴合度。";
  }

  return `当前方向更靠「${effectConfig.clickDriver}」驱动点击，创意概念图更适合拉开与普通封面的差距。`;
}

function mapCandidateToExecutionTag(candidateId) {
  if (candidateId === "current-asset-optimize") {
    return "先优化现有图";
  }
  if (candidateId === "content-matched-search") {
    return "先补贴内容的图";
  }
  return "先做概念图";
}

export function buildRankedImageStrategies({ fields, effectConfig, candidates }) {
  return candidates
    .map((candidate) => {
      let priorityScore = 0;

      if (candidate.candidateId === "current-asset-optimize") {
        priorityScore = scoreCurrentAsset(fields);
      } else if (candidate.candidateId === "content-matched-search") {
        priorityScore = scoreContentMatched(fields);
      } else {
        priorityScore = scoreCreativeConcept(fields, effectConfig);
      }

      return {
        ...candidate,
        priorityScore,
        priorityReason: buildPriorityReason(candidate.candidateId, fields, effectConfig),
        executionTag: mapCandidateToExecutionTag(candidate.candidateId),
      };
    })
    .sort((left, right) => right.priorityScore - left.priorityScore);
}
