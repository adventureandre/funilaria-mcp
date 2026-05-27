import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const CREATE_SKILL_TOOL = {
  name: "create_skill",
  title: "Create a skill for an AI",
  description:
    "Creates a new skill (playbook/instruction set) for a given AI. " +
    "A skill defines specialized behavior the AI can follow.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      name: { type: "string", description: "Unique skill name/slug." },
      displayName: { type: "string", description: "Human-friendly name." },
      description: { type: "string", description: "What the skill does." },
      instructions: { type: "string", description: "The skill's instruction content/body." },
      triggerType: { type: "string", description: "How the skill is triggered (e.g. 'manual', 'auto')." },
      triggerCondition: { type: "string", description: "Condition expression for auto trigger." },
    },
    required: ["aiId", "name", "displayName", "description", "instructions"],
    additionalProperties: false,
  },
} as const;

export const UPDATE_SKILL_TOOL = {
  name: "update_skill",
  title: "Update a skill",
  description:
    "Updates an existing skill's configuration. Pass only the fields you want to change.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      id: { type: "string", description: "The skill's ID." },
      displayName: { type: "string" },
      description: { type: "string" },
      instructions: { type: "string" },
      triggerType: { type: "string" },
      triggerCondition: { type: "string" },
    },
    required: ["aiId", "id"],
    additionalProperties: false,
  },
} as const;

export const GET_SKILL_TOOL = {
  name: "get_skill",
  title: "Get skill details",
  description: "Returns the full details of a specific skill.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      id: { type: "string", description: "The skill's ID." },
    },
    required: ["aiId", "id"],
    additionalProperties: false,
  },
} as const;

export const DELETE_SKILL_TOOL = {
  name: "delete_skill",
  title: "Delete a skill",
  description: "Permanently deletes a skill from an AI.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      id: { type: "string", description: "The skill's ID." },
    },
    required: ["aiId", "id"],
    additionalProperties: false,
  },
} as const;

export const IMPORT_SKILL_TOOL = {
  name: "import_skill",
  title: "Import a skill",
  description: "Imports a skill from an exported payload into an AI.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      data: { type: "object", description: "The exported skill data to import.", additionalProperties: true },
    },
    required: ["aiId", "data"],
    additionalProperties: false,
  },
} as const;

export const EXPORT_SKILL_TOOL = {
  name: "export_skill",
  title: "Export a skill",
  description: "Exports a skill as a portable payload that can be imported elsewhere.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      id: { type: "string", description: "The skill's ID." },
    },
    required: ["aiId", "id"],
    additionalProperties: false,
  },
} as const;

export const APPROVE_SKILL_TOOL = {
  name: "approve_skill",
  title: "Approve a pending skill",
  description: "Approves a skill that is pending review.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      id: { type: "string", description: "The skill's ID." },
    },
    required: ["aiId", "id"],
    additionalProperties: false,
  },
} as const;

export const REJECT_SKILL_TOOL = {
  name: "reject_skill",
  title: "Reject a pending skill",
  description: "Rejects a skill that is pending review.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      id: { type: "string", description: "The skill's ID." },
      reason: { type: "string", description: "Reason for rejection." },
    },
    required: ["aiId", "id"],
    additionalProperties: false,
  },
} as const;

export const MOVE_SKILL_TOOL = {
  name: "move_skill",
  title: "Move/reorder a skill",
  description: "Changes the position/order of a skill within an AI.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      id: { type: "string", description: "The skill's ID." },
      position: { type: "integer", description: "New position index." },
    },
    required: ["aiId", "id", "position"],
    additionalProperties: false,
  },
} as const;

export async function runCreateSkill(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.name || typeof a.name !== "string") throw new Error("Parameter 'name' is required.");
  const { aiId, content, ...rest } = a;
  const body: Record<string, unknown> = { ...rest };
  if (content && !body.instructions) body.instructions = content;
  return auroraRequest(creds, apiPath`/dashboard/ia/${aiId}/skills`, {
    method: "POST",
    body,
  });
}

export async function runUpdateSkill(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  const { aiId, id, content, ...rest } = a;
  const body: Record<string, unknown> = { ...rest };
  if (content && !body.instructions) body.instructions = content;
  return auroraRequest(creds, apiPath`/dashboard/ia/${aiId}/skills/${id}`, {
    method: "PUT",
    body,
  });
}

export async function runGetSkill(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/skills/${a.id}`);
}

export async function runDeleteSkill(
  creds: Credentials,
  args: unknown,
): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  await auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/skills/${a.id}`, { method: "DELETE" });
  return { deleted: true };
}

export async function runImportSkill(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.data || typeof a.data !== "object") throw new Error("Parameter 'data' is required.");
  return auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/skills/import`, {
    method: "POST",
    body: a.data,
  });
}

export async function runExportSkill(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/skills/${a.id}/export`);
}

export async function runApproveSkill(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/skills/${a.id}/approve`, { method: "POST" });
}

export async function runRejectSkill(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  const body: Record<string, unknown> = {};
  if (a.reason && typeof a.reason === "string") body.reason = a.reason;
  return auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/skills/${a.id}/reject`, {
    method: "POST",
    body: Object.keys(body).length > 0 ? body : undefined,
  });
}

export async function runMoveSkill(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  if (a.position === undefined || typeof a.position !== "number") throw new Error("Parameter 'position' is required.");
  return auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/skills/${a.id}/move`, {
    method: "POST",
    body: { position: a.position },
  });
}
