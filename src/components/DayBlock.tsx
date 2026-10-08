import { DAY_FULL, addDays, fmtShort } from "@/lib/dates";
import type { Row } from "@/lib/types";
import ItemRow from "./ItemRow";

export default function DayBlock({
  weekday,
  monday,
  rows,
  isToday,
  onToggle,
  onDelete,
}: {
  weekday: number;
  monday: Date;
  rows: Row[];
  isToday: boolean;
  onToggle: (row: Row) => void;
  onDelete: (row: Row) => void;
}) {
  return (
    <div className="border-t border-line-soft px-3.5 py-2 first:border-t-0">
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-dim">
        {DAY_FULL[weekday]} · {fmtShort(addDays(monday, weekday))}
        {isToday && <span className="ml-2 text-accent">today</span>}
      </div>
      {rows.length === 0 ? (
        <div className="text-[12.5px] italic text-dim">Nothing due</div>
      ) : (
        rows.map((r) => <ItemRow key={r.key} row={r} onToggle={onToggle} onDelete={onDelete} />)
      )}
    </div>
  );
}
