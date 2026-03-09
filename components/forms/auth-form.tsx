"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Account created. If email confirmation is enabled, confirm email and then login.");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setMessage(error.message);
      } else {
        router.push("/profile");
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif" }}>
        {isSignup ? "Create Account" : "Login"}
      </h1>
      <p className="subtle">
        {isSignup
          ? "Open signup is enabled. Teacher role is assigned by TEACHER_EMAILS."
          : "Use your class account to upload, discuss, and save quiz attempts."}
      </p>

      {isSignup ? (
        <label>
          Display name
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
        </label>
      ) : null}

      <label>
        Email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>

      <label>
        Password
        <input
          type="password"
          value={password}
          minLength={6}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      <button disabled={loading}>{loading ? "Working..." : isSignup ? "Create account" : "Login"}</button>
      {message ? <p className="subtle">{message}</p> : null}
    </form>
  );
}
