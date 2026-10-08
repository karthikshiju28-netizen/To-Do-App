"use client";

import { useRef, useState } from "react";
import { addDays, fmtWeekLabel, fromISO, mondayOf, toISO } from "@/lib/dates";
import { buildFakeData } from "@/lib/fakeData";
import { completionKey, rowsForWeek, type ScheduleData } from "@/lib/schedule";
import type { Item, Row, Semester, Template } from "@/lib/types";
import AddModal, { type NewEntry } from "./AddModal";
import SemesterModal from "./SemesterModal";
import WeekDays from "./WeekDays";

type Undo = { label: string; restore: () => void };

export default function Tracker() {
  // Loaded browser-only (see TrackerLoader), so reading the clock here is safe.
  const [today] = useState(() => new Date());
  const [data, setData] = useState<ScheduleData>(() => buildFakeData(new Date()));
  const [view, setView] = useState<"week" | "semester">("week");
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [showSemester, setShowSemester] = useState(false);
  const [undo, setUndo] = useState<Undo | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const nextId = useRef(1000);

  const monday = weekStart;
  const thisMonday = mondayOf(today);
  const update = (fn: (d: ScheduleData) => ScheduleData) => setData(fn);

  function toggle(row: Row) {
    update((d) => {
      if (row.kind === "template") {
        const completions = new Set(d.completions);
        const key = completionKey(row.id, row.occurrenceDate);
        if (completions.has(key)) completions.delete(key);
        else completions.add(key);
        return { ...d, completions };
      }
      return { ...d, items: d.items.map((i) => (i.id === row.id ? { ...i, done: !i.done } : i)) };
    });
  }

  function offerUndo(label: string, restore: () => void) {
    clearTimeout(undoTimer.current);
    setUndo({ label, restore });
    undoTimer.current = setTimeout(() => setUndo(null), 6000);
  }

  function remove(row: Row) {
    if (row.kind === "template") {
      const gone = data.templates.find((t) => t.id === row.id);
      if (!gone) return;
      update((d) => ({ ...d, templates: d.templates.filter((t) => t.id !== row.id) }));
      offerUndo(`Deleted weekly "${row.title}"`, () =>
        update((d) => ({ ...d, templates: [...d.templates, gone] })),
      );
    } else {
      const gone = data.items.find((i) => i.id === row.id);
      if (!gone) return;
      update((d) => ({ ...d, items: d.items.filter((i) => i.id !== row.id) }));
      offerUndo(`Deleted "${row.title}"`, () => update((d) => ({ ...d, items: [...d.items, gone] })));
    }
  }

  function add(entry: NewEntry) {
    update((d) => {
      let lists = d.lists;
      let list = lists.find((l) => l.name.toLowerCase() === entry.listName.toLowerCase());
      if (!list) {
        list = { id: `l${nextId.current++}`, name: entry.listName, isCourse: false };
        lists = [...lists, list];
      }
      if (entry.mode === "weekly") {
        const t: Template = {
          id: `t${nextId.current++}`,
          listId: list.id,
          title: entry.title,
          weekday: entry.weekday,
          startDate: d.semester.startDate,
          endDate: d.semester.endDate,
        };
        return { ...d, lists, templates: [...d.templates, t] };
      }
      const it: Item = {
        id: `i${nextId.current++}`,
        listId: list.id,
        title: entry.title,
        dueDate: entry.dueDate,
        originalDueDate: entry.dueDate,
        type: entry.type,
        done: false,
      };
      return { ...d, lists, items: [...d.items, it] };
    });
    setShowAdd(false);
  }

  function saveSemester(s: Semester) {
    update((d) => ({ ...d, semester: s }));
    setShowSemester(false);
  }

  function renderSemester() {
    const end = fromISO(data.semester.endDate);
    const cards = [];
    for (let m = mondayOf(fromISO(data.semester.startDate)); m <= end; m = addDays(m, 7)) {
      const key = toISO(m);
      const days = rowsForWeek(data!, m, today);
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
          {open && <WeekDays monday={m} days={days} today={today} onToggle={toggle} onDelete={remove} />}
        </div>,
      );
    }
    return cards.length ? cards : <p className="text-dim italic">Set your semester dates to see the full list.</p>;
  }

  const navBtn =
    "cursor-pointer rounded-lg border border-line bg-panel px-3 py-1.5 text-[13px] text-ink hover:border-accent";

  return (
    <div className="mx-auto max-w-[760px] px-4 pb-24 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <h1 className="text-xl font-semibold">{data.semester.name} Assignments</h1>
          <p className="mb-4 text-[13px] text-dim">Demo data · nothing is saved yet</p>
        </div>
        <button className={navBtn} onClick={() => setShowSemester(true)}>
          ⚙ Semester dates
        </button>
      </div>

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

      {undo && (
        <div className="fixed bottom-[22px] left-4 z-30 flex items-center gap-3 rounded-lg bg-ink px-3.5 py-2.5 text-[13px] text-bg shadow-lg">
          {undo.label}
          <button
            className="cursor-pointer font-bold underline"
            onClick={() => {
              undo.restore();
              setUndo(null);
            }}
          >
            Undo
          </button>
        </div>
      )}

      {showAdd && <AddModal lists={data.lists} onClose={() => setShowAdd(false)} onAdd={add} />}
      {showSemester && (
        <SemesterModal semester={data.semester} onClose={() => setShowSemester(false)} onSave={saveSemester} />
      )}
    </div>
  );
}
