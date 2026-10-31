import { fail, json, withAuth } from "@/lib/api";
import { importContactsCsv } from "@/lib/repositories";

export async function POST(request: Request) {
  try {
    return await withAuth(async () => {
      const body = (await request.json()) as { csv?: string; optIn?: boolean };
      return json(importContactsCsv(body.csv || "", body.optIn !== false));
    });
  } catch (error) {
    return fail(error);
  }
}
