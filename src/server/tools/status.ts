import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const GET_ME_TOOL = {
  name: "get_me",
  title: "Get current user info",
  description: "Returns the authenticated user's profile (email, role, permissions).",
  inputSchema: {
    type: "object" as const,
    properties: {},
    additionalProperties: false,
  },
} as const;

export const GET_STATUS_TOOL = {
  name: "get_status",
  title: "Get system status",
  description: "Returns Aurora system status and health information.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    additionalProperties: false,
  },
} as const;

export async function runGetMe(creds: Credentials): Promise<unknown> {
  return auroraRequest(creds, "/dashboard/auth/me");
}

export async function runGetStatus(creds: Credentials): Promise<unknown> {
  return auroraRequest(creds, "/dashboard/status");
}
