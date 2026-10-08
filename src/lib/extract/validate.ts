import { fromISO, toISO, weekdayIndex } from "../dates";
import { MAX_ITEMS, MAX_WEEKLY, type ModelOutput, type ReviewData, type ReviewFlag, type ReviewItem, type ReviewWeekly } from "./types";

export interface ValidationContext {
  semester: { startDate: string; endDate: string };
  existingItems: { title: string; dueDate: string }[];
  existingTemplates: { title: string; weekday: number }[];
  model: string;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Titles count as the same if equal, or one contains the other (and is long enough to mean something). */
function similar(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  return x === y || (Math.min(x.length, y.length) >= 4 && (x.includes(y) || y.includes(x)));
}

function validDate(s: string | null): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return toISO(fromISO(s)) === s; // rejects things like 2026-02-31
}

/** "Quiz 3" -> "quiz": the title with numbers removed, used to spot repeating series. */
const stem = (title: string) => norm(title.replace(/\d+/g, " ").replace(/\b(week|wk|#)\b/gi, " "));

/**
 * Turns the AI's raw answer into review rows, applying the checks the AI can't be trusted with:
 * real dates, dates inside the semester, repeating series collapsed to weekly tasks, and duplicates.
 */
export function postProcess(raw: ModelOutput, ctx: ValidationContext): ReviewData {
  const { startDate: semStart, endDate: semEnd } = ctx.semester;
  let id = 0;
  const tempId = () => `x${++id}`;

  // ---- one-time items
  let items: ReviewItem[] = [];
  const seen = new Set<string>();
  for (const r of raw.items.slice(0, MAX_ITEMS)) {
    const title = r.title.trim();
    if (!title) continue;
    const dueDate = validDate(r.due_date) ? r.due_date : null;
    const key = `${norm(title)}|${dueDate}`;
    if (seen.has(key)) continue; // the same thing listed twice in the document
    seen.add(key);

    const flags: ReviewFlag[] = [];
    if (r.confidence === "low") flags.push("low_confidence");
    if (!dueDate) flags.push("no_date");
    else if (dueDate < semStart || dueDate > semEnd) flags.push("outside_semester");
    if (dueDate && ctx.existingItems.some((e) => e.dueDate === dueDate && similar(e.title, title))) {
      flags.push("duplicate");
    }
    items.push({
      tempId: tempId(),
      title,
      dueDate,
      type: r.type,
      sourceQuote: r.source_quote.trim().slice(0, 300),
      uncertaintyNote: r.uncertainty_note,
      flags,
      selected: !flags.some((f) => f === "no_date" || f === "outside_semester" || f === "duplicate"),
    });
  }

  // ---- weekly tasks the AI listed
  const weekly: ReviewWeekly[] = [];
  const addWeekly = (w: Omit<ReviewWeekly, "tempId" | "selected"> & { selected?: boolean }) => {
    const flags = [...w.flags];
    if (ctx.existingTemplates.some((t) => t.weekday === w.weekday && similar(t.title, w.title))) {
      flags.push("duplicate");
    }
    weekly.push({ ...w, tempId: tempId(), flags, selected: w.selected ?? !flags.includes("duplicate") });
  };

  for (const w of raw.weekly.slice(0, MAX_WEEKLY)) {
    const title = w.title.trim();
    if (!title) continue;
    const start = validDate(w.start_date) && w.start_date >= semStart ? w.start_date : semStart;
    const end = validDate(w.end_date) && w.end_date <= semEnd ? w.end_date : semEnd;
    addWeekly({
      title,
      weekday: w.weekday,
      startDate: start <= end ? start : semStart,
      endDate: start <= end ? end : semEnd,
      sourceQuote: w.source_quote.trim().slice(0, 300),
      uncertaintyNote: w.uncertainty_note,
      flags: w.confidence === "low" ? ["low_confidence"] : [],
    });
  }

  // ---- a long numbered series on the same weekday ("Quiz 1" ... "Quiz 12") is really a weekly task
  const groups = new Map<string, ReviewItem[]>();
  for (const it of items) {
    if (!it.dueDate) continue;
    const s = stem(it.title);
    if (s) groups.set(s, [...(groups.get(s) ?? []), it]);
  }
  const collapsed = new Set<string>();
  for (const group of groups.values()) {
    if (group.length < 6) continue;
    const sorted = [...group].sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
    const days = sorted.map((g) => weekdayIndex(fromISO(g.dueDate!)));
    const gapsOk = sorted.every((g, i) => {
      if (i === 0) return true;
      const gap = (fromISO(g.dueDate!).getTime() - fromISO(sorted[i - 1].dueDate!).getTime()) / 86400000;
      return gap % 7 === 0 && gap <= 14;
    });
    if (!gapsOk || new Set(days).size !== 1) continue;
    sorted.forEach((g) => collapsed.add(g.tempId));
    const baseTitle = sorted[0].title.replace(/\s*#?\d+\s*/g, " ").replace(/\s+/g, " ").trim() || sorted[0].title;
    addWeekly({
      title: baseTitle,
      weekday: days[0],
      startDate: sorted[0].dueDate!,
      endDate: sorted[sorted.length - 1].dueDate!,
      sourceQuote: sorted[0].sourceQuote,
      uncertaintyNote: `Combined ${sorted.length} similar items into one weekly task.`,
      flags: ["collapsed"],
    });
  }
  items = items.filter((it) => !collapsed.has(it.tempId));

  return { courseName: raw.course_name, model: ctx.model, items, weekly };
}
