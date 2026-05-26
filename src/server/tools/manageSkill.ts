import { auroraRequest } from "../../auth/client.js";
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
      content: { type: "string", description: "The skill's instruction content/body." },
      triggerType: { type: "string", description: "How the skill is triggered (e.g. 'manual', 'auto')." },
      triggerCondition: { type: "string", description: "Condition expression for auto trigger." },
    },
    required: ["aiId", "name", "displayName", "content"],
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
      content: { type: "string" },
      triggerType: { type: "string" },
      triggerCondition: { type: "string" },
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

export async function runCreateSkill(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.name || typeof a.name !== "string") throw new Error("Parameter 'name' is required.");
  const { aiId, ...body } = a;
  return auroraRequest(creds, `/dashboard/ia/${aiId}/skills`, {
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
  const { aiId, id, ...body } = a;
  return auroraRequest(creds, `/dashboard/ia/${aiId}/skills/${id}`, {
    method: "PUT",
    body,
  });
}

export async function runDeleteSkill(
  creds: Credentials,
  args: unknown,
): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  await auroraRequest(creds, `/dashboard/ia/${a.aiId}/skills/${a.id}`, { method: "DELETE" });
  return { deleted: true };
}
