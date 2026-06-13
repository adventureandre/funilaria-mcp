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
      systemPrompt: { type: "string" },
      systemPromptVision: { type: "string" },
      whisperPrompt: { type: "string" },
      maxTokens: { type: "integer", minimum: 1 },
      temperature: { type: "number", minimum: 0, maximum: 2 },
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
      handoffEnabled: { type: "boolean" },
      handoffCategories: { type: "array", items: { type: "string" } },
      handoffPromptHint: { type: "string" },
      promptShieldEnabled: { type: "boolean" },
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
