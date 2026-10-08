import { addDays, mondayOf, toISO } from "./dates";
import type { ScheduleData } from "./schedule";
import type { Item, ItemType } from "./types";

// Phase 1 only: made-up data so the UI has something to show.
// Dates are relative to today so every view (including overdue) is populated.
export function buildFakeData(today: Date): ScheduleData {
  const monday = mondayOf(today);
  const sStart = mondayOf(addDays(today, -6 * 7));
  const semester = {
    name: "Fall 2026",
    startDate: toISO(sStart),
    endDate: toISO(addDays(sStart, 16 * 7 - 3)),
  };

  const lists = [
    { id: "l1", name: "CEE 330", isCourse: true },
    { id: "l2", name: "CEE 331", isCourse: true },
    { id: "l3", name: "CHEM 232", isCourse: true },
    { id: "l4", name: "Personal", isCourse: false },
    { id: "l5", name: "EntreCorps", isCourse: false },
  ];

  const templates = [
    { id: "t1", listId: "l1", title: "Pre-lecture", weekday: 1 },
    { id: "t2", listId: "l3", title: "Online homework", weekday: 3 },
    { id: "t3", listId: "l2", title: "Lab report", weekday: 4 },
    { id: "t4", listId: "l5", title: "Weekly check-in", weekday: 6 },
  ].map((t) => ({ ...t, startDate: semester.startDate, endDate: semester.endDate }));

  const item = (
    id: string, listId: string, title: string, offset: number, type: ItemType, done = false,
  ): Item => {
    const d = toISO(addDays(monday, offset));
    return { id, listId, title, dueDate: d, originalDueDate: d, type, done };
  };

  const items: Item[] = [
    item("i1", "l2", "HW 03", -3, "assignment"), // overdue
    item("i2", "l4", "Renew passport", -1, "task"), // overdue
    item("i3", "l2", "Midterm 1", 4, "exam"),
    item("i4", "l1", "Quiz 2", 2, "quiz"),
    item("i5", "l3", "Problem set 5", 1, "assignment", true),
    item("i6", "l1", "Design project proposal", 9, "project"),
    item("i7", "l5", "Send out interest forms", 3, "task"),
    item("i8", "l2", "HW 04", 8, "assignment"),
    item("i9", "l3", "Midterm 2", 24, "exam"),
  ];

  return { lists, items, templates, completions: new Set<string>(), semester };
}
