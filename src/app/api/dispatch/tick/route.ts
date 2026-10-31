import { fail, json } from "@/lib/api";
import { drainDispatch } from "@/lib/dispatcher";
import { ensureBoot } from "@/lib/seed";
import { getSettings } from "@/lib/repositories";

export async function POST(request: Request) {
  try {
    ensureBoot();
    const settings = getSettings();
    const secret = request.headers.get("x-meridian-secret");
    if (settings.n8n_callback_secret && secret && secret !== settings.n8n_callback_secret) {
      return json({ error: "Segredo inválido" }, 401);
    }
    const ticks = await drainDispatch(12);
    return json({ ticks });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function GET(request: Request) {
  return POST(request);
}
