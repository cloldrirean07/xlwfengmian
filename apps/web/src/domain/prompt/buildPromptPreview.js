function buildFirstRoundTask() {
  return [
    "你现在不是通用设计工具，而是内容平台封面方向助手。",
    "第一轮目标不是直接生成最终封面，而是输出 3 张有明显差异的方向卡片。",
    "必须先判断点击机制，再输出方向卡片。",
    "3 张卡片必须分别体现不同主变量，不允许只是换措辞。",
  ].join("\n");
}

function buildInputSection(fields) {
  return [
    "【输入字段】",
    `- 内容主题：${fields.contentTopic}`,
    `- 内容目标：${fields.contentGoal}`,
    `- 素材类型：${fields.userAssetType}`,
    `- 平台：${fields.platform}`,
    `- 内容类型：${fields.contentTypePrimary}`,
    `- 主点击机制：${fields.clickDriverPrimary}`,
    `- 是否有明确结果：${fields.hasClearResult}`,
    `- 是否有明显反差：${fields.hasContrast}`,
    `- 是否有悬念空间：${fields.hasCuriosityGap}`,
    `- 是否需要清晰讲明白：${fields.requiresClarity}`,
    `- 是否需要专业可信感：${fields.requiresTrust}`,
    `- 用户偏好：${fields.userReferencePreference || "未提供"}`,
    fields.assetNotes ? `- 素材备注：${fields.assetNotes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildDirectionSection(rankedDirections) {
  return [
    "【已排序方向】",
    ...rankedDirections.map(
      (direction, index) =>
        `${index + 1}. ${direction.directionType}｜内容分=${direction.fitScoreContent}｜素材分=${direction.fitScoreAsset}｜平台分=${direction.fitScorePlatform}｜适配理由=${direction.directionFitReason}｜风险=${direction.directionRisk}`,
    ),
  ].join("\n");
}

function buildFirstRoundOutputSchema() {
  return [
    "【第一轮输出格式】",
    "请输出 3 张方向卡片，每张卡片都必须包含：",
    "- 方向标签",
    "- 一句话为什么适合",
    "- 封面大字建议",
    "- 1-2 个标题建议",
    "- 配图方向",
    "- 构图建议",
    "- 点击逻辑",
    "- 风险提醒",
  ].join("\n");
}

function buildSecondRoundTask(refinement) {
  return [
    "你现在进入第二轮优化，不要重新发散成 3 个方向。",
    "只保留用户已经认可的主方向，只调整 1 个主变量。",
    `用户当前选中：${refinement.adjustment.selectedDirectionType}`,
    `用户原话反馈：${refinement.adjustment.userFeedbackRaw}`,
    `这轮必须保留：${refinement.adjustment.preserveElement}`,
    `用户修改请求：${refinement.adjustment.changeRequest || refinement.adjustment.feedbackAction}`,
    `主问题映射：${refinement.adjustment.feedbackMappedIssuePrimary}`,
    `目标变量：${refinement.adjustment.feedbackTargetVariable}`,
    `改单动作：${refinement.adjustment.feedbackAction}`,
    `下一轮目标：${refinement.adjustment.nextRoundGoal}`,
    refinement.adjustment.workspaceContext
      ? `工作区上下文：${refinement.adjustment.workspaceContext.summary}｜${refinement.adjustment.workspaceContext.refinedTask}`
      : null,
    refinement.adjustment.workspaceContext?.draftPromptLine
      ? `工作区补充提示：${refinement.adjustment.workspaceContext.draftPromptLine}`
      : null,
  ].join("\n");
}

function buildSecondRoundOutputSchema() {
  return [
    "【第二轮输出格式】",
    "请只输出 1 张优化后的主卡，并包含：",
    "- 这次保留了什么",
    "- 这次重点改了什么",
    "- 新的方向描述",
    "- 新的封面大字建议",
    "- 新的标题建议",
    "- 新的配图方向",
    "- 新的构图建议",
    "- 为什么现在更贴需求",
    "- 1 个可选微调方向",
  ].join("\n");
}

export function buildPromptPreview({ analysis, refinement = null }) {
  const firstRoundPrompt = [
    buildFirstRoundTask(),
    buildInputSection(analysis.fields),
    buildDirectionSection(analysis.rankedDirections),
    buildFirstRoundOutputSchema(),
  ].join("\n\n");

  if (!refinement) {
    return {
      mode: "first-round",
      firstRoundPrompt,
    };
  }

  return {
    mode: "full",
    firstRoundPrompt,
    secondRoundPrompt: [buildSecondRoundTask(refinement), buildSecondRoundOutputSchema()].join("\n\n"),
  };
}
