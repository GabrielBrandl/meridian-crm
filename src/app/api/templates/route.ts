import { fail, json, withAuth } from "@/lib/api";
import { createTemplate, listTemplates } from "@/lib/repositories";

export async function GET() {
  try {
    return await withAuth(async () => json({ templates: listTemplates() }));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    return await withAuth(async () => {
      const body = await request.json();
      return json({ template: createTemplate(body.name, body.body, body.category) });
    });
  } catch (error) {
    return fail(error);
  }
}
