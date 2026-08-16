import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

// Erros capturados (error_logs) — rastro operacional do tenant. Mesma permissão
// da auditoria (audit:read). Backend: GET /dashboard/error-logs.

export const LIST_ERROR_LOGS_TOOL = {
  name: "list_error_logs",
  title: "List error logs",
  description:
    "Returns captured operational errors (failed RAG, UiAction effects, 500s) with pagination.",
  inputSchema: {
    type: "object" as const,
    properties: {
      page: { type: "integer", minimum: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100 },
      search: { type: "string", description: "Filter by message, errorType or route." },
      ownerId: { type: "string", description: "Owner (master only) to scope the logs." },
    },
    additionalProperties: false,
  },
} as const;

export async function runListErrorLogs(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const params = new URLSearchParams();
  if (a.page) params.set("page", String(a.page));
  if (a.limit) params.set("limit", String(a.limit));
  if (a.search && typeof a.search === "string") params.set("search", a.search);
  if (a.ownerId && typeof a.ownerId === "string") params.set("ownerId", a.ownerId);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return auroraRequest(creds, `/dashboard/error-logs${qs}`);
}
