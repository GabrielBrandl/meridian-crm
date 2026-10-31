import { fail, json } from "@/lib/api";
import { runWithUser } from "@/lib/context";
import { appendMessage, findTenantByInstance, markConnectionState, optOutContact } from "@/lib/repositories";
import { isOptOutKeyword } from "@/lib/phone";
import { ensureBoot } from "@/lib/seed";
import { getSettings } from "@/lib/repositories";

function eventName(body: { event?: string }) {
  return String(body.event || "").toLowerCase();
}

function extractText(data?: {
  message?: { conversation?: string; extendedTextMessage?: { text?: string } };
}) {
  return data?.message?.conversation || data?.message?.extendedTextMessage?.text || "";
}

export async function POST(request: Request) {
  try {
    ensureBoot();
    const body = (await request.json()) as {
      instance?: string;
      event?: string;
      data?: {
        state?: string;
        status?: string;
        qrcode?: { base64?: string };
        base64?: string;
        wuid?: string;
        owner?: string;
        key?: { remoteJid?: string; fromMe?: boolean };
        pushName?: string;
        message?: { conversation?: string; extendedTextMessage?: { text?: string } };
      };
    };
    const instance = body.instance || "";
    const found = findTenantByInstance(instance);
    if (!found) return json({ ok: true, ignored: "instance" });

    const event = eventName(body);
    if (event.includes("qrcode")) {
      const qr = body.data?.qrcode?.base64 || body.data?.base64 || "";
      markConnectionState(instance, "qr", null, qr);
      return json({ ok: true, event: "qr" });
    }
    if (event.includes("connection")) {
      const state = String(body.data?.state || body.data?.status || "").toLowerCase();
      const phone = body.data?.owner || body.data?.wuid?.replace(/\D/g, "") || null;
      const status = state === "open" ? "connected" : state === "connecting" ? "qr" : "idle";
      markConnectionState(instance, status, phone);
      return json({ ok: true, event: "connection", status });
    }

    const text = extractText(body.data);
    const jid = body.data?.key?.remoteJid || "";
    const phone = jid.replace("@s.whatsapp.net", "").replace("@g.us", "");
    if (!text || !phone || body.data?.key?.fromMe) return json({ ok: true, ignored: "payload" });

    return runWithUser(
      { id: "evolution", name: "WhatsApp", email: "webhook@local", role: "system", tenantId: found.tenant_id },
      () => {
        const result = appendMessage({ phone, name: body.data?.pushName, body: text, direction: "in" });
        const settings = getSettings(found.tenant_id);
        const optedOut = isOptOutKeyword(text, settings.opt_out_keywords.split(",").map((k) => k.trim()));
        if (optedOut) optOutContact(result.contact.id);
        return json({ ok: true, optedOut });
      },
    );
  } catch (error) {
    return fail(error, 500);
  }
}
