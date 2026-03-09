import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="card">
      <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif" }}>
        Not Found
      </h1>
      <p className="subtle">The requested page does not exist or is not visible under current access rules.</p>
      <Link className="button secondary" href="/">
        Back to home
      </Link>
    </section>
  );
}
