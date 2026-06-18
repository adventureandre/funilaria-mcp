import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

// Planos & assinaturas. Catálogo e gestão de assinatura são master-only no
// backend; `get_my_plan` é leitura do próprio plano (owner). Backend:
// /dashboard/plans, /dashboard/owners/:ownerId/subscription, /dashboard/subscriptions.

export const GET_MY_PLAN_TOOL = {
  name: "get_my_plan",
  title: "Get my plan",
  description: "Returns the caller's own plan, subscription, limits and agent usage.",
  inputSchema: { type: "object" as const, properties: {}, additionalProperties: false },
} as const;

export const LIST_PLANS_TOOL = {
  name: "list_plans",
  title: "List plans",
  description: "Returns the plan catalog.",
  inputSchema: { type: "object" as const, properties: {}, additionalProperties: false },
} as const;

export const CREATE_PLAN_TOOL = {
  name: "create_plan",
  title: "Create a plan",
  description: "Creates a new plan (master only).",
  inputSchema: {
    type: "object" as const,
    properties: {
      slug: { type: "string", description: "Plan slug, kebab-case (^[a-z0-9-]+$)." },
      name: { type: "string" },
      description: { type: "string" },
      priceCents: { type: "integer", minimum: 0 },
      currency: { type: "string", description: "3-letter currency code." },
      isActive: { type: "boolean" },
      isDefault: { type: "boolean" },
      sortOrder: { type: "integer", minimum: 0 },
    },
    required: ["slug", "name"],
    additionalProperties: false,
  },
} as const;

