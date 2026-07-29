function summarizeLines(prompt, limit = 6) {
  return prompt
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit);
}

export class MockLlmProvider {
  constructor() {
    this.name = "mock";
  }

  async generateFirstRoundDraft({ prompt, analysis }) {
    const lines = summarizeLines(prompt);
    return {
      provider: this.name,
      mode: "first-round",
      summary: "这是基于当前规则系统和 Prompt Builder 生成的模拟首轮模型输出。",
      highlights: lines,
      draftCards: analysis.cards.map((card) => ({
        cardId: card.cardId,
        label: card.directionLabelUserFacing,
        copy: card.coverCopyMain,
        reason: card.clickReason,
      })),
    };
  }

  async generateSecondRoundDraft({ prompt, refinement }) {
    const lines = summarizeLines(prompt);
    return {
      provider: this.name,
      mode: "second-round",
      summary: "这是基于当前规则系统和 Prompt Builder 生成的模拟二轮模型输出。",
      highlights: lines,
      refinedDirection: refinement.secondRound.refinedCard.cardTitle,
      changeFocus: refinement.adjustment.feedbackTargetVariable,
      refinedCopy: refinement.secondRound.refinedCard.coverCopyMain,
    };
  }
}
