// OpenAI adapter implementing the AIProvider interface.
// @MX:ANCHOR: [AUTO] External API integration point -- OpenAI chat completions
// @MX:REASON: External system boundary; changes here affect all AI generation flows
// @MX:SPEC: SPEC-AI-001

import OpenAI from "openai";
import type { AIProvider, AIResponse, GenerationConfig } from "../types";

const DEFAULT_MODEL = "gpt-4o-mini";

export class OpenAIAdapter implements AIProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "AI_API_KEY environment variable is required for OpenAI provider"
      );
    }

    this.client = new OpenAI({ apiKey });
    this.model = process.env.AI_MODEL_ID ?? DEFAULT_MODEL;
  }

  async generateCompletion(
    prompt: string,
    config: GenerationConfig
  ): Promise<AIResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: prompt.split("\n\n")[0] ?? "" },
          {
            role: "user",
            content: prompt.split("\n\n").slice(1).join("\n\n"),
          },
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content ?? "";
      const usage = response.usage;

      return {
        content,
        inputTokens: usage?.prompt_tokens ?? 0,
        outputTokens: usage?.completion_tokens ?? 0,
        model: this.model,
        provider: "openai",
      };
    } catch (error: unknown) {
      if (error instanceof OpenAI.APIError) {
        if (error.status === 401) {
          throw new Error("OpenAI authentication failed: Invalid API key");
        }
        if (error.status === 429) {
          throw new Error("OpenAI rate limit exceeded: Please try again later");
        }
        throw new Error(`OpenAI API error (${error.status}): ${error.message}`);
      }
      if (error instanceof Error) {
        throw new Error(`OpenAI request failed: ${error.message}`);
      }
      throw new Error("OpenAI request failed: Unknown error");
    }
  }
}
