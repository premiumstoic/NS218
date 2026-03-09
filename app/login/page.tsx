import Link from "next/link";
import { AuthForm } from "@/components/forms/auth-form";

export default function LoginPage() {
  return (
    <div className="grid" style={{ maxWidth: "560px", margin: "0 auto" }}>
      <AuthForm mode="login" />
      <p className="subtle">
        No account yet? <Link href="/signup">Create one</Link>
      </p>
    </div>
  );
}
