import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const LIST_RECENT_CONVERSATIONS_TOOL = {
  name: "list_recent_conversations",
  title: "List recent conversations",
  description:
    "Returns the most recent conversations across all AIs. Useful for a quick overview of recent activity.",
  inputSchema: {
    type: "object" as const,
    properties: {
      limit: {
        type: "integer",
        description: "Number of recent messages to return (default 30).",
        minimum: 1,
        maximum: 100,
      },
    },
    additionalProperties: false,
  },
} as const;

export async function runListRecentConversations(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const limit = typeof a.limit === "number" ? a.limit : 30;
  return auroraRequest(creds, `/dashboard/conversations/recent?limit=${limit}`);
}
