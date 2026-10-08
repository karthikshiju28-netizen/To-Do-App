"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fieldInput } from "@/components/Modal";
import { createClient } from "@/lib/supabase/client";

const primaryBtn =
  "w-full cursor-pointer rounded-[7px] bg-accent p-2.5 text-[13.5px] font-bold text-white disabled:opacity-60";

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    if (error) {
      setBusy(false);
      setError("That code didn't work. Check it, or request a new one.");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function google() {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[400px] flex-col justify-center px-4">
      <h1 className="mb-1 text-xl font-semibold">Syllabus To-Do</h1>
      <p className="mb-2 text-[13px]">
        Upload a syllabus and get a weekly to-do list. The app finds every deadline, exam and recurring task, and you review them before anything is saved.
      </p>
      <p className="mb-6 text-[13px] text-dim">Sign in or sign up. No password needed.</p>

      <div className="rounded-[10px] border border-line bg-panel p-4 shadow-card">
        {step === "email" ? (
          <>
            <button
              onClick={google}
              className="mb-3 w-full cursor-pointer rounded-[7px] border border-line bg-bg p-2.5 text-[13.5px] font-bold text-ink hover:border-accent"
            >
              Continue with Google
            </button>
            <div className="mb-3 text-center text-[11px] uppercase tracking-wider text-dim">or use email</div>
            <form onSubmit={sendLink}>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-dim">Email</span>
                <input
                  type="email"
                  required
                  className={fieldInput}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                />
              </label>
              <button disabled={busy} className={`${primaryBtn} mt-3`}>
                {busy ? "Sending…" : "Email me a sign-in link"}
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={verifyCode}>
            <p className="mb-3 text-[13.5px]">
              We emailed <b>{email}</b>. Click the link in it, <b>or</b> type the 6-digit code from the email here. The code is handy if your school&apos;s email filter breaks the link.
            </p>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              className={`${fieldInput} text-center text-lg tracking-[0.3em]`}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
            />
            <button disabled={busy || code.length < 6} className={`${primaryBtn} mt-3`}>
              {busy ? "Checking…" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
              className="mt-2 w-full cursor-pointer text-xs font-semibold text-accent"
            >
              Use a different email
            </button>
          </form>
        )}
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </div>
      <p className="mt-4 text-center text-[11.5px] text-dim">
        By continuing you agree to the <Link href="/terms" className="underline">Terms</Link> and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </main>
  );
}
