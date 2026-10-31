import { all, one, run, tx } from "./db";
import { uid, nowIso } from "./ids";
import { optionalTenantId, tenantId } from "./context";
import { interpolateMessage, normalizePhone, parseCsv } from "./phone";
import {
  campaignMetrics,
  resolveAudience,
  uniqueByPhone,
  type ContactForCampaign,
} from "./campaign-rules";
import type { Campaign, Contact, Recipient, Settings } from "./types";

function tid(explicit?: string | null) {
  return explicit || tenantId();
}

export function getSettings(explicit?: string | null): Settings {
  const row = one<Settings>("SELECT * FROM settings WHERE tenant_id = ?", [tid(explicit)]);
  if (!row) throw new Error("Configuração do workspace não encontrada.");
  return row;
}

export function updateSettings(patch: Partial<Settings>) {
  const id = tid();
  const current = getSettings(id);
  const next = { ...current, ...patch };
  run(
    `UPDATE settings SET
      company_name=?, n8n_webhook_url=?, n8n_secret=?, n8n_callback_secret=?,
      sandbox_mode=?, messages_per_minute=?, daily_limit=?, min_interval_seconds=?,
      jitter_seconds=?, business_hours_start=?, business_hours_end=?, timezone=?,
      opt_out_keywords=?, pause_error_rate=?, require_opt_in=?, test_phone=?
     WHERE tenant_id=?`,
    [
      next.company_name,
      next.n8n_webhook_url,
      next.n8n_secret,
      next.n8n_callback_secret,
      next.sandbox_mode ? 1 : 0,
      next.messages_per_minute,
      next.daily_limit,
      next.min_interval_seconds,
      next.jitter_seconds,
      next.business_hours_start,
      next.business_hours_end,
      next.timezone,
      next.opt_out_keywords,
      next.pause_error_rate,
      next.require_opt_in ? 1 : 0,
      next.test_phone,
      id,
    ],
  );
  return getSettings(id);
}

export function listContacts(query = "") {
  const like = `%${query}%`;
  const id = tid();
  return all<Contact>(
    `SELECT c.*,
      (SELECT GROUP_CONCAT(t.name, ',') FROM contact_tags ct JOIN tags t ON t.id = ct.tag_id WHERE ct.contact_id = c.id) AS tags,
      pc.stage_id, ps.name AS stage_name
     FROM contacts c
     LEFT JOIN pipeline_cards pc ON pc.contact_id = c.id
     LEFT JOIN pipeline_stages ps ON ps.id = pc.stage_id
     WHERE c.tenant_id=? AND (? = '' OR c.name LIKE ? OR c.phone LIKE ? OR c.company LIKE ? OR c.city LIKE ?)
     ORDER BY c.created_at DESC`,
    [id, query, like, like, like, like],
  );
}

export function getContact(id: string) {
  return one<Contact>(
    `SELECT c.*,
      (SELECT GROUP_CONCAT(t.name, ',') FROM contact_tags ct JOIN tags t ON t.id = ct.tag_id WHERE ct.contact_id = c.id) AS tags,
      pc.stage_id, ps.name AS stage_name
     FROM contacts c
     LEFT JOIN pipeline_cards pc ON pc.contact_id = c.id
     LEFT JOIN pipeline_stages ps ON ps.id = pc.stage_id
     WHERE c.id=? AND c.tenant_id=?`,
    [id, tid()],
  );
}

