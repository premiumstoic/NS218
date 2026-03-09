import { NextResponse } from "next/server";
import { parseJsonBody, apiError } from "@/lib/api";
import { requireApiProfile } from "@/lib/api-auth";
import { weekCreateSchema } from "@/lib/validators/api";

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile({ teacherOnly: true });
    if (auth.error) {
      return auth.error;
    }

    const payload = await parseJsonBody(request, weekCreateSchema);

    const { data, error } = await auth.supabase.from("weeks").insert(payload).select("*").single();
    if (error) {
      throw error;
    }

    return NextResponse.json({ week: data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
