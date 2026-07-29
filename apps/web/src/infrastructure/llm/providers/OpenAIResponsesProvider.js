export class OpenAIResponsesProvider {
  constructor({ apiKey, baseUrl, model, temperature, maxOutputTokens }) {
    this.name = "openai";
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
    this.temperature = temperature ?? 0.7;
    this.maxOutputTokens = maxOutputTokens ?? 1200;
  }

  async generateFirstRoundDraft({ prompt }) {
    const text = await this.#requestText(prompt);

    return {
      provider: this.name,
      mode: "first-round",
      summary: "这是来自 OpenAI provider 的首轮草稿输出。",
      rawText: text,
    };
  }

  async generateSecondRoundDraft({ prompt }) {
    const text = await this.#requestText(prompt);

    return {
      provider: this.name,
      mode: "second-round",
      summary: "这是来自 OpenAI provider 的二轮草稿输出。",
      rawText: text,
    };
  }

  async #requestText(prompt) {
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: prompt,
        temperature: this.temperature,
        max_output_tokens: this.maxOutputTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI provider request failed: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    return this.#extractText(payload);
  }

  #extractText(payload) {
    if (typeof payload.output_text === "string" && payload.output_text) {
      return payload.output_text;
    }

    const texts =
      payload.output
        ?.flatMap((item) => item.content || [])
        ?.filter((content) => content.type === "output_text")
        ?.map((content) => content.text)
        ?.filter(Boolean) || [];

    if (texts.length > 0) {
      return texts.join("\n\n");
    }

    throw new Error("OpenAI provider returned no readable text output.");
  }
}
