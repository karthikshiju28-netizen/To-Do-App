import { Suspense } from "react";
import { redirect } from "next/navigation";
import { signOut } from "./actions";
import TrackerLoader from "@/components/TrackerLoader";
import { loadSchedule } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export default function Home() {
  // Reading the login cookie happens at request time, so it sits behind a loading boundary.
  return (
    <Suspense fallback={<div className="p-6 text-dim">Loading…</div>}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await loadSchedule(supabase);
  if (result.status === "needs-onboarding") redirect("/onboarding");
  if (result.status === "error") {
    return <p className="p-6 text-danger">Couldn&apos;t load your data: {result.message}</p>;
  }

  return (
    <>
      <div className="mx-auto flex max-w-[760px] items-center justify-end gap-3 px-4 pt-3 text-xs text-dim">
        {user.email}
        <form action={signOut}>
          <button className="cursor-pointer font-semibold text-accent">Sign out</button>
        </form>
      </div>
      <TrackerLoader initial={result.data} />
    </>
  );
}
