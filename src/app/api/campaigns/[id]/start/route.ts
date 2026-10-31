import { fail, json, withAuth } from "@/lib/api";
import { drainDispatch } from "@/lib/dispatcher";
import { startCampaign } from "@/lib/repositories";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return await withAuth(async () => {
      const { id } = await context.params;
      const body = (await request.json().catch(() => ({}))) as { test?: boolean };
      const campaign = startCampaign(id, Boolean(body.test));
      const ticks = await drainDispatch(3);
      return json({ campaign, ticks });
    });
  } catch (error) {
    return fail(error);
  }
}
