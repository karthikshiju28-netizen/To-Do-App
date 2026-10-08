export type ItemType = "assignment" | "project" | "exam" | "quiz" | "task";

export interface List {
  id: string;
  name: string; // "CEE 331", "Personal", ...
  isCourse: boolean;
}

/** A one-time item with a specific due date. */
export interface Item {
  id: string;
  listId: string;
  title: string;
  dueDate: string; // the date currently shown (YYYY-MM-DD)
  originalDueDate: string; // the real deadline, never overwritten by rollover
  type: ItemType;
  done: boolean;
}

/** A weekly recurring task. weekday: 0 = Monday ... 6 = Sunday. */
export interface Template {
  id: string;
  listId: string;
  title: string;
  weekday: number;
  startDate: string;
  endDate: string;
}

export interface Semester {
  name: string;
  startDate: string;
  endDate: string;
}

/** One row shown in a day block (either a one-time item or a weekly occurrence). */
export interface Row {
  key: string; // unique React key
  kind: "item" | "template";
  id: string; // item id or template id
  occurrenceDate: string; // for templates: the date of this week's copy
  listName: string;
  title: string;
  done: boolean;
  type?: ItemType;
  overdueFrom?: string; // original due date, when shown as overdue on today
}
