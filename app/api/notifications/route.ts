import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unreadOnly = request.nextUrl.searchParams.get("unread_only") === "true";
    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from("notifications")
      .select("id,message,link,is_read,created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Notifications fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    return NextResponse.json({
      notifications: data ?? [],
      unread_count: data?.filter((n) => !n.is_read).length ?? 0
    });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
