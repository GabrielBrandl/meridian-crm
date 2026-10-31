import { fail, json, withAuth } from "@/lib/api";
import { dashboard } from "@/lib/repositories";

export async function GET() {
  try {
    return await withAuth(async (user) => {
      if (user.role === "platform") return json({ error: "Use /admin" }, 400);
      return json(dashboard());
    });
  } catch (error) {
    return fail(error);
  }
}
