import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UploadClient, { type UploadRow } from "./UploadClient";

export default function UploadPage() {
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

  const [lists, uploads] = await Promise.all([
    supabase.from("lists").select("id,name").order("created_at"),
    supabase
      .from("uploads")
      .select("id,file_name,status,error,created_at")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  return (
    <main className="mx-auto max-w-[760px] px-4 pb-16 pt-5">
      <Link href="/" className="text-[13px] font-semibold text-accent">‹ Back to my list</Link>
      <h1 className="mb-1 mt-2 text-xl font-semibold">Upload course materials</h1>
      <p className="mb-5 text-[13px] text-dim">
        Add syllabi, schedules or Canvas screenshots. We&apos;ll find the deadlines, and you review them before anything is saved.
      </p>
      <UploadClient
        userId={user.id}
        lists={lists.data ?? []}
        recent={(uploads.data ?? []) as UploadRow[]}
      />
    </main>
  );
}
