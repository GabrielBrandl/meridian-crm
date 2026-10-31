import { fail, json, withAuth } from "@/lib/api";
import { listTags } from "@/lib/repositories";

export async function GET() {
  try {
    return await withAuth(async () => json({ tags: listTags() }));
  } catch (error) {
    return fail(error);
  }
}
