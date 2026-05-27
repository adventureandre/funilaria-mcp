import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const LIST_ROLES_TOOL = {
  name: "list_roles",
  title: "List roles",
  description: "Returns all roles configured in Aurora.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    additionalProperties: false,
  },
} as const;

export const LIST_PERMISSIONS_TOOL = {
  name: "list_permissions",
  title: "List permissions",
  description: "Returns all available permissions that can be assigned to roles.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    additionalProperties: false,
  },
} as const;

export const CREATE_ROLE_TOOL = {
  name: "create_role",
  title: "Create a role",
  description: "Creates a new role (master only).",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "Role name/slug." },
      displayName: { type: "string", description: "Human-friendly role name." },
      description: { type: "string", description: "Role description." },
    },
    required: ["name"],
    additionalProperties: false,
  },
} as const;

export const UPDATE_ROLE_PERMISSIONS_TOOL = {
  name: "update_role_permissions",
  title: "Update role permissions",
  description: "Updates the permissions assigned to a role (master only).",
  inputSchema: {
    type: "object" as const,
    properties: {
      roleId: { type: "string", description: "The role's ID." },
      permissions: {
        type: "array",
        items: { type: "string" },
        description: "Array of permission strings to assign.",
      },
    },
    required: ["roleId", "permissions"],
    additionalProperties: false,
  },
} as const;

export const DELETE_ROLE_TOOL = {
  name: "delete_role",
  title: "Delete a role",
  description: "Deletes a role (master only).",
  inputSchema: {
    type: "object" as const,
    properties: {
      roleId: { type: "string", description: "The role's ID." },
    },
    required: ["roleId"],
    additionalProperties: false,
  },
} as const;

export async function runListRoles(creds: Credentials): Promise<unknown> {
  return auroraRequest(creds, "/dashboard/roles");
}

export async function runListPermissions(creds: Credentials): Promise<unknown> {
  return auroraRequest(creds, "/dashboard/permissions");
}

export async function runCreateRole(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.name || typeof a.name !== "string") throw new Error("Parameter 'name' is required.");
  return auroraRequest(creds, "/dashboard/roles", { method: "POST", body: a });
}

export async function runUpdateRolePermissions(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.roleId || typeof a.roleId !== "string") throw new Error("Parameter 'roleId' is required.");
  if (!Array.isArray(a.permissions)) throw new Error("Parameter 'permissions' is required and must be an array.");
  return auroraRequest(creds, `/dashboard/roles/${a.roleId}/permissions`, {
    method: "PUT",
    body: { permissions: a.permissions },
  });
}

export async function runDeleteRole(creds: Credentials, args: unknown): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.roleId || typeof a.roleId !== "string") throw new Error("Parameter 'roleId' is required.");
  await auroraRequest(creds, `/dashboard/roles/${a.roleId}`, { method: "DELETE" });
  return { deleted: true };
}
