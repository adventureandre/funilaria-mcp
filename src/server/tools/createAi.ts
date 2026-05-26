import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const CREATE_AI_TOOL = {
  name: "create_ai",
  title: "Create an Aurora AI",
  description:
    "Creates a new Aurora AI with the given configuration. " +
    "At minimum, `name`, `displayName`, and `systemPrompt` are required.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "Unique slug identifier for the AI (lowercase, no spaces).",
      },
      displayName: {
        type: "string",
        description: "Human-friendly display name.",
      },
      systemPrompt: {
        type: "string",
        description: "The system prompt that defines the AI's behavior.",
      },
      description: { type: "string" },
      provider: { type: "string", description: "LLM provider (e.g. openai, anthropic, google)." },
      model: { type: "string", description: "Model identifier (e.g. gpt-4o, claude-sonnet-4-6)." },
      modelVison: { type: "string" },
      maxTokens: { type: "integer", minimum: 1 },
      temperature: { type: "number", minimum: 0, maximum: 2 },
      embeddingEnabled: { type: "boolean" },
      embeddingProvider: { type: "string" },
      canLearnFromUsers: { type: "boolean" },
      canAccessOtherAIs: { type: "boolean" },
      promptShieldEnabled: { type: "boolean" },
    },
    required: ["name", "displayName", "systemPrompt"],
    additionalProperties: false,
  },
} as const;

export async function runCreateAi(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.name || typeof a.name !== "string") {
    throw new Error("Parameter 'name' is required.");
  }
  if (!a.displayName || typeof a.displayName !== "string") {
    throw new Error("Parameter 'displayName' is required.");
  }
  if (!a.systemPrompt || typeof a.systemPrompt !== "string") {
    throw new Error("Parameter 'systemPrompt' is required.");
  }
  return auroraRequest(creds, "/dashboard/ia", {
    method: "POST",
    body: a,
  });
}
