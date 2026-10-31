import { fail, json, withPlatform } from "@/lib/api";
import { setTenantStatus } from "@/lib/tenants";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return await withPlatform(async () => {
      const { id } = await context.params;
      const body = (await request.json()) as { status?: string };
      if (!body.status) return json({ error: "Informe o status" }, 400);
      return json({ tenant: setTenantStatus(id, body.status) });
    });
  } catch (error) {
    return fail(error);
  }
}
