import { all, one, run } from "./db";
import { uid, nowIso } from "./ids";
import { hashPassword } from "./password";
import { planOf, type PlanId } from "./plans";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  owner_name: string;
  owner_email: string;
  phone: string | null;
  daily_limit: number;
  user_limit: number;
  notes: string;
  created_at: string;
  approved_at: string | null;
};

const STAGES = [
  ["Novo lead", "#817EFF", 0, 0, 0],
  ["Qualificado", "#0033FF", 1, 0, 0],
  ["Proposta", "#38bdf8", 2, 0, 0],
  ["Negociação", "#f59e0b", 3, 0, 0],
  ["Ganho", "#22c55e", 4, 1, 0],
  ["Perdido", "#64748b", 5, 0, 1],
] as const;

const TAGS = [
  ["Lead quente", "#0033FF"],
  ["Lead frio", "#817EFF"],
  ["Cliente", "#22c55e"],
  ["VIP", "#f59e0b"],
];

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "cliente";
}

export function uniqueSlug(base: string) {
  let slug = slugify(base);
  let i = 1;
  while (one("SELECT id FROM tenants WHERE slug = ?", [slug])) {
    slug = `${slugify(base)}-${i}`;
    i += 1;
  }
  return slug;
}

export function bootstrapWorkspace(tenantId: string, companyName: string, dailyLimit: number) {
  run(
    `INSERT OR IGNORE INTO settings (
      tenant_id, company_name, n8n_webhook_url, n8n_secret, n8n_callback_secret, sandbox_mode,
      messages_per_minute, daily_limit, min_interval_seconds, jitter_seconds,
      business_hours_start, business_hours_end, timezone, opt_out_keywords,
      pause_error_rate, require_opt_in, test_phone
    ) VALUES (?, ?, '', ?, ?, 1, 12, ?, 4, 3, '08:00', '20:00', 'America/Manaus',
      'sair,parar,stop,cancelar,descadastrar', 25, 1, '')`,
    [tenantId, companyName, process.env.N8N_SHARED_SECRET || "meridian-n8n-secret", process.env.N8N_CALLBACK_SECRET || "meridian-n8n-secret", dailyLimit],
  );
  run(
    `INSERT INTO connections (id, tenant_id, name, provider, status, instance_name, notes)
     VALUES (?, ?, 'WhatsApp principal', 'evolution', 'idle', ?, ?)`,
    [uid(), tenantId, `meridian-${uniqueSlug(companyName)}`.slice(0, 40), "Leia o QR no celular com o WhatsApp Business da empresa."],
  );
  for (const [name, color] of TAGS) {
    run("INSERT INTO tags (id, tenant_id, name, color) VALUES (?, ?, ?, ?)", [uid(), tenantId, name, color]);
  }
  for (const [name, color, position, won, lost] of STAGES) {
    run(
      "INSERT INTO pipeline_stages (id, tenant_id, name, color, position, is_won, is_lost) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [uid(), tenantId, name, color, position, won, lost],
    );
  }
  run(
    "INSERT INTO templates (id, tenant_id, name, body, category, created_at) VALUES (?, ?, ?, ?, 'marketing', ?)",
    [uid(), tenantId, "Boas-vindas", "Olá {{primeiro_nome}}, aqui é da {{empresa}}. Obrigado pelo contato!", nowIso()],
  );
}

export function createTenant(input: {
  name: string;
  ownerName: string;
  ownerEmail: string;
  password: string;
  phone?: string;
  plan?: string;
  status?: "active" | "pending";
  notes?: string;
}) {
  const email = input.ownerEmail.toLowerCase().trim();
  if (one("SELECT id FROM users WHERE email = ?", [email])) {
    throw new Error("Este e-mail já está em uso.");
  }
  const plan = planOf(input.plan || "starter");
  const id = uid();
  const stamp = nowIso();
  const status = input.status || "active";
  run(
    `INSERT INTO tenants (id, name, slug, plan, status, owner_name, owner_email, phone, daily_limit, user_limit, notes, created_at, approved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name.trim(),
      uniqueSlug(input.name),
      (input.plan as PlanId) || "starter",
      status,
      input.ownerName.trim(),
      email,
      input.phone || null,
      plan.dailyLimit,
      plan.userLimit,
      input.notes || "",
      stamp,
      status === "active" ? stamp : null,
    ],
  );
  run(
    "INSERT INTO users (id, tenant_id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, 'admin', ?)",
    [uid(), id, input.ownerName.trim(), email, hashPassword(input.password), stamp],
  );
  bootstrapWorkspace(id, input.name.trim(), plan.dailyLimit);
  return getTenant(id);
}

export function getTenant(id: string) {
  return one<Tenant>("SELECT * FROM tenants WHERE id = ?", [id]);
}

export function listTenants() {
  return all<Tenant & { users: number; contacts: number; sent_today: number }>(
    `SELECT t.*,
      (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) AS users,
      (SELECT COUNT(*) FROM contacts WHERE tenant_id = t.id) AS contacts,
      (SELECT COUNT(*) FROM campaign_recipients r WHERE r.tenant_id = t.id AND r.sent_at >= date('now') AND r.status NOT IN ('failed','skipped')) AS sent_today
     FROM tenants t
     ORDER BY t.created_at DESC`,
  );
}

export function setTenantStatus(id: string, status: string) {
  run("UPDATE tenants SET status=?, approved_at=CASE WHEN ?='active' THEN COALESCE(approved_at, ?) ELSE approved_at END WHERE id=?", [
    status,
    status,
    nowIso(),
    id,
  ]);
  return getTenant(id);
}

export function platformStats() {
  return {
    tenants: one<{ total: number }>("SELECT COUNT(*) AS total FROM tenants")?.total ?? 0,
    pending: one<{ total: number }>("SELECT COUNT(*) AS total FROM tenants WHERE status='pending'")?.total ?? 0,
    active: one<{ total: number }>("SELECT COUNT(*) AS total FROM tenants WHERE status='active'")?.total ?? 0,
    contacts: one<{ total: number }>("SELECT COUNT(*) AS total FROM contacts")?.total ?? 0,
    sentToday:
      one<{ total: number }>(
        "SELECT COUNT(*) AS total FROM campaign_recipients WHERE sent_at >= date('now') AND status NOT IN ('failed','skipped')",
      )?.total ?? 0,
  };
}
