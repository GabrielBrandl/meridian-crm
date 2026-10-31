import { json } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { ensureBoot } from "@/lib/seed";
import { evolutionConfigured } from "@/lib/evolution";

export async function GET() {
  ensureBoot();
  const user = await getSession();
  return json({ user, evolution: evolutionConfigured() });
}
