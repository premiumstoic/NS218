import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { is_read } = body;

    const supabase = await createSupabaseServerClient();

    // Verify ownership
    const { data: notification } = await supabase
      .from("notifications")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (!notification || notification.user_id !== profile.id) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read })
      .eq("id", id);

    if (error) {
      console.error("Notification update error:", error);
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    // Verify ownership
    const { data: notification } = await supabase
      .from("notifications")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (!notification || notification.user_id !== profile.id) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const { error } = await supabase.from("notifications").delete().eq("id", id);

    if (error) {
      console.error("Notification delete error:", error);
      return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
