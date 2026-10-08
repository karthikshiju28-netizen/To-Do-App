"use client";

import { useRef, useState } from "react";
import { DAY_FULL, fmtShort, fromISO, toISO } from "@/lib/dates";
import type { QuickAddResult } from "@/lib/quickadd/parse";
import type { ItemType, List } from "@/lib/types";
import type { NewEntry } from "./AddModal";

const field = "rounded-[7px] border border-line bg-bg px-2 py-1.5 text-[13px] text-ink";

type Draft = {
  kind: "once" | "weekly";
  title: string;
  listName: string;
  dueDate: string;
  weekday: number;
  type: ItemType;
  confidence: "high" | "low";
  note: string | null;
};

/** One text box at the top: type a quick note, check the pre-filled result, confirm. */
export default function QuickAdd({ lists, onAdd }: { lists: List[]; onAdd: (entry: NewEntry) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || text.trim().length < 2) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/quickadd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), today: toISO(new Date()) }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error ?? "Couldn't add that. Please try again.");
      const r = out as QuickAddResult;
      setDraft({
        kind: r.kind,
        title: r.title,
        listName: lists.find((l) => l.id === r.listId)?.name ?? "",
        dueDate: r.dueDate ?? "",
        weekday: r.weekday ?? 0,
        type: r.type,
        confidence: r.confidence,
        note: r.note,
      });
      setTimeout(() => confirmRef.current?.focus(), 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const ready =
    !!draft && !!draft.title.trim() && !!draft.listName.trim() && (draft.kind === "weekly" || !!draft.dueDate);

  function confirm() {
    if (!draft || !ready) return;
    const base = { listName: draft.listName.trim(), title: draft.title.trim() };
    onAdd(
      draft.kind === "weekly"
        ? { mode: "weekly", ...base, weekday: draft.weekday }
        : { mode: "once", ...base, dueDate: draft.dueDate, type: draft.type },
    );
    setDraft(null);
    setText("");
  }

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  return (
    <div className="mb-4">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          maxLength={300}
          placeholder='Quick add: "HW4 for CEE 331 next Friday", "call mom tmrw"…'
          className="min-w-0 flex-1 rounded-[9px] border border-line bg-panel px-3 py-2.5 text-[14px] text-ink shadow-card placeholder:text-dim"
        />
        <button
          disabled={busy || text.trim().length < 2}
          className="cursor-pointer rounded-[9px] bg-accent px-4 text-[13.5px] font-bold text-white disabled:cursor-default disabled:opacity-50"
        >
          {busy ? "…" : "Add"}
        </button>
      </form>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}

      {draft && (
        <div className="mt-2 rounded-[10px] border border-accent bg-panel p-3 shadow-card">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <input
              className={`${field} min-w-[10rem] flex-1`}
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              aria-label="Title"
            />
            <input
              className={`${field} w-32`}
              list="quick-lists"
              value={draft.listName}
              onChange={(e) => patch({ listName: e.target.value })}
              placeholder="List…"
              aria-label="List"
            />
            <datalist id="quick-lists">
              {lists.map((l) => (
                <option key={l.id} value={l.name} />
              ))}
            </datalist>
            {draft.kind === "weekly" ? (
              <select className={field} value={draft.weekday} onChange={(e) => patch({ weekday: Number(e.target.value) })}>
                {DAY_FULL.map((d, i) => (
                  <option key={d} value={i}>Every {d}</option>
                ))}
              </select>
            ) : (
              <>
                <input
                  type="date"
                  className={`${field} ${draft.dueDate ? "" : "border-danger"}`}
                  value={draft.dueDate}
                  onChange={(e) => patch({ dueDate: e.target.value })}
                  aria-label="Due date"
                />
                <select className={field} value={draft.type} onChange={(e) => patch({ type: e.target.value as ItemType })}>
                  {["assignment", "project", "exam", "quiz", "task"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] text-dim">
              {!draft.listName.trim()
                ? "Pick a list (or type a new one)."
                : draft.kind === "once" && !draft.dueDate
                  ? "No date found: choose one."
                  : draft.kind === "once"
                    ? `Due ${fmtShort(fromISO(draft.dueDate))}${draft.confidence === "low" ? " · double-check this" : ""}`
                    : "Repeats weekly this semester"}
              {draft.note && draft.confidence === "low" ? ` · ${draft.note}` : ""}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDraft(null)}
                className="cursor-pointer rounded-[7px] border border-line bg-bg px-3 py-1.5 text-[13px] font-bold text-dim"
              >
                Cancel
              </button>
              <button
                ref={confirmRef}
                onClick={confirm}
                disabled={!ready}
                className="cursor-pointer rounded-[7px] bg-accent px-4 py-1.5 text-[13px] font-bold text-white disabled:cursor-default disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
