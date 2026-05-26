import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const LIST_CONVERSATIONS_TOOL = {
  name: "list_conversations",
  title: "List conversations",
  description:
    "Lists conversations for an AI. If `aiId` is provided, lists conversations for that specific AI. " +
    "Otherwise returns recent conversations across all AIs. " +
    "Supports pagination via `page` and `limit`.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: {
        type: "string",
        description: "AI ID to filter conversations. Omit for recent across all AIs.",
      },
      page: { type: "integer", minimum: 1, description: "Page number (default 1)." },
      limit: { type: "integer", minimum: 1, maximum: 100, description: "Items per page (default 20)." },
    },
    additionalProperties: false,
  },
} as const;

export async function runListConversations(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const params = new URLSearchParams();
  if (a.page) params.set("page", String(a.page));
  if (a.limit) params.set("limit", String(a.limit));
  const qs = params.toString() ? `?${params.toString()}` : "";

  if (a.aiId && typeof a.aiId === "string") {
    return auroraRequest(creds, `/dashboard/conversations/${a.aiId}${qs}`);
  }
  return auroraRequest(creds, `/dashboard/conversations/recent${qs}`);
}
