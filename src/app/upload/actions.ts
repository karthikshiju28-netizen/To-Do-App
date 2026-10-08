"use server";

import { z } from "zod";
import { ITEM_TYPES } from "@/lib/extract/types";
import { createClient } from "@/lib/supabase/server";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
// A list is either an existing list's id or "new" (the list named in newListName).
const listRef = z.union([z.string().uuid(), z.literal("new")]);

const payloadSchema = z.object({
  uploadId: z.string().uuid(),
  newListName: z.string().trim().min(1).max(60).nullable(),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        dueDate: date,
        type: z.enum(ITEM_TYPES),
        listRef,
        sourceQuote: z.string().max(400).nullable(),
      }),
    )
    .max(300),
  weekly: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        weekday: z.number().int().min(0).max(6),
        startDate: date,
        endDate: date,
        listRef,
      }),
    )
    .max(60),
});

export type SavePayload = z.input<typeof payloadSchema>;

/** Saves the rows the user ticked on the review screen. */
export async function saveReview(input: SavePayload): Promise<{ error?: string }> {
  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) return { error: "Some rows are incomplete. Check the dates and titles." };
  const p = parsed.data;
  if (!p.items.length && !p.weekly.length) return { error: "Nothing selected." };

  const needsNew = [...p.items, ...p.weekly].some((r) => r.listRef === "new");
  if (needsNew && !p.newListName) return { error: "Choose or name a list for these items." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  // Claim the upload first so saving twice can't duplicate everything.
  const { data: claimed } = await supabase
    .from("uploads")
    .update({ status: "saved" })
    .eq("id", p.uploadId)
    .eq("status", "review")
    .select("id");
  if (!claimed?.length) return { error: "These items were already added (or the upload isn't ready)." };

  const undo = async (message: string) => {
    // Remove anything this attempt already saved so a retry can't create duplicates.
    await supabase.from("items").delete().eq("source_upload_id", p.uploadId);
    await supabase.from("uploads").update({ status: "review" }).eq("id", p.uploadId);
    return { error: message };
  };

  let newListId: string | null = null;
  if (needsNew) {
    // Reuse a list of the same name rather than failing on the unique-name rule.
    const existing = await supabase.from("lists").select("id").eq("name", p.newListName!).maybeSingle();
    if (existing.data) newListId = existing.data.id;
    else {
      const created = await supabase
        .from("lists")
        .insert({ name: p.newListName!, is_course: true })
        .select("id")
        .single();
      if (created.error) return undo(`Couldn't create the list: ${created.error.message}`);
      newListId = created.data.id;
    }
  }
  const resolve = (ref: string) => (ref === "new" ? newListId! : ref);

  if (p.items.length) {
    const { error } = await supabase.from("items").insert(
      p.items.map((i) => ({
        list_id: resolve(i.listRef),
        title: i.title,
        due_date: i.dueDate,
        original_due_date: i.dueDate,
        type: i.type,
        source_upload_id: p.uploadId,
        source_quote: i.sourceQuote,
      })),
    );
    if (error) return undo(`Couldn't save items: ${error.message}`);
  }
  if (p.weekly.length) {
    const { error } = await supabase.from("templates").insert(
      p.weekly.map((w) => ({
        list_id: resolve(w.listRef),
        title: w.title,
        weekday: w.weekday,
        start_date: w.startDate,
        end_date: w.endDate,
      })),
    );
    if (error) return undo(`Couldn't save weekly tasks: ${error.message}`);
  }
  return {};
}
