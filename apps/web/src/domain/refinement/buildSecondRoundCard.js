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

export function buildSecondRoundCard({ selectedCard, adjustment }) {
  const mode = refinementTone[adjustment.feedbackTargetVariable] || refinementTone.信息;
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
      directionDescription: mode.description,
      coverCopyMain: `${selectedCard.coverCopyMain} / ${mode.coverCopy}`,
      titleOptions: selectedCard.titleOptions.map((title, index) =>
        index === 0 ? `${title}，但更贴内容` : `${title}，表达更稳`,
      ),
      imageDirection: `${selectedCard.imageDirection}；${mode.tweak}`,
      compositionDirection: `${selectedCard.compositionDirection}；保留原有主结构`,
      clickReason: `${selectedCard.clickReason} 这轮重点解决「${adjustment.feedbackMappedIssuePrimary}」。${workspaceNote}`,
      riskNote: selectedCard.riskNote,
    },
    optionalTweaks: [
      "如果还想更抓眼，可以再提高异常点的集中度。",
      "如果还想更高级，可以进一步减少文案字数和元素数量。",
    ],
  };
}
