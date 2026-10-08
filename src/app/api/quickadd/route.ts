import { NextResponse } from "next/server";
import { z } from "zod";
import { ExtractionError } from "@/lib/extract/gemini";
import { parseQuickAdd } from "@/lib/quickadd/parse";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

const DAILY_LIMIT = 100;

const bodySchema = z.object({
  text: z.string().trim().min(2).max(300),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Type a short note first." }, { status: 400 });

  // Cost control: a fixed number of quick-adds per user per 24 hours.
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const used = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("kind", "quickadd")
    .gte("created_at", since);
  if (used.error) {
    console.error("ai_usage check failed:", used.error.message);
    return NextResponse.json({ error: "Quick add isn't set up yet (database update needed)." }, { status: 500 });
  }
  if ((used.count ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json({ error: `Daily limit reached (${DAILY_LIMIT} quick adds). Try again tomorrow.` }, { status: 429 });
  }
  await supabase.from("ai_usage").insert({ kind: "quickadd" });

  const lists = await supabase.from("lists").select("id,name");
  try {
    const result = await parseQuickAdd(body.data.text, { today: body.data.today, lists: lists.data ?? [] });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof ExtractionError ? e.message : "Something went wrong. Please try again.";
    if (!(e instanceof ExtractionError)) console.error("Quick add failed:", e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
