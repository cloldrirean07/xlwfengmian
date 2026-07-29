import { MockLlmProvider } from "./providers/MockLlmProvider.js";
import { OpenAIResponsesProvider } from "./providers/OpenAIResponsesProvider.js";

export function createLlmProvider(options = {}) {
  const providerName = options.provider || process.env.AI_COVER_LLM_PROVIDER || "mock";

  if (providerName === "mock") {
    return new MockLlmProvider();
  }

  if (providerName === "openai") {
    return new OpenAIResponsesProvider({
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      model: options.model || process.env.AI_COVER_OPENAI_MODEL,
      temperature: options.temperature,
      maxOutputTokens: options.maxOutputTokens,
    });
  }

  throw new Error(`Unsupported LLM provider: ${providerName}`);
}
