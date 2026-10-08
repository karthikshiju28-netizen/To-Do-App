"use client";

import dynamic from "next/dynamic";
import type { ScheduleSnapshot } from "@/lib/db";

// The tracker depends on the browser's clock, so skip server rendering for it.
const Tracker = dynamic(() => import("./Tracker"), {
  ssr: false,
  loading: () => <div className="p-6 text-dim">Loading…</div>,
});

export default function TrackerLoader({ initial }: { initial: ScheduleSnapshot }) {
  return <Tracker initial={initial} />;
}
