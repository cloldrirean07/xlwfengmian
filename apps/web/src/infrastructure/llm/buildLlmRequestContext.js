export function buildLlmRequestContext(payload) {
  return {
    provider: payload.provider || process.env.AI_COVER_LLM_PROVIDER || "mock",
    model: payload.model || process.env.AI_COVER_OPENAI_MODEL || "",
    temperature: payload.temperature ?? 0.7,
    maxOutputTokens: payload.maxOutputTokens ?? 1200,
  };
}
