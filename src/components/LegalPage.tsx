import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-[680px] px-4 py-8 text-[14px] leading-relaxed">
      <Link href="/login" className="text-[13px] font-semibold text-accent">‹ Syllabus To-Do</Link>
      <h1 className="mb-1 mt-3 text-2xl font-semibold">{title}</h1>
      <p className="mb-6 text-xs text-dim">Last updated {updated}</p>
      <div className="space-y-4 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-bold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </main>
  );
}

export const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
export const contactLine = CONTACT
  ? `email ${CONTACT}`
  : "use the contact email shown on the Google sign-in screen";
