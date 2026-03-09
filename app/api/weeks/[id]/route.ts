import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("weeks").select("*").eq("id", id).single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ week: data });
  } catch (error) {
    return apiError(error, 404);
  }
}
