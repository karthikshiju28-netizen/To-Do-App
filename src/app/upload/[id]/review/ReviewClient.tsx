"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fieldInput } from "@/components/Modal";
import { DAY_FULL } from "@/lib/dates";
import { ITEM_TYPES, type ReviewData, type ReviewFlag, type ReviewItem, type ReviewWeekly } from "@/lib/extract/types";
import { saveReview } from "../../actions";

type ItemState = ReviewItem & { listRef: string | null }; // null = use the list chosen at the top
type WeeklyState = ReviewWeekly & { listRef: string | null };

const FLAG_TEXT: Record<ReviewFlag, string> = {
  low_confidence: "Not sure about this one",
  no_date: "No date found: set one to add it",
  outside_semester: "Date is outside your semester",
  duplicate: "Looks like it's already in your list",
  collapsed: "Combined from a repeating series",
};
const FLAG_BAD: ReviewFlag[] = ["no_date", "outside_semester"];

const small = "rounded-[7px] border border-line bg-bg px-2 py-1.5 text-[13px] text-ink";

export default function ReviewClient({
  uploadId,
  data,
  lists,
  defaultListId,
  semester,
}: {
  uploadId: string;
  data: ReviewData;
  lists: { id: string; name: string }[];
  defaultListId: string | null;
  semester: { startDate: string; endDate: string };
}) {
  const router = useRouter();
  const [pending, startSave] = useTransition();
  const [error, setError] = useState("");

  // Which list these belong to: an existing one, or a new one named after the course in the document.
  const guess = data.courseName?.trim() ?? "";
  const match = lists.find((l) => l.name.toLowerCase() === guess.toLowerCase());
  const [listChoice, setListChoice] = useState<string>(defaultListId ?? match?.id ?? (guess ? "new" : lists[0]?.id ?? "new"));
  const [newListName, setNewListName] = useState(guess);

  const [items, setItems] = useState<ItemState[]>(() => data.items.map((i) => ({ ...i, listRef: null })));
  const [weekly, setWeekly] = useState<WeeklyState[]>(() => data.weekly.map((w) => ({ ...w, listRef: null })));

  const patchItem = (id: string, p: Partial<ItemState>) =>
    setItems((cur) => cur.map((i) => (i.tempId === id ? { ...i, ...p } : i)));
  const patchWeekly = (id: string, p: Partial<WeeklyState>) =>
    setWeekly((cur) => cur.map((w) => (w.tempId === id ? { ...w, ...p } : w)));

  const pickedItems = items.filter((i) => i.selected);
  const pickedWeekly = weekly.filter((w) => w.selected);
  const missingDate = pickedItems.some((i) => !i.dueDate);
  const total = pickedItems.length + pickedWeekly.length;
  const usesNew = [...pickedItems, ...pickedWeekly].some((r) => (r.listRef ?? listChoice) === "new");

  function listSelect(value: string | null, onChange: (v: string | null) => void) {
    return (
      <select className={`${small} max-w-[9rem]`} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">Same as above</option>
        {lists.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
        {newListName.trim() && <option value="new">New: {newListName.trim()}</option>}
      </select>
    );
  }

  function badges(flags: ReviewFlag[], note: string | null) {
    return (
      <>
        {flags.map((f) => (
          <span
            key={f}
            className={`mr-1.5 inline-block rounded-[5px] px-1.5 py-px text-[10.5px] font-semibold ${
              FLAG_BAD.includes(f) ? "bg-danger/15 text-danger" : "bg-accent-soft text-accent"
            }`}
          >
            {FLAG_TEXT[f]}
          </span>
        ))}
        {note && <span className="text-[11.5px] text-dim">{note}</span>}
      </>
    );
  }

  function submit() {
    setError("");
    startSave(async () => {
      const res = await saveReview({
        uploadId,
        newListName: usesNew ? newListName.trim() || null : null,
        items: pickedItems.map((i) => ({
          title: i.title,
          dueDate: i.dueDate!,
          type: i.type,
          listRef: i.listRef ?? listChoice,
          sourceQuote: i.sourceQuote || null,
        })),
        weekly: pickedWeekly.map((w) => ({
          title: w.title,
          weekday: w.weekday,
          startDate: w.startDate,
          endDate: w.endDate,
          listRef: w.listRef ?? listChoice,
        })),
      });
      if (res.error) setError(res.error);
      else {
        router.push("/");
        router.refresh();
      }
    });
  }

  const nothingFound = !items.length && !weekly.length;

  return (
    <div className="space-y-6">
      <div className="rounded-[10px] border border-line bg-panel p-3.5 shadow-card">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-dim">Add these to which list?</span>
          <select className={fieldInput} value={listChoice} onChange={(e) => setListChoice(e.target.value)}>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
            <option value="new">＋ Create a new list…</option>
          </select>
        </label>
        {(listChoice === "new" || items.some((i) => i.listRef === "new")) && (
          <label className="mt-2.5 block">
            <span className="mb-1 block text-xs font-semibold text-dim">New list name</span>
            <input className={fieldInput} value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="e.g. CEE 331" />
          </label>
        )}
      </div>

      {nothingFound && (
        <p className="rounded-[10px] border border-line bg-panel p-4 text-[13.5px]">
          No deadlines were found in this file. If it should have some, try a clearer scan or the course schedule page.
        </p>
      )}

      {weekly.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold">Repeats every week ({weekly.length})</h2>
          <div className="overflow-hidden rounded-[10px] border border-line bg-panel shadow-card">
            {weekly.map((w) => (
              <div key={w.tempId} className={`border-t border-line-soft p-3 first:border-t-0 ${w.selected ? "" : "opacity-60"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="checkbox" checked={w.selected} onChange={(e) => patchWeekly(w.tempId, { selected: e.target.checked })} className="h-[17px] w-[17px] accent-accent" aria-label="Include" />
                  <input className={`${small} min-w-[10rem] flex-1`} value={w.title} onChange={(e) => patchWeekly(w.tempId, { title: e.target.value })} />
                  <select className={small} value={w.weekday} onChange={(e) => patchWeekly(w.tempId, { weekday: Number(e.target.value) })}>
                    {DAY_FULL.map((d, i) => (
                      <option key={d} value={i}>Every {d}</option>
                    ))}
                  </select>
                  {listSelect(w.listRef, (v) => patchWeekly(w.tempId, { listRef: v }))}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 pl-[25px] text-xs text-dim">
                  from
                  <input type="date" className={small} min={semester.startDate} max={semester.endDate} value={w.startDate} onChange={(e) => patchWeekly(w.tempId, { startDate: e.target.value })} />
                  to
                  <input type="date" className={small} min={semester.startDate} max={semester.endDate} value={w.endDate} onChange={(e) => patchWeekly(w.tempId, { endDate: e.target.value })} />
                </div>
                <div className="mt-1.5 pl-[25px]">
                  {w.sourceQuote && <p className="text-[12px] italic text-dim">&ldquo;{w.sourceQuote}&rdquo;</p>}
                  <div className="mt-1">{badges(w.flags, w.uncertaintyNote)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {items.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">One-time deadlines ({items.length})</h2>
            <div className="text-xs">
              <button className="cursor-pointer font-semibold text-accent" onClick={() => setItems(items.map((i) => ({ ...i, selected: true })))}>All</button>
              <span className="text-dim"> · </span>
              <button className="cursor-pointer font-semibold text-accent" onClick={() => setItems(items.map((i) => ({ ...i, selected: false })))}>None</button>
            </div>
          </div>
          <div className="overflow-hidden rounded-[10px] border border-line bg-panel shadow-card">
            {items.map((i) => {
              const low = i.flags.includes("low_confidence");
              return (
                <div
                  key={i.tempId}
                  className={`border-t border-line-soft p-3 first:border-t-0 ${low ? "bg-accent-soft/40" : ""} ${i.selected ? "" : "opacity-60"}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="checkbox" checked={i.selected} onChange={(e) => patchItem(i.tempId, { selected: e.target.checked })} className="h-[17px] w-[17px] accent-accent" aria-label="Include" />
                    <input className={`${small} min-w-[10rem] flex-1`} value={i.title} onChange={(e) => patchItem(i.tempId, { title: e.target.value })} />
                    <input
                      type="date"
                      className={`${small} ${i.selected && !i.dueDate ? "border-danger" : ""}`}
                      value={i.dueDate ?? ""}
                      onChange={(e) => {
                        const v = e.target.value || null;
                        const outside = !!v && (v < semester.startDate || v > semester.endDate);
                        const flags: ReviewFlag[] = i.flags.filter((f) => f !== "no_date" && f !== "outside_semester");
                        if (!v) flags.push("no_date");
                        else if (outside) flags.push("outside_semester");
                        patchItem(i.tempId, { dueDate: v, flags, selected: v ? i.selected || i.flags.includes("no_date") : false });
                      }}
                    />
                    <select className={small} value={i.type} onChange={(e) => patchItem(i.tempId, { type: e.target.value as ReviewItem["type"] })}>
                      {ITEM_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {listSelect(i.listRef, (v) => patchItem(i.tempId, { listRef: v }))}
                  </div>
                  <div className="mt-1.5 pl-[25px]">
                    {i.sourceQuote && <p className="text-[12px] italic text-dim">&ldquo;{i.sourceQuote}&rdquo;</p>}
                    <div className="mt-1">{badges(i.flags, i.uncertaintyNote)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-panel/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3">
          <div className="text-[12.5px]">
            {error ? (
              <span className="text-danger">{error}</span>
            ) : missingDate ? (
              <span className="text-danger">Set a date on every ticked row (or untick it).</span>
            ) : (
              <span className="text-dim">{total} selected</span>
            )}
          </div>
          <button
            onClick={submit}
            disabled={pending || total === 0 || missingDate || (usesNew && !newListName.trim())}
            className="cursor-pointer rounded-[7px] bg-accent px-5 py-2.5 text-[13.5px] font-bold text-white disabled:cursor-default disabled:opacity-50"
          >
            {pending ? "Adding…" : `Add ${total} selected`}
          </button>
        </div>
      </div>
    </div>
  );
}