export function upsertContact(input: {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  city?: string;
  notes?: string;
  opt_in?: boolean;
  source?: string;
  tagNames?: string[];
}) {
  const workspace = tid();
  const phone = normalizePhone(input.phone);
  if (!phone) throw new Error("Telefone inválido. Use DDD + número brasileiro.");
  const existing = input.id
    ? one<Contact>("SELECT * FROM contacts WHERE id=? AND tenant_id=?", [input.id, workspace])
    : one<Contact>("SELECT * FROM contacts WHERE phone=? AND tenant_id=?", [phone, workspace]);
  const id = existing?.id || input.id || uid();
  const stamp = nowIso();
  if (existing) {
    run(
      `UPDATE contacts SET name=?, phone=?, email=?, company=?, city=?, notes=?,
        opt_in=COALESCE(?, opt_in), source=COALESCE(?, source), updated_at=?
       WHERE id=? AND tenant_id=?`,
      [
        input.name, phone, input.email || null, input.company || null, input.city || null, input.notes || null,
        input.opt_in === undefined ? null : input.opt_in ? 1 : 0, input.source || null, stamp, id, workspace,
      ],
    );
  } else {
    run(
      `INSERT INTO contacts (id, tenant_id, name, phone, email, company, city, notes, opt_in, blocked, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [id, workspace, input.name, phone, input.email || null, input.company || null, input.city || null, input.notes || null, input.opt_in === false ? 0 : 1, input.source || "manual", stamp, stamp],
    );
    const firstStage = one<{ id: string }>("SELECT id FROM pipeline_stages WHERE tenant_id=? ORDER BY position LIMIT 1", [workspace]);
    if (firstStage) {
      run("INSERT OR IGNORE INTO pipeline_cards (id, tenant_id, contact_id, stage_id, value_cents, title) VALUES (?, ?, ?, ?, 0, ?)", [
        uid(), workspace, id, firstStage.id, input.name,
      ]);
    }
  }
  if (input.tagNames) {
    run("DELETE FROM contact_tags WHERE contact_id=?", [id]);
    for (const name of input.tagNames.map((t) => t.trim()).filter(Boolean)) {
      const tag = ensureTag(name);
      run("INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?)", [id, tag.id]);
    }
  }
  return getContact(id);
}

export function ensureTag(name: string, color = "#817EFF") {
  const workspace = tid();
  const existing = one<{ id: string; name: string; color: string }>(
    "SELECT * FROM tags WHERE tenant_id=? AND lower(name)=lower(?)",
    [workspace, name],
  );
  if (existing) return existing;
  const tag = { id: uid(), name, color };
  run("INSERT INTO tags (id, tenant_id, name, color) VALUES (?, ?, ?, ?)", [tag.id, workspace, tag.name, tag.color]);
  return tag;
}

export function listTags() {
  return all<{ id: string; name: string; color: string; total: number }>(
    `SELECT t.*, COUNT(ct.contact_id) AS total
     FROM tags t LEFT JOIN contact_tags ct ON ct.tag_id = t.id
     WHERE t.tenant_id=? GROUP BY t.id ORDER BY t.name`,
    [tid()],
  );
}

export function importContactsCsv(csv: string, defaultOptIn = true) {
  const rows = parseCsv(csv);
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];
  for (const row of rows) {
    try {
      const phone = normalizePhone(row.phone || "");
      if (!phone || !row.name) {
        skipped += 1;
        continue;
      }
      const existed = one("SELECT id FROM contacts WHERE phone=? AND tenant_id=?", [phone, tid()]);
      const opt = String(row.opt_in || "").toLowerCase();
      upsertContact({
        name: row.name, phone, email: row.email, company: row.company, city: row.city, source: "import",
        opt_in: opt ? ["1", "sim", "true", "yes"].includes(opt) : defaultOptIn,
        tagNames: (row.tags || "").split(/[;|]/).map((t) => t.trim()).filter(Boolean),
      });
      if (existed) updated += 1;
      else created += 1;
    } catch (error) {
      skipped += 1;
      errors.push(error instanceof Error ? error.message : "linha inválida");
    }
  }
  audit("contacts.import", `${created} criados, ${updated} atualizados, ${skipped} ignorados`);
  return { created, updated, skipped, errors: errors.slice(0, 8) };
}

export function listStages() {
  return all<{ id: string; name: string; color: string; position: number; is_won: number; is_lost: number }>(
    "SELECT * FROM pipeline_stages WHERE tenant_id=? ORDER BY position",
    [tid()],
  );
}

export function pipelineBoard() {
  const stages = listStages();
  const cards = all<{
    id: string; contact_id: string; stage_id: string; value_cents: number; title: string | null; name: string; phone: string; tags: string | null;
  }>(
    `SELECT pc.*, c.name, c.phone,
      (SELECT GROUP_CONCAT(t.name, ',') FROM contact_tags ct JOIN tags t ON t.id = ct.tag_id WHERE ct.contact_id = c.id) AS tags
     FROM pipeline_cards pc JOIN contacts c ON c.id = pc.contact_id
     WHERE pc.tenant_id=?`,
    [tid()],
  );
  return stages.map((stage) => ({ ...stage, cards: cards.filter((card) => card.stage_id === stage.id) }));
}

export function moveCard(contactId: string, stageId: string) {
  run("UPDATE pipeline_cards SET stage_id=? WHERE contact_id=? AND tenant_id=?", [stageId, contactId, tid()]);
  return pipelineBoard();
}

export function listTemplates() {
  return all("SELECT * FROM templates WHERE tenant_id=? ORDER BY created_at DESC", [tid()]);
}

export function createTemplate(name: string, body: string, category = "marketing") {
  const id = uid();
  run("INSERT INTO templates (id, tenant_id, name, body, category, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
    id, tid(), name, body, category, nowIso(),
  ]);
  return one("SELECT * FROM templates WHERE id=?", [id]);
}

export function contactsForCampaign(): ContactForCampaign[] {
  return all<ContactForCampaign & { tag_csv: string }>(
    `SELECT c.id, c.phone, c.opt_in, c.blocked,
      COALESCE((SELECT GROUP_CONCAT(tag_id) FROM contact_tags WHERE contact_id = c.id), '') AS tag_csv,
      pc.stage_id
     FROM contacts c LEFT JOIN pipeline_cards pc ON pc.contact_id = c.id
     WHERE c.tenant_id=?`,
    [tid()],
  ).map((row) => ({
    id: row.id, phone: row.phone, opt_in: row.opt_in, blocked: row.blocked, stage_id: row.stage_id,
    tags: String(row.tag_csv || "").split(",").filter(Boolean),
  }));
}

export function listCampaigns() {
  const campaigns = all<Campaign>("SELECT * FROM campaigns WHERE tenant_id=? ORDER BY created_at DESC", [tid()]);
  return campaigns.map((campaign) => {
    const recipients = all<Recipient>("SELECT * FROM campaign_recipients WHERE campaign_id=?", [campaign.id]);
    return { ...campaign, metrics: campaignMetrics(recipients) };
  });
}

export function getCampaign(id: string) {
  const campaign = one<Campaign>("SELECT * FROM campaigns WHERE id=? AND tenant_id=?", [id, tid()]);
  if (!campaign) return null;
  const recipients = all<Recipient & { name: string }>(
    `SELECT r.*, c.name FROM campaign_recipients r JOIN contacts c ON c.id = r.contact_id
     WHERE r.campaign_id=? ORDER BY r.status, c.name`,
    [id],
  );
  return { ...campaign, recipients, metrics: campaignMetrics(recipients) };
}

export function createCampaign(input: {
  name: string; message: string; tagIds?: string[]; stageId?: string | null; scheduledAt?: string | null; onlyOptIn?: boolean;
}) {
  const id = uid();
  const stamp = nowIso();
  run(
    `INSERT INTO campaigns (id, tenant_id, name, message, status, scheduled_at, tag_ids, stage_id, only_opt_in, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)`,
    [id, tid(), input.name, input.message, input.scheduledAt || null, JSON.stringify(input.tagIds || []), input.stageId || null, input.onlyOptIn === false ? 0 : 1, stamp, stamp],
  );
  audit("campaign.create", input.name);
  return getCampaign(id);
}

export function previewCampaignAudience(input: { tagIds?: string[]; stageId?: string | null; onlyOptIn?: boolean }) {
  const settings = getSettings();
  return {
    total: uniqueByPhone(resolveAudience(contactsForCampaign(), {
      tagIds: input.tagIds, stageId: input.stageId, onlyOptIn: input.onlyOptIn ?? Boolean(settings.require_opt_in),
    })).length,
  };
}

export function startCampaign(id: string, testMode = false) {
  const campaign = getCampaign(id);
  if (!campaign) throw new Error("Campanha não encontrada");
  if (campaign.status === "running") throw new Error("Campanha já está em execução");
  const settings = getSettings();
  const tagIds = JSON.parse(campaign.tag_ids || "[]") as string[];
  const audience = uniqueByPhone(resolveAudience(contactsForCampaign(), {
    tagIds, stageId: campaign.stage_id, onlyOptIn: Boolean(campaign.only_opt_in || settings.require_opt_in),
  }));
  if (!audience.length) throw new Error("Nenhum contato elegível. Confira opt-in, tags e etapa.");
  const workspace = tid();
  tx((db) => {
    db.prepare("DELETE FROM campaign_recipients WHERE campaign_id=?").run(id);
    const insert = db.prepare(
      `INSERT INTO campaign_recipients (id, tenant_id, campaign_id, contact_id, phone, rendered_message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    );
    for (const contact of audience) {
      const full = one<Contact>("SELECT * FROM contacts WHERE id=?", [contact.id]);
      insert.run(uid(), workspace, id, contact.id, contact.phone, interpolateMessage(campaign.message, full || contact));
    }
    db.prepare("UPDATE campaigns SET status='running', test_mode=?, started_at=?, finished_at=NULL, updated_at=? WHERE id=?").run(
      testMode ? 1 : 0, nowIso(), nowIso(), id,
    );
  });
  audit("campaign.start", `${campaign.name} (${audience.length} destinatários)`);
  return getCampaign(id);
}

