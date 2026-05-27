import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export interface AiConfig {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  provider: string;
  model: string;
  modelVison: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  embeddingEnabled: boolean;
  embeddingProvider: string;
  canLearnFromUsers: boolean;
  canAccessOtherAIs: boolean;
  canDelegateToOtherAIs: boolean;
  availableForDelegation: boolean;
  canShareEmbeddings: boolean;
  promptShieldEnabled: boolean;
  handoffEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const GET_AI_CONFIG_TOOL = {
  name: "get_ai_config",
  title: "Get Aurora AI configuration",
  description:
    "Returns the full configuration of an Aurora AI. " +
    "Accepts either `id` or `name` to identify the AI. " +
    "Returns: displayName, description, provider/model, maxTokens, temperature, systemPrompt and feature flags. " +
    "Provider API keys are NEVER returned.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "string",
        description: "The AI's unique ID. Use this or `name`.",
      },
      name: {
        type: "string",
        description: "The AI's unique name/slug. Use this or `id`.",
      },
    },
    additionalProperties: false,
  },
} as const;

export async function runGetAiConfig(
  creds: Credentials,
  args: { id?: unknown; name?: unknown } | undefined,
): Promise<unknown> {
  if (args?.id && typeof args.id === "string") {
    return auroraRequest(creds, apiPath`/dashboard/ia/${args.id}`);
  }
  if (args?.name && typeof args.name === "string") {
    const encoded = encodeURIComponent(args.name);
    const data = await auroraRequest<{ ai: AiConfig }>(
      creds,
      apiPath`/dashboard/mcp-bridge/ais/${encoded}`,
    );
    return data.ai ?? data;
  }
  throw new Error("Either 'id' or 'name' is required.");
}
