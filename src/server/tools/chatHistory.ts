import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const GET_CHAT_HISTORY_TOOL = {
  name: "get_chat_history",
  title: "Get chat history for a user",
  description:
    "Returns the conversation thread (message history) for a specific user with an AI. " +
    "Uses the AI's `name` (not ID) and the user's identifier (e.g. phone number or chatId).",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiName: {
        type: "string",
        description: "The AI's name (as returned by list_ais).",
      },
      userId: {
        type: "string",
        description: "The end-user's identifier (e.g. '5562999540017@c.us').",
      },
    },
    required: ["aiName", "userId"],
    additionalProperties: false,
  },
} as const;

export async function runGetChatHistory(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiName || typeof a.aiName !== "string")
    throw new Error("Parameter 'aiName' is required.");
  if (!a.userId || typeof a.userId !== "string")
    throw new Error("Parameter 'userId' is required.");
  return auroraRequest(
    creds,
    apiPath`/ia/${a.aiName}/chat/${a.userId}/history`,
  );
}
