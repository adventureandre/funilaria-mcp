import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export interface AiListItem {
  name: string;
  displayName: string;
  description: string | null;
  provider: string;
  model: string;
  isActive: boolean;
}

interface BackendResponse {
  ais: AiListItem[];
}

export const LIST_AIS_TOOL = {
  name: "list_ais",
  title: "List Aurora AIs",
  description:
    "Lists the Aurora AIs that the authenticated user has permission to use. " +
    "Returns each AI's name, displayName, description, provider, model, and isActive flag. " +
    "Use the `name` field when referencing an AI in other tools.",
  inputSchema: {
    type: "object" as const,
    properties: {
      includeInactive: {
        type: "boolean",
        description:
          "If true, also returns AIs whose isActive flag is false. Defaults to false.",
      },
    },
    additionalProperties: false,
  },
} as const;

export async function runListAis(
  creds: Credentials,
  args: { includeInactive?: boolean } | undefined,
): Promise<AiListItem[]> {
  const data = await auroraRequest<BackendResponse>(
    creds,
    "/dashboard/mcp-bridge/ais",
  );
  const all = data?.ais ?? [];
  if (args?.includeInactive) return all;
  return all.filter((ai) => ai.isActive);
}
