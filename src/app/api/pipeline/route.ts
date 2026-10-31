import { fail, json, withAuth } from "@/lib/api";
import { moveCard, pipelineBoard } from "@/lib/repositories";

export async function GET() {
  try {
    return await withAuth(async () => json({ stages: pipelineBoard() }));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    return await withAuth(async () => {
      const body = (await request.json()) as { contactId?: string; stageId?: string };
      return json({ stages: moveCard(body.contactId || "", body.stageId || "") });
    });
  } catch (error) {
    return fail(error);
  }
}
