import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

// Descoberta de modelos de um provider de LLM (popula os dropdowns de modelo).
// Backend: POST /dashboard/models. Sempre responde 200 (fallback em erro); a
// chave nunca é ecoada. Caminhos: llmProviderId | aiId (chave salva) | provider+key.

export const LIST_PROVIDER_MODELS_TOOL = {
  name: "list_provider_models",
  title: "Discover provider models",
  description:
    "Lists the models available for an LLM provider. Resolve by `llmProviderId` (preferred), " +
    "by `aiId` (uses the AI's saved key), or by legacy `provider` + `key`. " +
    "Returns { models, source } (source 'live' or 'fallback').",
  inputSchema: {
    type: "object" as const,
    properties: {
      llmProviderId: { type: "string", description: "Config-driven LLM provider ID (preferred)." },
      aiId: { type: "string", description: "Use this AI's saved provider/key." },
      provider: { type: "string", enum: ["openai", "claude", "gemini", "groq"], description: "Legacy vendor." },
      key: { type: "string", description: "API key (legacy, or override for llmProviderId). Masked values are ignored." },
    },
    additionalProperties: false,
  },
} as const;

export async function runListProviderModels(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.llmProviderId && !a.aiId && !a.provider) {
    throw new Error("Provide one of: llmProviderId, aiId, or provider (+ key).");
  }
  return auroraRequest(creds, "/dashboard/models", { method: "POST", body: a });
}
