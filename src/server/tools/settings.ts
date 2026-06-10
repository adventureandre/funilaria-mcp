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
      ownerId: {
        type: "string",
        description:
          "Owner (tenant) ID to read scoped settings (master only). " +
          "Omit for the global values. Requires `section`.",
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
      ownerId: {
        type: "string",
        description:
          "Owner (tenant) ID to scope the settings to. Master only — " +
          "omit to write the GLOBAL settings (affects all tenants).",
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
    const qs =
      a.ownerId && typeof a.ownerId === "string"
        ? `?ownerId=${encodeURIComponent(a.ownerId)}`
        : "";
    return auroraRequest(creds, apiPath`/dashboard/settings/${a.section}` + qs);
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
  // ownerId vai na query string — é onde o backend (ownerFilter) lê o escopo
  // quando o ator é master. Sem ele, master grava o GLOBAL.
  const qs =
    a.ownerId && typeof a.ownerId === "string"
      ? `?ownerId=${encodeURIComponent(a.ownerId)}`
      : "";
  return auroraRequest(creds, apiPath`/dashboard/settings/${a.section}` + qs, {
    method: "PATCH",
    body: a.values,
  });
}
