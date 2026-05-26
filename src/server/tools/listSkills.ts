import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const LIST_SKILLS_TOOL = {
  name: "list_skills",
  title: "List skills for an AI",
  description:
    "Returns the skills (playbooks/instructions) configured for a given AI. " +
    "If no `aiId` is provided, lists skills across all AIs.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: {
        type: "string",
        description: "The AI's ID. Omit to list all skills.",
      },
    },
    additionalProperties: false,
  },
} as const;

export async function runListSkills(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (a.aiId && typeof a.aiId === "string") {
    return auroraRequest(creds, `/dashboard/ia/${a.aiId}/skills`);
  }
  return auroraRequest(creds, "/dashboard/skills");
}
