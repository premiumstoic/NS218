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
  const [oauthLoading, setOauthLoading] = useState(false);

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

  async function onGoogleSignIn() {
    setOauthLoading(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/profile")}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo
      }
    });

    if (error) {
      setMessage(error.message);
      setOauthLoading(false);
    }
  }

  return (
    <form className="card form-stack auth-form" onSubmit={onSubmit}>
      <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif" }}>
        {isSignup ? "Create Account" : "Login"}
      </h1>
      <p className="subtle">
        {isSignup
          ? "Open signup is enabled. Teacher role is assigned by TEACHER_EMAILS."
          : "Use your class account to upload, discuss, and save quiz attempts."}
      </p>

      {isSignup ? (
        <div className="field">
          <label htmlFor="display-name">Display name</label>
          <input id="display-name" type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          minLength={6}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <button disabled={loading}>{loading ? "Working..." : isSignup ? "Create account" : "Login"}</button>
      <button type="button" className="secondary" disabled={oauthLoading} onClick={onGoogleSignIn}>
        {oauthLoading ? "Redirecting..." : "Continue with Google"}
      </button>
      {message ? <p className="subtle">{message}</p> : null}
    </form>
  );
}
