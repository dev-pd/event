# Design Agent Instructions (v3: single Next.js, cold start)

> **For the Cursor agent reading this:** You are Stage 2 of a 3-stage pipeline. Stage 1 produced `PRD.md`. Your job: read `PRD.md`, read `PRODUCT_DESIGN_PLAYBOOK.md`, and produce `DESIGN.md` containing the structural architecture (file tree, types, API contracts, component plan, page wireframes in text).
>
> Do not write code. Do not ask the user clarifying questions. Make calls. Output `DESIGN.md` at the repo root.
>
> **Critical context:** This is a **single Next.js app starting from an empty repo**. NO monorepo, NO separate Express API, NO Turborepo, NO `apps/web` and `apps/api` folders. The "API" is **Next.js Route Handlers** under `app/api/`. The Code agent both scaffolds AND builds the product in one hour.

---

## Table of contents

1. The pipeline
2. Inputs to read first
3. Architecture: single Next.js app
4. Locked stack and conventions
5. Localhost-only constraint
6. The exact DESIGN.md format
7. How to design the Prisma schema
8. How to design Route Handlers (the "API")
9. How to design pages and layouts
10. How to design the component tree
11. How to design state and data fetching
12. How to apply the visual playbook
13. Worked example
14. Common mistakes
15. Self-check

---

## 1. The pipeline

**Stage 1 (done):** PRD agent produced `PRD.md`.
**Stage 2 (you):** Design agent. Output: `DESIGN.md`.
**Stage 3 (next):** Code agent uses `PRD.md` + `DESIGN.md` to scaffold the project AND write product code.

Your output is the contract between product and implementation. Code agent does NOT make architectural decisions. It writes code per your spec.

---

## 2. Inputs to read first

Read in order:

1. **`PRD.md`** — product spec from Stage 1. Use its data model, API surface, pages, demo flow.
2. **`PRODUCT_DESIGN_PLAYBOOK.md`** — visual/UX bible. Use it for tokens, spacing, typography, layouts, motion.
3. **This file** — structural rules.

If `PRD.md` and the playbook conflict (rare): PRD wins for product behavior, playbook wins for visual treatment.

---

## 3. Architecture: single Next.js app

The Code agent will scaffold from `npx create-next-app@latest .` with App Router and TypeScript. No monorepo. The structure looks like this:

```
[repo root]/
├── app/
│   ├── layout.tsx              root layout (ClerkProvider, Toaster, fonts)
│   ├── globals.css             OKLCH tokens from playbook
│   ├── page.tsx                home page
│   ├── [route]/page.tsx        product pages
│   ├── api/
│   │   ├── [resource]/
│   │   │   ├── route.ts        GET (list), POST (create)
│   │   │   └── [id]/route.ts   GET (detail), PATCH, DELETE
│   │   └── [resource]/[id]/[action]/route.ts   action endpoints
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
├── components/
│   ├── ui/                     shadcn primitives
│   └── [feature]/              product components
├── lib/
│   ├── prisma.ts               Prisma singleton
│   ├── auth.ts                 currentUser + inline-sync helper
│   ├── api-client.ts           browser fetch helpers (relative URLs, no base needed)
│   ├── api-errors.ts           AppError factories for Route Handlers
│   ├── utils.ts                cn() from shadcn
│   └── email.ts                Resend helper (no-op if no key)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── types/
│   └── [feature].ts            shared TS types (no separate package)
├── middleware.ts               Clerk middleware
├── components.json             shadcn config
├── .env.example
├── package.json
└── (Next.js standard files: tsconfig, next.config, postcss, tailwind config)
```

**Critical differences from a monorepo:**
- API and web share the SAME `package.json` and dependencies
- Browser fetches use **relative paths** (`/api/x`) since same origin
- No `NEXT_PUBLIC_API_URL` needed
- Prisma client is imported directly into Route Handlers — no HTTP hop
- TypeScript types live in `types/` folder, not a separate workspace

---

## 4. Locked stack and conventions

| Layer | Tech | Notes |
|---|---|---|
| Framework | Next.js (latest), App Router, TS strict | One project |
| API | Next.js Route Handlers under `app/api/` | NOT Express |
| UI | shadcn/ui (New York) at `components/ui/`, Radix, Tailwind v4 | Tokens from playbook |
| Forms | react-hook-form + Zod | `@hookform/resolvers/zod` |
| Data | TanStack Query (client), `await prisma...` (server) | |
| Auth | Clerk via `@clerk/nextjs`, inline user upsert in `lib/auth.ts` | Mock-mode toggle via env |
| ORM | Prisma against local Postgres | Singleton in `lib/prisma.ts` |
| Validation | Zod everywhere | Schemas in `types/` or co-located |
| Errors | Custom factory pattern in `lib/api-errors.ts` | Helpers throw, route handlers catch and `NextResponse.json` |
| Toasts | Sonner | `toast.success`, `toast.error` |
| Email | Resend, optional, no-op without key | `lib/email.ts` |

