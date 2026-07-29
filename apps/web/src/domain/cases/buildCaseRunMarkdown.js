function renderCard(card) {
  return [
    `### 卡片 ${card.cardId}`,
    `- 方向标签：${card.directionLabelUserFacing}`,
    `- 为什么适合：${card.fitReason}`,
    `- 命中信号：${
      card.directionSignalChecklist?.matchedSignals?.length
        ? card.directionSignalChecklist.matchedSignals.join(" / ")
        : "待补充"
    }`,
    `- 边界提醒：${
      card.directionSignalChecklist?.boundaryRules?.length
        ? card.directionSignalChecklist.boundaryRules.join(" / ")
        : card.boundaryRule || "待补充"
    }`,
    `- 封面大字建议：${card.coverCopyMain}`,
    `- 标题建议：${card.titleOptions.join(" / ")}`,
    `- 配图方向：${card.imageDirection}`,
    `- 构图建议：${card.compositionDirection}`,
    `- 点击逻辑：${card.clickReason}`,
    `- 风险提醒：${card.riskNote}`,
  ].join("\n");
}

export function buildCaseRunMarkdown(result) {
  const { caseMeta, analysis, refinement } = result;
  const selectedCard = analysis.cards.find(
    (card) => card.cardId === refinement.adjustment.selectedCardId,
  );

  return [
    `# 端到端样例运行记录｜${caseMeta.id}`,
    "",
    "## 0. 样例基础信息",
    `- 样例编号：${caseMeta.id}`,
    `- 标题：${caseMeta.title}`,
    `- 发布平台：${caseMeta.platform}`,
    `- 来源类型：${caseMeta.sourceType}`,
    "",
    "## 1. 输入字段提取",
    `- content_topic：${analysis.fields.contentTopic}`,
    `- content_goal：${analysis.fields.contentGoal}`,
    `- user_asset_type：${analysis.fields.userAssetType}`,
    `- platform：${analysis.fields.platform}`,
    `- user_reference_preference：${analysis.fields.userReferencePreference}`,
    `- asset_notes：${analysis.fields.assetNotes}`,
    "",
    "## 2. 第一轮方向判断",
    `- 规则版本：${analysis.ruleMeta?.version || "unknown"}`,
    ...analysis.cards.map(renderCard),
    "",
    "## 3. 第一轮反馈记录",
    `- 用户选中的卡片：${refinement.adjustment.selectedCardId}`,
    `- 用户想保留的点：${refinement.adjustment.preserveElement}`,
    `- 用户反馈：${refinement.adjustment.userFeedbackRaw}`,
    "",
    "## 4. 第二轮优化结果",
    `- 基于卡片：${selectedCard?.directionLabelUserFacing || refinement.adjustment.selectedCardId}`,
    `- 规则版本：${refinement.ruleMeta?.version || analysis.ruleMeta?.version || "unknown"}`,
    `- 命中负向映射：${refinement.adjustment.feedbackMappingId}`,
    `- 命中正向保留信号：${refinement.adjustment.feedbackPositiveMappingId || "未命中"}`,
    `- 命中关键词：${
      refinement.adjustment.feedbackMatchedKeywords.length > 0
        ? refinement.adjustment.feedbackMatchedKeywords.join(" / ")
        : "未命中明确关键词，使用默认规则兜底"
    }`,
    `- 调整变量：${refinement.secondRound.changedVariable}`,
    `- 调整动作：${refinement.secondRound.changedAction}`,
    `- 优化后方向：${refinement.secondRound.refinedCard.cardTitle}`,
    `- 优化后封面大字：${refinement.secondRound.refinedCard.coverCopyMain}`,
    `- 优化后标题建议：${refinement.secondRound.refinedCard.titleOptions.join(" / ")}`,
    `- 优化后配图方向：${refinement.secondRound.refinedCard.imageDirection}`,
    `- 优化后构图建议：${refinement.secondRound.refinedCard.compositionDirection}`,
    `- 二轮解释：${refinement.mappingExplanation?.summary || "暂无"}`,
    "",
    "## 5. Prompt 与草稿输出",
    `- 第一轮 Prompt：见 JSON 导出中的 promptPreviewFirstRound`,
    `- 第二轮 Prompt：见 JSON 导出中的 promptPreviewSecondRound`,
    `- 第一轮 LLM Draft 概要：${result.llmDraftFirstRound.llmDraft.summary}`,
    `- 第二轮 LLM Draft 概要：${result.llmDraftSecondRound.llmDraft.summary}`,
    "",
    "## 6. 后续动作",
    "- [ ] 回填 Obsidian 端到端样例记录",
    "- [ ] 检查是否触发规则修订记录",
    "- [ ] 检查是否需要补反馈词映射",
    "",
  ].join("\n");
}
