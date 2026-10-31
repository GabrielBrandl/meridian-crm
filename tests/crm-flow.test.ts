import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, before } from "node:test";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "meridian-"));
process.env.DATABASE_PATH = path.join(dir, "test.db");
process.env.JWT_SECRET = "test-secret";

describe("fluxo CRM + sandbox n8n", () => {
  let seed: typeof import("../src/lib/seed");
  let repos: typeof import("../src/lib/repositories");
  let dispatcher: typeof import("../src/lib/dispatcher");
  let context: typeof import("../src/lib/context");
  let db: typeof import("../src/lib/db");

  function asClient<T>(fn: () => T) {
    const tenant = db.one<{ id: string }>("SELECT id FROM tenants LIMIT 1");
    return context.runWithUser(
      { id: "test", name: "Maria", email: "cliente@demo.com", role: "admin", tenantId: tenant?.id || null },
      fn,
    );
  }

  before(async () => {
    seed = await import("../src/lib/seed");
    repos = await import("../src/lib/repositories");
    dispatcher = await import("../src/lib/dispatcher");
    context = await import("../src/lib/context");
    db = await import("../src/lib/db");
    seed.ensureBoot();
    asClient(() =>
      repos.updateSettings({
        sandbox_mode: 1,
        messages_per_minute: 60,
        min_interval_seconds: 0,
        jitter_seconds: 0,
        daily_limit: 500,
        business_hours_start: "00:00",
        business_hours_end: "23:59",
      }),
    );
  });

  it("sobe a base com usuário e contatos", () => {
    const dash = asClient(() => repos.dashboard());
    assert.equal(dash.contacts, 5);
    assert.ok(dash.optIn > 0);
    assert.ok(db.one("SELECT id FROM users WHERE role='platform'"));
  });

  it("importa CSV e dispara campanha só para opt-in", () => {
    asClient(() => {
      const imported = repos.importContactsCsv(
        "nome,telefone,tags,opt_in\nTeste CRM,11940001999,Lead quente,sim\nSem Consentimento,11940001998,Lead quente,nao",
      );
      assert.equal(imported.created, 2);
      const tags = repos.listTags();
      const hot = tags.find((tag) => tag.name === "Lead quente");
      const campaign = repos.createCampaign({
        name: "Teste disparo",
        message: "Olá {{primeiro_nome}}, campanha Meridian.",
        tagIds: hot ? [hot.id] : [],
        onlyOptIn: true,
      });
      assert.ok(campaign);
      const started = repos.startCampaign(campaign!.id);
      assert.ok((started?.recipients.length || 0) >= 1);
      assert.ok(started?.recipients.every((r) => r.phone !== "5511940001998"));
    });
  });

  it("processa fila em sandbox e registra resposta com opt-out", async () => {
    const running = asClient(() => repos.listCampaigns().find((c) => c.status === "running" || c.status === "draft"));
    assert.ok(running);
    if (running.status === "draft") asClient(() => repos.startCampaign(running.id));
    const ticks = await dispatcher.drainDispatch(20);
    assert.ok(ticks.some((tick) => tick.processed === 1));
    const campaign = asClient(() => repos.getCampaign(running.id));
    assert.ok((campaign?.metrics.sent || 0) >= 1);
    const recipient = campaign?.recipients.find((r) => r.status === "sent");
    assert.ok(recipient);
    asClient(() => {
      const inbound = repos.appendMessage({
        phone: recipient!.phone,
        name: recipient!.name,
        body: "SAIR",
        direction: "in",
      });
      repos.optOutContact(inbound.contact.id);
      assert.equal(repos.getContact(inbound.contact.id)?.opt_in, 0);
      assert.ok(repos.inbox().length >= 1);
    });
  });
});
