import { fail, json, withAuth } from "@/lib/api";
import { conversationMessages, inbox } from "@/lib/repositories";

export async function GET(request: Request) {
  try {
    return await withAuth(async () => {
      const id = new URL(request.url).searchParams.get("id");
      if (id) return json({ messages: conversationMessages(id) });
      return json({ conversations: inbox() });
    });
  } catch (error) {
    return fail(error);
  }
}
