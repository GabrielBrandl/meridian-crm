import type { Settings } from "./types";

export type DispatchPayload = {
  event: "campaign.send";
  campaignId: string;
  campaignName: string;
  recipientId: string;
  contactId: string;
  contactName: string;
  phone: string;
  message: string;
  testMode: boolean;
  sandbox: boolean;
};

export async function dispatchToN8n(settings: Settings, payload: DispatchPayload) {
  if (settings.sandbox_mode || !settings.n8n_webhook_url) {
    return {
      ok: true,
      sandbox: true,
      provider_id: `sandbox_${payload.recipientId.slice(0, 8)}`,
    };
  }

  const response = await fetch(settings.n8n_webhook_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-meridian-secret": settings.n8n_secret,
    },
    body: JSON.stringify({
      ...payload,
      secret: settings.n8n_secret,
      callbackPath: "/api/webhooks/n8n/status",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`n8n respondeu ${response.status}: ${text.slice(0, 180)}`);
  }

  let provider_id = "";
  try {
    const json = (await response.json()) as { provider_id?: string; id?: string };
    provider_id = json.provider_id || json.id || "";
  } catch {
    provider_id = "";
  }
  return { ok: true, sandbox: false, provider_id };
}

export function assertCallbackSecret(header: string | null, query: string | null, settings: Settings) {
  const received = header || query || "";
  if (!settings.n8n_callback_secret) return true;
  return received === settings.n8n_callback_secret;
}
