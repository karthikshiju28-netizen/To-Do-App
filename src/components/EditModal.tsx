"use client";

import { useState } from "react";
import { DAY_FULL } from "@/lib/dates";
import type { Item, ItemType, List, Template } from "@/lib/types";
import Modal, { Field, ModalButtons, fieldInput } from "./Modal";

export type EditTarget = { kind: "item"; item: Item } | { kind: "template"; template: Template };

export type EditPatch =
  | { kind: "item"; id: string; listId: string; title: string; dueDate: string; type: ItemType }
  | { kind: "template"; id: string; listId: string; title: string; weekday: number };

export default function EditModal({
  target,
  lists,
  onClose,
  onSave,
}: {
  target: EditTarget;
  lists: List[];
  onClose: () => void;
  onSave: (patch: EditPatch) => void;
}) {
  const base = target.kind === "item" ? target.item : target.template;
  const [listId, setListId] = useState(base.listId);
  const [title, setTitle] = useState(base.title);
  const [dueDate, setDueDate] = useState(target.kind === "item" ? target.item.dueDate : "");
  const [type, setType] = useState<ItemType>(target.kind === "item" ? target.item.type : "assignment");
  const [weekday, setWeekday] = useState(target.kind === "template" ? target.template.weekday : 0);

  function save() {
    if (!title.trim()) return;
    if (target.kind === "item") {
      if (!dueDate) return;
      onSave({ kind: "item", id: base.id, listId, title: title.trim(), dueDate, type });
    } else {
      onSave({ kind: "template", id: base.id, listId, title: title.trim(), weekday });
    }
  }

  return (
    <Modal title={target.kind === "item" ? "Edit item" : "Edit weekly task"} onClose={onClose}>
      <Field label="List">
        <select className={fieldInput} value={listId} onChange={(e) => setListId(e.target.value)}>
          {lists.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Title">
        <input className={fieldInput} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      {target.kind === "item" ? (
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
      ) : (
        <Field label="Due every">
          <select className={fieldInput} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
            {DAY_FULL.map((d, i) => (
              <option key={d} value={i}>{d}</option>
            ))}
          </select>
        </Field>
      )}
      <ModalButtons onCancel={onClose} onSave={save} saveLabel="Save" />
    </Modal>
  );
}
