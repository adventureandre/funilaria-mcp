import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const READ_WEBHOOK_INSPECTOR_TOOL = {
  name: "read_webhook_inspector",
  title: "Read webhook inspector buffer",
  description: "Reads the captured webhook payloads for a given slug.",
  inputSchema: {
    type: "object" as const,
    properties: {
      slug: { type: "string", description: "The webhook inspector slug." },
    },
    required: ["slug"],
    additionalProperties: false,
  },
} as const;

export const CLEAR_WEBHOOK_INSPECTOR_TOOL = {
  name: "clear_webhook_inspector",
  title: "Clear webhook inspector buffer",
  description: "Clears the captured webhook payloads for a given slug.",
  inputSchema: {
    type: "object" as const,
    properties: {
      slug: { type: "string", description: "The webhook inspector slug." },
    },
    required: ["slug"],
    additionalProperties: false,
  },
} as const;

export async function runReadWebhookInspector(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.slug || typeof a.slug !== "string") throw new Error("Parameter 'slug' is required.");
  return auroraRequest(creds, `/dashboard/webhook-inspector/${a.slug}`);
}

export async function runClearWebhookInspector(creds: Credentials, args: unknown): Promise<{ cleared: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.slug || typeof a.slug !== "string") throw new Error("Parameter 'slug' is required.");
  await auroraRequest(creds, `/dashboard/webhook-inspector/${a.slug}`, { method: "DELETE" });
  return { cleared: true };
}
