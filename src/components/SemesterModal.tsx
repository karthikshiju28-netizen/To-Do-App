"use client";

import { useState } from "react";
import type { Semester } from "@/lib/types";
import Modal, { Field, ModalButtons, fieldInput } from "./Modal";

export default function SemesterModal({
  semester,
  onClose,
  onSave,
}: {
  semester: Semester;
  onClose: () => void;
  onSave: (s: Semester) => void;
}) {
  const [start, setStart] = useState(semester.startDate);
  const [end, setEnd] = useState(semester.endDate);

  return (
    <Modal title="Semester dates" onClose={onClose}>
      <Field label="Semester start (a Monday)">
        <input type="date" className={fieldInput} value={start} onChange={(e) => setStart(e.target.value)} />
      </Field>
      <Field label="Semester end">
        <input type="date" className={fieldInput} value={end} onChange={(e) => setEnd(e.target.value)} />
      </Field>
      <p className="mt-1 text-[11.5px] text-dim">Used to build the full-semester list. Edit anytime.</p>
      <ModalButtons
        onCancel={onClose}
        saveLabel="Save"
        onSave={() => start && end && start <= end && onSave({ ...semester, startDate: start, endDate: end })}
      />
    </Modal>
  );
}
