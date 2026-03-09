import Link from "next/link";
import { AuthForm } from "@/components/forms/auth-form";

export default function SignupPage() {
  return (
    <div className="grid" style={{ maxWidth: "560px", margin: "0 auto" }}>
      <AuthForm mode="signup" />
      <p className="subtle">
        Already registered? <Link href="/login">Go to login</Link>
      </p>
    </div>
  );
}
