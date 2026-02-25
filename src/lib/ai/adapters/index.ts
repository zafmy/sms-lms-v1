// Adapter factory -- returns configured AIProvider based on environment.
// @MX:NOTE: [AUTO] Provider selection via AI_PROVIDER env var (SPEC-AI-001 Phase 2)
// @MX:SPEC: SPEC-AI-001

import type { AIProvider } from "../types";
import { OpenAIAdapter } from "./openai";
import { AnthropicAdapter } from "./anthropic";

type SupportedProvider = "openai" | "anthropic";

const SUPPORTED_PROVIDERS: ReadonlySet<string> = new Set([
  "openai",
  "anthropic",
]);

// Create and return the configured AI provider instance.
// Reads AI_PROVIDER env var (default: "openai").
// Throws descriptive error if AI_API_KEY is missing or provider is unsupported.
export function getAIProvider(): AIProvider {
  const providerName = process.env.AI_PROVIDER ?? "openai";

  if (!SUPPORTED_PROVIDERS.has(providerName)) {
    throw new Error(
      `Unsupported AI provider "${providerName}". Supported providers: ${[...SUPPORTED_PROVIDERS].join(", ")}`
    );
  }

  const provider = providerName as SupportedProvider;

  switch (provider) {
    case "openai":
      return new OpenAIAdapter();
    case "anthropic":
      return new AnthropicAdapter();
  }
}
