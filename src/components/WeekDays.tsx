import { addDays, toISO } from "@/lib/dates";
import type { Row } from "@/lib/types";
import DayBlock from "./DayBlock";

/** Seven day blocks for one week. */
export default function WeekDays({
  monday,
  days,
  today,
  onToggle,
  onDelete,
}: {
  monday: Date;
  days: Row[][];
  today: Date;
  onToggle: (row: Row) => void;
  onDelete: (row: Row) => void;
}) {
  return (
    <>
      {days.map((rows, i) => (
        <DayBlock
          key={i}
          weekday={i}
          monday={monday}
          rows={rows}
          isToday={toISO(addDays(monday, i)) === toISO(today)}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}
