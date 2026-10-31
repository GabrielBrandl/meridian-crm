import { fail, json } from "@/lib/api";
import { runWithUser } from "@/lib/context";
import { one } from "@/lib/db";
import { isOptOutKeyword, normalizePhone } from "@/lib/phone";
import { assertCallbackSecret } from "@/lib/n8n";
import { ensureBoot } from "@/lib/seed";
import { appendMessage, getSettings, optOutContact } from "@/lib/repositories";

export async function POST(request: Request) {
  try {
    ensureBoot();
    const body = (await request.json()) as {
      phone?: string;
      name?: string;
      message?: string;
      text?: string;
      pushName?: string;
      tenantId?: string;
    };
    const phone = normalizePhone(body.phone || "");
    const tenantId =
      body.tenantId ||
      one<{ tenant_id: string }>("SELECT tenant_id FROM contacts WHERE phone=? LIMIT 1", [phone || ""])?.tenant_id ||
      one<{ id: string }>("SELECT id FROM tenants WHERE status='active' ORDER BY created_at LIMIT 1")?.id;
    if (!tenantId) return json({ error: "Workspace não encontrado" }, 404);

    return runWithUser(
      { id: "n8n", name: "n8n", email: "n8n@local", role: "system", tenantId },
      () => {
        const settings = getSettings(tenantId);
        const url = new URL(request.url);
        if (!assertCallbackSecret(request.headers.get("x-meridian-secret"), url.searchParams.get("secret"), settings)) {
          return json({ error: "Segredo inválido" }, 401);
        }
        const text = body.message || body.text || "";
        const result = appendMessage({
          phone: body.phone || "",
          name: body.name || body.pushName,
          body: text,
          direction: "in",
        });
        const optedOut = isOptOutKeyword(text, settings.opt_out_keywords.split(",").map((k) => k.trim()).filter(Boolean));
        if (optedOut) optOutContact(result.contact.id);
        return json({ ok: true, optedOut, ...result });
      },
    );
  } catch (error) {
    return fail(error, 500);
  }
}
