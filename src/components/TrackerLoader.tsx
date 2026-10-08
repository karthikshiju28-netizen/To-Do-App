"use client";

import dynamic from "next/dynamic";

// The tracker depends on the browser's clock, so skip server rendering for it.
const Tracker = dynamic(() => import("./Tracker"), {
  ssr: false,
  loading: () => <div className="p-6 text-dim">Loading…</div>,
});

export default function TrackerLoader() {
  return <Tracker />;
}