export const UPDATE_PLAN_TOOL = {
  name: "update_plan",
  title: "Update a plan",
  description: "Updates a plan (master only). Pass at least one field.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The plan's ID." },
      name: { type: "string" },
      description: { type: "string" },
      priceCents: { type: "integer", minimum: 0 },
      currency: { type: "string" },
      isActive: { type: "boolean" },
      isDefault: { type: "boolean" },
      sortOrder: { type: "integer", minimum: 0 },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const DEACTIVATE_PLAN_TOOL = {
  name: "deactivate_plan",
  title: "Deactivate a plan",
  description: "Soft-deactivates a plan (master only).",
  inputSchema: {
    type: "object" as const,
    properties: { id: { type: "string", description: "The plan's ID." } },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const GET_PLAN_LIMITS_TOOL = {
  name: "get_plan_limits",
  title: "Get plan limits",
  description: "Returns the resolved limits of a plan.",
  inputSchema: {
    type: "object" as const,
    properties: { id: { type: "string", description: "The plan's ID." } },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const UPDATE_PLAN_LIMITS_TOOL = {
  name: "update_plan_limits",
  title: "Update plan limits",
  description: "Updates a plan's limits (master only). Pass at least one field.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The plan's ID." },
      maxSizeBytes: { type: "integer", description: "GenDoc max file size in bytes." },
      defaultQuotaMBPerMonth: { type: "integer", description: "GenDoc default monthly quota (MB)." },
      maxPerRound: { type: "integer", description: "GenDoc max docs per round." },
      rateLimitPerWindow: { type: "integer", description: "GenDoc rate limit per window." },
      rateLimitWindowSeconds: { type: "integer", description: "GenDoc rate limit window (seconds)." },
      chatMax: { type: "integer", description: "Max chat messages." },
      maxAgents: { type: "integer", description: "Max agents (0 = unlimited)." },
      whatsappEnabled: { type: "boolean" },
      handoffEnabled: { type: "boolean" },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const GET_OWNER_SUBSCRIPTION_TOOL = {
  name: "get_owner_subscription",
  title: "Get owner subscription",
  description: "Returns the plan and subscription for an owner (master only).",
  inputSchema: {
    type: "object" as const,
    properties: { ownerId: { type: "string", description: "The owner's ID." } },
    required: ["ownerId"],
    additionalProperties: false,
  },
} as const;

export const ASSIGN_SUBSCRIPTION_TOOL = {
  name: "assign_subscription",
  title: "Assign subscription",
  description: "Assigns a plan to an owner (master only).",
  inputSchema: {
    type: "object" as const,
    properties: {
      ownerId: { type: "string", description: "The owner's ID." },
      planId: { type: "string", description: "The plan's ID." },
      status: { type: "string", enum: ["ACTIVE", "TRIALING", "PAST_DUE"] },
      expiresAt: { type: "string", description: "ISO datetime, or null for no expiry." },
      externalRef: { type: "string", description: "External billing reference." },
    },
    required: ["ownerId", "planId"],
    additionalProperties: false,
  },
} as const;

export const CANCEL_SUBSCRIPTION_TOOL = {
  name: "cancel_subscription",
  title: "Cancel subscription",
  description: "Cancels an owner's subscription (master only).",
  inputSchema: {
    type: "object" as const,
    properties: { ownerId: { type: "string", description: "The owner's ID." } },
    required: ["ownerId"],
    additionalProperties: false,
  },
} as const;

export const LIST_SUBSCRIPTIONS_TOOL = {
  name: "list_subscriptions",
  title: "List subscriptions",
  description: "Operational view of subscriptions with metrics (master only).",
  inputSchema: {
    type: "object" as const,
    properties: {
      plan: { type: "string" },
      status: { type: "string", enum: ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED", "EXPIRED"] },
      q: { type: "string", description: "Free-text search." },
      sort: { type: "string", enum: ["expiresAt", "startedAt"] },
      page: { type: "integer", minimum: 1 },
      pageSize: { type: "integer", minimum: 1, maximum: 500 },
      dueInDays: { type: "integer", minimum: 1 },
      periodDays: { type: "integer", minimum: 1 },
      dueSoonDays: { type: "integer", minimum: 1 },
    },
    additionalProperties: false,
  },
} as const;

export const SUBSCRIPTIONS_TREND_TOOL = {
  name: "subscriptions_trend",
  title: "Subscriptions trend",
  description: "Returns subscription trend points over time (master only).",
  inputSchema: {
    type: "object" as const,
    properties: { months: { type: "integer", minimum: 1, maximum: 36 } },
    additionalProperties: false,
  },
} as const;

export const RENEW_SUBSCRIPTION_TOOL = {
  name: "renew_subscription",
  title: "Renew subscription",
  description:
    "Renews an owner's subscription (master only). Provide extendDays OR expiresAt, not both.",
  inputSchema: {
    type: "object" as const,
    properties: {
      ownerId: { type: "string", description: "The owner's ID." },
      extendDays: { type: "integer", minimum: 1 },
      expiresAt: { type: "string", description: "ISO datetime." },
    },
    required: ["ownerId"],
    additionalProperties: false,
  },
} as const;

export const SUBSCRIPTION_HISTORY_TOOL = {
  name: "subscription_history",
  title: "Subscription history",
  description: "Returns the subscription event timeline for an owner (master only).",
  inputSchema: {
    type: "object" as const,
    properties: { ownerId: { type: "string", description: "The owner's ID." } },
    required: ["ownerId"],
    additionalProperties: false,
  },
} as const;

function buildQuery(a: Record<string, unknown>, keys: string[]): string {
  const params = new URLSearchParams();
  for (const k of keys) {
    const v = a[k];
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function requireString(a: Record<string, unknown>, key: string): string {
  const v = a[key];
  if (!v || typeof v !== "string") throw new Error(`Parameter '${key}' is required.`);
  return v;
}

export async function runGetMyPlan(creds: Credentials): Promise<unknown> {
  return auroraRequest(creds, "/dashboard/me/plan");
}

export async function runListPlans(creds: Credentials): Promise<unknown> {
  return auroraRequest(creds, "/dashboard/plans");
}

export async function runCreatePlan(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  requireString(a, "slug");
  requireString(a, "name");
  return auroraRequest(creds, "/dashboard/plans", { method: "POST", body: a });
}

export async function runUpdatePlan(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const id = requireString(a, "id");
  const { id: _omit, ...body } = a;
  return auroraRequest(creds, apiPath`/dashboard/plans/${id}`, { method: "PUT", body });
}

export async function runDeactivatePlan(creds: Credentials, args: unknown): Promise<{ deactivated: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  const id = requireString(a, "id");
  await auroraRequest(creds, apiPath`/dashboard/plans/${id}`, { method: "DELETE" });
  return { deactivated: true };
}

export async function runGetPlanLimits(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const id = requireString(a, "id");
  return auroraRequest(creds, apiPath`/dashboard/plans/${id}/limits`);
}

export async function runUpdatePlanLimits(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const id = requireString(a, "id");
  const { id: _omit, ...body } = a;
  return auroraRequest(creds, apiPath`/dashboard/plans/${id}/limits`, { method: "PATCH", body });
}

export async function runGetOwnerSubscription(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const ownerId = requireString(a, "ownerId");
  return auroraRequest(creds, apiPath`/dashboard/owners/${ownerId}/subscription`);
}

export async function runAssignSubscription(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const ownerId = requireString(a, "ownerId");
  requireString(a, "planId");
  const { ownerId: _omit, ...body } = a;
  return auroraRequest(creds, apiPath`/dashboard/owners/${ownerId}/subscription`, { method: "POST", body });
}

export async function runCancelSubscription(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const ownerId = requireString(a, "ownerId");
  return auroraRequest(creds, apiPath`/dashboard/owners/${ownerId}/subscription`, { method: "DELETE" });
}

export async function runListSubscriptions(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const qs = buildQuery(a, [
    "plan", "status", "q", "sort", "page", "pageSize", "dueInDays", "periodDays", "dueSoonDays",
  ]);
  return auroraRequest(creds, `/dashboard/subscriptions${qs}`);
}

export async function runSubscriptionsTrend(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const qs = buildQuery(a, ["months"]);
  return auroraRequest(creds, `/dashboard/subscriptions/trend${qs}`);
}

export async function runRenewSubscription(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const ownerId = requireString(a, "ownerId");
  const { ownerId: _omit, ...body } = a;
  return auroraRequest(creds, apiPath`/dashboard/owners/${ownerId}/subscription/renew`, { method: "POST", body });
}

export async function runSubscriptionHistory(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const ownerId = requireString(a, "ownerId");
  return auroraRequest(creds, apiPath`/dashboard/owners/${ownerId}/subscription/history`);
}
