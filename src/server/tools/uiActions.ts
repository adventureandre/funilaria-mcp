import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const LINK_UI_ACTION_TOOL = {
  name: "link_ui_action_to_ai",
  title: "Link UI Action to AI",
  description: "Associates a UI Action with an AI so it can use it during conversations.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      uiActionId: { type: "string", description: "The UI Action's ID." },
      customDescription: { type: "string", description: "Override description for this AI." },
      isEnabled: { type: "boolean", description: "Whether the link is active (default true)." },
      rateLimit: { type: "integer", description: "Max invocations per minute for this link." },
      commandExposure: {
        type: "string",
        enum: ["NONE", "DASHBOARD", "PUBLIC"],
        description:
          "Exposes this action as a chat command (/name). NONE (default) = not a command; DASHBOARD = panel operators only; PUBLIC = also the public API and chat widget. Requires chatCommandsEnabled on the AI.",
      },
    },
    required: ["aiId", "uiActionId"],
    additionalProperties: false,
  },
} as const;

export const UNLINK_UI_ACTION_TOOL = {
  name: "unlink_ui_action_from_ai",
  title: "Unlink UI Action from AI",
  description: "Removes the association between a UI Action and an AI.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      uiActionId: { type: "string", description: "The UI Action's ID." },
    },
    required: ["aiId", "uiActionId"],
    additionalProperties: false,
  },
} as const;

export const UI_ACTION_STATS_TOOL = {
  name: "ui_action_stats",
  title: "UI Action usage stats",
  description:
    "Returns usage statistics for UI Actions. " +
    "If `id` is provided, returns detailed stats for that action. Otherwise returns bulk stats.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "Optional: specific UI Action ID for detailed stats." },
    },
    additionalProperties: false,
  },
} as const;

export async function runLinkUiAction(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.uiActionId || typeof a.uiActionId !== "string") throw new Error("Parameter 'uiActionId' is required.");
  const { aiId, uiActionId, ...body } = a;
  return auroraRequest(creds, apiPath`/dashboard/ia/${aiId}/ui-actions/${uiActionId}`, {
    method: "POST",
    body,
  });
}

export async function runUnlinkUiAction(
  creds: Credentials,
  args: unknown,
): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.uiActionId || typeof a.uiActionId !== "string") throw new Error("Parameter 'uiActionId' is required.");
  await auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/ui-actions/${a.uiActionId}`, { method: "DELETE" });
  return { deleted: true };
}

export async function runUiActionStats(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (a.id && typeof a.id === "string") {
    return auroraRequest(creds, apiPath`/dashboard/ui-actions/${a.id}/stats`);
  }
  return auroraRequest(creds, "/dashboard/ui-actions/stats");
}
