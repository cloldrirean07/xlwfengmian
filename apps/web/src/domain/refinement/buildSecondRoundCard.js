const refinementTone = {
  信息: {
    description: "保留原来的点击逻辑，同时让主题和价值点更快被看懂。",
    coverCopy: "先把重点讲明白",
    tweak: "图像和文字都更贴内容本身",
  },
  结果: {
    description: "保留原方向，但把用户能得到的收获放到更前面。",
    coverCopy: "先让人看到收获",
    tweak: "标题补足结果，封面聚焦回报",
  },
  悬念: {
    description: "保留原方向，但让第一眼更有点开的冲动。",
    coverCopy: "留一点没说完",
    tweak: "减少解释，放大异常点",
  },
  冲突: {
    description: "保留原方向，但拉开与普通内容的视觉差距。",
    coverCopy: "把反差点再拉开",
    tweak: "主视觉更单一，冲突更集中",
  },
  质感: {
    description: "保留原方向，但让表达更克制、更可信。",
    coverCopy: "把语气收稳一点",
    tweak: "减少浮夸元素，提升秩序感",
  },
};

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function detectMaterialScenario(selectedCard) {
  const pool = [
    selectedCard.coverCopyMain,
    selectedCard.imageDirection,
    selectedCard.compositionDirection,
    selectedCard.directionLabelUserFacing,
    ...(selectedCard.titleOptions || []),
    ...(selectedCard.materialKeywords || []),
  ].join(" ");

  if (includesAny(pool, ["辣炒鱿鱼", "螃蟹", "红油", "香菜", "海鲜", "夜宵"])) {
    return "food-impact";
  }

  if (includesAny(pool, ["夏日晚霞", "晚霞", "霞光", "云层", "落日", "天空"])) {
    return "sunset-sky";
  }

  return "";
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function buildScenarioTitleOptions(selectedCard, scenario) {
  if (scenario === "food-impact") {
    return unique([
      selectedCard.titleOptions.includes("辣炒的味蕾") ? "辣炒的味蕾，封面先抓住这一口" : "",
      "辣炒海鲜封面，先抓住这一口",
      "红油和海鲜，是这张封面的点击点",
      ...selectedCard.titleOptions,
    ]).slice(0, 3);
  }

  if (scenario === "sunset-sky") {
    return unique([
      selectedCard.titleOptions.includes("最后一抹霞光") ? "最后一抹霞光，适合这样做封面" : "",
      "一张天空图也能做出封面感",
      "夏日晚霞照别只发原图",
      ...selectedCard.titleOptions,
    ]).slice(0, 3);
  }

  return selectedCard.titleOptions.map((title, index) =>
    index === 0 ? `${title}，重点更清楚` : `${title}，节奏更稳`,
  );
}

function buildScenarioFusionCopy(selectedCard, mode, scenario) {
  if (scenario === "food-impact") {
    return `${selectedCard.coverCopyMain} / 重点更清楚，食欲冲击别丢`;
  }

  if (scenario === "sunset-sky") {
    return `${selectedCard.coverCopyMain} / 重点更清楚，天空情绪别丢`;
  }

  return `${selectedCard.coverCopyMain} / ${mode.coverCopy}`;
}

function buildScenarioImageDirection(selectedCard, mode, scenario) {
  if (scenario === "food-impact") {
    return `${selectedCard.imageDirection}；裁切时优先放大红油、海鲜、辣椒和食物近景，保留一眼有食欲的冲击点。`;
  }

  if (scenario === "sunset-sky") {
    return `${selectedCard.imageDirection}；裁切时保留天空留白、云层方向和落日色彩，把标题放在低干扰区域。`;
  }

  return `${selectedCard.imageDirection}；${mode.tweak}`;
}

function buildScenarioCompositionDirection(selectedCard, scenario) {
  if (scenario === "food-impact") {
    return `${selectedCard.compositionDirection}；标题服务食物主体，避免遮挡红油、蟹壳、鱿鱼和辣椒。`;
  }

  if (scenario === "sunset-sky") {
    return `${selectedCard.compositionDirection}；用天空留白承接短标题，地平线或暗部区域负责稳定画面。`;
  }

  return `${selectedCard.compositionDirection}；保留原有主结构`;
}

function buildScenarioDescription(mode, scenario) {
  if (scenario === "food-impact") {
    return "保留清楚重点，同时把食物主体、食欲冲击和教程任务一起放到前面。";
  }

  if (scenario === "sunset-sky") {
    return "保留清楚重点，同时让天空留白、晚霞情绪和封面教程任务一起成立。";
  }

  return mode.description;
}

export function buildSecondRoundCard({ selectedCard, adjustment }) {
  const mode = refinementTone[adjustment.feedbackTargetVariable] || refinementTone.信息;
  const scenario = detectMaterialScenario(selectedCard);
  const workspaceNote = adjustment.workspaceContext?.nextSuggestion
    ? ` 工作区补充建议：${adjustment.workspaceContext.nextSuggestion}`
    : "";

  return {
    basedOnCardId: selectedCard.cardId,
    preservedElement: adjustment.preserveElement,
    preservedVariable: adjustment.preservedVariable,
    changedVariable: adjustment.feedbackTargetVariable,
    changedAction: adjustment.feedbackAction,
    nextRoundGoal: adjustment.nextRoundGoal,
    refinedCard: {
      cardTitle: `${selectedCard.directionLabelUserFacing} · 第二轮优化`,
      directionDescription: buildScenarioDescription(mode, scenario),
      coverCopyMain: buildScenarioFusionCopy(selectedCard, mode, scenario),
      titleOptions: buildScenarioTitleOptions(selectedCard, scenario),
      imageDirection: buildScenarioImageDirection(selectedCard, mode, scenario),
      compositionDirection: buildScenarioCompositionDirection(selectedCard, scenario),
      clickReason: `${selectedCard.clickReason} 这轮重点解决「${adjustment.feedbackMappedIssuePrimary}」。${workspaceNote}`,
      riskNote: selectedCard.riskNote,
    },
    optionalTweaks: [
      "如果还想更抓眼，可以再提高异常点的集中度。",
      "如果还想更高级，可以进一步减少文案字数和元素数量。",
    ],
  };
}
