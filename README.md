# SF Event Match --- NOTE: This was built in 30 mins as part of a challenge for a startup. Idea -> Build -> Deploy.

Live **FunCheap SF** listings (RSS), ranked for each visitor with **OpenAI** (optional) for fit, reasons, and short hooks—plus a **deterministic fallback** if the model or key is unavailable.

- **Frontend**: Next.js App Router (`src/app/page.tsx`), preferences in **localStorage**.
- **API**: `POST /api/events/personalized` fetches RSS server-side, then calls OpenAI or falls back to rule scoring (`src/lib/score.ts`).
- **No database** in this version.

## Environment variables

Create `.env.local` (or set vars in **Vercel → Settings → Environment Variables**). **Never commit secrets.**

| Variable | Required | Description |
|----------|----------|----------------|
| `OPENAI_API_KEY` | No* | Enables AI ranking + card copy. Without it, the app uses rule-based scoring only. |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini`. |

\*App works without it; quality is lower.

## Local dev

```bash
npm install
# add OPENAI_API_KEY to .env.local if you want AI ranking
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), pick tastes, **Save & refresh matches**.

## Deploy on Vercel

1. Push this repo to GitHub and import the project in Vercel.
2. Add `OPENAI_API_KEY` (and optional `OPENAI_MODEL`) in Vercel env vars for **Production** (and Preview if you like).
3. Deploy. No database or extra services required.

## Security

- If an API key was ever pasted in chat, email, or a ticket, **revoke it** in the OpenAI dashboard and create a **new** key. Store it only in Vercel / local env files that are gitignored.

## Legacy

Older Kiloforge pipeline notes live in `docs/pipeline/` and are unrelated to this app.
