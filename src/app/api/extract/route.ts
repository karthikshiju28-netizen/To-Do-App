import { NextResponse } from "next/server";
import { z } from "zod";
import { runGemini, ExtractionError } from "@/lib/extract/gemini";
import { ALLOWED_MIME, DAILY_UPLOAD_LIMIT } from "@/lib/extract/limits";
import { postProcess } from "@/lib/extract/validate";
import { createClient } from "@/lib/supabase/server";

// Reading a long PDF can take a while. (Vercel's free plan allows up to 60 seconds.)
export const maxDuration = 60;

const bodySchema = z.object({
  uploadId: z.string().uuid(),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const { uploadId } = body.data;

  // Row-level security means this only finds the signed-in user's own uploads.
  const { data: upload } = await supabase.from("uploads").select("*").eq("id", uploadId).maybeSingle();
  if (!upload) return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  if (!upload.storage_path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (upload.status !== "pending" && upload.status !== "failed") {
    return NextResponse.json({ status: upload.status }); // already handled
  }

  const fail = async (message: string, httpStatus: number) => {
    await supabase.from("uploads").update({ status: "failed", error: message }).eq("id", uploadId);
    return NextResponse.json({ status: "failed", error: message }, { status: httpStatus });
  };

  if (!(ALLOWED_MIME as readonly string[]).includes(upload.mime_type ?? "")) {
    return fail("That file type isn't supported. Use a PDF, PNG, JPG, WebP or pasted text.", 400);
  }

  // Cost control: at most DAILY_UPLOAD_LIMIT uploads per user in any 24 hours.
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabase
    .from("uploads")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since)
    .neq("id", uploadId)
    .or("error.is.null,error.neq.limit"); // uploads refused for hitting the limit don't count against it
  if ((count ?? 0) >= DAILY_UPLOAD_LIMIT) {
    await supabase.from("uploads").update({ status: "failed", error: "limit" }).eq("id", uploadId);
    return NextResponse.json(
      { status: "failed", error: `Daily limit reached (${DAILY_UPLOAD_LIMIT} uploads per day). Try again tomorrow.` },
      { status: 429 },
    );
  }

  // Claim the upload so a double click can't run it twice.
  const { data: claimed } = await supabase
    .from("uploads")
    .update({ status: "extracting", error: null })
    .eq("id", uploadId)
    .eq("status", upload.status)
    .select("id");
  if (!claimed?.length) return NextResponse.json({ status: "extracting" });

  try {
    const [file, sem, lists, items, templates] = await Promise.all([
      supabase.storage.from("uploads").download(upload.storage_path),
      supabase.from("semesters").select("name,start_date,end_date").eq("is_active", true).maybeSingle(),
      supabase.from("lists").select("name"),
      supabase.from("items").select("title,due_date"),
      supabase.from("templates").select("title,weekday"),
    ]);
    if (file.error || !file.data) return fail("Couldn't read the uploaded file. Please upload it again.", 500);
    if (!sem.data) return fail("Set up your semester first.", 400);

    const semester = { name: sem.data.name, startDate: sem.data.start_date, endDate: sem.data.end_date };
    const bytes = new Uint8Array(await file.data.arrayBuffer());

    const raw = await runGemini(
      { bytes, mimeType: upload.mime_type },
      {
        semester,
        today: body.data.today ?? new Date().toISOString().slice(0, 10),
        listNames: (lists.data ?? []).map((l) => l.name),
      },
    );

    const review = postProcess(raw, {
      semester,
      existingItems: (items.data ?? []).map((i) => ({ title: i.title, dueDate: i.due_date })),
      existingTemplates: (templates.data ?? []).map((t) => ({ title: t.title, weekday: t.weekday })),
      model: raw.model,
    });

    await supabase.from("uploads").update({ status: "review", raw_extraction: review, error: null }).eq("id", uploadId);
    return NextResponse.json({ status: "review" });
  } catch (e) {
    const message =
      e instanceof ExtractionError ? e.message : "Something went wrong while reading this file. Please try again.";
    if (!(e instanceof ExtractionError)) console.error("Extraction failed:", e);
    return fail(message, 502);
  }
}
