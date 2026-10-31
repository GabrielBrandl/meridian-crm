export const PLANS = {
  starter: { label: "Starter", dailyLimit: 250, userLimit: 3, whatsapp: 1 },
  pro: { label: "Pro", dailyLimit: 2000, userLimit: 8, whatsapp: 3 },
  enterprise: { label: "Enterprise", dailyLimit: 10000, userLimit: 30, whatsapp: 10 },
} as const;

export type PlanId = keyof typeof PLANS;

export function planOf(id: string) {
  return PLANS[(id as PlanId) in PLANS ? (id as PlanId) : "starter"];
}
