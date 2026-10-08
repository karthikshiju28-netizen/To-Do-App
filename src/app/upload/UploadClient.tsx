"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fieldInput } from "@/components/Modal";
import { ALLOWED_MIME, MAX_FILE_BYTES } from "@/lib/extract/limits";
import { toISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";

export interface UploadRow {
  id: string;
  file_name: string;
  status: "pending" | "extracting" | "review" | "saved" | "failed";
  error: string | null;
  created_at: string;
}

type Progress = { name: string; state: "waiting" | "uploading" | "reading" | "done" | "error"; message?: string; id?: string };

const mimeOf = (f: File) =>
  f.type || (f.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : f.name.toLowerCase().endsWith(".txt") ? "text/plain" : "");

export default function UploadClient({
  userId,
  lists,
  recent,
}: {
  userId: string;
  lists: { id: string; name: string }[];
  recent: UploadRow[];
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [files, setFiles] = useState<File[]>([]);
  const [pasted, setPasted] = useState("");
  const [listId, setListId] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [problem, setProblem] = useState("");
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | File[]) {
    const ok: File[] = [];
    const rejected: string[] = [];
    for (const f of Array.from(list)) {
      if (!(ALLOWED_MIME as readonly string[]).includes(mimeOf(f))) rejected.push(`${f.name} (type not supported)`);
      else if (f.size > MAX_FILE_BYTES) rejected.push(`${f.name} (over 10 MB)`);
      else ok.push(f);
    }
    setProblem(rejected.length ? `Skipped: ${rejected.join(", ")}` : "");
    setFiles((cur) => [...cur, ...ok]);
  }

  async function processAll() {
    const all = [...files];
    if (pasted.trim()) all.push(new File([pasted], "pasted-text.txt", { type: "text/plain" }));
    if (!all.length) return;
    setBusy(true);
    setProblem("");
    const state: Progress[] = all.map((f) => ({ name: f.name, state: "waiting" }));
    const update = (i: number, patch: Partial<Progress>) => {
      state[i] = { ...state[i], ...patch };
      setProgress([...state]);
    };
    setProgress([...state]);

    // One at a time keeps us inside the AI service's free rate limits.
    for (let i = 0; i < all.length; i++) {
      const file = all[i];
      try {
        update(i, { state: "uploading" });
        const id = crypto.randomUUID();
        const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
        const path = `${userId}/${id}/${safeName}`;
        const mime = mimeOf(file);

        const up = await supabase.storage.from("uploads").upload(path, file, { contentType: mime });
        if (up.error) throw new Error(up.error.message);
        const row = await supabase.from("uploads").insert({
          id,
          list_id: listId || null,
          storage_path: path,
          file_name: file.name,
          mime_type: mime,
          status: "pending",
        });
        if (row.error) throw new Error(row.error.message);

        update(i, { state: "reading", id });
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId: id, today: toISO(new Date()) }),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || out.status === "failed") throw new Error(out.error ?? "Couldn't read this file.");
        update(i, { state: "done" });
      } catch (e) {
        update(i, { state: "error", message: e instanceof Error ? e.message : "Something went wrong." });
      }
    }

    setBusy(false);
    setFiles([]);
    setPasted("");
    // A single successful file goes straight to review.
    if (state.length === 1 && state[0].state === "done" && state[0].id) {
      router.push(`/upload/${state[0].id}/review`);
    } else {
      router.refresh();
    }
  }

  async function retry(id: string) {
    setBusy(true);
    const res = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId: id, today: toISO(new Date()) }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok && out.status === "review") router.push(`/upload/${id}/review`);
    else {
      setProblem(out.error ?? "Couldn't read this file.");
      router.refresh();
    }
  }

  const stateText: Record<Progress["state"], string> = {
    waiting: "Waiting…",
    uploading: "Uploading…",
    reading: "Reading… this can take up to a minute",
    done: "Ready to review",
    error: "Failed",
  };

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        className={`cursor-pointer rounded-[10px] border-2 border-dashed p-8 text-center ${
          dragging ? "border-accent bg-accent-soft" : "border-line bg-panel"
        }`}
      >
        <p className="font-semibold">Drop files here, or click to choose</p>
        <p className="mt-1 text-xs text-dim">PDF, PNG, JPG or WebP · up to 10 MB each · several at once is fine</p>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,application/pdf,image/*,text/plain"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="rounded-[10px] border border-line bg-panel p-3 text-[13px]">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between py-1">
              <span className="truncate">{f.name}</span>
              <button
                className="ml-3 cursor-pointer text-dim hover:text-danger"
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                aria-label={`Remove ${f.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-dim">Or paste text (a schedule, an email, a course page)</span>
        <textarea
          rows={4}
          className={fieldInput}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="Paste anything with deadlines in it…"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-dim">These belong to (optional, you can choose after reading)</span>
        <select className={fieldInput} value={listId} onChange={(e) => setListId(e.target.value)}>
          <option value="">Decide on the review screen</option>
          {lists.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </label>

      {problem && <p className="text-xs text-danger">{problem}</p>}

      <button
        onClick={processAll}
        disabled={busy || (!files.length && !pasted.trim())}
        className="w-full cursor-pointer rounded-[7px] bg-accent p-2.5 text-[13.5px] font-bold text-white disabled:cursor-default disabled:opacity-50"
      >
        {busy ? "Working…" : "Find my deadlines"}
      </button>

      {progress.length > 0 && (
        <ul className="rounded-[10px] border border-line bg-panel p-3 text-[13px]">
          {progress.map((p, i) => (
            <li key={i} className="py-1">
              <span className="font-semibold">{p.name}</span>{" "}
              <span className={p.state === "error" ? "text-danger" : "text-dim"}>
                · {p.state === "error" ? p.message : stateText[p.state]}
              </span>
              {p.state === "done" && p.id && (
                <Link className="ml-2 font-semibold text-accent" href={`/upload/${p.id}/review`}>Review →</Link>
              )}
            </li>
          ))}
        </ul>
      )}

      {recent.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold">Recent uploads</h2>
          <ul className="overflow-hidden rounded-[10px] border border-line bg-panel text-[13px]">
            {recent.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 border-t border-line-soft px-3 py-2 first:border-t-0">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{u.file_name}</div>
                  {u.status === "failed" && (
                    <div className="text-xs text-danger">{u.error === "limit" ? "Daily limit reached" : u.error}</div>
                  )}
                </div>
                <div className="shrink-0 text-xs">
                  {u.status === "review" && (
                    <Link className="font-semibold text-accent" href={`/upload/${u.id}/review`}>Review →</Link>
                  )}
                  {u.status === "saved" && <span className="text-dim">Added</span>}
                  {(u.status === "failed" || u.status === "pending") && (
                    <button disabled={busy} className="cursor-pointer font-semibold text-accent" onClick={() => retry(u.id)}>
                      Retry
                    </button>
                  )}
                  {u.status === "extracting" && <span className="text-dim">Reading…</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