**Naming:**
- Files: kebab-case (`booking-detail-view.tsx`)
- Components: PascalCase named exports
- Pages: default export at `app/[route]/page.tsx`
- Route Handlers: named exports `GET`, `POST`, `PATCH`, `DELETE` from `route.ts`
- Hooks: `use<Thing>` named exports
- Schemas: `<thing>Schema` co-located with the component or in `types/`

---

## 5. Localhost-only constraint

| Component | Where | Port |
|---|---|---|
| App (web + API) | local | 3000 |
| Postgres | local | 5432 |
| Email | Resend HTTP if `RESEND_API_KEY` set, else no-op log | |

**Implications:**
- No CORS issues (same origin)
- No `NEXT_PUBLIC_API_URL` (use relative paths)
- No deployment-specific config (no Vercel config tweaks)
- DB queries fast on local; still note obvious indexes (FK, filter columns)
- Email features must gracefully degrade without `RESEND_API_KEY`

---

## 6. The exact DESIGN.md format

Output `DESIGN.md` at repo root with this structure exactly:

```markdown
# Design: [App name from PRD]

> Implementation contract for the Code agent.

---

## 1. File tree
[Exact list, marked CREATE / MODIFY / NO CHANGE relative to fresh `create-next-app` output]

## 2. Prisma schema additions
[Full schema text — this will go into a fresh prisma/schema.prisma]

## 3. Shared types
[TypeScript types in types/]

## 4. API contracts (Route Handlers)
[For each endpoint: HTTP method, path, auth, body/params/query Zod schema, business logic outline, response shape, error codes]

## 5. Pages and layouts
[For each page: route, server/client, data fetching approach, composition sketch in text, playbook layout pattern reference]

## 6. Component tree
[For each new component: path, server/client, props TS, internal state, hooks used, shadcn primitives, behavior]

## 7. State and data fetching
[Query keys, mutation patterns, cache invalidation, refetchInterval if used, server-side fetch patterns]

## 8. Visual treatment notes
[Specific playbook references: tokens for primary action, radius, layout pattern, any non-default choices]

## 9. Seed data plan
[What gets seeded, how many rows, where the seed file lives, command to run it]

## 10. Demo path checklist
[Map PRD demo flow to specific routes, components, and API calls. Code agent uses to verify correctness.]
```

---

## 7. How to design the Prisma schema

Take the data model from `PRD.md` section 7 and expand:

**Always include:**
- `id String @id @default(uuid())`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`
- Relations with explicit `@relation(fields: [], references: [])`
- Cascade rules on child models (`onDelete: Cascade` where appropriate)

**Add indexes for:**
- Every foreign key
- Every field that appears in a list filter
- Unique constraints on natural keys

**Naming:**
- Models: PascalCase singular (`Booking`, not `bookings`)
- Fields: camelCase
- Enums: SCREAMING_SNAKE_CASE values

**For local user storage:**
The Code agent will create a minimal `User` model (with `clerkUserId`, `email`, `name`) for the inline-sync pattern. Your product models reference users via `userId String` foreign key. The User table is created in the scaffold step.

```prisma
// This is created during scaffold, you reference it from product models
model User {
  id          String   @id @default(uuid())
  clerkUserId String?  @unique
  email       String   @unique
  name        String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  // relations to product models added by you
}
```

**Skip in 1-hour design:**
- Soft delete columns
- Audit columns beyond createdAt/updatedAt
- Polymorphic relations
- Multi-column composite indexes unless genuinely needed

---

## 8. How to design Route Handlers (the "API")

Next.js Route Handlers are NOT Express. They're:
- Files at `app/api/.../route.ts`
- Export `GET`, `POST`, `PATCH`, `DELETE` named functions
- Receive `Request` and `{ params }` as args
- Return `NextResponse.json(...)` or use `Response.json(...)`

**Pattern reference:**
```typescript
// app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, validationError } from "@/lib/api-errors";

