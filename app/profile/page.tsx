import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { SignOutButton } from "@/components/forms/signout-button";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="grid">
      <section className="card">
        <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Profile
        </h1>
        <p>
          <strong>Name:</strong> {profile.display_name ?? "-"}
        </p>
        <p>
          <strong>Email:</strong> {profile.email}
        </p>
        <p>
          <strong>Role:</strong> <span className="badge">{profile.role}</span>
        </p>
        <SignOutButton />
      </section>

      <section className="card">
        <h2 className="section-title">Quick links</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
          <Link className="button secondary" href="/student/uploads">
            Upload Center
          </Link>
          <Link className="button secondary" href="/student/activity">
            My Activity
          </Link>
          <Link className="button secondary" href="/student/quizzes">
            Quiz Attempts
          </Link>
          {profile.role === "teacher" ? (
            <Link className="button" href="/teacher">
              Teacher Dashboard
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
