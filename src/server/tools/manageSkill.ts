import { auroraRequest, auroraUpload, apiPath } from "../../auth/client.js";
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
      name: {
        type: "string",
        description: "Unique skill slug, kebab-case (^[a-z][a-z0-9-]{1,63}$).",
      },
      description: { type: "string", description: "What the skill does." },
      instructions: { type: "string", description: "The skill's instruction content/body." },
      parametersSchema: {
        type: "object",
        description: "Optional JSON Schema for the skill's parameters.",
        additionalProperties: true,
      },
      status: {
        type: "string",
        enum: ["PENDING", "ACTIVE", "REJECTED"],
        description: "Initial status (default ACTIVE).",
      },
    },
    required: ["aiId", "name", "description", "instructions"],
    additionalProperties: false,
  },
} as const;

export const UPDATE_SKILL_TOOL = {
  name: "update_skill",
  title: "Update a skill",
  description:
    "Updates an existing skill. Pass only the fields you want to change. " +
    "Note: `name` and `status` are not editable here (use approve/reject for status).",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      id: { type: "string", description: "The skill's ID." },
      description: { type: "string" },
      instructions: { type: "string" },
      parametersSchema: {
        type: "object",
        description: "JSON Schema for the skill's parameters.",
        additionalProperties: true,
      },
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
  description:
    "Imports a skill into an AI from an exported ZIP (as produced by export_skill). " +
    "Pass the ZIP bytes as base64.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      zipBase64: { type: "string", description: "The skill ZIP file content, base64-encoded." },
      filename: { type: "string", description: "Filename for the upload (default 'skill.zip')." },
    },
    required: ["aiId", "zipBase64"],
    additionalProperties: false,
  },
} as const;

export const EXPORT_SKILL_TOOL = {
  name: "export_skill",
  title: "Export a skill",
  description:
    "Exports a skill as a portable ZIP. Returns `{ contentType, base64 }` — the ZIP bytes are base64-encoded.",
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
  title: "Move a skill to another AI",
  description: "Moves a skill from its current AI to a different AI (same owner).",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The skill's current AI ID." },
      id: { type: "string", description: "The skill's ID." },
      targetAiId: { type: "string", description: "The destination AI ID (must belong to the same owner)." },
    },
    required: ["aiId", "id", "targetAiId"],
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
  if (!a.zipBase64 || typeof a.zipBase64 !== "string")
    throw new Error("Parameter 'zipBase64' is required.");

  const filename =
    a.filename && typeof a.filename === "string" ? a.filename : "skill.zip";
  const bytes = Buffer.from(a.zipBase64, "base64");
  const blob = new Blob([bytes], { type: "application/zip" });
  const formData = new FormData();
  formData.append("file", blob, filename);

  return auroraUpload(creds, apiPath`/dashboard/ia/${a.aiId}/skills/import`, formData);
}

export async function runExportSkill(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  // Resposta é um ZIP binário — não passar por JSON.parse.
  return auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/skills/${a.id}/export`, {
    responseType: "binary",
  });
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
  if (!a.targetAiId || typeof a.targetAiId !== "string") throw new Error("Parameter 'targetAiId' is required.");
  return auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/skills/${a.id}/move`, {
    method: "POST",
    body: { targetAiId: a.targetAiId },
  });
}
