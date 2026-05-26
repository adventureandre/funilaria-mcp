import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export interface AiListItem {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  provider: string;
  model: string;
  isActive: boolean;
}

export const LIST_AIS_TOOL = {
  name: "list_ais",
  title: "List Aurora AIs",
  description:
    "Lists the Aurora AIs that the authenticated user has permission to use. " +
    "Returns each AI's id, name, displayName, description, provider, model, and isActive flag. " +
    "Use `name` for chat_with_ai/get_ai_config, and `id` for update/delete/skills/embeddings tools.",
  inputSchema: {
    type: "object" as const,
    properties: {
      includeInactive: {
        type: "boolean",
        description: "If true, also returns inactive AIs. Defaults to false.",
      },
      search: {
        type: "string",
        description: "Search by name or displayName.",
      },
      provider: {
        type: "string",
        description: "Filter by provider (e.g. 'openai', 'anthropic').",
      },
      page: { type: "integer", minimum: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100 },
    },
    additionalProperties: false,
  },
} as const;

export async function runListAis(
  creds: Credentials,
  args: Record<string, unknown> | undefined,
): Promise<unknown> {
  const a = args ?? {};
  const params = new URLSearchParams();
  if (a.page) params.set("page", String(a.page));
  if (a.limit) params.set("limit", String(a.limit));
  if (a.search && typeof a.search === "string") params.set("search", a.search);
  if (a.provider && typeof a.provider === "string") params.set("provider", a.provider);
  const qs = params.toString() ? `?${params.toString()}` : "";

  const data = await auroraRequest<unknown>(creds, `/dashboard/ia${qs}`);
  const all: AiListItem[] = Array.isArray(data)
    ? data
    : (data as any)?.data ?? (data as any)?.ais ?? [];

  if (a.includeInactive) return all;
  return all.filter((ai) => ai.isActive);
}