const createBookingSchema = z.object({
  recipientUserId: z.string().uuid(),
  proposedDate: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) throw validationError(parsed.error);

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: { requesterUserId: user.id, ...parsed.data },
        include: { requester: true, recipient: true },
      });
      return b;
    });

    // best-effort email
    sendBookingEmail(booking).catch((e) => console.warn("email failed", e));

    return NextResponse.json({ booking });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    
    const bookings = await prisma.booking.findMany({
      where: { recipientUserId: user.id, status: status ?? undefined },
      include: { requester: true },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json({ bookings });
  } catch (err) {
    return handleApiError(err);
  }
}
```

**For each endpoint in PRD.md section 8, document:**

```markdown
### POST /api/[resource]

**File:** `app/api/[resource]/route.ts`
**Auth:** required (calls `requireUser()`)
**Body schema (Zod):**
```typescript
const createSchema = z.object({
  field1: z.string().min(1).max(200),
  field2: z.number().int().positive(),
});
```

**Business logic outline:**
1. Authenticate via `requireUser()` (throws 401 if not signed in)
2. Parse body via `safeParse`, throw `validationError` on fail
3. Run `prisma.$transaction`: create primary entity + child rows (if any)
4. After transaction: best-effort email (don't fail on email error)
5. Return `{ x: createdEntity }`

**Response (200):** `{ x: X }`
**Errors:**
- 400 `VALIDATION_ERROR`: invalid body
- 401 `UNAUTHORIZED`: not signed in
- 409 `CONFLICT`: [specific business condition]
```

**For dynamic route params** (`/api/x/[id]/accept`):
- File path: `app/api/x/[id]/accept/route.ts`
- Function signature: `export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> })`
- Note Next.js 15+ params are async: `const { id } = await params;`

**Service-layer pattern (optional but cleaner):**
For complex business logic, extract into `lib/services/[resource].ts` and call from the Route Handler. Helps testability later. Service signatures: `async function xxx(userId: string, input: T): Promise<R>`. Services NEVER touch req/res.

**Filtering and pagination:**
- Use `URL(req.url).searchParams` to read query params
- Skip pagination for the demo (limit 50 hardcoded). Add a TODO comment.

---

## 9. How to design pages and layouts

For each page in `PRD.md` section 9:

**Decide:**
- Server Component or Client Component (default Server, switch to Client for state/effects/event handlers)
- What data is fetched on the server (initial load) vs client (subsequent updates via TanStack Query)
- Which playbook layout pattern (section 10 of `PRODUCT_DESIGN_PLAYBOOK.md`):
  - A. Marketing home
  - B. Split authentication
  - C. Application shell
  - D. Command center (lists and operations)
  - E. Multi-step creation
  - F. Detail workspace
  - G. Focused task flow

**Server-side data fetch in pages:**
Server Components can call Prisma directly. No HTTP hop needed.

```typescript
// app/page.tsx (Server Component)
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { BookingListClient } from "@/components/bookings/booking-list-client";