export function pauseCampaign(id: string) {
  run("UPDATE campaigns SET status='paused', updated_at=? WHERE id=? AND tenant_id=?", [nowIso(), id, tid()]);
  return getCampaign(id);
}

export function sentToday(explicit?: string | null) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return one<{ total: number }>(
    `SELECT COUNT(*) AS total FROM campaign_recipients
     WHERE tenant_id=? AND sent_at IS NOT NULL AND sent_at >= ? AND status NOT IN ('failed','skipped')`,
    [tid(explicit), start.toISOString()],
  )?.total ?? 0;
}

export function lastSentAt(explicit?: string | null) {
  return one<{ sent_at: string }>(
    "SELECT sent_at FROM campaign_recipients WHERE tenant_id=? AND sent_at IS NOT NULL ORDER BY sent_at DESC LIMIT 1",
    [tid(explicit)],
  )?.sent_at;
}

export function nextPendingRecipient() {
  return one<Recipient & { campaign_status: string; campaign_name: string; contact_name: string; tenant_id: string }>(
    `SELECT r.*, c.status AS campaign_status, c.name AS campaign_name, ct.name AS contact_name
     FROM campaign_recipients r
     JOIN campaigns c ON c.id = r.campaign_id
     JOIN contacts ct ON ct.id = r.contact_id
     JOIN tenants t ON t.id = r.tenant_id
     WHERE r.status='pending' AND c.status='running' AND t.status='active'
     ORDER BY r.rowid LIMIT 1`,
  );
}

