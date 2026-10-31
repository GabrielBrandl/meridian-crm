export type ContactForCampaign = {
  id: string;
  phone: string;
  opt_in: number;
  blocked: number;
  tags: string[];
  stage_id?: string | null;
};

export type CampaignFilter = {
  tagIds?: string[];
  stageId?: string | null;
  onlyOptIn?: boolean;
};

export type SettingsForDispatch = {
  messages_per_minute: number;
  daily_limit: number;
  min_interval_seconds: number;
  jitter_seconds: number;
  business_hours_start: string;
  business_hours_end: string;
  timezone: string;
  pause_error_rate: number;
  require_opt_in: number;
};

export function resolveAudience(
  contacts: ContactForCampaign[],
  filter: CampaignFilter,
): ContactForCampaign[] {
  const tagIds = filter.tagIds?.filter(Boolean) ?? [];
  return contacts.filter((contact) => {
    if (contact.blocked) return false;
    if (filter.onlyOptIn !== false && !contact.opt_in) return false;
    if (tagIds.length > 0 && !tagIds.some((tag) => contact.tags.includes(tag))) return false;
    if (filter.stageId && contact.stage_id !== filter.stageId) return false;
    return true;
  });
}

export function uniqueByPhone<T extends { phone: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.phone)) return false;
    seen.add(item.phone);
    return true;
  });
}

export function parseHour(value: string): number {
  const [h, m] = value.split(":").map((part) => Number(part));
  return (h || 0) * 60 + (m || 0);
}

export function isWithinBusinessHours(
  settings: Pick<SettingsForDispatch, "business_hours_start" | "business_hours_end" | "timezone">,
  at = new Date(),
): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: settings.timezone || "America/Manaus",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
  const current = hour * 60 + minute;
  const start = parseHour(settings.business_hours_start);
  const end = parseHour(settings.business_hours_end);
  if (start === end) return true;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

export function nextDelayMs(
  settings: Pick<SettingsForDispatch, "messages_per_minute" | "min_interval_seconds" | "jitter_seconds">,
  random = Math.random,
): number {
  const fromRate = Math.ceil(60000 / Math.max(1, settings.messages_per_minute));
  const min = Math.max(settings.min_interval_seconds * 1000, fromRate);
  const jitter = Math.floor(random() * Math.max(0, settings.jitter_seconds) * 1000);
  return min + jitter;
}

export function shouldPauseForErrors(failed: number, processed: number, threshold: number): boolean {
  if (processed < 8) return false;
  return (failed / processed) * 100 >= threshold;
}

export function remainingDailyQuota(sentToday: number, dailyLimit: number): number {
  return Math.max(0, dailyLimit - sentToday);
}

export function campaignMetrics(recipients: Array<{ status: string }>) {
  const count = (status: string) => recipients.filter((r) => r.status === status).length;
  const total = recipients.length;
  const sent = count("sent") + count("delivered") + count("read") + count("replied");
  const delivered = count("delivered") + count("read") + count("replied");
  const read = count("read") + count("replied");
  const replied = count("replied");
  const failed = count("failed") + count("skipped");
  return {
    total,
    pending: count("pending"),
    sent,
    delivered,
    read,
    replied,
    failed,
    deliveryRate: total ? Math.round((delivered / total) * 100) : 0,
    replyRate: sent ? Math.round((replied / sent) * 100) : 0,
  };
}
