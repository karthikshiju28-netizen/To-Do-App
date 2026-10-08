import { fmtShort, fromISO } from "@/lib/dates";
import type { Row } from "@/lib/types";

const tagClass =
  "ml-1.5 rounded-[5px] bg-accent-soft px-1.5 py-px align-[1px] text-[10px] font-semibold text-accent";

export default function ItemRow({
  row,
  onToggle,
  onDelete,
  onEdit,
}: {
  row: Row;
  onToggle: (row: Row) => void;
  onDelete: (row: Row) => void;
  onEdit: (row: Row) => void;
}) {
  const showType = row.kind === "item" && row.type && row.type !== "assignment" && row.type !== "task";
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <input
        type="checkbox"
        checked={row.done}
        onChange={() => onToggle(row)}
        aria-label={`Mark ${row.title} done`}
        className="mt-0.5 h-[17px] w-[17px] shrink-0 cursor-pointer accent-accent"
      />
      <div
        onClick={() => onEdit(row)}
        title="Click to edit"
        className={`flex-1 cursor-pointer text-[13.5px] leading-snug ${row.done ? "text-done line-through" : ""}`}
      >
        <span className={`font-bold ${row.done ? "" : "text-accent"}`}>{row.listName}</span> — {row.title}
        {showType && <span className={tagClass}>{row.type}</span>}
        {row.overdueFrom && (
          <span className="ml-1.5 rounded-[5px] bg-danger/15 px-1.5 py-px align-[1px] text-[10px] font-semibold text-danger">
            overdue · was {fmtShort(fromISO(row.overdueFrom))}
          </span>
        )}
      </div>
      <button
        onClick={() => onDelete(row)}
        title="Delete"
        aria-label={`Delete ${row.title}`}
        className="shrink-0 cursor-pointer px-1 text-[15px] text-dim opacity-50 hover:text-danger hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
