import Link from "next/link";
import type { Profile } from "@/lib/types";

interface NavBarProps {
  profile: Profile | null;
}

export function NavBar({ profile }: NavBarProps) {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          NS218 Playground
        </Link>

        <nav className="nav-links">
          <Link href="/weeks">Weeks</Link>
          <Link href="/syllabus">Syllabus Map</Link>
          {profile ? <Link href="/profile">Profile</Link> : <Link href="/login">Login</Link>}
          {profile ? <Link href="/student/uploads">Upload Center</Link> : null}
          {profile ? <Link href="/student/quizzes">Quiz History</Link> : null}
          {profile ? <Link href="/student/activity">Activity</Link> : null}
          {profile?.role === "teacher" ? <Link href="/teacher">Teacher</Link> : null}
        </nav>
      </div>
    </header>
  );
}
