import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReviewData } from "@/lib/extract/types";
import { createClient } from "@/lib/supabase/server";
import ReviewClient from "./ReviewClient";

export default function ReviewPage(props: PageProps<"/upload/[id]/review">) {
  return (
    <Suspense fallback={<div className="p-6 text-dim">Loading…</div>}>
      <Content params={props.params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [upload, lists, semester] = await Promise.all([
    supabase.from("uploads").select("id,file_name,status,list_id,raw_extraction").eq("id", id).maybeSingle(),
    supabase.from("lists").select("id,name").order("created_at"),
    supabase.from("semesters").select("start_date,end_date").eq("is_active", true).maybeSingle(),
  ]);
  if (!upload.data || !semester.data) notFound();

  const back = (
    <Link href="/upload" className="text-[13px] font-semibold text-accent">‹ Uploads</Link>
  );

  if (upload.data.status !== "review" || !upload.data.raw_extraction) {
    return (
      <main className="mx-auto max-w-[760px] px-4 pt-5">
        {back}
        <p className="mt-4 text-[13.5px]">
          {upload.data.status === "saved"
            ? "These items have already been added to your list."
            : "This upload isn't ready to review yet."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[900px] px-4 pb-32 pt-5">
      {back}
      <h1 className="mb-1 mt-2 text-xl font-semibold">Review deadlines</h1>
      <p className="mb-5 truncate text-[13px] text-dim">From {upload.data.file_name}. Nothing is saved until you click Add.</p>
      <ReviewClient
        uploadId={upload.data.id}
        data={upload.data.raw_extraction as ReviewData}
        lists={lists.data ?? []}
        defaultListId={upload.data.list_id}
        semester={{ startDate: semester.data.start_date, endDate: semester.data.end_date }}
      />
    </main>
  );
}
