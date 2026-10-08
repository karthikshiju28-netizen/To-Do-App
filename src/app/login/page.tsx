"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fieldInput } from "@/components/Modal";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[400px] flex-col justify-center px-4">
      <h1 className="mb-1 text-xl font-semibold">Syllabus To-Do</h1>
      <p className="mb-6 text-[13px] text-dim">Sign in or sign up with your email. We&apos;ll send you a link, no password needed.</p>

      {status === "sent" ? (
        <div className="rounded-[10px] border border-line bg-panel p-4 text-[13.5px] shadow-card">
          Check <b>{email}</b> for a sign-in link. You can close this tab once you click it.
        </div>
      ) : (
        <form onSubmit={sendLink} className="rounded-[10px] border border-line bg-panel p-4 shadow-card">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-dim">Email</span>
            <input
              type="email"
              required
              autoFocus
              className={fieldInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
            />
          </label>
          <button
            disabled={status === "sending"}
            className="mt-3 w-full cursor-pointer rounded-[7px] bg-accent p-2.5 text-[13.5px] font-bold text-white disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Email me a sign-in link"}
          </button>
          {status === "error" && <p className="mt-2 text-xs text-danger">{message}</p>}
        </form>
      )}
    </main>
  );
}
