import { addDays, fromISO, toISO, weekdayIndex } from "./dates";
import type { Item, List, Row, Semester, Template } from "./types";

export interface ScheduleData {
  lists: List[];
  items: Item[];
  templates: Template[];
  completions: Set<string>; // "templateId__YYYY-MM-DD"
  semester: Semester;
}

export const completionKey = (templateId: string, date: string) => `${templateId}__${date}`;

/**
 * Rows for each day (index 0 = Monday) of the week starting at `monday`.
 *
 * Overdue rollover: an unfinished one-time item whose date has passed is shown
 * on `today` with an "overdue" marker. Its stored dates are never changed, so
 * the real deadline is never lost.
 */
export function rowsForWeek(data: ScheduleData, monday: Date, today: Date): Row[][] {
  const days: Row[][] = Array.from({ length: 7 }, () => []);
  const listName = (id: string) => data.lists.find((l) => l.id === id)?.name ?? "";
  const todayISO = toISO(today);
  const weekEnd = addDays(monday, 6);

  for (const t of data.templates) {
    const date = addDays(monday, t.weekday);
    const iso = toISO(date);
    if (iso < t.startDate || iso > t.endDate) continue;
    days[t.weekday].push({
      key: `t:${completionKey(t.id, iso)}`,
      kind: "template",
      id: t.id,
      occurrenceDate: iso,
      listName: listName(t.listId),
      title: t.title,
      done: data.completions.has(completionKey(t.id, iso)),
    });
  }

  for (const it of data.items) {
    const overdue = !it.done && it.dueDate < todayISO;
    const shownOn = overdue ? todayISO : it.dueDate;
    const d = fromISO(shownOn);
    if (d < monday || d > weekEnd) continue;
    days[weekdayIndex(d)].push({
      key: `i:${it.id}`,
      kind: "item",
      id: it.id,
      occurrenceDate: shownOn,
      listName: listName(it.listId),
      title: it.title,
      done: it.done,
      type: it.type,
      overdueFrom: overdue ? it.originalDueDate : undefined,
    });
  }

  for (const day of days) day.sort((a, b) => a.listName.localeCompare(b.listName));
  return days;
}
