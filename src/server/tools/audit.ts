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
      actorId: { type: "string", description: "Filter by the user who performed the action." },
      targetUserId: { type: "string", description: "Filter by the user the action targeted." },
      resource: { type: "string", description: "Filter by resource type (e.g. 'ia', 'provider')." },
      action: { type: "string", description: "Filter by action type (e.g. 'ia.update')." },
    },
    additionalProperties: false,
  },
} as const;

export async function runListAudit(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const params = new URLSearchParams();
  if (a.page) params.set("page", String(a.page));
  if (a.limit) params.set("limit", String(a.limit));
  if (a.actorId && typeof a.actorId === "string") params.set("actorId", a.actorId);
  if (a.targetUserId && typeof a.targetUserId === "string") params.set("targetUserId", a.targetUserId);
  if (a.resource && typeof a.resource === "string") params.set("resource", a.resource);
  if (a.action && typeof a.action === "string") params.set("action", a.action);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return auroraRequest(creds, `/dashboard/audit${qs}`);
}
