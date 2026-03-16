import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Create a notification for a specific user
 */
export async function createNotification(
  userId: string,
  message: string,
  link?: string
) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.from("notifications").insert({
      user_id: userId,
      message,
      link: link || null
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

/**
 * Create notifications for all students in a course
 */
export async function notifyAllStudents(
  message: string,
  link?: string
) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get all students
    const { data: students } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "student");

    if (!students) return;

    // Create notifications for each student
    const notifications = students.map((student) => ({
      user_id: student.id,
      message,
      link: link || null
    }));

    await supabase.from("notifications").insert(notifications);
  } catch (error) {
    console.error("Failed to notify all students:", error);
  }
}

/**
 * Notify a user about a comment reply
 */
export async function notifyCommentReply(
  userId: string,
  replyAuthorName: string,
  targetType: "week" | "content_item" | "upload",
  targetId: string
) {
  const messageMap = {
    week: "Week",
    content_item: "Content",
    upload: "Upload"
  };

  const message = `${replyAuthorName} replied to the discussion on a ${messageMap[targetType]}`;
  const link = targetType === "content_item" ? `/content/${targetId}` : `/weeks/${targetId}`;

  await createNotification(userId, message, link);
}
