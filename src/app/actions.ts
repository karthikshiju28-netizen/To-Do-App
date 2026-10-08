"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const COLORS = ["#b5551f", "#3b7a57", "#3f63a8", "#8a4b9c", "#a8433a", "#8a7a1f", "#2f7f8a", "#6b5b4a"];

const parseNames = (raw: FormDataEntryValue | null) =>
  Array.from(
    new Set(
      String(raw ?? "")
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );

/** First-run setup: create the active semester and the user's lists. */
export async function completeOnboarding(_prev: { error?: string } | undefined, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  const courses = parseNames(formData.get("courses"));
  const others = parseNames(formData.get("others"));

  if (!name || !start || !end) return { error: "Please fill in the semester name and both dates." };
  if (end <= start) return { error: "The end date has to be after the start date." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error: semErr } = await supabase
    .from("semesters")
    .insert({ user_id: user.id, name, start_date: start, end_date: end, is_active: true });
  if (semErr) return { error: semErr.message };

  const all = [
    ...courses.map((n) => ({ name: n, is_course: true })),
    ...others.filter((n) => !courses.includes(n)).map((n) => ({ name: n, is_course: false })),
  ];
  if (all.length) {
    const { error: listErr } = await supabase
      .from("lists")
      .insert(all.map((l, i) => ({ ...l, user_id: user.id, color: COLORS[i % COLORS.length] })));
    if (listErr) return { error: listErr.message };
  }
  redirect("/");
}
