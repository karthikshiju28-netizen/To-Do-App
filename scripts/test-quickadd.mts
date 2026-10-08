// Developer check: runs quick-add on sample phrases. Usage: npx tsx --env-file=.env.local scripts/test-quickadd.mts
import { parseQuickAdd } from "../src/lib/quickadd/parse";
const lists = ["CEE 331", "CHEM 232", "Personal", "EntreCorps"].map((name, i) => ({ id: `l${i}`, name }));
const cases = [
  "send out interest forms due tn",
  "write amma letter due tommo",
  "HW4 for cee331 next friday",
  "chem 232 midterm oct 22",
  "every tuesday pre-lecture for cee 330",
  "call mom",
];
for (const c of cases) {
  try {
    const r = await parseQuickAdd(c, { today: "2026-10-08", lists });
    const list = lists.find((l) => l.id === r.listId)?.name ?? "—";
    console.log(`"${c}"\n   -> ${r.kind} | "${r.title}" | list=${list} | date=${r.dueDate} wd=${r.weekday} | ${r.type} | ${r.confidence} ${r.note ?? ""}`);
  } catch (e) { console.log(`"${c}" -> ERROR`, String(e)); }
}
