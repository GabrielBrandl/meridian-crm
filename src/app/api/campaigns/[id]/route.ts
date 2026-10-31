import { fail, json, withAuth } from "@/lib/api";
import { getCampaign } from "@/lib/repositories";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return await withAuth(async () => {
      const { id } = await context.params;
      const campaign = getCampaign(id);
      if (!campaign) return json({ error: "Campanha não encontrada" }, 404);
      return json({ campaign });
    });
  } catch (error) {
    return fail(error);
  }
}
