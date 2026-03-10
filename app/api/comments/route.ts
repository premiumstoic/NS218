import { NextResponse } from "next/server";
import { parseJsonBody, apiError } from "@/lib/api";
import { requireApiProfile } from "@/lib/api-auth";
import { commentCreateSchema } from "@/lib/validators/api";

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile();
    if (auth.error) {
      return auth.error;
    }

    const payload = await parseJsonBody(request, commentCreateSchema);

    const { data, error } = await auth.supabase
      .from("comments")
      .insert({
        ...payload,
        author_id: auth.profile.id
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        comment: {
          ...data,
          profiles: {
            display_name: auth.profile.display_name ?? null,
            email: auth.profile.email ?? null,
            theme_token: auth.profile.theme_token ?? "sage",
            avatar_url: auth.profile.avatar_url ?? null
          }
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error);
  }
}
