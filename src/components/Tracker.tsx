"use client";

import { useRef, useState } from "react";
import { addDays, fmtShort, fmtWeekLabel, fromISO, mondayOf, toISO } from "@/lib/dates";
import { itemToDb, templateToDb, type ScheduleSnapshot } from "@/lib/db";
import { completionKey, rowsForWeek, type ScheduleData } from "@/lib/schedule";
import { createClient } from "@/lib/supabase/client";
import type { Item, List, Row, Semester, Template } from "@/lib/types";
import AddModal, { type NewEntry } from "./AddModal";
import QuickAdd from "./QuickAdd";
import EditModal, { type EditPatch, type EditTarget } from "./EditModal";
import SemesterModal from "./SemesterModal";
import WeekDays from "./WeekDays";

type Toast = { text: string; error?: boolean; action?: { label: string; run: () => void } };
type DbResult = { error: { message: string } | null };

export default function Tracker({ initial }: { initial: ScheduleSnapshot }) {
  // Loaded browser-only (see TrackerLoader), so reading the clock here is safe.
  const [today] = useState(() => new Date());
  const [data, setData] = useState<ScheduleData>(() => ({
    ...initial,
    completions: new Set(initial.completions),
  }));
  const [supabase] = useState(() => createClient());
  const [view, setView] = useState<"week" | "semester">("week");
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [showSemester, setShowSemester] = useState(false);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const monday = weekStart;
  const thisMonday = mondayOf(today);

  function showToast(t: Toast) {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), t.error ? 8000 : 6000);
  }

  /**
   * Optimistic save: the screen has already changed. Send the change to the
   * database, and if it fails, put the screen back the way it was.
   */
  async function persist(previous: ScheduleData, run: () => PromiseLike<DbResult>) {
    const { error } = await run();
    if (error) {
      setData(previous);
      showToast({ text: `Couldn't save that change: ${error.message}`, error: true });
    }
  }

  function toggle(row: Row) {
    const previous = data;
    const nowDone = !row.done;

    if (row.kind === "template") {
      const key = completionKey(row.id, row.occurrenceDate);
      const completions = new Set(data.completions);
      if (nowDone) completions.add(key);
      else completions.delete(key);
      setData({ ...data, completions });
      persist(previous, () =>
        nowDone
          ? supabase
              .from("completions")
              .upsert(
                { template_id: row.id, occurrence_date: row.occurrenceDate, done: true },
                { onConflict: "template_id,occurrence_date" },
              )
          : supabase
              .from("completions")
              .delete()
              .eq("template_id", row.id)
              .eq("occurrence_date", row.occurrenceDate),
      );
    } else {
      setData({ ...data, items: data.items.map((i) => (i.id === row.id ? { ...i, done: nowDone } : i)) });
      persist(previous, () =>
        supabase
          .from("items")
          .update({ done: nowDone, done_at: nowDone ? new Date().toISOString() : null })
          .eq("id", row.id),
      );
    }
  }

  function remove(row: Row) {
    const previous = data;
    if (row.kind === "template") {
      const gone = data.templates.find((t) => t.id === row.id);
      if (!gone) return;
      setData({ ...data, templates: data.templates.filter((t) => t.id !== row.id) });
      persist(previous, () => supabase.from("templates").delete().eq("id", gone.id));
      showToast({
        text: `Deleted weekly "${row.title}"`,
        action: {
          label: "Undo",
          run: () => {
            setData((d) => ({ ...d, templates: [...d.templates, gone] }));
            persist(previous, () => supabase.from("templates").insert(templateToDb(gone)));
            setToast(null);
          },
        },
      });
    } else {
      const gone = data.items.find((i) => i.id === row.id);
      if (!gone) return;
      setData({ ...data, items: data.items.filter((i) => i.id !== row.id) });
      persist(previous, () => supabase.from("items").delete().eq("id", gone.id));
      showToast({
        text: `Deleted "${row.title}"`,
        action: {
          label: "Undo",
          run: () => {
            setData((d) => ({ ...d, items: [...d.items, gone] }));
            persist(previous, () => supabase.from("items").insert(itemToDb(gone)));
            setToast(null);
          },
        },
      });
    }
  }

  function add(entry: NewEntry) {
    const previous = data;
    let list: List | undefined = data.lists.find((l) => l.name.toLowerCase() === entry.listName.toLowerCase());
    const newList = list ? null : { id: crypto.randomUUID(), name: entry.listName, isCourse: false, color: null };
    list = list ?? newList!;

    let item: Item | null = null;
    let template: Template | null = null;
    if (entry.mode === "weekly") {
      template = {
        id: crypto.randomUUID(),
        listId: list.id,
        title: entry.title,
        weekday: entry.weekday,
        startDate: data.semester.startDate,
        endDate: data.semester.endDate,
      };
    } else {
      item = {
        id: crypto.randomUUID(),
        listId: list.id,
        title: entry.title,
        dueDate: entry.dueDate,
        originalDueDate: entry.dueDate,
        type: entry.type,
        done: false,
      };
    }

    setData({
      ...data,
      lists: newList ? [...data.lists, newList] : data.lists,
      items: item ? [...data.items, item] : data.items,
      templates: template ? [...data.templates, template] : data.templates,
    });
    setShowAdd(false);

    persist(previous, async () => {
      // A brand-new list has to exist before anything can point at it.
      if (newList) {
        const r = await supabase
          .from("lists")
          .insert({ id: newList.id, name: newList.name, is_course: false });
        if (r.error) return r;
      }
      return item
        ? supabase.from("items").insert(itemToDb(item))
        : supabase.from("templates").insert(templateToDb(template!));
    });
  }

  function startEdit(row: Row) {
    if (row.kind === "item") {
      const item = data.items.find((i) => i.id === row.id);
      if (item) setEditing({ kind: "item", item });
    } else {
      const template = data.templates.find((t) => t.id === row.id);
      if (template) setEditing({ kind: "template", template });
    }
  }

  function saveEdit(patch: EditPatch) {
    const previous = data;
    setEditing(null);
    if (patch.kind === "item") {
      setData({
        ...data,
        items: data.items.map((i) =>
          i.id === patch.id
            ? { ...i, listId: patch.listId, title: patch.title, dueDate: patch.dueDate, originalDueDate: patch.dueDate, type: patch.type }
            : i,
        ),
      });
      persist(previous, () =>
        supabase
          .from("items")
          .update({
            list_id: patch.listId,
            title: patch.title,
            due_date: patch.dueDate,
            original_due_date: patch.dueDate, // the user is deliberately changing the real deadline
            type: patch.type,
          })
          .eq("id", patch.id),
      );
    } else {
      setData({
        ...data,
        templates: data.templates.map((t) =>
          t.id === patch.id ? { ...t, listId: patch.listId, title: patch.title, weekday: patch.weekday } : t,
        ),
      });
      persist(previous, () =>
        supabase
          .from("templates")
          .update({ list_id: patch.listId, title: patch.title, weekday: patch.weekday })
          .eq("id", patch.id),
      );
    }
  }

  function saveSemester(s: Semester) {
    const previous = data;
    const old = data.semester;
    // Weekly tasks that followed the old semester dates follow the new ones.
    setData({
      ...data,
      semester: s,
      templates: data.templates.map((t) =>
        t.startDate === old.startDate && t.endDate === old.endDate
          ? { ...t, startDate: s.startDate, endDate: s.endDate }
          : t,
      ),
    });
    setShowSemester(false);
    persist(previous, async () => {
      const r = await supabase
        .from("semesters")
        .update({ start_date: s.startDate, end_date: s.endDate })
        .eq("id", s.id);
      if (r.error) return r;
      return supabase
        .from("templates")
        .update({ start_date: s.startDate, end_date: s.endDate })
        .eq("start_date", old.startDate)
        .eq("end_date", old.endDate);
    });
  }

  function renderSemester() {
    const end = fromISO(data.semester.endDate);
    const cards = [];
    for (let m = mondayOf(fromISO(data.semester.startDate)); m <= end; m = addDays(m, 7)) {
      const key = toISO(m);
      const days = rowsForWeek(data, m, today);
      const flat = days.flat();
      const isCurrent = key === toISO(thisMonday);
      const open = isCurrent || expanded.has(key);
      cards.push(
        <div key={key} className="mb-3 overflow-hidden rounded-[10px] border border-line bg-panel shadow-card">
          <button
            className="flex w-full cursor-pointer items-center justify-between bg-week px-3.5 py-3 text-left"
            onClick={() =>
              setExpanded((s) => {
                const n = new Set(s);
                if (n.has(key)) n.delete(key);
                else n.add(key);
                return n;
              })
            }
          >
            <span className="text-[14.5px] font-bold">
              {fmtWeekLabel(m)}
              {isCurrent && " (this week)"}
            </span>
            <span className="whitespace-nowrap rounded-full border border-line bg-panel px-2 py-0.5 text-[11.5px] font-semibold text-dim">
              {flat.filter((r) => r.done).length}/{flat.length}
            </span>
          </button>
          {open && (
            <WeekDays monday={m} days={days} today={today} onToggle={toggle} onDelete={remove} onEdit={startEdit} />
          )}
        </div>,
      );
    }
    return cards.length ? cards : <p className="text-dim italic">Set your semester dates to see the full list.</p>;
  }

  const navBtn =
    "cursor-pointer rounded-lg border border-line bg-panel px-3 py-1.5 text-[13px] text-ink hover:border-accent";
  const sem = data.semester;

  return (
    <div className="mx-auto max-w-[760px] px-4 pb-24 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <h1 className="text-xl font-semibold">{sem.name}</h1>
          <p className="mb-4 text-[13px] text-dim">
            {fmtShort(fromISO(sem.startDate))} – {fmtShort(fromISO(sem.endDate))}
          </p>
        </div>
        <button className={navBtn} onClick={() => setShowSemester(true)}>
          ⚙ Semester dates
        </button>
      </div>

      <QuickAdd lists={data.lists} onAdd={add} />

      <div className="mb-4 flex w-fit gap-1.5 rounded-full border border-line bg-panel p-1 shadow-card">
        {(["week", "semester"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`cursor-pointer rounded-full px-4 py-[7px] text-[13.5px] font-semibold ${
              view === v ? "bg-accent text-white" : "text-dim"
            }`}
          >
            {v === "week" ? "This Week" : "Whole Semester"}
          </button>
        ))}
      </div>

      {view === "week" ? (
        <>
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <button className={navBtn} onClick={() => setWeekStart(addDays(monday, -7))}>‹ Prev</button>
            <div className="text-center">
              <div className="text-[14.5px] font-bold">{fmtWeekLabel(monday)}</div>
              {toISO(monday) !== toISO(thisMonday) && (
                <button className="cursor-pointer text-xs font-semibold text-accent" onClick={() => setWeekStart(thisMonday)}>
                  Today
                </button>
              )}
            </div>
            <button className={navBtn} onClick={() => setWeekStart(addDays(monday, 7))}>Next ›</button>
          </div>
          <div className="mb-3 overflow-hidden rounded-[10px] border border-line bg-panel shadow-card">
            <WeekDays
              monday={monday}
              days={rowsForWeek(data, monday, today)}
              today={today}
              onToggle={toggle}
              onDelete={remove}
              onEdit={startEdit}
            />
          </div>
        </>
      ) : (
        renderSemester()
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-[22px] right-[22px] cursor-pointer rounded-full bg-accent px-5 py-[13px] text-sm font-bold text-white shadow-[0_4px_14px_rgba(0,0,0,.2)]"
      >
        + Add
      </button>

      {toast && (
        <div
          className={`fixed bottom-[22px] left-4 right-24 z-30 flex w-fit max-w-[calc(100%-7rem)] items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] shadow-lg ${
            toast.error ? "bg-danger text-white" : "bg-ink text-bg"
          }`}
        >
          {toast.text}
          {toast.action && (
            <button className="cursor-pointer font-bold underline" onClick={toast.action.run}>
              {toast.action.label}
            </button>
          )}
        </div>
      )}

      {showAdd && <AddModal lists={data.lists} onClose={() => setShowAdd(false)} onAdd={add} />}
      {showSemester && (
        <SemesterModal semester={sem} onClose={() => setShowSemester(false)} onSave={saveSemester} />
      )}
      {editing && (
        <EditModal target={editing} lists={data.lists} onClose={() => setEditing(null)} onSave={saveEdit} />
      )}
    </div>
  );
}
