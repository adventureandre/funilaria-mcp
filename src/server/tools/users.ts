import { auroraRequest, apiPath } from "../../auth/client.js";
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

export const CREATE_USER_TOOL = {
  name: "create_user",
  title: "Create a user",
  description: "Creates a new Aurora dashboard user.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "User's full name." },
      email: { type: "string", description: "User's email address." },
      password: { type: "string", description: "Initial password." },
      roleId: { type: "string", description: "Role ID to assign." },
    },
    required: ["name", "email", "password"],
    additionalProperties: false,
  },
} as const;

export const UPDATE_USER_TOOL = {
  name: "update_user",
  title: "Update a user",
  description: "Updates an existing user's profile.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The user's ID." },
      name: { type: "string" },
      email: { type: "string" },
      password: { type: "string" },
      roleId: { type: "string" },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const DELETE_USER_TOOL = {
  name: "delete_user",
  title: "Delete a user",
  description: "Removes a user from Aurora.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The user's ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export async function runGetUser(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, apiPath`/dashboard/users/${a.id}`);
}

export async function runCreateUser(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.name || typeof a.name !== "string") throw new Error("Parameter 'name' is required.");
  if (!a.email || typeof a.email !== "string") throw new Error("Parameter 'email' is required.");
  if (!a.password || typeof a.password !== "string") throw new Error("Parameter 'password' is required.");
  return auroraRequest(creds, "/dashboard/users", { method: "POST", body: a });
}

export async function runUpdateUser(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  const { id, ...body } = a;
  return auroraRequest(creds, apiPath`/dashboard/users/${id}`, { method: "PUT", body });
}

export async function runDeleteUser(creds: Credentials, args: unknown): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  await auroraRequest(creds, apiPath`/dashboard/users/${a.id}`, { method: "DELETE" });
  return { deleted: true };
}
