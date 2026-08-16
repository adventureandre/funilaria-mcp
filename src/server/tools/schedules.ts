import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";
import type {
  ScheduleInput,
  SchedulePreset,
  ScheduledTask,
  SchedulesListResponse,
  SchedulesGetResponse,
  SchedulesUpdateInput,
} from "./types/schedules.types.js";

// SchedulesController endpoints already handle validation, limits, and RBAC.
// This tool is a thin wrapper that dispatches to those endpoints via auroraRequest.

// Lists all scheduled tasks for the current owner with pagination.
// Returns: { data: ScheduledTask[], total: number, page: number, limit: number }
// Errors: none (returns empty list if no tasks found)
export const LIST_SCHEDULES_TOOL = {
  name: "list_schedules",
  title: "List scheduled tasks",
  description: "Returns a paginated list of scheduled tasks for the current owner.",
  inputSchema: {
    type: "object" as const,
    properties: {
      page: { type: "number", description: "Page number (default 1)." },
      limit: { type: "number", description: "Number of tasks per page (default 20, max 100)." },
      search: { type: "string", description: "Filter by title (case-insensitive)." },
    },
    additionalProperties: false,
  },
} as const;

// Fetches a single scheduled task with all details including original preset.
// Returns: ScheduledTask (full object)
// Errors: 404 if not found or owner mismatch
export const GET_SCHEDULE_TOOL = {
  name: "get_schedule",
  title: "Get a scheduled task",
  description: "Returns full details of a scheduled task by ID, including scheduleConfig (original preset).",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The task ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

// Creates a new scheduled task. Backend validates preset, delivery consistency, and limits.
// Returns: ScheduledTask (created task with id, nextRunAt, schedule, scheduleConfig)
// Errors: 400 invalid preset/email/interval, 404 IA not found, 403 limit exceeded
export const CREATE_SCHEDULE_TOOL = {
  name: "create_schedule",
  title: "Create a scheduled task",
  description:
    "Creates a new scheduled task. The IA instructs what to do; recurrence uses presets (daily/weekly/monthly/hourly).",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "ID of the IA that will execute the task." },
      title: { type: "string", description: "Short title for the task." },
      instruction: { type: "string", description: "What the IA should do when task runs." },
      deliveryType: {
        type: "string",
        enum: ["email", "whatsapp", "internal"],
        description: "Where result goes: email (external), whatsapp (external), or internal (chat history).",
      },
      target: {
        type: "string",
        description: "Recipient email or WhatsApp number. Null/omitted for internal delivery.",
      },
      preset: {
        type: "object",
        description: "Recurrence preset: { kind, hour, minute, [weekday], [day], [everyHours] }. See docs for examples.",
      },
    },
    required: ["aiId", "title", "instruction", "deliveryType", "preset"],
    additionalProperties: false,
  },
} as const;

// Updates one or more fields of a task. Validates ownership, preset, delivery, and limits.
// Returns: ScheduledTask (updated task)
// Errors: 400 invalid data, 404 task not found, 403 owner mismatch/limit exceeded
export const UPDATE_SCHEDULE_TOOL = {
  name: "update_schedule",
  title: "Update a scheduled task",
  description: "Updates task fields: title, instruction, preset, deliveryType, target, or enabled (pause/resume).",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The task ID." },
      title: { type: "string" },
      instruction: { type: "string" },
      preset: { type: "object" },
      deliveryType: { type: "string", enum: ["email", "whatsapp", "internal"] },
      target: { type: "string" },
      enabled: { type: "boolean", description: "Set to false to pause, true to resume." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

// Permanently deletes a scheduled task. Ownership verified before deletion.
// Returns: { deleted: true }
// Errors: 404 if task not found or owner mismatch
export const DELETE_SCHEDULE_TOOL = {
  name: "delete_schedule",
  title: "Delete a scheduled task",
  description: "Permanently removes a scheduled task. Future executions will not occur.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The task ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

async function runListSchedules(creds: Credentials, args: unknown): Promise<SchedulesListResponse> {
  const a = (args ?? {}) as Record<string, unknown>;
  const params = new URLSearchParams();
  if (typeof a.page === "number") params.set("page", String(a.page));
  if (typeof a.limit === "number") params.set("limit", String(a.limit));
  if (a.search && typeof a.search === "string") params.set("search", a.search);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return auroraRequest(creds, `/dashboard/schedules${qs}`);
}

async function runGetSchedule(creds: Credentials, args: unknown): Promise<SchedulesGetResponse> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, apiPath`/dashboard/schedules/${a.id}`);
}

async function runCreateSchedule(creds: Credentials, args: unknown): Promise<ScheduledTask> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.title || typeof a.title !== "string") throw new Error("Parameter 'title' is required.");
  if (!a.instruction || typeof a.instruction !== "string") throw new Error("Parameter 'instruction' is required.");
  if (!a.deliveryType || typeof a.deliveryType !== "string") throw new Error("Parameter 'deliveryType' is required.");
  if (!a.preset || typeof a.preset !== "object") throw new Error("Parameter 'preset' is required.");

  return auroraRequest(creds, "/dashboard/schedules", { method: "POST", body: a });
}

async function runUpdateSchedule(creds: Credentials, args: unknown): Promise<ScheduledTask> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  const { id, ...body } = a;
  return auroraRequest(creds, apiPath`/dashboard/schedules/${id}`, { method: "PUT", body });
}

async function runDeleteSchedule(creds: Credentials, args: unknown): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  await auroraRequest(creds, apiPath`/dashboard/schedules/${a.id}`, { method: "DELETE" });
  return { deleted: true };
}

export {
  runListSchedules,
  runGetSchedule,
  runCreateSchedule,
  runUpdateSchedule,
  runDeleteSchedule,
}