export function markRecipient(id: string, status: string, extra: { error?: string; provider_id?: string } = {}) {
  const stamp = nowIso();
  const sent = ["sent", "delivered", "read", "replied"].includes(status) ? stamp : null;
  run(
    `UPDATE campaign_recipients SET status=?, error=?, provider_id=COALESCE(?, provider_id),
      sent_at=COALESCE(?, sent_at),
      delivered_at=CASE WHEN ? IN ('delivered','read','replied') THEN COALESCE(delivered_at, ?) ELSE delivered_at END,
      read_at=CASE WHEN ? IN ('read','replied') THEN COALESCE(read_at, ?) ELSE read_at END,
      replied_at=CASE WHEN ?='replied' THEN COALESCE(replied_at, ?) ELSE replied_at END
     WHERE id=?`,
    [status, extra.error || null, extra.provider_id || null, sent, status, stamp, status, stamp, status, stamp, id],
  );
}

export function maybeFinishCampaigns() {
  const running = all<{ id: string }>("SELECT id FROM campaigns WHERE status='running'");
  for (const campaign of running) {
    const pending = one<{ total: number }>("SELECT COUNT(*) AS total FROM campaign_recipients WHERE campaign_id=? AND status='pending'", [campaign.id]);
    if ((pending?.total ?? 0) === 0) {
      run("UPDATE campaigns SET status='completed', finished_at=?, updated_at=? WHERE id=?", [nowIso(), nowIso(), campaign.id]);
    }
  }
}

export function inbox() {
  return all(
    `SELECT cv.*, c.name, c.phone FROM conversations cv JOIN contacts c ON c.id = cv.contact_id
     WHERE cv.tenant_id=? ORDER BY cv.last_at DESC`,
    [tid()],
  );
}

export function conversationMessages(conversationId: string) {
  run("UPDATE conversations SET unread=0 WHERE id=? AND tenant_id=?", [conversationId, tid()]);
  return all("SELECT * FROM messages WHERE conversation_id=? AND tenant_id=? ORDER BY created_at", [conversationId, tid()]);
}

export function appendMessage(input: { phone: string; name?: string; body: string; direction: "in" | "out"; campaignId?: string }) {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new Error("Telefone inválido no webhook");
  const workspace = tid();
  let contact = one<Contact>("SELECT * FROM contacts WHERE phone=? AND tenant_id=?", [phone, workspace]);
  if (!contact) {
    contact = upsertContact({ name: input.name || `Contato ${phone.slice(-4)}`, phone, source: "whatsapp", opt_in: true }) as Contact;
  }
  let conversation = one<{ id: string }>("SELECT id FROM conversations WHERE contact_id=? AND tenant_id=?", [contact.id, workspace]);
  if (!conversation) {
    conversation = { id: uid() };
    run("INSERT INTO conversations (id, tenant_id, contact_id, unread, last_message, last_at) VALUES (?, ?, ?, 0, '', ?)", [
      conversation.id, workspace, contact.id, nowIso(),
    ]);
  }
  const messageId = uid();
  run("INSERT INTO messages (id, tenant_id, conversation_id, contact_id, direction, body, campaign_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
    messageId, workspace, conversation.id, contact.id, input.direction, input.body, input.campaignId || null, nowIso(),
  ]);
  run("UPDATE conversations SET last_message=?, last_at=?, unread = unread + ? WHERE id=?", [
    input.body, nowIso(), input.direction === "in" ? 1 : 0, conversation.id,
  ]);
  if (input.direction === "in") {
    run("UPDATE contacts SET last_inbound_at=? WHERE id=?", [nowIso(), contact.id]);
    run("UPDATE campaign_recipients SET status='replied', replied_at=? WHERE contact_id=? AND status IN ('sent','delivered','read')", [nowIso(), contact.id]);
  }
  return { contact, conversationId: conversation.id, messageId };
}

