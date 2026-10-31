import { fail, json, withAuth } from "@/lib/api";
import { evolutionConfigured } from "@/lib/evolution";
import { getSettings, listConnections, updateSettings } from "@/lib/repositories";

export async function GET() {
  try {
    return await withAuth(async () => json({
      settings: getSettings(),
      connections: listConnections(),
      evolution: evolutionConfigured(),
    }));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    return await withAuth(async () => json({ settings: updateSettings(await request.json()) }));
  } catch (error) {
    return fail(error);
  }
}