export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  
  const initialBookings = await prisma.booking.findMany({
    where: { /* ... */ },
    take: 50,
  });
  
  return <BookingListClient initial={initialBookings} />;
}
```

**Sketch the page composition in text** using the playbook component vocabulary:

```
[Page] / — Application shell + Command center
├── TopBar (sticky, blur)
│   ├── Logo
│   ├── Nav: "Browse" / "My matches"
│   └── UserMenu
├── Main (max-w-7xl, py-10)
│   ├── PageHeader (flex justify-between, mb-8)
│   │   ├── h1 "Find a partner"
│   │   └── Button "Update profile" (Link to /profile)
│   ├── FilterBar (sticky, py-4, border-b, mb-6)
│   │   ├── Select duprRange
│   │   ├── Select court
│   │   └── Select availability
│   └── PlayerGrid (grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6)
│       ├── PlayerCard × N
│       └── EmptyState (when filtered list is empty)
└── RequestMatchDialog (rendered conditionally)
```

**Always specify:**
- Spacing tokens (`py-10`, `gap-6`)
- Layout primitive (max-w, container)
- Where the primary action lives
- Empty state appearance
- Mobile considerations (per playbook)

---

## 10. How to design the component tree

For each new component:

| Field | Example |
|---|---|
| Path | `components/pickle/booking-form-dialog.tsx` |
| Type | Client (`"use client"`) |
| Props | `{ trigger: ReactNode; recipientId: string; onSuccess?: (m: Match) => void }` |
| Internal state | `const [open, setOpen] = useState(false)` |
| Hooks | `useForm`, `useMutation` |
| Primitives | `Dialog`, `Form`, `FormField`, `Input`, `Calendar`, `Button`, `toast` |
| Behavior | Opens via trigger. Submit calls `useCreateMatch`, on success closes, fires toast, invalidates `['matches']`. |

**Component categorization:**

- **View components** (lists, detail views, dashboards) — usually Client, data via `useQuery` (or hydrated from server `initialData`)
- **Form components** (dialogs, edit forms) — always Client, `useForm` + `useMutation`
- **Card components** (list items) — usually rendered as children, Client only if interactive
- **Layout components** (page shells, headers) — Server unless they need client state

**Rules:**
- Components live next to the feature: `components/[feature]/`
- Generic primitives stay in `components/ui/` (added via `npx shadcn add`)
- One main component per file, named export
- No prop drilling beyond 2 levels

---

## 11. How to design state and data fetching

**TanStack Query patterns:**

| Pattern | When | Example |
|---|---|---|
| `useQuery({ queryKey: ['x', filters] })` | Read-only data, list and detail | List of matches |
| `useMutation` + `queryClient.invalidateQueries` | Writes affecting cached lists | Create match → invalidate `['matches']` |
| `refetchInterval` | Polling for cross-tab visibility | `refetchInterval: 5000` on `['matches']` for the multi-user demo |

**Query key conventions:**
- List with no filters: `['bookings']`
- List with filters: `['bookings', { status, from, to }]`
- Detail: `['booking', id]`
- "Mine": `['bookings', 'me']`

**Server vs client data:**
- Initial page render: Server Component calls Prisma directly, passes `initialData` to Client component
- Subsequent updates: Client uses `useQuery({ initialData, queryKey, queryFn })` with the route handler endpoint
- Pattern eliminates one HTTP request on first load

**API client pattern:**
```typescript
// lib/api-client.ts
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.error?.code ?? "UNKNOWN", err.error?.message ?? "Request failed", res.status);
  }
  return res.json();
}
```

Note: same-origin fetches don't need full URL, just the path. Auth comes via Clerk session cookie automatically.

**Form state:**
- `useForm({ resolver: zodResolver(schema) })` always
- `defaultValues` from props or sensible defaults
- On submit: call mutation, on success close dialog and toast, on error set field errors via `setError`

---

## 12. How to apply the visual playbook

Map every page to a playbook layout pattern:

| Page type from PRD | Playbook pattern |
|---|---|
| List with filters and primary action | D. Command center |
| Detail view of one entity | F. Detail workspace |
| Multi-step form (rare in 1-hour) | E. Multi-step creation |
| Single-task page (e.g. profile create) | G. Focused task flow |
| Logged-in dashboard | C. Application shell |
| Public landing | A. Marketing home (skip for 1-hour) |

**For each component, reference playbook sections:**
- Buttons: section 7 (sizes, variants)
- Inputs: section 7 (40px default, label above, error treatment)
- Cards: section 7 (rounded-[--radius-lg], shadow-sm, p-6)
- Status pills: section 7 (one shared component, dot + label)
- Empty states: section 7 (icon, title, copy, one CTA)
- Loading: section 7 (skeleton shaped like content)

**Color decisions:**
- Primary action: `bg-primary text-primary-foreground`
- Destructive: `bg-destructive text-destructive-foreground`
- Secondary: outline or `bg-secondary`
- Status: tinted backgrounds (`bg-info/10`, `bg-success/10`)
- NEVER use raw hex.

**The "delight detail"** from PRD.md section 11 is a real implementation requirement. Specify exactly which file implements it and what behavior. Not optional.

---

## 13. Worked example

For the PickleMatch PRD (pickleball partner finder), DESIGN.md looks like this:

```markdown
# Design: PickleMatch

> Implementation contract for the Code agent.

---

## 1. File tree

Files marked **C**REATE, **M**ODIFY (existing from create-next-app), **N**O CHANGE.

