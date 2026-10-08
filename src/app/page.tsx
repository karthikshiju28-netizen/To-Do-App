import Link from "next/link";
import { QuickAddMock, ReviewMock, WeekMock } from "@/components/landing/Mock";

export const metadata = {
  title: "Syllabus To-Do: turn your syllabi into a weekly to-do list",
  description:
    "Upload a syllabus or a Canvas screenshot. We find every deadline, exam and weekly task, you review them, then check things off week by week.",
};

const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-[15px] font-bold text-white shadow-[0_6px_20px_-6px_rgba(181,85,31,0.6)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const btnGhost =
  "inline-flex items-center justify-center rounded-full border border-line bg-panel px-6 py-3 text-[15px] font-semibold text-ink transition hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const steps = [
  {
    n: "1",
    title: "Upload",
    body: "Drop in a syllabus PDF, a screenshot of your course page, or just paste the text. Several files at once is fine.",
  },
  {
    n: "2",
    title: "Review",
    body: "Every deadline appears with the exact line it came from. Fix a date, untick something, or skip it. Nothing is saved until you say so.",
  },
  {
    n: "3",
    title: "Check off",
    body: "See just this week, or the whole semester. Weekly tasks repeat on their own, and missed items stay in front of you until they're done.",
  },
];

const features = [
  { title: "Understands “Week 5 Tuesday”", body: "Relative dates are turned into real calendar dates using your semester start." },
  { title: "Weekly tasks, not 14 copies", body: "A weekly quiz becomes one repeating task with a fresh checkbox every week." },
  { title: "Nothing slips through", body: "Anything you haven't finished moves to today with an overdue tag. The real due date is never lost." },
  { title: "Private by default", body: "Your lists and files are only visible to you, and every account is separate." },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-[1040px] items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent text-[15px] text-white">✓</span>
          Syllabus To-Do
        </Link>
        <Link href="/login" className="rounded-full px-4 py-2 text-[14px] font-semibold text-ink hover:text-accent">
          Sign in
        </Link>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-[1040px] items-center gap-10 px-4 pb-16 pt-8 md:grid-cols-[1.05fr_1fr] md:pt-14">
          <div>
            <p className="mb-4 inline-block rounded-full bg-accent-soft px-3 py-1 text-[12.5px] font-semibold text-accent">
              Free · made for students
            </p>
            <h1 className="font-serif text-[40px] font-semibold leading-[1.08] tracking-tight sm:text-[52px]">
              Your syllabus, turned into a to-do list.
            </h1>
            <p className="mt-5 max-w-[34rem] text-[17px] leading-relaxed text-dim">
              Upload a syllabus or a Canvas screenshot. We pull out every deadline, exam and weekly task. You check them, then tick things off week by week.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login" className={btnPrimary}>Get started</Link>
              <a href="#how" className={btnGhost}>See how it works</a>
            </div>
            <p className="mt-4 text-[13px] text-dim">Sign in with Google or email. No password, no card.</p>
          </div>
          <div className="md:rotate-[1.2deg]">
            <WeekMock />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-line-soft bg-week/60">
          <div className="mx-auto max-w-[1040px] px-4 py-16">
            <h2 className="font-serif text-[30px] font-semibold tracking-tight sm:text-[36px]">From PDF to checklist in three steps</h2>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {steps.map((s) => (
                <li key={s.n} className="rounded-[14px] border border-line bg-panel p-6 shadow-card">
                  <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[15px] font-bold text-white">
                    {s.n}
                  </span>
                  <h3 className="text-[18px] font-bold">{s.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-dim">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Review emphasis */}
        <section className="mx-auto grid max-w-[1040px] items-center gap-10 px-4 py-16 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <ReviewMock />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="font-serif text-[30px] font-semibold leading-tight tracking-tight sm:text-[36px]">
              You stay in control.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-dim">
              AI can misread things, so every deadline shows the sentence it came from. Anything unclear, like &ldquo;TBD&rdquo; or a date outside your semester, is flagged instead of guessed. Fix it or skip it before it reaches your list.
            </p>
          </div>
        </section>

        {/* Quick add */}
        <section className="border-y border-line-soft bg-week/60">
          <div className="mx-auto grid max-w-[1040px] items-center gap-10 px-4 py-16 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-[30px] font-semibold leading-tight tracking-tight sm:text-[36px]">
                Add things the way you think them.
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-dim">
                Type &ldquo;write letter due tommo&rdquo; or &ldquo;HW4 for cee331 next friday&rdquo;. It understands shorthand, picks the right class, and fills in the date for you to confirm.
              </p>
            </div>
            <QuickAddMock />
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-[1040px] px-4 py-16">
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="flex gap-3.5">
                <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                <div>
                  <h3 className="text-[16.5px] font-bold">{f.title}</h3>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-dim">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final call to action */}
        <section className="mx-auto max-w-[1040px] px-4 pb-20">
          <div className="rounded-[20px] bg-accent px-6 py-12 text-center text-white sm:px-12">
            <h2 className="font-serif text-[30px] font-semibold tracking-tight sm:text-[38px]">Start with one syllabus.</h2>
            <p className="mx-auto mt-3 max-w-[30rem] text-[16px] opacity-90">
              It takes about two minutes to set up your semester and see your first week.
            </p>
            <Link
              href="/login"
              className="mt-7 inline-flex rounded-full bg-white px-7 py-3 text-[15px] font-bold text-[#8f3f12] transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Get started free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line-soft">
        <div className="mx-auto flex max-w-[1040px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-[12.5px] text-dim">
          <p className="max-w-[40rem]">
            Deadlines are suggested by AI (Google Gemini) and can be wrong. Always check them against your official course materials. Please don&apos;t upload private documents.
          </p>
          <nav className="flex gap-4">
            <Link href="/privacy" className="hover:text-accent">Privacy</Link>
            <Link href="/terms" className="hover:text-accent">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
