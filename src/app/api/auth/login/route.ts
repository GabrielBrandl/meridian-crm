import { fail, json } from "@/lib/api";
import { findUserByEmail, setSession, toSession, verifyPassword } from "@/lib/auth";
import { ensureBoot } from "@/lib/seed";

export async function POST(request: Request) {
  try {
    ensureBoot();
    const body = (await request.json()) as { email?: string; password?: string };
    const user = findUserByEmail(body.email || "");
    if (!user || !verifyPassword(body.password || "", user.password_hash)) {
      return json({ error: "E-mail ou senha inválidos" }, 401);
    }
    if (user.role !== "platform" && (user as { tenant_status?: string }).tenant_status === "pending") {
      return json({ error: "Seu cadastro ainda aguarda aprovação da GB Systems." }, 403);
    }
    if (user.role !== "platform" && (user as { tenant_status?: string }).tenant_status === "suspended") {
      return json({ error: "Este workspace está suspenso. Fale com a GB Systems." }, 403);
    }
    const session = toSession(user);
    await setSession(session);
    return json({ user: session, redirect: session.role === "platform" ? "/admin" : "/dashboard" });
  } catch (error) {
    return fail(error, 500);
  }
}