```
[root]/
├── app/
│   ├── layout.tsx                                        M (add ClerkProvider, Toaster)
│   ├── globals.css                                       M (add OKLCH tokens)
│   ├── page.tsx                                          M (browse + filters)
│   ├── matches/page.tsx                                  C
│   ├── api/
│   │   ├── players/route.ts                              C (GET list)
│   │   ├── matches/route.ts                              C (POST create)
│   │   ├── matches/me/route.ts                           C (GET incoming)
│   │   └── matches/[id]/accept/route.ts                  C (POST accept)
│   ├── sign-in/[[...sign-in]]/page.tsx                   C
│   └── sign-up/[[...sign-up]]/page.tsx                   C
├── components/
│   ├── ui/                                               C (shadcn add: button card input label dialog select badge calendar form sheet sonner tabs avatar slider)
│   └── pickle/
│       ├── player-card.tsx                               C
│       ├── filter-bar.tsx                                C
│       ├── request-match-dialog.tsx                      C
│       ├── match-card.tsx                                C
│       ├── match-list.tsx                                C
│       ├── dupr-badge.tsx                                C
│       ├── browse-page-client.tsx                        C
│       └── matches-page-client.tsx                       C
├── lib/
│   ├── prisma.ts                                         C
│   ├── auth.ts                                           C (currentUser + inline-sync)
│   ├── api-client.ts                                     C
│   ├── api-errors.ts                                     C
│   ├── email.ts                                          C (Resend with no-op fallback)
│   ├── courts.ts                                         C (seeded courts JSON)
│   └── utils.ts                                          M (already from shadcn init)
├── types/
│   └── pickle.ts                                         C
├── prisma/
│   ├── schema.prisma                                     C
│   └── seed.ts                                           C
├── middleware.ts                                         C (Clerk middleware)
├── components.json                                       C (shadcn config)
├── .env.example                                          C
└── package.json                                          M (already from create-next-app)
```

---

## 2. Prisma schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String   @id @default(uuid())
  clerkUserId     String?  @unique
  email           String   @unique
  name            String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  player          Player?
  outgoingMatches Match[]  @relation("RequesterMatches")
  incomingMatches Match[]  @relation("RecipientMatches")
}

model Player {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  duprRating      Float
  preferredCourts String[]
  availability    String[]
  bio             String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([duprRating])
}

model Match {
  id              String      @id @default(uuid())
  requesterUserId String
  requester       User        @relation("RequesterMatches", fields: [requesterUserId], references: [id])
  recipientUserId String
  recipient       User        @relation("RecipientMatches", fields: [recipientUserId], references: [id])
  proposedDate    DateTime
  courtId         String
  message         String?
  status          MatchStatus @default(PENDING)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([recipientUserId, status])
  @@index([requesterUserId, status])
}

enum MatchStatus {
  PENDING
  CONFIRMED
  DECLINED
}
```

Courts are NOT a Prisma model. They live in `lib/courts.ts` as a hardcoded array of 4 Bay Area courts.

---

## 3. Shared types

```typescript
// types/pickle.ts