export function optOutContact(contactId: string) {
  run("UPDATE contacts SET opt_in=0, opted_out_at=?, updated_at=? WHERE id=? AND tenant_id=?", [nowIso(), nowIso(), contactId, tid()]);
  run("UPDATE campaign_recipients SET status='skipped', error='opt-out' WHERE contact_id=? AND status='pending'", [contactId]);
}

export function dashboard() {
  const workspace = tid();
  const contacts = one<{ total: number }>("SELECT COUNT(*) AS total FROM contacts WHERE tenant_id=?", [workspace])?.total ?? 0;
  const optIn = one<{ total: number }>("SELECT COUNT(*) AS total FROM contacts WHERE tenant_id=? AND opt_in=1", [workspace])?.total ?? 0;
  const campaigns = one<{ total: number }>("SELECT COUNT(*) AS total FROM campaigns WHERE tenant_id=?", [workspace])?.total ?? 0;
  const running = one<{ total: number }>("SELECT COUNT(*) AS total FROM campaigns WHERE tenant_id=? AND status='running'", [workspace])?.total ?? 0;
  const replied = one<{ total: number }>("SELECT COUNT(*) AS total FROM campaign_recipients WHERE tenant_id=? AND status='replied'", [workspace])?.total ?? 0;
  const unread = one<{ total: number }>("SELECT COUNT(*) AS total FROM conversations WHERE tenant_id=? AND unread>0", [workspace])?.total ?? 0;
  return { contacts, optIn, campaigns, running, sent: sentToday(), replied, unread, recent: listCampaigns().slice(0, 5), funnel: listStages().map((stage) => ({
    ...stage,
    total: one<{ total: number }>("SELECT COUNT(*) AS total FROM pipeline_cards WHERE stage_id=?", [stage.id])?.total ?? 0,
  })), settings: getSettings() };
}

export function listConnections() {
  return all("SELECT * FROM connections WHERE tenant_id=? ORDER BY name", [tid()]);
}

export function getConnection(id?: string) {
  if (id) return one("SELECT * FROM connections WHERE id=? AND tenant_id=?", [id, tid()]);
  return one("SELECT * FROM connections WHERE tenant_id=? ORDER BY name LIMIT 1", [tid()]);
}

export function updateConnection(id: string, patch: Record<string, unknown>) {
  const current = getConnection(id) as Record<string, unknown> | null;
  if (!current) throw new Error("Conexão não encontrada");
  const next = { ...current, ...patch };
  run(
    `UPDATE connections SET name=?, provider=?, status=?, instance_name=?, phone_number=?, qr_code=?, last_checked_at=?, notes=?
     WHERE id=? AND tenant_id=?`,
    [next.name, next.provider, next.status, next.instance_name, next.phone_number ?? null, next.qr_code ?? null, next.last_checked_at ?? null, next.notes, id, tid()],
  );
  return getConnection(id);
}

export function findTenantByInstance(instance: string) {
  return one<{ id: string; tenant_id: string }>("SELECT id, tenant_id FROM connections WHERE instance_name=?", [instance]);
}

export function markConnectionState(instance: string, status: string, phone?: string | null, qr?: string | null) {
  const found = findTenantByInstance(instance);
  if (!found) return null;
  run(
    `UPDATE connections
     SET status=?,
         phone_number=COALESCE(?, phone_number),
         qr_code=CASE WHEN ?='connected' THEN '' ELSE COALESCE(?, qr_code) END,
         last_checked_at=?
     WHERE id=?`,
    [status, phone || null, status, qr || null, nowIso(), found.id],
  );
  return found;
}

export function audit(action: string, details: string) {
  run("INSERT INTO audit_logs (id, tenant_id, action, details, created_at) VALUES (?, ?, ?, ?, ?)", [
    uid(), optionalTenantId(), action, details, nowIso(),
  ]);
}
