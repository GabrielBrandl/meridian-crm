import { fail, json, withAuth } from "@/lib/api";
import { pauseCampaign } from "@/lib/repositories";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return await withAuth(async () => {
      const { id } = await context.params;
      return json({ campaign: pauseCampaign(id) });
    });
  } catch (error) {
    return fail(error);
  }
}
