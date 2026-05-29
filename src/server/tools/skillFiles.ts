import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const LIST_SKILL_FILES_TOOL = {
  name: "list_skill_files",
  title: "List skill files",
  description: "Returns the files attached to a skill.",
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

export const GET_SKILL_FILE_TOOL = {
  name: "get_skill_file",
  title: "Get a skill file",
  description: "Returns the content/metadata of a specific skill file.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      id: { type: "string", description: "The skill's ID." },
      fileId: { type: "string", description: "The file's ID." },
    },
    required: ["aiId", "id", "fileId"],
    additionalProperties: false,
  },
} as const;

export const CREATE_SKILL_FILE_TOOL = {
  name: "create_skill_file",
  title: "Create a skill file",
  description:
    "Attaches a Markdown reference file to a skill (the 'new pattern': SKILL.md " +
    "instructions + reference/example .md files read on demand via skill_read_file). " +
    "Only .md files up to 1MB are accepted.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      id: { type: "string", description: "The skill's ID." },
      filename: { type: "string", description: "File name — must end with .md (e.g. 'api-reference.md')." },
      fileType: {
        type: "string",
        enum: ["reference", "example"],
        description: "File category: 'reference' or 'example'. Defaults to 'reference'.",
      },
      content: { type: "string", description: "Markdown file content." },
    },
    required: ["aiId", "id", "filename", "content"],
    additionalProperties: false,
  },
} as const;

export const UPDATE_SKILL_FILE_TOOL = {
  name: "update_skill_file",
  title: "Update a skill file",
  description: "Updates the content of an existing skill file (the filename is fixed).",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      id: { type: "string", description: "The skill's ID." },
      fileId: { type: "string", description: "The file's ID." },
      content: { type: "string", description: "New Markdown file content." },
    },
    required: ["aiId", "id", "fileId", "content"],
    additionalProperties: false,
  },
} as const;

export const DELETE_SKILL_FILE_TOOL = {
  name: "delete_skill_file",
  title: "Delete a skill file",
  description: "Removes a file from a skill.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      id: { type: "string", description: "The skill's ID." },
      fileId: { type: "string", description: "The file's ID." },
    },
    required: ["aiId", "id", "fileId"],
    additionalProperties: false,
  },
} as const;

function requireStr(a: Record<string, unknown>, key: string): string {
  if (!a[key] || typeof a[key] !== "string") throw new Error(`Parameter '${key}' is required.`);
  return a[key] as string;
}

export async function runListSkillFiles(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const aiId = requireStr(a, "aiId");
  const id = requireStr(a, "id");
  return auroraRequest(creds, apiPath`/dashboard/ia/${aiId}/skills/${id}/files`);
}

export async function runGetSkillFile(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const aiId = requireStr(a, "aiId");
  const id = requireStr(a, "id");
  const fileId = requireStr(a, "fileId");
  return auroraRequest(creds, apiPath`/dashboard/ia/${aiId}/skills/${id}/files/${fileId}`);
}

export async function runCreateSkillFile(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const aiId = requireStr(a, "aiId");
  const id = requireStr(a, "id");
  const { aiId: _, id: __, ...body } = a;
  // backend createFile nao tem default de fileType (so o uploadFile tem) — sem isso o storageKey vira .../undefined/.
  if (!body.fileType) body.fileType = "reference";
  return auroraRequest(creds, apiPath`/dashboard/ia/${aiId}/skills/${id}/files`, {
    method: "POST",
    body,
  });
}

export async function runUpdateSkillFile(creds: Credentials, args: unknown): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const aiId = requireStr(a, "aiId");
  const id = requireStr(a, "id");
  const fileId = requireStr(a, "fileId");
  const { aiId: _, id: __, fileId: ___, ...body } = a;
  return auroraRequest(creds, apiPath`/dashboard/ia/${aiId}/skills/${id}/files/${fileId}`, {
    method: "PUT",
    body,
  });
}

export async function runDeleteSkillFile(creds: Credentials, args: unknown): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  const aiId = requireStr(a, "aiId");
  const id = requireStr(a, "id");
  const fileId = requireStr(a, "fileId");
  await auroraRequest(creds, apiPath`/dashboard/ia/${aiId}/skills/${id}/files/${fileId}`, { method: "DELETE" });
  return { deleted: true };
}
