import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const DELETE_CONVERSATION_TOOL = {
  name: "delete_conversation",
  title: "Delete a conversation",
  description:
    "Deletes conversation history. If only `aiId` is provided, deletes ALL conversations for that AI. " +
    "If both `aiId` and `userId` are provided, deletes only that specific conversation.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      userId: { type: "string", description: "Optional: specific user's conversation to delete." },
    },
    required: ["aiId"],
    additionalProperties: false,
  },
} as const;

export async function runDeleteConversation(
  creds: Credentials,
  args: unknown,
): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  const path = a.userId && typeof a.userId === "string"
    ? `/dashboard/conversations/${a.aiId}/${encodeURIComponent(a.userId)}`
    : `/dashboard/conversations/${a.aiId}`;
  await auroraRequest(creds, path, { method: "DELETE" });
  return { deleted: true };
}
