import { fail, json, withAuth } from "@/lib/api";
import { listContacts, upsertContact } from "@/lib/repositories";

export async function GET(request: Request) {
  try {
    return await withAuth(async () => {
      const query = new URL(request.url).searchParams.get("q") || "";
      return json({ contacts: listContacts(query) });
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    return await withAuth(async () => {
      const body = await request.json();
      return json({
        contact: upsertContact({
          name: body.name, phone: body.phone, email: body.email, company: body.company,
          city: body.city, notes: body.notes, opt_in: body.opt_in !== false, tagNames: body.tags || [],
        }),
      });
    });
  } catch (error) {
    return fail(error);
  }
}
