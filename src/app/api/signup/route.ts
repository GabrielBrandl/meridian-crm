import { fail, json } from "@/lib/api";
import { createTenant } from "@/lib/tenants";
import { ensureBoot } from "@/lib/seed";

export async function POST(request: Request) {
  try {
    ensureBoot();
    const body = await request.json();
    if (!body.company || !body.name || !body.email || !body.password) {
      return json({ error: "Preencha empresa, nome, e-mail e senha." }, 400);
    }
    if (String(body.password).length < 6) {
      return json({ error: "A senha precisa ter pelo menos 6 caracteres." }, 400);
    }
    const tenant = createTenant({
      name: body.company,
      ownerName: body.name,
      ownerEmail: body.email,
      password: body.password,
      phone: body.phone,
      plan: "starter",
      status: "pending",
    });
    return json({
      ok: true,
      message: "Cadastro recebido. A GB Systems libera o acesso em seguida.",
      tenant: { id: tenant?.id, name: tenant?.name, status: tenant?.status },
    });
  } catch (error) {
    return fail(error);
  }
}
