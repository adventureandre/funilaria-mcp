import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

const SECTIONS = [
  "rate-limit",
  "uploads",
  "chat",
  "workspace",
  "mcp",
  "chat-limits",
  "media",
  "gendoc",
] as const;

// gendoc tem um sub-recurso de quota por IA (/gendoc/quota/:aiId). media aceita
// override por IA via ?aiId=. Para as demais seções, aiId não se aplica.
function settingsPath(section: string, aiId?: string, ownerId?: string): string {
  if (section === "gendoc" && aiId) {
    return `/dashboard/settings/gendoc/quota/${encodeURIComponent(aiId)}`;
  }
  const params = new URLSearchParams();
  if (section === "media" && aiId) params.set("aiId", aiId);
  if (ownerId) params.set("ownerId", ownerId);
  const qs = params.toString();
  return `/dashboard/settings/${section}${qs ? `?${qs}` : ""}`;
}

export const GET_SETTINGS_TOOL = {
  name: "get_settings",
  title: "Get system settings",
  description:
    "Returns Aurora system settings. Specify `section` to read one group: " +
    "'rate-limit', 'uploads', 'chat', 'workspace', 'mcp', 'chat-limits', 'media', 'gendoc'. " +
    "Omit for all sections. For 'gendoc' with `aiId`, returns that AI's effective quota; " +
    "for 'media' with `aiId`, returns that AI's override.",
  inputSchema: {
    type: "object" as const,
    properties: {
      section: {
        type: "string",
        enum: [...SECTIONS],
        description: "Which settings section to read.",
      },
      aiId: {
        type: "string",
        description:
          "AI ID for per-AI scope. Applies to 'gendoc' (quota) and 'media' (override).",
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
    "Requires the setting:write permission (some sections are tenant-admin scoped). " +
    "Pass the section and the key-value pairs to update. " +
    "For 'gendoc' with `aiId`, sets that AI's quota override (use { quotaMB: null } to reset). " +
    "For 'media' with `aiId`, writes that AI's override.",
  inputSchema: {
    type: "object" as const,
    properties: {
      section: {
        type: "string",
        enum: [...SECTIONS],
        description: "Which settings section to update.",
      },
      values: {
        type: "object",
        description: "Key-value pairs to set.",
        additionalProperties: true,
      },
      aiId: {
        type: "string",
        description:
          "AI ID for per-AI scope. Applies to 'gendoc' (quota override) and 'media' (override).",
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
  const section = typeof a.section === "string" ? a.section : undefined;
  const aiId = typeof a.aiId === "string" ? a.aiId : undefined;
  const ownerId = typeof a.ownerId === "string" ? a.ownerId : undefined;

  if (section) {
    return auroraRequest(creds, settingsPath(section, aiId, ownerId));
  }

  const results = await Promise.all(
    SECTIONS.map((s) => auroraRequest(creds, settingsPath(s))),
  );
  return Object.fromEntries(SECTIONS.map((s, i) => [s, results[i]]));
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
  const aiId = typeof a.aiId === "string" ? a.aiId : undefined;
  const ownerId = typeof a.ownerId === "string" ? a.ownerId : undefined;
  return auroraRequest(creds, settingsPath(a.section, aiId, ownerId), {
    method: "PATCH",
    body: a.values,
  });
}
