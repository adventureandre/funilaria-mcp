import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

// Providers de LLM config-driven. `type` é o PROTOCOLO do adaptador, não o
// vendor: openai-completions (cobre OpenAI/Groq/OpenRouter/DeepSeek/Ollama/vLLM),
// anthropic-messages, gemini. Backend: /dashboard/llm-providers.

export const LIST_LLM_PROVIDERS_TOOL = {
  name: "list_llm_providers",
  title: "List LLM providers",
  description: "Returns the LLM providers configured in Aurora (chat/completions backends).",
  inputSchema: {
    type: "object" as const,
    properties: {},
    additionalProperties: false,
  },
} as const;

export const GET_LLM_PROVIDER_TOOL = {
  name: "get_llm_provider",
  title: "Get LLM provider details",
  description: "Returns the full configuration of a specific LLM provider.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The LLM provider's ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const CREATE_LLM_PROVIDER_TOOL = {
  name: "create_llm_provider",
  title: "Create an LLM provider",
  description:
    "Registers a new LLM provider. `type` is the adapter PROTOCOL, not the vendor.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "Provider name/slug (unique per owner)." },
      displayName: { type: "string", description: "Human-friendly label." },
      type: {
        type: "string",
        enum: ["openai-completions", "anthropic-messages", "gemini"],
        description: "Adapter protocol. openai-completions covers OpenAI/Groq/OpenRouter/DeepSeek/Ollama/vLLM.",
      },
      baseUrl: { type: "string", description: "Endpoint base URL. Empty = SDK default." },
      apiKey: { type: "string", description: "API key for the endpoint." },
      transcriptionModel: { type: "string", description: "Audio transcription model (Whisper), when supported." },
      isActive: { type: "boolean" },
      ownerId: { type: "string", description: "Owner (master only)." },
    },
    required: ["name", "displayName", "type"],
    additionalProperties: false,
  },
} as const;

export const UPDATE_LLM_PROVIDER_TOOL = {
  name: "update_llm_provider",
  title: "Update an LLM provider",
  description: "Updates an existing LLM provider's configuration.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The LLM provider's ID." },
      displayName: { type: "string" },
      type: { type: "string", enum: ["openai-completions", "anthropic-messages", "gemini"] },
      baseUrl: { type: "string" },
      apiKey: { type: "string" },
      transcriptionModel: { type: "string" },
      isActive: { type: "boolean" },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const DELETE_LLM_PROVIDER_TOOL = {
  name: "delete_llm_provider",
  title: "Delete an LLM provider",
  description: "Removes an LLM provider. Blocked if any AI still uses it.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The LLM provider's ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const TEST_LLM_PROVIDER_TOOL = {
  name: "test_llm_provider",
  title: "Test an LLM provider connection",
  description: "Validates baseUrl + apiKey with a light call (model listing). Never echoes the key.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The LLM provider's ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export async function runListLlmProviders(creds: Credentials): Promise<unknown> {
  return auroraRequest(creds, "/dashboard/llm-providers");
}

export async function runGetLlmProvider(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, apiPath`/dashboard/llm-providers/${a.id}`);
}

export async function runCreateLlmProvider(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.name || typeof a.name !== "string") throw new Error("Parameter 'name' is required.");
  if (!a.displayName || typeof a.displayName !== "string") throw new Error("Parameter 'displayName' is required.");
  if (!a.type || typeof a.type !== "string") throw new Error("Parameter 'type' is required.");
  return auroraRequest(creds, "/dashboard/llm-providers", { method: "POST", body: a });
}

export async function runUpdateLlmProvider(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  const { id, ...body } = a;
  return auroraRequest(creds, apiPath`/dashboard/llm-providers/${id}`, { method: "PUT", body });
}

export async function runDeleteLlmProvider(creds: Credentials, args: unknown): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  await auroraRequest(creds, apiPath`/dashboard/llm-providers/${a.id}`, { method: "DELETE" });
  return { deleted: true };
}

export async function runTestLlmProvider(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, apiPath`/dashboard/llm-providers/${a.id}/test`);
}
