import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { SignOutButton } from "@/components/forms/signout-button";
import { ProfilePersonalizationForm } from "@/components/forms/profile-personalization-form";

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
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name ?? profile.email}
            width={72}
            height={72}
            style={{ borderRadius: "999px", objectFit: "cover", border: "1px solid var(--line)", marginBottom: "0.8rem" }}
          />
        ) : null}
        <p>
          <strong>Name:</strong> {profile.display_name ?? "-"}
        </p>
        <p>
          <strong>Email:</strong> {profile.email}
        </p>
        <p>
          <strong>Role:</strong> <span className="badge">{profile.role}</span>
        </p>
        <p>
          <strong>Theme:</strong> <span className="badge">{profile.theme_token}</span>
        </p>
        <SignOutButton />
      </section>

      <ProfilePersonalizationForm
        profile={{
          id: profile.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          theme_token: profile.theme_token
        }}
      />

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
