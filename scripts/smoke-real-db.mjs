import { createClient } from "@supabase/supabase-js";

function fail(message) {
  throw new Error(message);
}

function logStep(message) {
  console.log(`\n[smoke] ${message}`);
}

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
];

for (const key of required) {
  if (!process.env[key]) {
    fail(`Missing env var: ${key}`);
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const service = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const authed = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

let createdUserId = null;
let createdCommentId = null;

try {
  logStep("Checking public weeks visibility as anonymous client");
  const { data: weeks, error: weeksError } = await anon.from("weeks").select("id,title,published").limit(5);
  if (weeksError) {
    fail(`Anon weeks read failed: ${weeksError.message}`);
  }
  if (!weeks || weeks.length === 0) {
    fail("No published weeks found; seed may be missing or RLS blocking.");
  }

  const weekId = weeks[0].id;
  console.log(`[ok] Found ${weeks.length} week rows (sample week id: ${weekId})`);

  logStep("Verifying unauthorized comment insert is blocked");
  const { error: anonInsertError } = await anon.from("comments").insert({
    target_type: "week",
    target_id: weekId,
    body: "anon smoke attempt"
  });
  if (!anonInsertError) {
    fail("Expected anon comment insert to fail, but it succeeded.");
  }
  console.log(`[ok] Anon insert blocked: ${anonInsertError.message}`);

  logStep("Creating temporary authenticated student user");
  const tempEmail = `ns218-smoke-${Date.now()}@example.com`;
  const tempPassword = `Smoke!${Date.now()}`;
  const { data: createdUser, error: createUserError } = await service.auth.admin.createUser({
    email: tempEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { display_name: "Smoke Test User" }
  });
  if (createUserError || !createdUser.user) {
    fail(`Create temp user failed: ${createUserError?.message ?? "unknown"}`);
  }
  createdUserId = createdUser.user.id;
  console.log(`[ok] Created temp user ${tempEmail}`);

  logStep("Signing in as temporary user");
  const { data: signInData, error: signInError } = await authed.auth.signInWithPassword({
    email: tempEmail,
    password: tempPassword
  });
  if (signInError || !signInData.user) {
    fail(`Temp user sign-in failed: ${signInError?.message ?? "unknown"}`);
  }
  console.log(`[ok] Signed in user id ${signInData.user.id}`);

  logStep("Ensuring profile row is visible for authenticated user");
  const { data: profile, error: profileError } = await authed
    .from("profiles")
    .select("id,email,role")
    .eq("id", signInData.user.id)
    .maybeSingle();
  if (profileError) {
    fail(`Profile read failed: ${profileError.message}`);
  }
  if (!profile) {
    fail("No profile row found for temp user.");
  }
  console.log(`[ok] Profile exists with role=${profile.role}`);

  logStep("Inserting authenticated comment on a published week");
  const { data: comment, error: commentError } = await authed
    .from("comments")
    .insert({
      author_id: signInData.user.id,
      target_type: "week",
      target_id: weekId,
      body: "smoke: authenticated comment"
    })
    .select("id")
    .single();
  if (commentError || !comment) {
    fail(`Authenticated comment insert failed: ${commentError?.message ?? "unknown"}`);
  }
  createdCommentId = comment.id;
  console.log(`[ok] Comment inserted id=${createdCommentId}`);

  logStep("Verifying comment is publicly readable on published week");
  const { data: publicComments, error: publicCommentsError } = await anon
    .from("comments")
    .select("id,target_type,target_id")
    .eq("target_type", "week")
    .eq("target_id", weekId)
    .eq("id", createdCommentId);
  if (publicCommentsError) {
    fail(`Public comment read failed: ${publicCommentsError.message}`);
  }
  if (!publicComments || publicComments.length !== 1) {
    fail("Inserted comment is not publicly visible as expected.");
  }
  console.log("[ok] Public comment visibility verified");

  logStep("Verifying student cannot create weeks");
  const { error: forbiddenWeekInsertError } = await authed.from("weeks").insert({
    course_code: "NS218",
    week_index: 999,
    title: "forbidden-student-insert",
    start_date: "2026-12-31",
    is_exam_week: false,
    published: false
  });
  if (!forbiddenWeekInsertError) {
    fail("Expected student week insert to fail, but it succeeded.");
  }
  console.log(`[ok] Student week insert blocked: ${forbiddenWeekInsertError.message}`);

  console.log("\n[smoke] PASS: Real DB + RLS smoke suite completed successfully.");
} finally {
  if (createdCommentId) {
    await service.from("comments").delete().eq("id", createdCommentId);
    console.log(`[cleanup] Deleted temp comment ${createdCommentId}`);
  }

  if (createdUserId) {
    await service.auth.admin.deleteUser(createdUserId);
    console.log(`[cleanup] Deleted temp user ${createdUserId}`);
  }
}
