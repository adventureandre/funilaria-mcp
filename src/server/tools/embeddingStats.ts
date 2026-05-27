import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const GET_EMBEDDING_STATS_TOOL = {
  name: "get_embedding_stats",
  title: "Get embedding statistics",
  description:
    "Returns statistics for an AI's embeddings (knowledge base): total count, " +
    "total tokens, average tokens per entry, sources breakdown.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
    },
    required: ["aiId"],
    additionalProperties: false,
  },
} as const;

export async function runGetEmbeddingStats(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string")
    throw new Error("Parameter 'aiId' is required.");
  return auroraRequest(creds, `/dashboard/ia/${a.aiId}/embeddings/stats`);
}
