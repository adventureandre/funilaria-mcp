import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

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
