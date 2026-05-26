import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const LIST_EMBEDDINGS_TOOL = {
  name: "list_embeddings",
  title: "List embeddings for an AI",
  description:
    "Returns the embeddings (knowledge base entries) for a given AI. " +
    "Also shows embedding stats if `stats` is true.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      stats: { type: "boolean", description: "If true, returns stats instead of listing entries." },
    },
    required: ["aiId"],
    additionalProperties: false,
  },
} as const;

export const CREATE_EMBEDDING_TOOL = {
  name: "create_embedding",
  title: "Create an embedding",
  description:
    "Adds a new knowledge base entry (embedding) to an AI. " +
    "The text will be embedded and made searchable during conversations.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      content: { type: "string", description: "The text content to embed." },
      metadata: {
        type: "object",
        description: "Optional metadata to associate with the embedding.",
        additionalProperties: true,
      },
    },
    required: ["aiId", "content"],
    additionalProperties: false,
  },
} as const;

export const UPDATE_EMBEDDING_TOOL = {
  name: "update_embedding",
  title: "Update an embedding",
  description: "Updates the content or metadata of an existing embedding entry.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      embeddingId: { type: "string", description: "The embedding's ID." },
      content: { type: "string", description: "New text content." },
      metadata: { type: "object", description: "New metadata.", additionalProperties: true },
    },
    required: ["aiId", "embeddingId"],
    additionalProperties: false,
  },
} as const;

export const DELETE_EMBEDDING_TOOL = {
  name: "delete_embedding",
  title: "Delete an embedding",
  description: "Removes a specific embedding entry from an AI's knowledge base.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      embeddingId: { type: "string", description: "The embedding's ID." },
    },
    required: ["aiId", "embeddingId"],
    additionalProperties: false,
  },
} as const;

export async function runListEmbeddings(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (a.stats) {
    return auroraRequest(creds, `/dashboard/ia/${a.aiId}/embeddings/stats`);
  }
  return auroraRequest(creds, `/dashboard/ia/${a.aiId}/embeddings`);
}

export async function runCreateEmbedding(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.content || typeof a.content !== "string") throw new Error("Parameter 'content' is required.");
  const { aiId, ...body } = a;
  return auroraRequest(creds, `/dashboard/ia/${aiId}/embeddings`, {
    method: "POST",
    body,
  });
}

export async function runUpdateEmbedding(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.embeddingId || typeof a.embeddingId !== "string") throw new Error("Parameter 'embeddingId' is required.");
  const { aiId, embeddingId, ...body } = a;
  return auroraRequest(creds, `/dashboard/ia/${aiId}/embeddings/${embeddingId}`, {
    method: "PUT",
    body,
  });
}

export async function runDeleteEmbedding(
  creds: Credentials,
  args: unknown,
): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.embeddingId || typeof a.embeddingId !== "string") throw new Error("Parameter 'embeddingId' is required.");
  await auroraRequest(creds, `/dashboard/ia/${a.aiId}/embeddings/${a.embeddingId}`, { method: "DELETE" });
  return { deleted: true };
}
