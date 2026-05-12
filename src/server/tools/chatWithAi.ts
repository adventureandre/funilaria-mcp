import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

interface HistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface ChatWithAiArgs {
  name: string;
  message: string;
  history?: HistoryItem[];
  maxTokens?: number;
  temperature?: number;
}

export interface ChatWithAiResult {
  content: string | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
}

export const CHAT_WITH_AI_TOOL = {
  name: "chat_with_ai",
  title: "Chat with an Aurora AI",
  description:
    "Sends a single user message to an Aurora AI (by `name`) and returns its reply. " +
    "The AI's configured systemPrompt is automatically prepended on the backend. " +
    "Pass optional `history` (array of { role: 'user'|'assistant', content }) to provide multi-turn context, oldest first. " +
    "This call is stateless — no conversation is persisted in Aurora. " +
    "Use `list_ais` to discover available AIs.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "The AI's `name`, as returned by list_ais.",
      },
      message: {
        type: "string",
        description: "The user message to send to the AI.",
      },
      history: {
        type: "array",
        description:
          "Optional prior turns for multi-turn context. Order: oldest → newest.",
        items: {
          type: "object",
          properties: {
            role: { type: "string", enum: ["user", "assistant"] },
            content: { type: "string" },
          },
          required: ["role", "content"],
          additionalProperties: false,
        },
      },
      maxTokens: {
        type: "integer",
        description: "Override the AI's default maxTokens for this call.",
        minimum: 1,
      },
      temperature: {
        type: "number",
        description:
          "Override the AI's default temperature (0..2) for this call.",
        minimum: 0,
        maximum: 2,
      },
    },
    required: ["name", "message"],
    additionalProperties: false,
  },
} as const;

function normalizeArgs(args: unknown): ChatWithAiArgs {
  const a = (args ?? {}) as Record<string, unknown>;
  if (typeof a.name !== "string" || a.name.length === 0) {
    throw new Error("Parameter 'name' is required and must be a non-empty string.");
  }
  if (typeof a.message !== "string" || a.message.length === 0) {
    throw new Error(
      "Parameter 'message' is required and must be a non-empty string.",
    );
  }

  const result: ChatWithAiArgs = { name: a.name, message: a.message };

  if (a.history !== undefined) {
    if (!Array.isArray(a.history)) {
      throw new Error("Parameter 'history' must be an array.");
    }
    const history: HistoryItem[] = [];
    for (const item of a.history) {
      const h = item as Record<string, unknown>;
      if (
        (h?.role === "user" || h?.role === "assistant") &&
        typeof h?.content === "string"
      ) {
        history.push({ role: h.role, content: h.content });
      }
    }
    result.history = history;
  }

  if (a.maxTokens !== undefined) {
    if (typeof a.maxTokens !== "number" || !Number.isFinite(a.maxTokens)) {
      throw new Error("Parameter 'maxTokens' must be a number.");
    }
    result.maxTokens = a.maxTokens;
  }
  if (a.temperature !== undefined) {
    if (typeof a.temperature !== "number" || !Number.isFinite(a.temperature)) {
      throw new Error("Parameter 'temperature' must be a number.");
    }
    result.temperature = a.temperature;
  }

  return result;
}

export async function runChatWithAi(
  creds: Credentials,
  args: unknown,
): Promise<ChatWithAiResult> {
  const body = normalizeArgs(args);
  return auroraRequest<ChatWithAiResult>(
    creds,
    "/dashboard/mcp-bridge/chat",
    { method: "POST", body },
  );
}
