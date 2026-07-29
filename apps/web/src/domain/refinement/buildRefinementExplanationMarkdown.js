export function buildRefinementExplanationMarkdown(result) {
  const { caseMeta, analysis, refinement } = result;
  const selectedCard = analysis.cards.find(
    (card) => card.cardId === refinement.adjustment.selectedCardId,
  );
  const explanation = refinement.mappingExplanation;
  const matchedSignals = selectedCard?.directionSignalChecklist?.matchedSignals || [];
  const boundaryRules = selectedCard?.directionSignalChecklist?.boundaryRules || [];

  return [
    `# 二轮解释验证记录｜${caseMeta.id}`,
    "",
    "## 0. 基础信息",
    `- 样例编号：${caseMeta.id}`,
    `- 标题：${caseMeta.title}`,
    `- 平台：${caseMeta.platform}`,
    `- 来源类型：${caseMeta.sourceType}`,
    "",
    "## 1. 规则版本",
    `- 首轮规则版本：${analysis.ruleMeta?.version || "unknown"}`,
    `- 二轮规则版本：${refinement.ruleMeta?.version || analysis.ruleMeta?.version || "unknown"}`,
    "",
    "## 2. 这次用户反馈",
    `- 选中卡片：${refinement.adjustment.selectedCardId}`,
    `- 对应方向：${selectedCard?.directionLabelUserFacing || refinement.adjustment.selectedDirectionType}`,
    `- 用户想保留：${refinement.adjustment.preserveElement}`,
    `- 用户原话反馈：${refinement.adjustment.userFeedbackRaw}`,
    "",
    "## 2.1 首轮方向判断依据",
    `- 首轮方向：${selectedCard?.directionLabelUserFacing || "待补充"}`,
    `- 首轮方向类型：${selectedCard?.directionTypeInternal || "待补充"}`,
    `- 首轮命中信号：${matchedSignals.length > 0 ? matchedSignals.join(" / ") : "待补充"}`,
    `- 首轮边界提醒：${boundaryRules.length > 0 ? boundaryRules.join(" / ") : selectedCard?.boundaryRule || "待补充"}`,
    "",
    "## 3. 系统命中的反馈映射",
    `- 负向映射 ID：${refinement.adjustment.feedbackMappingId}`,
    `- 正向保留映射 ID：${refinement.adjustment.feedbackPositiveMappingId || "未命中"}`,
    `- 主问题：${refinement.adjustment.feedbackMappedIssuePrimary}`,
    `- 目标变量：${refinement.adjustment.feedbackTargetVariable}`,
    `- 辅助变量：${refinement.adjustment.feedbackSupportVariable}`,
    `- 保留变量：${refinement.adjustment.preservedVariable}`,
    `- 命中关键词：${
      refinement.adjustment.feedbackMatchedKeywords.length > 0
        ? refinement.adjustment.feedbackMatchedKeywords.join(" / ")
        : "未命中明确关键词，使用默认规则兜底"
    }`,
    `- 是否接入工作区上下文：${refinement.adjustment.workspaceContext ? "是" : "否"}`,
    "",
    "## 4. 二轮解释摘要",
    `- 解释结论：${explanation?.summary || "暂无"}`,
    ...(explanation?.explanationLines || []).map((line) => `- ${line}`),
    "",
    "## 5. 二轮优化结果",
    `- 改单动作：${refinement.secondRound.changedAction}`,
    `- 下一轮目标：${refinement.secondRound.nextRoundGoal}`,
    `- 新的封面大字：${refinement.secondRound.refinedCard.coverCopyMain}`,
    `- 新的标题建议：${refinement.secondRound.refinedCard.titleOptions.join(" / ")}`,
    `- 新的配图方向：${refinement.secondRound.refinedCard.imageDirection}`,
    `- 新的构图建议：${refinement.secondRound.refinedCard.compositionDirection}`,
    "",
    "## 6. 人工验证区",
    "- 这次命中的反馈映射是否合理：",
    "- 如果不合理，真正的问题更像是什么：",
    "- 这次命中的关键词是否准确：",
    "- 是否需要新增反馈词：",
    "- 是否需要调整默认兜底逻辑：",
    "- 这次二轮解释是否足够说服人：",
    "",
    "## 7. 后续动作",
    "- [ ] 回填到误判样本记录",
    "- [ ] 回填到规则修订任务",
    "- [ ] 更新 feedback-catalog.json",
    "- [ ] 更新验证结论",
    "",
  ].join("\n");
}
