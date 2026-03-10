import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();

    const { data: week, error: weekError } = await supabase
      .from("weeks")
      .select("id")
      .eq("id", id)
      .eq("published", true)
      .is("archived_at", null)
      .maybeSingle();

    if (weekError || !week) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("content_items")
      .select("id, week_id, type, title, body, published_at, created_by, updated_at")
      .eq("week_id", id)
      .not("published_at", "is", null)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ content: data ?? [] });
  } catch (error) {
    return apiError(error, 500);
  }
}
