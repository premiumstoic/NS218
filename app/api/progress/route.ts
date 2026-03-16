import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

interface ProgressRequest {
  content_item_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ProgressRequest = await request.json();
    const { content_item_id } = body;

    if (!content_item_id) {
      return NextResponse.json({ error: "Missing content_item_id" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Verify the content item exists
    const { data: contentItem, error: itemError } = await supabase
      .from("content_items")
      .select("id, week_id")
      .eq("id", content_item_id)
      .maybeSingle();

    if (itemError || !contentItem) {
      return NextResponse.json({ error: "Content item not found" }, { status: 404 });
    }

    // Insert or update progress record
    const { error: upsertError } = await supabase.from("student_progress").upsert(
      {
        user_id: profile.id,
        content_item_id: content_item_id,
        completed_at: new Date().toISOString()
      },
      {
        onConflict: "user_id,content_item_id"
      }
    );

    if (upsertError) {
      console.error("Progress update error:", upsertError);
      return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
    }

    // Fetch updated week progress
    const { data: contentItems } = await supabase
      .from("content_items")
      .select("id")
      .eq("week_id", contentItem.week_id)
      .not("published_at", "is", null);

    const { data: completedItems } = await supabase
      .from("student_progress")
      .select("id")
      .eq("user_id", profile.id)
      .in(
        "content_item_id",
        contentItems?.map((c) => c.id) ?? []
      );

    const totalCount = contentItems?.length ?? 0;
    const completedCount = completedItems?.length ?? 0;
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return NextResponse.json({
      success: true,
      week_id: contentItem.week_id,
      completed_count: completedCount,
      total_count: totalCount,
      progress_percentage: progressPercentage
    });
  } catch (error) {
    console.error("Progress error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weekId = request.nextUrl.searchParams.get("week_id");
    if (!weekId) {
      return NextResponse.json({ error: "Missing week_id" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Get all content items for this week
    const { data: contentItems } = await supabase
      .from("content_items")
      .select("id")
      .eq("week_id", weekId)
      .not("published_at", "is", null);

    // Get completed items for this user in this week
    const { data: completedItems } = await supabase
      .from("student_progress")
      .select("content_item_id")
      .eq("user_id", profile.id)
      .in(
        "content_item_id",
        contentItems?.map((c) => c.id) ?? []
      );

    const totalCount = contentItems?.length ?? 0;
    const completedCount = completedItems?.length ?? 0;
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return NextResponse.json({
      week_id: weekId,
      completed_count: completedCount,
      total_count: totalCount,
      progress_percentage: progressPercentage,
      completed_item_ids: completedItems?.map((c) => c.content_item_id) ?? []
    });
  } catch (error) {
    console.error("Progress fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
