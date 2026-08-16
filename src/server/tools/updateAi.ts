import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const UPDATE_AI_TOOL = {
  name: "update_ai",
  title: "Update an Aurora AI",
  description:
    "Updates configuration fields of an existing Aurora AI. " +
    "Pass only the fields you want to change. Use `get_ai_config` to see current values first. " +
    "Requires the AI's `id` (use `list_ais` to find it).",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "string",
        description: "The AI's unique ID.",
      },
      displayName: { type: "string" },
      description: { type: "string" },
      provider: { type: "string" },
      model: { type: "string" },
      modelVison: { type: "string" },
      token: { type: "string", description: "LLM provider API key. Do not re-send the masked value from get_ai_config." },
      geminiKey: { type: "string", description: "Gemini API key. Masked value is ignored on save." },
      embeddingKey: { type: "string", description: "Embedding provider API key. Masked value is ignored on save." },
      apiKey: { type: "string", description: "Auth key for the AI's own HTTP endpoint." },
      llmProviderId: { type: "string", description: "FK to a config-driven LLM provider." },
      messagingProviderId: { type: "string", description: "FK to a messaging provider (WhatsApp/HTTP)." },
      systemPrompt: { type: "string" },
      systemPromptVision: { type: "string" },
      whisperPrompt: { type: "string" },
      maxTokens: { type: "integer", minimum: 1 },
      temperature: { type: "number", minimum: 0, maximum: 2 },
      reasoningEffort: {
        type: "string",
        enum: ["minimal", "low", "medium", "high", ""],
        description:
          "Reasoning effort for reasoning models (gpt-5/o-series). " +
          "Lower = faster responses. Empty string = model default.",
      },
      messageMaxLength: { type: "integer", minimum: 1 },
      isActive: { type: "boolean" },
      embeddingEnabled: { type: "boolean" },
      embeddingProvider: { type: "string", description: "Legacy embedding vendor slug (openai|gemini). Prefer embeddingProviderId." },
      embeddingProviderId: { type: "string", description: "FK to a config-driven embedding provider. Overrides the legacy embeddingProvider/embeddingKey." },
      confirmDropEmbeddings: {
        type: "boolean",
        description:
          "Required to confirm dropping this AI's existing embeddings when switching embedding provider/model (incompatible vector space). Without it the switch is blocked (409).",
      },
      embeddingThreshold: { type: "number", minimum: 0, maximum: 1 },
      canLearnFromUsers: { type: "boolean" },
      canAccessOtherAIs: { type: "boolean" },
      canDelegateToOtherAIs: { type: "boolean" },
      availableForDelegation: { type: "boolean" },
      canShareEmbeddings: { type: "boolean" },
      canGenerateDocuments: { type: "boolean" },
      canSendWhatsApp: { type: "boolean" },
      chatCommandsEnabled: {
        type: "boolean",
        description:
          "Master switch for chat commands (/name). Off by default: with it off, a leading slash is plain text everywhere. Which actions become commands is decided per link — see update_ui_action_link.",
      },
      delegationAIIds: { type: "array", items: { type: "string" }, description: "Target AI IDs this AI may delegate to (requires canDelegateToOtherAIs)." },
      sharedEmbeddingsAIIds: { type: "array", items: { type: "string" }, description: "AI IDs (same owner) this AI shares embeddings with (requires canShareEmbeddings)." },
      handoffEnabled: { type: "boolean" },
      handoffCategories: { type: "array", items: { type: "string" } },
      handoffPromptHint: { type: "string" },
      handoffAutoReturnMinutes: { type: "integer", minimum: 0 },
      promptShieldEnabled: { type: "boolean" },
      isPublic: { type: "boolean" },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export async function runUpdateAi(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") {
    throw new Error("Parameter 'id' is required.");
  }
  const { id, ...body } = a;
  return auroraRequest(creds, apiPath`/dashboard/ia/${id}`, {
    method: "PUT",
    body,
  });
}
