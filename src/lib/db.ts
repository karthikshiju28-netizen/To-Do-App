import type { SupabaseClient } from "@supabase/supabase-js";
import { completionKey, type ScheduleData } from "./schedule";
import type { Item, ItemType, List, Semester, Template } from "./types";

// Database rows use snake_case; the app uses camelCase. These convert between them.

export interface ItemRowDb {
  id: string;
  list_id: string;
  title: string;
  due_date: string;
  original_due_date: string;
  type: ItemType;
  done: boolean;
  done_at: string | null;
}

export const itemFromDb = (r: ItemRowDb): Item => ({
  id: r.id,
  listId: r.list_id,
  title: r.title,
  dueDate: r.due_date,
  originalDueDate: r.original_due_date,
  type: r.type,
  done: r.done,
});

export const itemToDb = (i: Item): ItemRowDb => ({
  id: i.id,
  list_id: i.listId,
  title: i.title,
  due_date: i.dueDate,
  original_due_date: i.originalDueDate,
  type: i.type,
  done: i.done,
  done_at: i.done ? new Date().toISOString() : null,
});

export const templateToDb = (t: Template) => ({
  id: t.id,
  list_id: t.listId,
  title: t.title,
  weekday: t.weekday,
  start_date: t.startDate,
  end_date: t.endDate,
});

/** Plain-JSON version of ScheduleData so it can be passed from server to client. */
export type ScheduleSnapshot = Omit<ScheduleData, "completions"> & { completions: string[] };

export type LoadResult =
  | { status: "ok"; data: ScheduleSnapshot }
  | { status: "needs-onboarding" }
  | { status: "error"; message: string };

/** Everything the signed-in user owns (row-level security filters it to them). */
export async function loadSchedule(supabase: SupabaseClient): Promise<LoadResult> {
  const [sem, lists, items, templates, completions] = await Promise.all([
    supabase.from("semesters").select("id,name,start_date,end_date").eq("is_active", true).maybeSingle(),
    supabase.from("lists").select("id,name,is_course,color").order("created_at"),
    supabase.from("items").select("id,list_id,title,due_date,original_due_date,type,done,done_at"),
    supabase.from("templates").select("id,list_id,title,weekday,start_date,end_date"),
    supabase.from("completions").select("template_id,occurrence_date").eq("done", true),
  ]);

  const failed = [sem, lists, items, templates, completions].find((r) => r.error);
  if (failed?.error) return { status: "error", message: failed.error.message };
  if (!sem.data) return { status: "needs-onboarding" };

  const semester: Semester = {
    id: sem.data.id,
    name: sem.data.name,
    startDate: sem.data.start_date,
    endDate: sem.data.end_date,
  };

  return {
    status: "ok",
    data: {
      semester,
      lists: (lists.data ?? []).map(
        (l): List => ({ id: l.id, name: l.name, isCourse: l.is_course, color: l.color }),
      ),
      items: (items.data ?? []).map((r) => itemFromDb(r as ItemRowDb)),
      templates: (templates.data ?? []).map(
        (t): Template => ({
          id: t.id,
          listId: t.list_id,
          title: t.title,
          weekday: t.weekday,
          startDate: t.start_date,
          endDate: t.end_date,
        }),
      ),
      completions: (completions.data ?? []).map((c) => completionKey(c.template_id, c.occurrence_date)),
    },
  };
}
