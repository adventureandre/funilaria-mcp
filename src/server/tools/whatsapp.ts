import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

// Canal de WhatsApp de uma IA (via baileys-gateway). Gated por plano (master
// livre). Backend: /dashboard/ia/:aiId/whatsapp[...].

export const WHATSAPP_INFO_TOOL = {
  name: "whatsapp_info",
  title: "Get WhatsApp status",
  description: "Returns the WhatsApp connection status/info for an AI (includes QR when connecting).",
  inputSchema: {
    type: "object" as const,
    properties: { aiId: { type: "string", description: "The AI's ID." } },
    required: ["aiId"],
    additionalProperties: false,
  },
} as const;

export const WHATSAPP_CONNECT_TOOL = {
  name: "whatsapp_connect",
  title: "Connect WhatsApp",
  description: "Starts/connects the WhatsApp session for an AI (returns QR/status).",
  inputSchema: {
    type: "object" as const,
    properties: { aiId: { type: "string", description: "The AI's ID." } },
    required: ["aiId"],
    additionalProperties: false,
  },
} as const;

export const WHATSAPP_DISCONNECT_TOOL = {
  name: "whatsapp_disconnect",
  title: "Disconnect WhatsApp",
  description: "Stops/disconnects the WhatsApp session for an AI.",
  inputSchema: {
    type: "object" as const,
    properties: { aiId: { type: "string", description: "The AI's ID." } },
    required: ["aiId"],
    additionalProperties: false,
  },
} as const;

function requireAiId(args: unknown): string {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  return a.aiId;
}

export async function runWhatsappInfo(creds: Credentials, args: unknown): Promise<unknown> {
  return auroraRequest(creds, apiPath`/dashboard/ia/${requireAiId(args)}/whatsapp`);
}

export async function runWhatsappConnect(creds: Credentials, args: unknown): Promise<unknown> {
  return auroraRequest(creds, apiPath`/dashboard/ia/${requireAiId(args)}/whatsapp/connect`, { method: "POST" });
}

export async function runWhatsappDisconnect(creds: Credentials, args: unknown): Promise<unknown> {
  return auroraRequest(creds, apiPath`/dashboard/ia/${requireAiId(args)}/whatsapp/disconnect`, { method: "POST" });
}
