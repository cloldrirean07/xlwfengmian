function ensureString(value, fieldName) {
  if (!value || typeof value !== "string") {
    throw new Error(`${fieldName} is required.`);
  }
}

export function validateLlmRequest({ analysis, selectedCardId, feedback, provider, model }) {
  if (!analysis || !analysis.cards || !Array.isArray(analysis.cards) || analysis.cards.length === 0) {
    throw new Error("analysis with cards is required before creating an LLM draft.");
  }

  if (selectedCardId && !feedback) {
    throw new Error("feedback is required when selectedCardId is provided.");
  }

  if (!selectedCardId && feedback) {
    throw new Error("selectedCardId is required when feedback is provided.");
  }

  if (provider === "openai") {
    ensureString(model, "model");
    ensureString(process.env.OPENAI_API_KEY, "OPENAI_API_KEY");
  }
}
