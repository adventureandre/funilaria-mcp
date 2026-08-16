import { auroraRequest, apiPath } from "../../auth/client.js";
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
      page: { type: "integer", minimum: 1, description: "Page number (when listing)." },
      limit: { type: "integer", minimum: 1, maximum: 100, description: "Entries per page (when listing)." },
      search: { type: "string", description: "Filter entries by content (when listing)." },
      source: { type: "string", description: "Filter entries by source (e.g. 'manual', 'document')." },
    },
    required: ["aiId"],
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
    return auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/embeddings/stats`);
  }
  const params = new URLSearchParams();
  if (a.page) params.set("page", String(a.page));
  if (a.limit) params.set("limit", String(a.limit));
  if (a.search && typeof a.search === "string") params.set("search", a.search);
  if (a.source && typeof a.source === "string") params.set("source", a.source);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/embeddings` + qs);
}

