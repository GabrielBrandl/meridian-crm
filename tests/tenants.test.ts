import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, before } from "node:test";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "meridian-tenants-"));
process.env.DATABASE_PATH = path.join(dir, "tenants.db");

describe("multi-tenant", () => {
  let seed: typeof import("../src/lib/seed");
  let tenants: typeof import("../src/lib/tenants");
  let repos: typeof import("../src/lib/repositories");
  let context: typeof import("../src/lib/context");

  before(async () => {
    seed = await import("../src/lib/seed");
    tenants = await import("../src/lib/tenants");
    repos = await import("../src/lib/repositories");
    context = await import("../src/lib/context");
    seed.ensureBoot();
  });

  it("isola contatos entre clientes", () => {
    const created = tenants.createTenant({
      name: "Clinica Norte",
      ownerName: "Paulo",
      ownerEmail: "paulo@clinica.com",
      password: "senha123",
      plan: "starter",
    });
    assert.ok(created);
    const demo = tenants.listTenants().find((t) => t.owner_email === "cliente@demo.com");
    assert.ok(demo);
    const demoCount = context.runWithUser(
      { id: "a", name: "a", email: "a", role: "admin", tenantId: demo!.id },
      () => repos.listContacts().length,
    );
    const clinicCount = context.runWithUser(
      { id: "b", name: "b", email: "b", role: "admin", tenantId: created!.id },
      () => repos.listContacts().length,
    );
    assert.equal(demoCount, 5);
    assert.equal(clinicCount, 0);
  });
});
