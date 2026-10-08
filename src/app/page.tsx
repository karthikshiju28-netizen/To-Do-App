import { redirect } from "next/navigation";
import { signOut } from "./actions";
import TrackerLoader from "@/components/TrackerLoader";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // First run: no active semester yet, so send them through setup.
  const { data: semester, error } = await supabase
    .from("semesters")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    return (
      <p className="p-6 text-danger">
        Couldn&apos;t reach the database: {error.message}. Has the SQL migration been run?
      </p>
    );
  }
  if (!semester) redirect("/onboarding");

  return (
    <>
      <div className="mx-auto flex max-w-[760px] items-center justify-end gap-3 px-4 pt-3 text-xs text-dim">
        {user.email}
        <form action={signOut}>
          <button className="cursor-pointer font-semibold text-accent">Sign out</button>
        </form>
      </div>
      <TrackerLoader />
    </>
  );
}
