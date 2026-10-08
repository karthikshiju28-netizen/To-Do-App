// Offline check of the validation rules (no AI call).
import { postProcess } from "../src/lib/extract/validate";
const q = { source_quote: "q", confidence: "high" as const, uncertainty_note: null, date_as_written: null };
const raw = {
  course_name: "CEE 331",
  items: [
    ...["2026-09-04","2026-09-11","2026-09-18","2026-09-25","2026-10-02","2026-10-09","2026-10-16"].map((d, n) => ({ ...q, title: `Quiz ${n + 1}`, due_date: d, type: "quiz" as const })),
    { ...q, title: "Midterm 1", due_date: "2026-09-24", type: "exam" as const },
    { ...q, title: "Midterm 1", due_date: "2026-09-24", type: "exam" as const }, // listed twice
    { ...q, title: "Final exam", due_date: "2027-01-05", type: "exam" as const }, // outside semester
    { ...q, title: "Mystery", due_date: "2026-02-31", type: "task" as const }, // impossible date
    { ...q, title: "HW 1", due_date: "2026-09-04", type: "assignment" as const }, // already in the list
    { ...q, title: "Report", due_date: null, type: "project" as const, confidence: "low" as const },
  ],
  weekly: [{ ...q, title: "Pre-lecture", weekday: 1, start_date: "2020-01-01", end_date: null }],
};
const out = postProcess(raw, {
  semester: { startDate: "2026-08-24", endDate: "2026-12-18" },
  existingItems: [{ title: "Homework 1 / HW 1", dueDate: "2026-09-04" }],
  existingTemplates: [],
  model: "test",
});
const check = (name: string, ok: boolean) => console.log(ok ? "PASS" : "FAIL", name);
check("7 weekly quizzes collapse into one weekly task", out.weekly.some((w) => w.title === "Quiz" && w.weekday === 4 && w.flags.includes("collapsed")) && !out.items.some((i) => i.title.startsWith("Quiz")));
check("same item listed twice appears once", out.items.filter((i) => i.title === "Midterm 1").length === 1);
check("date outside semester is flagged and unticked", (() => { const x = out.items.find((i) => i.title === "Final exam")!; return x.flags.includes("outside_semester") && !x.selected; })());
check("impossible date becomes 'no date'", (() => { const x = out.items.find((i) => i.title === "Mystery")!; return x.dueDate === null && x.flags.includes("no_date") && !x.selected; })());
check("existing item flagged duplicate and unticked", (() => { const x = out.items.find((i) => i.title === "HW 1")!; return x.flags.includes("duplicate") && !x.selected; })());
check("low confidence kept ticked? (no date => unticked)", (() => { const x = out.items.find((i) => i.title === "Report")!; return x.flags.includes("low_confidence") && !x.selected; })());
check("weekly start clamped into the semester", out.weekly.find((w) => w.title === "Pre-lecture")!.startDate === "2026-08-24");
