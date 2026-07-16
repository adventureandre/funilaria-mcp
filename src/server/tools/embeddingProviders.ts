import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

// Providers de embedding config-driven. `type` é o protocolo do adaptador, não o
// vendor: openai (cobre OpenAI e endpoints OpenAI-compatible via baseUrl) ou
// gemini. `model` + `dimension` definem o espaço vetorial; dimension deve casar
// uma coluna pgvector existente ({1536, 768}). Backend: /dashboard/embedding-providers.

export const LIST_EMBEDDING_PROVIDERS_TOOL = {
  name: "list_embedding_providers",
  title: "List embedding providers",
  description: "Returns the embedding providers configured in Aurora (vector/RAG backends).",
  inputSchema: {
    type: "object" as const,
    properties: {},
    additionalProperties: false,
  },
} as const;

export const GET_EMBEDDING_PROVIDER_TOOL = {
  name: "get_embedding_provider",
  title: "Get embedding provider details",
  description: "Returns the full configuration of a specific embedding provider.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The embedding provider's ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const CREATE_EMBEDDING_PROVIDER_TOOL = {
  name: "create_embedding_provider",
  title: "Create an embedding provider",
  description:
    "Registers a new embedding provider. `dimension` must match an existing pgvector column (1536 or 768).",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "Provider name/slug (unique per owner)." },
      displayName: { type: "string", description: "Human-friendly label." },
      type: {
        type: "string",
        enum: ["openai", "gemini"],
        description: "Adapter protocol. openai covers OpenAI and OpenAI-compatible endpoints.",
      },
      model: { type: "string", description: "Embedding model (e.g. text-embedding-3-small, gemini-embedding-001)." },
      dimension: { type: "integer", enum: [1536, 768], description: "Vector dimension. Must match a supported pgvector column." },
      baseUrl: { type: "string", description: "Endpoint base URL. Empty = SDK default." },
      apiKey: { type: "string", description: "API key for the endpoint." },
      isActive: { type: "boolean" },
      ownerId: { type: "string", description: "Owner (master only)." },
    },
    required: ["name", "displayName", "type", "model", "dimension"],
    additionalProperties: false,
  },
} as const;

export const UPDATE_EMBEDDING_PROVIDER_TOOL = {
  name: "update_embedding_provider",
  title: "Update an embedding provider",
  description:
    "Updates an embedding provider. Changing model/dimension is blocked while AIs use it (would invalidate their vectors).",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The embedding provider's ID." },
      displayName: { type: "string" },
      type: { type: "string", enum: ["openai", "gemini"] },
      model: { type: "string" },
      dimension: { type: "integer", enum: [1536, 768] },
      baseUrl: { type: "string" },
      apiKey: { type: "string" },
      isActive: { type: "boolean" },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const DELETE_EMBEDDING_PROVIDER_TOOL = {
  name: "delete_embedding_provider",
  title: "Delete an embedding provider",
  description: "Removes an embedding provider. Blocked if any AI still uses it.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The embedding provider's ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const TEST_EMBEDDING_PROVIDER_TOOL = {
  name: "test_embedding_provider",
  title: "Test an embedding provider connection",
  description: "Generates a sample embedding and checks the length against the declared dimension. Never echoes the key.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The embedding provider's ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export async function runListEmbeddingProviders(creds: Credentials): Promise<unknown> {
  return auroraRequest(creds, "/dashboard/embedding-providers");
}

export async function runGetEmbeddingProvider(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, apiPath`/dashboard/embedding-providers/${a.id}`);
}

export async function runCreateEmbeddingProvider(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.name || typeof a.name !== "string") throw new Error("Parameter 'name' is required.");
  if (!a.displayName || typeof a.displayName !== "string") throw new Error("Parameter 'displayName' is required.");
  if (!a.type || typeof a.type !== "string") throw new Error("Parameter 'type' is required.");
  if (!a.model || typeof a.model !== "string") throw new Error("Parameter 'model' is required.");
  if (typeof a.dimension !== "number") throw new Error("Parameter 'dimension' is required.");
  return auroraRequest(creds, "/dashboard/embedding-providers", { method: "POST", body: a });
}

export async function runUpdateEmbeddingProvider(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  const { id, ...body } = a;
  return auroraRequest(creds, apiPath`/dashboard/embedding-providers/${id}`, { method: "PUT", body });
}

export async function runDeleteEmbeddingProvider(creds: Credentials, args: unknown): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  await auroraRequest(creds, apiPath`/dashboard/embedding-providers/${a.id}`, { method: "DELETE" });
  return { deleted: true };
}

export async function runTestEmbeddingProvider(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, apiPath`/dashboard/embedding-providers/${a.id}/test`);
}
