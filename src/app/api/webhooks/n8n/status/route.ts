import { fail, json } from "@/lib/api";
import { assertCallbackSecret } from "@/lib/n8n";
import { ensureBoot } from "@/lib/seed";
import { getSettings, markRecipient, maybeFinishCampaigns } from "@/lib/repositories";
import { one } from "@/lib/db";
import { runWithUser } from "@/lib/context";

export async function POST(request: Request) {
  try {
    ensureBoot();
    const body = (await request.json()) as {
      recipientId?: string;
      campaignId?: string;
      phone?: string;
      status?: string;
      provider_id?: string;
      error?: string;
      tenantId?: string;
    };
    const recipient = body.recipientId
      ? one<{ id: string; tenant_id: string }>("SELECT id, tenant_id FROM campaign_recipients WHERE id=?", [body.recipientId])
      : one<{ id: string; tenant_id: string }>(
          `SELECT id, tenant_id FROM campaign_recipients WHERE phone=? AND status IN ('sent','delivered','read') ORDER BY sent_at DESC LIMIT 1`,
          [body.phone || ""],
        );
    if (!recipient) return json({ error: "Destinatário não encontrado" }, 404);
    return runWithUser(
      { id: "n8n", name: "n8n", email: "n8n@local", role: "system", tenantId: body.tenantId || recipient.tenant_id },
      () => {
        const settings = getSettings(recipient.tenant_id);
        const url = new URL(request.url);
        if (!assertCallbackSecret(request.headers.get("x-meridian-secret"), url.searchParams.get("secret"), settings)) {
          return json({ error: "Segredo inválido" }, 401);
        }
        const status = body.status || "delivered";
        markRecipient(recipient.id, status, { provider_id: body.provider_id, error: body.error });
        maybeFinishCampaigns();
        return json({ ok: true, recipientId: recipient.id, status });
      },
    );
  } catch (error) {
    return fail(error, 500);
  }
}
