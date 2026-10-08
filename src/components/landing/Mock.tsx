// Static, decorative previews of the real app used on the landing page.

type Row = { list: string; title: string; done?: boolean; tag?: string; overdue?: string };

function MockRow({ r }: { r: Row }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span
        aria-hidden
        className={`mt-0.5 flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[4px] border text-[11px] leading-none ${
          r.done ? "border-accent bg-accent text-white" : "border-dim/50"
        }`}
      >
        {r.done ? "✓" : ""}
      </span>
      <div className={`flex-1 text-[13.5px] leading-snug ${r.done ? "text-done line-through" : ""}`}>
        <span className={`font-bold ${r.done ? "" : "text-accent"}`}>{r.list}</span> — {r.title}
        {r.tag && (
          <span className="ml-1.5 rounded-[5px] bg-accent-soft px-1.5 py-px align-[1px] text-[10px] font-semibold text-accent">
            {r.tag}
          </span>
        )}
        {r.overdue && (
          <span className="ml-1.5 rounded-[5px] bg-danger/15 px-1.5 py-px align-[1px] text-[10px] font-semibold text-danger">
            overdue · was {r.overdue}
          </span>
        )}
      </div>
    </div>
  );
}

function Day({ label, rows }: { label: string; rows: Row[] }) {
  return (
    <div className="border-t border-line-soft px-4 py-2.5 first:border-t-0">
      <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-dim">{label}</div>
      {rows.length ? rows.map((r) => <MockRow key={r.title} r={r} />) : <div className="text-[12.5px] italic text-dim">Nothing due</div>}
    </div>
  );
}

export function WeekMock() {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-panel shadow-[0_18px_50px_-18px_rgba(0,0,0,0.35)]" aria-hidden>
      <div className="flex items-center justify-between border-b border-line bg-week px-4 py-3">
        <span className="text-[14px] font-bold">Week of Oct 5 – Oct 11</span>
        <span className="rounded-full border border-line bg-panel px-2 py-0.5 text-[11.5px] font-semibold text-dim">3/7</span>
      </div>
      <Day label="Tuesday · Oct 6" rows={[
        { list: "CEE 330", title: "Pre-lecture", done: true },
        { list: "CHEM 232", title: "Problem set 5", done: true },
      ]} />
      <Day label="Thursday · Oct 8 · today" rows={[
        { list: "CEE 331", title: "HW 3", overdue: "Oct 2" },
        { list: "CHEM 232", title: "Online homework", done: true },
        { list: "EntreCorps", title: "Send out interest forms" },
      ]} />
      <Day label="Friday · Oct 9" rows={[
        { list: "CEE 331", title: "Midterm 1", tag: "exam" },
      ]} />
    </div>
  );
}

export function ReviewMock() {
  const rows = [
    { t: "Midterm 1", d: "Sep 24", q: "Midterm 1: Thursday, September 24, in class", low: false },
    { t: "Project proposal", d: "Sep 28", q: "Project proposal due Monday of Week 6", low: false },
    { t: "Progress report", d: "No date", q: "Progress report: TBD, around mid-November", low: true },
  ];
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-panel shadow-card" aria-hidden>
      {rows.map((r) => (
        <div key={r.t} className={`border-t border-line-soft p-3 first:border-t-0 ${r.low ? "bg-accent-soft/40" : ""}`}>
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border border-accent bg-accent text-[11px] text-white">
              {r.low ? "" : "✓"}
            </span>
            <span className="min-w-[8rem] flex-1 rounded-[7px] border border-line bg-bg px-2 py-1.5">{r.t}</span>
            <span className={`rounded-[7px] border bg-bg px-2 py-1.5 ${r.low ? "border-danger text-danger" : "border-line"}`}>{r.d}</span>
          </div>
          <p className="mt-1.5 pl-[25px] text-[12px] italic text-dim">&ldquo;{r.q}&rdquo;</p>
          {r.low && (
            <p className="mt-1 pl-[25px] text-[10.5px] font-semibold text-accent">Not sure about this one · no date found</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function QuickAddMock() {
  return (
    <div className="space-y-2" aria-hidden>
      <div className="rounded-[9px] border border-line bg-panel px-3 py-2.5 text-[14px] shadow-card">
        HW4 for cee331 next friday<span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-accent" />
      </div>
      <div className="rounded-[10px] border border-accent bg-panel p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="min-w-[6rem] flex-1 rounded-[7px] border border-line bg-bg px-2 py-1.5">HW4</span>
          <span className="rounded-[7px] border border-line bg-bg px-2 py-1.5">CEE 331</span>
          <span className="rounded-[7px] border border-line bg-bg px-2 py-1.5">Oct 16</span>
          <span className="rounded-[7px] bg-accent px-3 py-1.5 font-bold text-white">Confirm</span>
        </div>
      </div>
    </div>
  );
}
