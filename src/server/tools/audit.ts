import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const LIST_AUDIT_TOOL = {
  name: "list_audit",
  title: "List audit logs",
  description:
    "Returns audit logs (master only). Supports pagination and filtering.",
  inputSchema: {
    type: "object" as const,
    properties: {
      page: { type: "integer", minimum: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100 },
      userId: { type: "string", description: "Filter by user ID." },
      action: { type: "string", description: "Filter by action type." },
    },
    additionalProperties: false,
  },
} as const;

export async function runListAudit(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const params = new URLSearchParams();
  if (a.page) params.set("page", String(a.page));
  if (a.limit) params.set("limit", String(a.limit));
  if (a.userId && typeof a.userId === "string") params.set("userId", a.userId);
  if (a.action && typeof a.action === "string") params.set("action", a.action);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return auroraRequest(creds, `/dashboard/audit${qs}`);
}
