import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export interface AiConfig {
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
  promptShieldEnabled: boolean;
  handoffEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BackendResponse {
  ai: AiConfig;
}

export const GET_AI_CONFIG_TOOL = {
  name: "get_ai_config",
  title: "Get Aurora AI configuration",
  description:
    "Returns the full configuration of an Aurora AI by `name`: " +
    "displayName, description, provider/model, maxTokens, temperature, systemPrompt and feature flags. " +
    "Provider API keys are NEVER returned. " +
    "Use `list_ais` first to discover valid `name` values.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description:
          "The AI's unique `name` field, as returned by list_ais.",
      },
    },
    required: ["name"],
    additionalProperties: false,
  },
} as const;

export async function runGetAiConfig(
  creds: Credentials,
  args: { name?: unknown } | undefined,
): Promise<AiConfig> {
  if (!args?.name || typeof args.name !== "string") {
    throw new Error("Parameter 'name' is required and must be a string.");
  }
  const encoded = encodeURIComponent(args.name);
  const data = await auroraRequest<BackendResponse>(
    creds,
    `/dashboard/mcp-bridge/ais/${encoded}`,
  );
  return data.ai;
}
