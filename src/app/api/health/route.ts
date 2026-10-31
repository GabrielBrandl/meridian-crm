import { json } from "@/lib/api";
import { one } from "@/lib/db";
import { evolutionConfigured } from "@/lib/evolution";
import { ensureBoot } from "@/lib/seed";

export async function GET() {
  ensureBoot();
  return json({
    ok: true,
    product: "Meridian CRM",
    tenants: one<{ total: number }>("SELECT COUNT(*) AS total FROM tenants")?.total ?? 0,
    evolution: evolutionConfigured(),
  });
}
