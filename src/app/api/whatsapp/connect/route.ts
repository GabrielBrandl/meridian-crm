import { fail, json, withAuth } from "@/lib/api";
import { connectInstance, connectionState, createInstance, evolutionConfigured, extractQr, extractState, logoutInstance, setInstanceWebhook } from "@/lib/evolution";
import { getConnection, updateConnection } from "@/lib/repositories";
import { nowIso } from "@/lib/ids";

export async function GET() {
  try {
    return await withAuth(async () => {
      const connection = getConnection();
      if (!connection || !evolutionConfigured() || (connection as { instance_name?: string }).instance_name === "") {
        return json({ connection, evolution: evolutionConfigured() });
      }
      try {
        const state = extractState(await connectionState((connection as { instance_name: string }).instance_name));
        const status = state === "open" ? "connected" : state === "connecting" ? "qr" : (connection as { status: string }).status;
        updateConnection((connection as { id: string }).id, { status, last_checked_at: nowIso(), qr_code: status === "connected" ? "" : (connection as { qr_code?: string }).qr_code });
      } catch {
        /* Evolution pode estar fora */
      }
      return json({ connection: getConnection(), evolution: evolutionConfigured() });
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST() {
  try {
    return await withAuth(async (user) => {
      if (!evolutionConfigured()) {
        return json({ error: "O servidor ainda não tem Evolution API. A GB Systems liga isso no deploy." }, 400);
      }
      const connection = getConnection() as { id: string; instance_name: string } | null;
      if (!connection) return json({ error: "Conexão não encontrada" }, 404);
      const instance = connection.instance_name || `meridian-${(user.tenantId || "ws").slice(0, 8)}`;
      try {
        await createInstance(instance);
      } catch {
        /* instância pode já existir */
      }
      try {
        await setInstanceWebhook(instance);
      } catch {
        /* webhook é configurado de novo no próximo QR */
      }
      const payload = await connectInstance(instance);
      const qr = extractQr(payload);
      const updated = updateConnection(connection.id, {
        instance_name: instance,
        status: qr ? "qr" : "connecting",
        qr_code: qr,
        last_checked_at: nowIso(),
      });
      return json({ connection: updated, evolution: true });
    });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE() {
  try {
    return await withAuth(async () => {
      const connection = getConnection() as { id: string; instance_name: string } | null;
      if (connection?.instance_name && evolutionConfigured()) {
        try { await logoutInstance(connection.instance_name); } catch { /* ignore */ }
      }
      return json({
        connection: connection
          ? updateConnection(connection.id, { status: "idle", qr_code: "", phone_number: "", last_checked_at: nowIso() })
          : null,
      });
    });
  } catch (error) {
    return fail(error);
  }
}
