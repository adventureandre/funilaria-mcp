export type ScheduleDeliveryType = "email" | "whatsapp" | "internal";
export type ScheduleStatus = "success" | "error";

export interface SchedulePreset {
  kind: "daily" | "weekly" | "monthly" | "hourly";
  hour?: number;
  minute?: number;
  weekday?: number;
  day?: number;
  everyHours?: number;
}

export interface ScheduleInput {
  aiId: string;
  title: string;
  instruction: string;
  deliveryType: ScheduleDeliveryType;
  target?: string | null;
  preset: SchedulePreset;
  enabled?: boolean;
}

export interface ScheduledTask {
  id: string;
  ownerId: string;
  aiId: string;
  title: string;
  instruction: string;
  deliveryType: ScheduleDeliveryType;
  target: string | null;
  schedule: string;
  scheduleConfig: SchedulePreset;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string;
  lastStatus: ScheduleStatus | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchedulesListResponse {
  data: ScheduledTask[];
  total: number;
  page: number;
  limit: number;
}

export interface SchedulesGetResponse extends ScheduledTask {}

export interface SchedulesUpdateInput {
  id: string;
  title?: string;
  instruction?: string;
  deliveryType?: ScheduleDeliveryType;
  target?: string | null;
  preset?: SchedulePreset;
  enabled?: boolean;
}

export type ScheduleAction = "list" | "get" | "create" | "update" | "delete";
