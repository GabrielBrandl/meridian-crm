const evoUrl = () => (process.env.EVOLUTION_URL || "").replace(/\/$/, "");
const evoKey = () => process.env.EVOLUTION_API_KEY || "meridian-evo-key";

export function evolutionConfigured() {
  return Boolean(evoUrl());
}

async function evo<T>(path: string, init: RequestInit = {}) {
  const base = evoUrl();
  if (!base) throw new Error("Evolution API não está configurada no servidor.");
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      apikey: evoKey(),
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let json: T | null = null;
  try {
    json = text ? (JSON.parse(text) as T) : null;
  } catch {
    json = null;
  }
  if (!response.ok) {
    throw new Error(`Evolution ${response.status}: ${text.slice(0, 180)}`);
  }
  return json as T;
}

function publicAppUrl() {
  return (process.env.APP_PUBLIC_URL || "").replace(/\/$/, "");
}

export async function createInstance(instance: string) {
  const webhookUrl = publicAppUrl() ? `${publicAppUrl()}/api/webhooks/evolution` : "";
  return evo("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName: instance,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
      ...(webhookUrl
        ? {
            webhook: {
              url: webhookUrl,
              byEvents: false,
              base64: true,
              events: ["QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT"],
            },
          }
        : {}),
    }),
  });
}

export async function setInstanceWebhook(instance: string) {
  const webhookUrl = publicAppUrl() ? `${publicAppUrl()}/api/webhooks/evolution` : "";
  if (!webhookUrl) return null;
  return evo(`/webhook/set/${instance}`, {
    method: "POST",
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: true,
        events: ["QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT"],
      },
    }),
  });
}

export async function connectInstance(instance: string) {
  return evo<{ base64?: string; code?: string; count?: number }>(`/instance/connect/${instance}`);
}

export async function connectionState(instance: string) {
  return evo<{ instance?: { state?: string }; state?: string }>(`/instance/connectionState/${instance}`);
}

export async function logoutInstance(instance: string) {
  return evo(`/instance/logout/${instance}`, { method: "DELETE" });
}

export async function sendText(instance: string, phone: string, text: string) {
  return evo<{ key?: { id?: string } }>(`/message/sendText/${instance}`, {
    method: "POST",
    body: JSON.stringify({ number: phone, text }),
  });
}

export function extractQr(payload: unknown): string {
  const data = payload as { base64?: string; qrcode?: { base64?: string }; code?: string };
  return data?.qrcode?.base64 || data?.base64 || "";
}

export function extractState(payload: unknown): string {
  const data = payload as { instance?: { state?: string }; state?: string };
  return data?.instance?.state || data?.state || "unknown";
}
