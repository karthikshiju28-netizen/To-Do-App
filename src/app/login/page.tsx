"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const primaryBtn =
  "w-full cursor-pointer rounded-[10px] bg-accent px-4 py-3.5 text-[16px] font-bold text-white shadow-[0_6px_18px_-8px_rgba(181,85,31,0.7)] transition hover:brightness-110 disabled:opacity-60";
const bigInput = "w-full rounded-[10px] border border-line bg-bg px-3.5 py-3 text-[16px] text-ink";

function GoogleG() {
  return (
    <svg aria-hidden width="22" height="22" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

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
      router.push("/app");
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
    <main className="mx-auto flex min-h-screen max-w-[460px] flex-col justify-center px-4">
      <h1 className="mb-2 font-serif text-[32px] font-semibold tracking-tight">Syllabus To-Do</h1>
      <p className="mb-2 text-[15px] leading-relaxed">
        Upload a syllabus and get a weekly to-do list. The app finds every deadline, exam and recurring task, and you review them before anything is saved.
      </p>
      <p className="mb-6 text-[14px] text-dim">Sign in or sign up. No password needed.</p>

      <div className="rounded-[16px] border border-line bg-panel p-6 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.3)]">
        {step === "email" ? (
          <>
            <button
              onClick={google}
              className="mb-4 flex w-full cursor-pointer items-center justify-center gap-3 rounded-[10px] border-2 border-line bg-bg px-4 py-3.5 text-[16px] font-bold text-ink transition hover:border-accent"
            >
              <GoogleG />
              Continue with Google
            </button>
            <div className="mb-4 flex items-center gap-3 text-[12px] uppercase tracking-wider text-dim"><span className="h-px flex-1 bg-line" />or use email<span className="h-px flex-1 bg-line" /></div>
            <form onSubmit={sendLink}>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-dim">Email</span>
                <input
                  type="email"
                  required
                  className={bigInput}
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
            <p className="mb-4 text-[15px] leading-relaxed">
              We emailed <b>{email}</b>. Click the link in it, <b>or</b> type the 6-digit code from the email here. The code is handy if your school&apos;s email filter breaks the link.
            </p>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              className={`${bigInput} text-center text-2xl tracking-[0.3em]`}
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
              className="mt-3 w-full cursor-pointer text-[14px] font-semibold text-accent"
            >
              Use a different email
            </button>
          </form>
        )}
        {error && <p className="mt-3 text-[14px] text-danger">{error}</p>}
      </div>
      <p className="mt-5 text-center text-[13px] text-dim">
        By continuing you agree to the <Link href="/terms" className="underline">Terms</Link> and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </main>
  );
}
