// Developer check: runs the real extraction on a file.
// Usage: npx tsx --env-file=.env.local scripts/test-extract.mts <file> [mime]
import { readFileSync } from "node:fs";
import { runGemini } from "../src/lib/extract/gemini";
import { postProcess } from "../src/lib/extract/validate";

const [path, mime = "application/pdf"] = process.argv.slice(2);
const ctx = {
  semester: { name: "Fall 2026", startDate: "2026-08-24", endDate: "2026-12-18" },
  today: "2026-10-08",
  listNames: ["CEE 331", "Personal"],
};
const raw = await runGemini({ bytes: new Uint8Array(readFileSync(path)), mimeType: mime }, ctx);
const reviewed = postProcess(raw, {
  semester: ctx.semester,
  existingItems: [{ title: "HW 1", dueDate: "2026-09-04" }],
  existingTemplates: [],
  model: raw.model,
});
console.log(JSON.stringify(reviewed, null, 2));
