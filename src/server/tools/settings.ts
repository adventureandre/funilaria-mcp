import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const GET_SETTINGS_TOOL = {
  name: "get_settings",
  title: "Get system settings",
  description:
    "Returns Aurora system settings. Specify `section` to get a specific group: " +
    "'rate-limit', 'uploads', 'chat', or 'media'. Omit for all sections.",
  inputSchema: {
    type: "object" as const,
    properties: {
      section: {
        type: "string",
        enum: ["rate-limit", "uploads", "chat", "media"],
        description: "Which settings section to read.",
      },
    },
    additionalProperties: false,
  },
} as const;

export const UPDATE_SETTINGS_TOOL = {
  name: "update_settings",
  title: "Update system settings",
  description:
    "Updates Aurora system settings for a specific section. " +
    "Requires system:settings:write permission. " +
    "Pass the section and the key-value pairs to update.",
  inputSchema: {
    type: "object" as const,
    properties: {
      section: {
        type: "string",
        enum: ["rate-limit", "uploads", "chat", "media"],
        description: "Which settings section to update.",
      },
      values: {
        type: "object",
        description: "Key-value pairs to set.",
        additionalProperties: true,
      },
    },
    required: ["section", "values"],
    additionalProperties: false,
  },
} as const;

export async function runGetSettings(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (a.section && typeof a.section === "string") {
    return auroraRequest(creds, apiPath`/dashboard/settings/${a.section}`);
  }
  const [rateLimit, uploads, chat, media] = await Promise.all([
    auroraRequest(creds, "/dashboard/settings/rate-limit"),
    auroraRequest(creds, "/dashboard/settings/uploads"),
    auroraRequest(creds, "/dashboard/settings/chat"),
    auroraRequest(creds, "/dashboard/settings/media"),
  ]);
  return { rateLimit, uploads, chat, media };
}

export async function runUpdateSettings(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.section || typeof a.section !== "string") {
    throw new Error("Parameter 'section' is required.");
  }
  if (!a.values || typeof a.values !== "object") {
    throw new Error("Parameter 'values' is required and must be an object.");
  }
  return auroraRequest(creds, apiPath`/dashboard/settings/${a.section}`, {
    method: "PATCH",
    body: a.values,
  });
}
