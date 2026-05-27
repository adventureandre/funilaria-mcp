import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const LIST_UI_ACTIONS_TOOL = {
  name: "list_ui_actions",
  title: "List UI Actions",
  description:
    "Lists UI Actions (frontend actions the AI can trigger). " +
    "Supports filtering by `category` and pagination.",
  inputSchema: {
    type: "object" as const,
    properties: {
      category: { type: "string", description: "Filter by category (e.g. 'navigation', 'form', 'modal')." },
      page: { type: "integer", minimum: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100 },
      search: { type: "string", description: "Search by name or displayName." },
    },
    additionalProperties: false,
  },
} as const;

export const GET_UI_ACTION_TOOL = {
  name: "get_ui_action",
  title: "Get a UI Action",
  description: "Returns full details of a UI Action by ID, including linked AIs.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The UI Action's ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const CREATE_UI_ACTION_TOOL = {
  name: "create_ui_action",
  title: "Create a UI Action",
  description:
    "Creates a new UI Action that AIs can invoke in the frontend. " +
    "Requires `name`, `displayName`, `description`, `category`, and `parametersSchema`.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "Unique slug identifier." },
      displayName: { type: "string", description: "Human-friendly name." },
      description: { type: "string", description: "What this action does." },
      category: { type: "string", description: "Category (e.g. 'navigation', 'form', 'modal', 'api_call', 'notification')." },
      parametersSchema: {
        type: "object",
        description: "JSON Schema defining the parameters the action accepts.",
        additionalProperties: true,
      },
      schemaVersion: { type: "integer", description: "Schema version number." },
      isActive: { type: "boolean" },
      backendEffect: {
        type: "object",
        description: "Optional backend side-effect configuration.",
        additionalProperties: true,
      },
    },
    required: ["name", "displayName", "description", "category", "parametersSchema"],
    additionalProperties: false,
  },
} as const;

export const UPDATE_UI_ACTION_TOOL = {
  name: "update_ui_action",
  title: "Update a UI Action",
  description: "Updates an existing UI Action. Pass only the fields you want to change.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The UI Action's ID." },
      displayName: { type: "string" },
      description: { type: "string" },
      category: { type: "string" },
      parametersSchema: { type: "object", additionalProperties: true },
      schemaVersion: { type: "integer" },
      isActive: { type: "boolean" },
      backendEffect: { type: "object", additionalProperties: true },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const DELETE_UI_ACTION_TOOL = {
  name: "delete_ui_action",
  title: "Delete a UI Action",
  description: "Permanently deletes a UI Action.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The UI Action's ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

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

export async function runListUiActions(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const params = new URLSearchParams();
  if (a.page) params.set("page", String(a.page));
  if (a.limit) params.set("limit", String(a.limit));
  if (a.search && typeof a.search === "string") params.set("search", a.search);
  if (a.category && typeof a.category === "string") params.set("category", a.category);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return auroraRequest(creds, `/dashboard/ui-actions${qs}`);
}

export async function runGetUiAction(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, apiPath`/dashboard/ui-actions/${a.id}`);
}

export async function runCreateUiAction(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.name || typeof a.name !== "string") throw new Error("Parameter 'name' is required.");
  if (!a.displayName || typeof a.displayName !== "string") throw new Error("Parameter 'displayName' is required.");
  if (!a.category || typeof a.category !== "string") throw new Error("Parameter 'category' is required.");
  return auroraRequest(creds, "/dashboard/ui-actions", {
    method: "POST",
    body: a,
  });
}

export async function runUpdateUiAction(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  const { id, ...body } = a;
  return auroraRequest(creds, apiPath`/dashboard/ui-actions/${id}`, {
    method: "PUT",
    body,
  });
}

export async function runDeleteUiAction(
  creds: Credentials,
  args: unknown,
): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  await auroraRequest(creds, apiPath`/dashboard/ui-actions/${a.id}`, { method: "DELETE" });
  return { deleted: true };
}

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
