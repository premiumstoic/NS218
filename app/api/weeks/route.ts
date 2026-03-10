import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("weeks")
      .select("*")
      .eq("published", true)
      .is("archived_at", null)
      .order("week_index", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ weeks: data ?? [] });
  } catch (error) {
    return apiError(error, 500);
  }
}
