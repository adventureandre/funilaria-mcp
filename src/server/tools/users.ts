import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const LIST_USERS_TOOL = {
  name: "list_users",
  title: "List users",
  description:
    "Lists Aurora dashboard users (requires master/admin permission). " +
    "Supports search and pagination.",
  inputSchema: {
    type: "object" as const,
    properties: {
      search: { type: "string", description: "Search by name or email." },
      role: { type: "string", description: "Filter by role name." },
      page: { type: "integer", minimum: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100 },
    },
    additionalProperties: false,
  },
} as const;

export const GET_USER_TOOL = {
  name: "get_user",
  title: "Get user details",
  description: "Returns details of a specific user by ID (requires master permission).",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The user's ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export async function runListUsers(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const params = new URLSearchParams();
  if (a.page) params.set("page", String(a.page));
  if (a.limit) params.set("limit", String(a.limit));
  if (a.search && typeof a.search === "string") params.set("search", a.search);
  if (a.role && typeof a.role === "string") params.set("role", a.role);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return auroraRequest(creds, `/dashboard/users${qs}`);
}

export async function runGetUser(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, `/dashboard/users/${a.id}`);
}
