import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

// Permissões diretas de usuário (overrides ALLOW/DENY sobre o role) e
// impersonation (master only). Backend: /dashboard/users/:id/permissions e
// /dashboard/users/:id/impersonate.

export const GET_USER_PERMISSIONS_TOOL = {
  name: "get_user_permissions",
  title: "Get user permissions",
  description:
    "Returns a user's base (role) permissions, overrides, effective set, the actor's allowed ceiling, and the full catalog.",
  inputSchema: {
    type: "object" as const,
    properties: { id: { type: "string", description: "The user's ID." } },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const SET_USER_PERMISSIONS_TOOL = {
  name: "set_user_permissions",
  title: "Set user permissions",
  description:
    "Replaces a user's permission overrides. Each override is { resource, action, effect } " +
    "with effect 'ALLOW' or 'DENY'. Granting ALLOW beyond the actor's own ceiling is rejected.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The user's ID." },
      overrides: {
        type: "array",
        description: "The full set of overrides to apply (replaces existing).",
        items: {
          type: "object",
          properties: {
            resource: { type: "string" },
            action: { type: "string" },
            effect: { type: "string", enum: ["ALLOW", "DENY"] },
          },
          required: ["resource", "action", "effect"],
          additionalProperties: false,
        },
      },
    },
    required: ["id", "overrides"],
    additionalProperties: false,
  },
} as const;

export const IMPERSONATE_USER_TOOL = {
  name: "impersonate_user",
  title: "Impersonate a user",
  description:
    "Issues a 1-hour JWT to act as another user (master only). Returns { token, user, impersonatedBy }.",
  inputSchema: {
    type: "object" as const,
    properties: { id: { type: "string", description: "The target user's ID." } },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

function requireId(args: unknown): string {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return a.id;
}

export async function runGetUserPermissions(creds: Credentials, args: unknown): Promise<unknown> {
  return auroraRequest(creds, apiPath`/dashboard/users/${requireId(args)}/permissions`);
}

export async function runSetUserPermissions(creds: Credentials, args: unknown): Promise<unknown> {
  const id = requireId(args);
  const a = (args ?? {}) as Record<string, unknown>;
  if (!Array.isArray(a.overrides)) throw new Error("Parameter 'overrides' is required and must be an array.");
  return auroraRequest(creds, apiPath`/dashboard/users/${id}/permissions`, {
    method: "PUT",
    body: { overrides: a.overrides },
  });
}

export async function runImpersonateUser(creds: Credentials, args: unknown): Promise<unknown> {
  return auroraRequest(creds, apiPath`/dashboard/users/${requireId(args)}/impersonate`, { method: "POST" });
}
