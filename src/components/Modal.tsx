import type { ReactNode } from "react";

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={title}
        className="w-full max-w-[400px] rounded-[10px] bg-panel p-[18px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-base font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export const fieldInput =
  "w-full rounded-[7px] border border-line bg-bg px-2.5 py-2 text-[13.5px] text-ink";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-2.5 block">
      <span className="mb-1 block text-xs font-semibold text-dim">{label}</span>
      {children}
    </label>
  );
}

export function ModalButtons({
  onCancel,
  onSave,
  saveLabel,
}: {
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="mt-4 flex gap-2">
      <button
        onClick={onCancel}
        className="flex-1 cursor-pointer rounded-[7px] border border-line bg-bg p-2.5 text-[13.5px] font-bold text-dim"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        className="flex-1 cursor-pointer rounded-[7px] bg-accent p-2.5 text-[13.5px] font-bold text-white"
      >
        {saveLabel}
      </button>
    </div>
  );
}
