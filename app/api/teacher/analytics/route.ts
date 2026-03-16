import { requireApiProfile } from "@/lib/api-auth";
import { apiError } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await requireApiProfile({ teacherOnly: true });
    if (auth.error) {
      return auth.error;
    }

    // Fetch quiz analytics
    const { data: quizAnalytics } = await auth.supabase
      .from("quiz_analytics")
      .select("*")
      .order("week_index", { ascending: true });

    // Fetch student performance
    const { data: studentPerformance } = await auth.supabase
      .from("student_quiz_performance")
      .select("*")
      .order("average_score", { ascending: false });

    // Fetch weekly engagement
    const { data: weeklyEngagement } = await auth.supabase
      .from("weekly_engagement")
      .select("*")
      .order("week_index", { ascending: true });

    // Calculate summary statistics
    const summaryStats = {
      total_students: studentPerformance?.length ?? 0,
      avg_quiz_score: studentPerformance
        ? (
            studentPerformance.reduce((sum, s) => sum + (s.average_score ?? 0), 0) /
            studentPerformance.length
          ).toFixed(2)
        : 0,
      quiz_pass_rate: studentPerformance
        ? (
            (studentPerformance.filter((s) => (s.pass_rate ?? 0) >= 70).length /
              studentPerformance.length) *
            100
          ).toFixed(2)
        : 0,
      avg_participation_rate: weeklyEngagement
        ? (
            weeklyEngagement.reduce((sum, w) => sum + (w.quiz_participation_rate ?? 0), 0) /
            weeklyEngagement.length
          ).toFixed(2)
        : 0
    };

    return NextResponse.json({
      summary: summaryStats,
      quiz_analytics: quizAnalytics ?? [],
      student_performance: studentPerformance ?? [],
      weekly_engagement: weeklyEngagement ?? []
    });
  } catch (error) {
    return apiError(error);
  }
}
