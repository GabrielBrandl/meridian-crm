import { fail, json, withPlatform } from "@/lib/api";
import { createTenant, listTenants, platformStats } from "@/lib/tenants";

export async function GET() {
  try {
    return await withPlatform(async () => json({ tenants: listTenants(), stats: platformStats() }));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    return await withPlatform(async () => {
      const body = await request.json();
      if (!body.name || !body.ownerName || !body.ownerEmail || !body.password) {
        return json({ error: "Preencha empresa, responsável, e-mail e senha." }, 400);
      }
      const tenant = createTenant({
        name: body.name,
        ownerName: body.ownerName,
        ownerEmail: body.ownerEmail,
        password: body.password,
        phone: body.phone,
        plan: body.plan || "starter",
        status: "active",
        notes: body.notes,
      });
      return json({ tenant, login: { email: body.ownerEmail, password: body.password } });
    });
  } catch (error) {
    return fail(error);
  }
}
