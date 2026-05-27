import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const GET_CONVERSATION_STATUS_TOOL = {
  name: "get_conversation_status",
  title: "Get conversation status",
  description:
    "Returns the current status of a conversation (ACTIVE, PAUSED, AWAITING_HUMAN, HUMAN_HANDLING, CLOSED).",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      userId: { type: "string", description: "The end-user's identifier." },
    },
    required: ["aiId", "userId"],
    additionalProperties: false,
  },
} as const;

export const RESUME_CONVERSATION_TOOL = {
  name: "resume_conversation",
  title: "Resume a conversation",
  description: "Resumes a paused or handed-off conversation, setting it back to ACTIVE.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      userId: { type: "string", description: "The end-user's identifier." },
    },
    required: ["aiId", "userId"],
    additionalProperties: false,
  },
} as const;

export const CLOSE_CONVERSATION_TOOL = {
  name: "close_conversation",
  title: "Close a conversation",
  description: "Closes a conversation, ending the session.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      userId: { type: "string", description: "The end-user's identifier." },
    },
    required: ["aiId", "userId"],
    additionalProperties: false,
  },
} as const;

export const HANDOFF_ACK_TOOL = {
  name: "handoff_ack",
  title: "Acknowledge handoff",
  description:
    "Acknowledges a human handoff request, transitioning from AWAITING_HUMAN to HUMAN_HANDLING.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      userId: { type: "string", description: "The end-user's identifier." },
    },
    required: ["aiId", "userId"],
    additionalProperties: false,
  },
} as const;

function requirePair(args: unknown): { aiId: string; userId: string } {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.userId || typeof a.userId !== "string") throw new Error("Parameter 'userId' is required.");
  return { aiId: a.aiId, userId: a.userId };
}

export async function runGetConversationStatus(creds: Credentials, args: unknown): Promise<unknown> {
  const { aiId, userId } = requirePair(args);
  return auroraRequest(creds, apiPath`/dashboard/conversations/${aiId}/${userId}/status`);
}

export async function runResumeConversation(creds: Credentials, args: unknown): Promise<unknown> {
  const { aiId, userId } = requirePair(args);
  return auroraRequest(creds, apiPath`/dashboard/conversations/${aiId}/${userId}/resume`, { method: "POST" });
}

export async function runCloseConversation(creds: Credentials, args: unknown): Promise<unknown> {
  const { aiId, userId } = requirePair(args);
  return auroraRequest(creds, apiPath`/dashboard/conversations/${aiId}/${userId}/close`, { method: "POST" });
}

export async function runHandoffAck(creds: Credentials, args: unknown): Promise<unknown> {
  const { aiId, userId } = requirePair(args);
  return auroraRequest(creds, apiPath`/dashboard/conversations/${aiId}/${userId}/handoff/ack`, { method: "POST" });
}