export type Player = {
  id: string;
  userId: string;
  duprRating: number;
  preferredCourts: string[];
  availability: string[];
  bio: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlayerWithUser = Player & {
  user: { id: string; name: string; email: string };
};

export type CreateMatchInput = {
  recipientUserId: string;
  proposedDate: string;
  courtId: string;
  message?: string;
};

export type Match = {
  id: string;
  requesterUserId: string;
  recipientUserId: string;
  proposedDate: string;
  courtId: string;
  message: string | null;
  status: "PENDING" | "CONFIRMED" | "DECLINED";
  createdAt: string;
  updatedAt: string;
};

export type MatchWithParties = Match & {
  requester: { id: string; name: string };
  recipient: { id: string; name: string };
};

export type Court = {
  id: string;
  name: string;
  city: string;
};

export type BrowseFilters = {
  duprMin?: number;
  duprMax?: number;
  court?: string;
  availability?: "weekday-am" | "weekday-pm" | "weekend";
};
```

---

## 4. API contracts (Route Handlers)

### GET /api/players

**File:** `app/api/players/route.ts`
**Auth:** required (`requireUser()`)
**Query schema:**
```typescript
const browsePlayersSchema = z.object({
  duprMin: z.coerce.number().min(2.0).optional(),
  duprMax: z.coerce.number().max(7.0).optional(),
  court: z.string().optional(),
  availability: z.enum(["weekday-am", "weekday-pm", "weekend"]).optional(),
});
```

**Business logic:**
1. Authenticate
2. Parse query params from URL
3. Build Prisma where clause from filters
4. Exclude viewer's own player
5. Include user relation for display name
6. Limit 50 results, order by `duprRating` desc

**Response (200):** `{ players: PlayerWithUser[] }`
**Errors:** 400 VALIDATION_ERROR, 401 UNAUTHORIZED

### POST /api/matches

**File:** `app/api/matches/route.ts`
**Auth:** required
**Body schema:**
```typescript
const createMatchSchema = z.object({
  recipientUserId: z.string().uuid(),
  proposedDate: z.string().datetime(),
  courtId: z.string(),
  message: z.string().max(500).optional(),
});
```

**Business logic:**
1. Authenticate
2. Parse body
3. Reject if `recipientUserId === requester.id` (409 CONFLICT)
4. Verify recipient exists (404 if not)
5. Create Match in PENDING within `prisma.$transaction`
6. After transaction: best-effort `sendMatchRequestEmail` (no-op if Resend not configured)

**Response (200):** `{ match: MatchWithParties }`
**Errors:** 400, 401, 404, 409

### POST /api/matches/[id]/accept

**File:** `app/api/matches/[id]/accept/route.ts`
**Auth:** required
**Params:** `{ id: string (UUID) }`

**Business logic:**
1. Authenticate
2. Parse `id` from `params` (await it for Next 15+)
3. Load match, verify user is recipient (403 FORBIDDEN if not)
4. Verify status is PENDING (409 CONFLICT if not)
5. Update to CONFIRMED
6. Best-effort confirmation email to both parties

**Response (200):** `{ match: MatchWithParties }`
**Errors:** 401, 403, 404, 409

### GET /api/matches/me

**File:** `app/api/matches/me/route.ts`
**Auth:** required
**Business logic:**
1. Authenticate
2. Query incoming (recipient = me, all statuses) and outgoing (requester = me, all statuses)
3. Include both party names

**Response (200):** `{ incoming: MatchWithParties[], outgoing: MatchWithParties[] }`

---

## 5. Pages and layouts

### `/` — `app/page.tsx`

**Type:** Server Component (initial fetch) + Client child for interactivity
**Layout pattern:** D. Command center
**Server fetches:**
```typescript
// app/page.tsx
const { userId } = await auth();
if (!userId) redirect("/sign-in");
const me = await currentAppUser(); // helper that runs inline-sync
const initialPlayers = await prisma.player.findMany({
  where: { userId: { not: me.id } },
  include: { user: true },
  take: 50,
});
return <BrowsePageClient initialPlayers={initialPlayers} viewerUserId={me.id} />;
```

**Page composition (rendered inside BrowsePageClient):**
```
RootLayout (TopBar with UserMenu)
└── Main (max-w-7xl mx-auto py-10 px-6)
    ├── PageHeader (flex justify-between items-center mb-8)
    │   ├── h1 "Find a partner"
    │   └── (no secondary CTA on this page)
    ├── FilterBar (sticky top-16 py-4 border-b bg-background mb-6)
    │   ├── Select duprRange (Beginner / Intermediate / Advanced + "All")
    │   ├── Select court (4 options + "All")
    │   └── Select availability ("Weekday AM" / "Weekday PM" / "Weekend" + "Any")
    ├── PlayerGrid (grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6)
    │   └── PlayerCard × N
    │       ├── Header: Avatar + name + DuprBadge
    │       ├── Body: Court badges + Availability chips + bio (line-clamp-2)
    │       └── Footer: Button primary "Request match" → opens RequestMatchDialog
    └── EmptyState (when filtered list is empty)
```

### `/matches` — `app/matches/page.tsx`

**Type:** Server Component fetching initial + Client child for polling
**Layout pattern:** D. Command center with Tabs
**Server fetch:** initial incoming + outgoing matches
**Client behavior:** `useQuery(['matches', 'me'], { refetchInterval: 5000 })` for live updates

**Page composition:**
```
Main (max-w-5xl mx-auto py-10 px-6)
├── PageHeader (mb-6)
│   ├── h1 "My matches"
│   └── p text-muted-foreground "Incoming requests and your sent matches"
└── Tabs defaultValue="incoming"
    ├── TabsList
    │   ├── Tab "Incoming" + count Badge
    │   └── Tab "Outgoing" + count Badge
    ├── TabsContent value=incoming
    │   └── MatchList variant=incoming
    │       └── MatchCard × N (Accept / Decline buttons if PENDING)
    └── TabsContent value=outgoing
        └── MatchList variant=outgoing (no actions, just status)
```

---

## 6. Component tree

### `dupr-badge.tsx`
- **Path:** `components/pickle/dupr-badge.tsx`
- **Type:** Server (no state)
- **Props:** `{ rating: number }`
- **Primitives:** `Badge`
- **Behavior:** Renders rating + cohort label. Tinted bg per cohort.

### `player-card.tsx`
- **Path:** `components/pickle/player-card.tsx`
- **Type:** Client (button click handler)
- **Props:** `{ player: PlayerWithUser; onRequestMatch: (player: PlayerWithUser) => void }`
- **Primitives:** `Card`, `Avatar`, `Badge`, `Button`
- **Behavior:** Renders one player. Click "Request match" calls `onRequestMatch(player)`.

### `filter-bar.tsx`
- **Path:** `components/pickle/filter-bar.tsx`
- **Type:** Client
- **Props:** `{ filters: BrowseFilters; onChange: (f: BrowseFilters) => void }`
- **Primitives:** `Select`
- **Behavior:** Controlled inputs, debounce-free. Calls `onChange` on every change.

### `request-match-dialog.tsx`
- **Path:** `components/pickle/request-match-dialog.tsx`
- **Type:** Client
- **Props:** `{ open: boolean; onOpenChange: (o: boolean) => void; player: PlayerWithUser | null }`
- **Hooks:** `useForm`, `useMutation`
- **Primitives:** `Dialog`, `Form`, `FormField`, `Calendar`, `Select`, `Textarea`, `Button`, `toast`
- **Behavior:** Submits `POST /api/matches`. On success: closes, `toast.success("Match request sent")`, invalidates `['matches', 'me']`.

### `match-card.tsx`
- **Path:** `components/pickle/match-card.tsx`
- **Type:** Client
- **Props:** `{ match: MatchWithParties; viewerUserId: string; variant: "incoming" | "outgoing" }`
- **Hooks:** `useMutation` for accept
- **Primitives:** `Card`, `Badge`, `Button`
- **Behavior:** Status pill, counterparty, court name (looked up from `lib/courts.ts`), date. If incoming + PENDING: Accept button visible.

### `match-list.tsx`
- **Path:** `components/pickle/match-list.tsx`
- **Type:** Client
- **Props:** `{ matches: MatchWithParties[]; viewerUserId: string; variant: "incoming" | "outgoing" }`
- **Behavior:** Maps to MatchCard. Empty state if no matches.

### `browse-page-client.tsx`
- **Path:** `components/pickle/browse-page-client.tsx`
- **Type:** Client (orchestrates state)
- **Props:** `{ initialPlayers: PlayerWithUser[]; viewerUserId: string }`
- **State:** `filters`, `selectedPlayer`, `dialogOpen`
- **Hooks:** `useQuery({ queryKey: ['players', filters], initialData: initialPlayers })`
- **Behavior:** Owns FilterBar, PlayerGrid, RequestMatchDialog. Wires onRequestMatch → opens dialog.

### `matches-page-client.tsx`
- **Path:** `components/pickle/matches-page-client.tsx`
- **Type:** Client
- **Props:** `{ initialIncoming: MatchWithParties[]; initialOutgoing: MatchWithParties[]; viewerUserId: string }`
- **Hooks:** `useQuery(['matches', 'me'], { refetchInterval: 5000 })`
- **Behavior:** Owns Tabs, both MatchLists.

---

## 7. State and data fetching

**Query keys:**
- Browse players: `['players', filters]` with `initialData` from server
- My matches: `['matches', 'me']` with `refetchInterval: 5000` for cross-tab demo

**Mutations and invalidations:**
- `requestMatch` → invalidate `['matches', 'me']`
- `acceptMatch` → invalidate `['matches', 'me']`

**Polling:** `refetchInterval: 5000` on the matches query is what enables the multi-tab demo. Bob sees Alice's request within 5s without manual refresh, and Alice sees the CONFIRMED status flip.

**API client (relative paths, same origin):**
```typescript
// lib/api-client.ts uses relative paths since same origin
fetch("/api/matches", { method: "POST", body: JSON.stringify(input) })
```

No `Authorization` header needed; Clerk session cookie is automatic.

---

## 8. Visual treatment notes

- Primary color: keep playbook default OKLCH primary
- DUPR badges:
  - Beginner (2.0 to 2.5): `bg-info/10 text-info`
  - Intermediate (3.0 to 3.5): `bg-primary/10 text-primary`
  - Advanced (4.0+): `bg-success/10 text-success`
- Status pills:
  - PENDING: `bg-warning/10 text-warning`
  - CONFIRMED: `bg-success/10 text-success`
  - DECLINED: `bg-muted text-muted-foreground`
- Cards: playbook `--radius-lg`, `shadow-sm`, `p-6`
- Empty state on `/`: lucide `MapPin` icon, title "No players match these filters", body "Try widening your DUPR range or picking another court," primary button "Reset filters"

---

## 9. Seed data plan

**File:** `prisma/seed.ts`
**Run via:** `npm run db:seed` (script wired in package.json)
**Data:**
- 4 courts in `lib/courts.ts`:
  1. `cuesta-park` Cuesta Park, Mountain View
  2. `sunnyvale-tc` Sunnyvale Tennis Center, Sunnyvale
  3. `bay-club-rs` Bay Club Redwood Shores, Redwood City
  4. `memorial-park` Memorial Park, Cupertino
- 8 demo Users + matching Players, DUPR 2.5 to 4.5, mixed availability and courts
- Real-sounding names, 1 to 2 sentence bios in pickleball vocabulary
- 1 demo Match in CONFIRMED state between two seeded players (visible state on first load)

The signed-in user's player profile is created on first match request OR via a small "complete your profile" CTA shown if their player record is null (skip in 1-hour build, just allow them to request matches without a profile by treating the user record as enough).

**Simplification for cold-start time:** the user does NOT need to create a Player to use the app. They are a User from Clerk. Players are seeded. The user is the requester, seeded players are recipients. This eliminates the profile-creation flow.

---

## 10. Demo path checklist

| Step | What it touches |
|---|---|
| 1. Open `localhost:3000`, sign in as Alice | Clerk hosted UI + inline-sync in `lib/auth.ts` |
| 2. See 8 seeded players on home page | `app/page.tsx` server fetch + `BrowsePageClient` |
| 3. Filter "DUPR 3.0 to 4.0, Cuesta Park, weekday-am," see Bob | `FilterBar` + `useQuery(['players', filters])` |
| 4. Click "Request match" on Bob, fill dialog, send | `RequestMatchDialog` + `POST /api/matches` |
| 5. Open second tab as Bob (incognito), go to `/matches` | `app/matches/page.tsx` + `MatchesPageClient` |
| 6. See PENDING request from Alice, click Accept | `MatchCard` + `POST /api/matches/[id]/accept` |
| 7. Within 5s, Alice's tab polls and shows CONFIRMED | `useQuery(['matches', 'me'], { refetchInterval: 5000 })` |

**Code agent verification:** After implementation, the user can walk this exact path on localhost in under 30 seconds.

```

---

## 14. Common mistakes

1. **Designing as if a separate Express API exists.** It doesn't. API = Route Handlers in `app/api/`.
2. **Adding `apps/web/` or `apps/api/` to file paths.** Single-app structure. Files at root or in `app/`, `components/`, `lib/`, `prisma/`, `types/`.
3. **Inventing new shadcn primitives.** Use what exists.
4. **Designing too many components.** A cold-start build needs 6 to 10 new components, not 20.
5. **Missing the empty state.** Part of the design, not afterthought.
6. **Forgetting indexes on filter columns.**
7. **Putting business logic in Route Handlers AND services.** Pick one. For 1-hour, inline in Route Handlers is fine.
8. **Designing forms without Zod schema.** Schema first.
9. **Skipping the polling decision for multi-user demos.** Specify `refetchInterval`.
10. **Generic file names** like `utils.ts`, `helpers.ts`. Use feature-scoped names.
11. **Hex colors.** Use tokens.
12. **Designing more than 2 pages.** Cap is 2 unless absolutely necessary.
13. **Forgetting where the delight detail lives.** Specify file and behavior.
14. **Including `NEXT_PUBLIC_API_URL`.** Same-origin, not needed.
15. **Suggesting a separate `User` profile creation page.** Skip it; use Clerk's user data and seed Players.

---

## 15. Self-check before output

1. ✅ Is every file in the file tree marked C / M / N?
2. ✅ All paths use single-app structure (no `apps/web/` or `apps/api/`)?
3. ✅ Does Prisma schema include User model + product models?
4. ✅ Are indexes on FK and filter columns?
5. ✅ Does every API endpoint have file path, body/params/query Zod schema, business logic outline, response shape, error codes?
6. ✅ Is every endpoint a Route Handler at `app/api/...`?
7. ✅ Does every page reference a playbook layout pattern?
8. ✅ Does every component spec list path, type, props, hooks, primitives, behavior?
9. ✅ Are query keys consistent?
10. ✅ Is `refetchInterval` specified where multi-user matters?
11. ✅ Is seed data realistic with community vocabulary?
12. ✅ Does the demo path checklist map every PRD demo step to specific files?
13. ✅ Is the delight detail implementation specified?
14. ✅ Are colors token-based, not hex?
15. ✅ Does this fit in ~30 minutes of product code (after ~10 min scaffold)?

If any answer is no, revise.

---

## End

Read `PRD.md` and `PRODUCT_DESIGN_PLAYBOOK.md`. Apply this framework. Output `DESIGN.md` per section 6.
