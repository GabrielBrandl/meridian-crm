import { fail, json, withAuth } from "@/lib/api";
import { appendMessage } from "@/lib/repositories";

export async function POST(request: Request) {
  try {
    return await withAuth(async () => {
      const body = await request.json();
      return json(appendMessage({ phone: body.phone, name: body.name, body: body.body, direction: "out" }));
    });
  } catch (error) {
    return fail(error);
  }
}
