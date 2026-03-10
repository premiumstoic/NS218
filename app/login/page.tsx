import Link from "next/link";
import { AuthForm } from "@/components/forms/auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="grid" style={{ maxWidth: "560px", margin: "0 auto" }}>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      <AuthForm mode="login" />
      <p className="subtle">
        No account yet? <Link href="/signup">Create one</Link>
      </p>
    </div>
  );
}
