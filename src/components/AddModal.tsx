"use client";

import { useState } from "react";
import { DAY_FULL } from "@/lib/dates";
import type { ItemType, List } from "@/lib/types";
import Modal, { Field, ModalButtons, fieldInput } from "./Modal";

export type NewEntry =
  | { mode: "weekly"; listName: string; title: string; weekday: number }
  | { mode: "once"; listName: string; title: string; dueDate: string; type: ItemType };

export default function AddModal({
  lists,
  onClose,
  onAdd,
}: {
  lists: List[];
  onClose: () => void;
  onAdd: (entry: NewEntry) => void;
}) {
  const [mode, setMode] = useState<"weekly" | "once">("once");
  const [listName, setListName] = useState("");
  const [title, setTitle] = useState("");
  const [weekday, setWeekday] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [type, setType] = useState<ItemType>("assignment");

  function save() {
    if (!listName.trim() || !title.trim()) return;
    if (mode === "weekly") {
      onAdd({ mode, listName: listName.trim(), title: title.trim(), weekday });
    } else {
      if (!dueDate) return;
      onAdd({ mode, listName: listName.trim(), title: title.trim(), dueDate, type });
    }
  }

  const modeBtn = (m: "weekly" | "once", label: string) => (
    <button
      onClick={() => setMode(m)}
      className={`flex-1 cursor-pointer rounded-[7px] border p-2 text-[12.5px] font-semibold ${
        mode === m ? "border-accent bg-accent-soft text-accent" : "border-line bg-bg text-dim"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Modal title="Add to my list" onClose={onClose}>
      <div className="mb-3.5 flex gap-1.5">
        {modeBtn("weekly", "Repeats weekly")}
        {modeBtn("once", "One-time")}
      </div>
      <Field label="List">
        <input
          className={fieldInput}
          list="list-names"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          placeholder="e.g. CEE 330"
        />
        <datalist id="list-names">
          {lists.map((l) => (
            <option key={l.id} value={l.name} />
          ))}
        </datalist>
      </Field>
      <Field label="Title">
        <input
          className={fieldInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Pre-lecture"
        />
      </Field>
      {mode === "weekly" ? (
        <Field label="Due every">
          <select className={fieldInput} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
            {DAY_FULL.map((d, i) => (
              <option key={d} value={i}>{d}</option>
            ))}
          </select>
        </Field>
      ) : (
        <>
          <Field label="Due date">
            <input type="date" className={fieldInput} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Type">
            <select className={fieldInput} value={type} onChange={(e) => setType(e.target.value as ItemType)}>
              <option value="assignment">Assignment</option>
              <option value="project">Project</option>
              <option value="exam">Exam / Midterm</option>
              <option value="quiz">Quiz</option>
              <option value="task">Task</option>
            </select>
          </Field>
        </>
      )}
      <ModalButtons onCancel={onClose} onSave={save} saveLabel="Add" />
    </Modal>
  );
}
