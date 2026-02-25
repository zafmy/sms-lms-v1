// Anthropic adapter implementing the AIProvider interface.
// @MX:ANCHOR: [AUTO] External API integration point -- Anthropic messages API
// @MX:REASON: External system boundary; changes here affect all AI generation flows
// @MX:SPEC: SPEC-AI-001

import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AIResponse, GenerationConfig } from "../types";

const DEFAULT_MODEL = "claude-3-haiku-20240307";

export class AnthropicAdapter implements AIProvider {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "AI_API_KEY environment variable is required for Anthropic provider"
      );
    }

    this.client = new Anthropic({ apiKey });
    this.model = process.env.AI_MODEL_ID ?? DEFAULT_MODEL;
  }

  async generateCompletion(
    prompt: string,
    config: GenerationConfig
  ): Promise<AIResponse> {
    try {
      const systemContent = prompt.split("\n\n")[0] ?? "";
      const userContent = prompt.split("\n\n").slice(1).join("\n\n");

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: config.maxTokens,
        system: systemContent,
        messages: [{ role: "user", content: userContent }],
      });

      // Extract text content from response blocks
      const content = response.content
        .filter(
          (block): block is Anthropic.TextBlock => block.type === "text"
        )
        .map((block) => block.text)
        .join("");

      return {
        content,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        model: this.model,
        provider: "anthropic",
      };
    } catch (error: unknown) {
      if (error instanceof Anthropic.APIError) {
        if (error.status === 401) {
          throw new Error(
            "Anthropic authentication failed: Invalid API key"
          );
        }
        if (error.status === 429) {
          throw new Error(
            "Anthropic rate limit exceeded: Please try again later"
          );
        }
        throw new Error(
          `Anthropic API error (${error.status}): ${error.message}`
        );
      }
      if (error instanceof Error) {
        throw new Error(`Anthropic request failed: ${error.message}`);
      }
      throw new Error("Anthropic request failed: Unknown error");
    }
  }
}
