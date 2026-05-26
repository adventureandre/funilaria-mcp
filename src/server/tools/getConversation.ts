import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const GET_CONVERSATION_TOOL = {
  name: "get_conversation",
  title: "Get a conversation",
  description:
    "Returns the message history of a conversation between a specific AI and user. " +
    "Supports pagination — messages are returned newest-first by default.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      userId: { type: "string", description: "The end-user's identifier." },
      page: { type: "integer", minimum: 1, description: "Page number (default 1)." },
      limit: { type: "integer", minimum: 1, maximum: 100, description: "Messages per page (default 50)." },
    },
    required: ["aiId", "userId"],
    additionalProperties: false,
  },
} as const;

export async function runGetConversation(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") {
    throw new Error("Parameter 'aiId' is required.");
  }
  if (!a.userId || typeof a.userId !== "string") {
    throw new Error("Parameter 'userId' is required.");
  }
  const params = new URLSearchParams();
  if (a.page) params.set("page", String(a.page));
  if (a.limit) params.set("limit", String(a.limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return auroraRequest(
    creds,
    `/dashboard/conversations/${a.aiId}/${encodeURIComponent(a.userId)}${qs}`,
  );
}
