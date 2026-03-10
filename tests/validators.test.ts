import { describe, expect, it } from "vitest";
import { profilePatchSchema, quizAttemptSchema, weekCreateSchema } from "../lib/validators/api";

describe("API validators", () => {
  it("accepts valid week payload", () => {
    const parsed = weekCreateSchema.parse({
      course_code: "NS218",
      week_index: 2,
      title: "Act II surfaces",
      act: "Act II",
      start_date: "2026-03-09",
      published: true,
      is_exam_week: false
    });

    expect(parsed.week_index).toBe(2);
  });

  it("rejects invalid quiz attempt payload", () => {
    expect(() => quizAttemptSchema.parse({ answers: [] })).toThrow();
  });

  it("accepts valid profile theme token", () => {
    const parsed = profilePatchSchema.parse({
      display_name: "Test User",
      theme_token: "ocean"
    });

    expect(parsed.theme_token).toBe("ocean");
  });

  it("rejects invalid profile theme token", () => {
    expect(() => profilePatchSchema.parse({ theme_token: "purple" })).toThrow();
  });
});
