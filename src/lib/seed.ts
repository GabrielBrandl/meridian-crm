import { hashPassword } from "./password";
import { getDb, one, run } from "./db";
import { uid, nowIso } from "./ids";
import { createTenant } from "./tenants";
import { runWithUser } from "./context";
import { upsertContact } from "./repositories";

const DEMO_CONTACTS = [
  ["Ana Souza", "11940001001", "ana@empresa.com", "Norte Digital", "Manaus", ["Lead quente"]],
  ["Bruno Lima", "11940001002", "bruno@loja.com", "Loja Lima", "Manaus", ["Lead frio"]],
  ["Carla Mendes", "92940001003", "carla@gbs.com", "GB Partner", "Manaus", ["Cliente", "VIP"]],
  ["Diego Alves", "92940001004", "diego@start.com", "StartAM", "Manaus", ["Lead quente"]],
  ["Elisa Rocha", "92940001005", "elisa@cafe.com", "Café Rocha", "Itacoatiara", ["Lead frio"]],
] as const;

export function seedIfEmpty() {
  getDb();
  const existing = one("SELECT id FROM users LIMIT 1");
  if (existing) return { seeded: false };

  const stamp = nowIso();
  run(
    "INSERT INTO users (id, tenant_id, name, email, password_hash, role, created_at) VALUES (?, NULL, ?, ?, ?, 'platform', ?)",
    [uid(), "Gabriel Brandl", "admin@gbsystems.com", hashPassword("meridian123"), stamp],
  );

  const demo = createTenant({
    name: "Loja Demo",
    ownerName: "Maria Cliente",
    ownerEmail: "cliente@demo.com",
    password: "demo123",
    plan: "pro",
    status: "active",
    notes: "Conta de demonstração para testes comerciais.",
  });

  if (demo) {
    const user = one<{ id: string }>("SELECT id FROM users WHERE email = ?", ["cliente@demo.com"]);
    runWithUser(
      {
        id: user?.id || "seed",
        name: "Maria Cliente",
        email: "cliente@demo.com",
        role: "admin",
        tenantId: demo.id,
        tenantName: demo.name,
      },
      () => {
        for (const [name, phone, email, company, city, tags] of DEMO_CONTACTS) {
          upsertContact({
            name,
            phone: `55${phone}`,
            email,
            company,
            city,
            source: "seed",
            opt_in: true,
            tagNames: [...tags],
          });
        }
      },
    );
  }

  return { seeded: true };
}

export function ensureBoot() {
  return seedIfEmpty();
}
