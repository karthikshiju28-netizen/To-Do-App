"use client";

import { useActionState } from "react";
import { completeOnboarding } from "../actions";
import { fieldInput } from "@/components/Modal";

const label = "mb-1 block text-xs font-semibold text-dim";

export default function OnboardingPage() {
  const [state, action, pending] = useActionState(completeOnboarding, undefined);

  return (
    <main className="mx-auto max-w-[460px] px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold">Set up your semester</h1>
      <p className="mb-5 text-[13px] text-dim">
        Two minutes. You can change all of this later, and you&apos;ll upload your syllabi next.
      </p>

      <form action={action} className="space-y-3.5 rounded-[10px] border border-line bg-panel p-4 shadow-card">
        <label className="block">
          <span className={label}>Semester name</span>
          <input name="name" required defaultValue="Fall 2026" className={fieldInput} />
        </label>
        <div className="flex gap-3">
          <label className="block flex-1">
            <span className={label}>Starts (a Monday)</span>
            <input name="start" type="date" required className={fieldInput} />
          </label>
          <label className="block flex-1">
            <span className={label}>Ends</span>
            <input name="end" type="date" required className={fieldInput} />
          </label>
        </div>
        <label className="block">
          <span className={label}>Your classes (one per line)</span>
          <textarea name="courses" rows={4} placeholder={"CEE 331\nCHEM 232"} className={fieldInput} />
        </label>
        <label className="block">
          <span className={label}>Other lists (clubs, personal, work)</span>
          <textarea name="others" rows={2} defaultValue="Personal" className={fieldInput} />
        </label>
        {state?.error && <p className="text-xs text-danger">{state.error}</p>}
        <button
          disabled={pending}
          className="w-full cursor-pointer rounded-[7px] bg-accent p-2.5 text-[13.5px] font-bold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Continue"}
        </button>
      </form>
    </main>
  );
}
