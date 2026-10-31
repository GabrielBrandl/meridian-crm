import { fail, json, withAuth } from "@/lib/api";
import { createCampaign, listCampaigns, previewCampaignAudience } from "@/lib/repositories";

export async function GET() {
  try {
    return await withAuth(async () => json({ campaigns: listCampaigns() }));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    return await withAuth(async () => {
      const body = await request.json();
      if (body.preview) {
        return json(previewCampaignAudience({ tagIds: body.tagIds, stageId: body.stageId, onlyOptIn: body.onlyOptIn }));
      }
      return json({
        campaign: createCampaign({
          name: body.name, message: body.message, tagIds: body.tagIds,
          stageId: body.stageId, scheduledAt: body.scheduledAt, onlyOptIn: body.onlyOptIn,
        }),
      });
    });
  } catch (error) {
    return fail(error);
  }
}
