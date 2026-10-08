import { z } from "zod";

export const MAX_ITEMS = 200;
export const MAX_WEEKLY = 30;

export const ITEM_TYPES = ["assignment", "project", "exam", "quiz", "task"] as const;

// ---- what we ask Gemini to return -------------------------------------------

const confidence = z.enum(["high", "low"]);

export const modelOutputSchema = z.object({
  course_name: z.string().nullable(),
  items: z.array(
    z.object({
      title: z.string(),
      due_date: z.string().nullable(),
      date_as_written: z.string().nullable(),
      type: z.enum(ITEM_TYPES),
      source_quote: z.string(),
      confidence,
      uncertainty_note: z.string().nullable(),
    }),
  ),
  weekly: z.array(
    z.object({
      title: z.string(),
      weekday: z.number().int().min(0).max(6),
      start_date: z.string().nullable(),
      end_date: z.string().nullable(),
      source_quote: z.string(),
      confidence,
      uncertainty_note: z.string().nullable(),
    }),
  ),
});
export type ModelOutput = z.infer<typeof modelOutputSchema>;

/**
 * The same shape as a JSON Schema, which Gemini uses to guarantee valid JSON.
 * Note: do not add maxItems here. Gemini rejects the schema with a 400 error when it is combined with this nesting.
 * The size limits are applied in code instead (MAX_ITEMS / MAX_WEEKLY).
 */
export const modelJsonSchema = {
  type: "object",
  properties: {
    course_name: {
      type: ["string", "null"],
      description: 'Course code or name as written in the document, e.g. "CEE 331". null if none.',
    },
    items: {
      type: "array",
      description: "One-time deliverables, exams, quizzes, projects and milestones.",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short clean title, e.g. 'HW 3' or 'Midterm 1'. No course code." },
          due_date: { type: ["string", "null"], description: "YYYY-MM-DD, or null if the date is unknown/TBD." },
          date_as_written: { type: ["string", "null"], description: "The date text exactly as it appears." },
          type: { type: "string", enum: [...ITEM_TYPES] },
          source_quote: { type: "string", description: "Short verbatim quote (under 200 chars) supporting this item." },
          confidence: { type: "string", enum: ["high", "low"] },
          uncertainty_note: { type: ["string", "null"], description: "Why confidence is low, else null." },
        },
        required: ["title", "due_date", "date_as_written", "type", "source_quote", "confidence", "uncertainty_note"],
      },
    },
    weekly: {
      type: "array",
      description: "Tasks that repeat every week (weekly quiz, pre-lecture, weekly homework).",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          weekday: { type: "integer", minimum: 0, maximum: 6, description: "0=Monday ... 6=Sunday" },
          start_date: { type: ["string", "null"], description: "First occurrence YYYY-MM-DD, or null if it runs all semester." },
          end_date: { type: ["string", "null"], description: "Last occurrence YYYY-MM-DD, or null if it runs all semester." },
          source_quote: { type: "string" },
          confidence: { type: "string", enum: ["high", "low"] },
          uncertainty_note: { type: ["string", "null"] },
        },
        required: ["title", "weekday", "start_date", "end_date", "source_quote", "confidence", "uncertainty_note"],
      },
    },
  },
  required: ["course_name", "items", "weekly"],
} as const;

// ---- what we show on the review screen ----------------------------------------

export type ReviewFlag = "low_confidence" | "no_date" | "outside_semester" | "duplicate" | "collapsed";

export interface ReviewItem {
  tempId: string;
  title: string;
  dueDate: string | null;
  type: (typeof ITEM_TYPES)[number];
  sourceQuote: string;
  uncertaintyNote: string | null;
  flags: ReviewFlag[];
  selected: boolean;
}

export interface ReviewWeekly {
  tempId: string;
  title: string;
  weekday: number;
  startDate: string;
  endDate: string;
  sourceQuote: string;
  uncertaintyNote: string | null;
  flags: ReviewFlag[];
  selected: boolean;
}

/** Stored in uploads.raw_extraction. */
export interface ReviewData {
  courseName: string | null;
  model: string;
  items: ReviewItem[];
  weekly: ReviewWeekly[];
}

export interface ExtractionContext {
  semester: { name: string; startDate: string; endDate: string };
  today: string; // YYYY-MM-DD
  listNames: string[];
}
