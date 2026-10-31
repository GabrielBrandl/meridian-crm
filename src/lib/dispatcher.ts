import { isWithinBusinessHours, nextDelayMs, remainingDailyQuota, shouldPauseForErrors } from "./campaign-rules";
import { one, run } from "./db";
import { nowIso } from "./ids";
import { dispatchToN8n } from "./n8n";
import { evolutionConfigured, sendText } from "./evolution";
import {
  getSettings,
  lastSentAt,
  markRecipient,
  maybeFinishCampaigns,
  nextPendingRecipient,
  sentToday,
} from "./repositories";

export type TickResult = {
  processed: number;
  skipped: string | null;
  recipientId?: string;
  status?: string;
};

export async function tickDispatch(): Promise<TickResult> {
  const recipient = nextPendingRecipient();
  if (!recipient) {
    maybeFinishCampaigns();
    return { processed: 0, skipped: "fila vazia" };
  }

  const settings = getSettings(recipient.tenant_id);
  if (!isWithinBusinessHours(settings)) {
    return { processed: 0, skipped: "fora do horário comercial" };
  }
  if (remainingDailyQuota(sentToday(recipient.tenant_id), settings.daily_limit) <= 0) {
    return { processed: 0, skipped: "limite diário atingido" };
  }

  const last = lastSentAt(recipient.tenant_id);
  if (last) {
    const elapsed = Date.now() - new Date(last).getTime();
    if (elapsed < nextDelayMs(settings, () => 0)) {
      return { processed: 0, skipped: "respeitando intervalo de segurança" };
    }
  }

  const failed = one<{ total: number }>("SELECT COUNT(*) AS total FROM campaign_recipients WHERE campaign_id=? AND status='failed'", [recipient.campaign_id])?.total ?? 0;
  const processed = one<{ total: number }>("SELECT COUNT(*) AS total FROM campaign_recipients WHERE campaign_id=? AND status <> 'pending'", [recipient.campaign_id])?.total ?? 0;
  if (shouldPauseForErrors(failed, processed, settings.pause_error_rate)) {
    run("UPDATE campaigns SET status='paused', updated_at=? WHERE id=?", [nowIso(), recipient.campaign_id]);
    return { processed: 0, skipped: "campanha pausada por taxa de erro" };
  }

  const connection = one<{ status: string; provider: string; instance_name: string }>(
    "SELECT status, provider, instance_name FROM connections WHERE tenant_id=? ORDER BY name LIMIT 1",
    [recipient.tenant_id],
  );
  const campaign = one<{ test_mode: number; name: string }>("SELECT test_mode, name FROM campaigns WHERE id=?", [recipient.campaign_id]);

  try {
    let provider_id = "";
    const whatsappReady = connection?.status === "connected" && connection.provider === "evolution" && evolutionConfigured();
    if (whatsappReady) {
      const sent = await sendText(connection.instance_name, recipient.phone, recipient.rendered_message);
      provider_id = sent?.key?.id || `evo_${recipient.id.slice(0, 8)}`;
    } else if (!settings.sandbox_mode && settings.n8n_webhook_url) {
      const result = await dispatchToN8n(settings, {
        event: "campaign.send",
        campaignId: recipient.campaign_id,
        campaignName: campaign?.name || recipient.campaign_name,
        recipientId: recipient.id,
        contactId: recipient.contact_id,
        contactName: recipient.contact_name,
        phone: recipient.phone,
        message: recipient.rendered_message,
        testMode: Boolean(campaign?.test_mode),
        sandbox: false,
      });
      provider_id = result.provider_id;
    } else {
      provider_id = `sandbox_${recipient.id.slice(0, 8)}`;
    }
    markRecipient(recipient.id, "sent", { provider_id });
    maybeFinishCampaigns();
    return { processed: 1, skipped: null, recipientId: recipient.id, status: "sent" };
  } catch (error) {
    markRecipient(recipient.id, "failed", { error: error instanceof Error ? error.message : "falha no envio" });
    return { processed: 1, skipped: null, recipientId: recipient.id, status: "failed" };
  }
}

export async function drainDispatch(max = 8) {
  const results: TickResult[] = [];
  for (let i = 0; i < max; i += 1) {
    const result = await tickDispatch();
    results.push(result);
    if (!result.processed) break;
  }
  return results;
}
