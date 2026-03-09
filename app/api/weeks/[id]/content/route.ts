import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("content_items")
      .select("id, week_id, type, title, body, published_at, created_by, updated_at")
      .eq("week_id", id)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ content: data ?? [] });
  } catch (error) {
    return apiError(error, 500);
  }
}
