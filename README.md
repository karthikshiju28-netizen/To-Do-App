# Syllabus To-Do

Upload a syllabus, get a weekly to-do list. Each person signs up and gets their own private list.

- **Next.js 16** (App Router) + TypeScript + Tailwind
- **Supabase**: Postgres with Row Level Security, Auth (email link/code + Google), private Storage bucket
- **Google Gemini** reads uploaded syllabi and parses quick-add notes (server-side only)

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

## Database

Run the files in `supabase/migrations/` once, in order, in the Supabase dashboard (SQL Editor).

## Environment variables

| Name | Where it's used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server (safe to expose; protected by Row Level Security) |
| `GEMINI_API_KEY` | server only, never expose |
| `GEMINI_MODEL` | optional, defaults to `gemini-3.8-flash` |

Never commit `.env.local`.

## Developer checks

```bash
npx tsx --env-file=.env.local scripts/test-extract.mts <file> [mime]   # run extraction on a file
npx tsx --env-file=.env.local scripts/test-quickadd.mts                # try quick-add phrases
npx tsx scripts/test-validate.mts                                      # offline validation rules
```
