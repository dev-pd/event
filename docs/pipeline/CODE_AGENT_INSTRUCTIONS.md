# Code Agent Instructions (v3: cold-start, single Next.js app)

> **For the Cursor agent:** You are Stage 3. `PRD.md` and `DESIGN.md` exist. The repo is **empty** except for these doc files. Your job: scaffold the entire app from `npx create-next-app`, then implement the product code, then verify the demo runs on localhost. All in ~38 minutes.
>
> Do not redesign. Do not ask the user clarifying questions. Follow the steps in order. Do not jump ahead.

---

## 1. The pipeline

**Stage 1 (done):** `PRD.md` exists.
**Stage 2 (done):** `DESIGN.md` exists.
**Stage 3 (you):** Build everything from `git init` to working demo on localhost.

---

## 2. Inputs to read first

In order:
1. **`PRD.md`** — product spec
2. **`DESIGN.md`** — implementation contract (file tree, schema, types, schemas, API contracts, components, seed plan, demo path)
3. **`PRODUCT_DESIGN_PLAYBOOK.md`** — visual decisions
4. **This file** — execution rules

The user (separately) has already verified before challenge day:
- Node 20+ installed
- npm working
- PostgreSQL running on `localhost:5432` (via `docker compose up -d` or local install)
- A database exists (or `createdb` permission to make one)
- Clerk account exists with `pk_test_` and `sk_test_` keys ready
- The user will paste keys into `.env.local` after Step 1

---

## 3. The locked stack

| Layer | Tech | Notes |
|---|---|---|
| Framework | Next.js latest, App Router, TS strict | `localhost:3000` |
| Backend | **Route Handlers in `app/api/`** | NO Express |
| UI | shadcn/ui (New York), Radix, Tailwind v4, lucide-react | OKLCH tokens from playbook |
| Forms | react-hook-form + Zod | `@hookform/resolvers/zod` |
| Data | TanStack Query for client, Server Components + Prisma direct for server pages | |
| Auth | `@clerk/nextjs` with `currentUser()` in handlers, inline upsert helper | NO webhook. Mock-mode toggle. |
| ORM | Prisma against local Postgres | |
| Validation | Zod | |
| Toasts | Sonner | |
| Theme | next-themes, light only | |
| Email | Resend (optional, no-op without key) | |

---

## 4. THE SCAFFOLD STEPS (run in order, ~10 min total)

This is the part that was missing before. Run every step. Do not skip.

### Step S1: Create the Next.js app (90 sec)

Run from the directory the user is in (the empty challenge repo):

```bash
npx create-next-app@latest . \
  --typescript --tailwind --app --src-dir=false \
  --import-alias "@/*" --eslint --use-npm --yes
```

This installs Next.js, React, TypeScript, Tailwind v4, ESLint. The `--yes` accepts all prompts.

If a `package.json` already exists from `git init`, run with `--force` or in a fresh directory.

### Step S2: Install runtime dependencies (60 sec)

```bash
npm install \
  @clerk/nextjs \
  @prisma/client \
  @tanstack/react-query \
  @hookform/resolvers \
  react-hook-form \
  zod \
  date-fns \
  lucide-react \
  sonner \
  next-themes \
  framer-motion \
  class-variance-authority \
  clsx \
  tailwind-merge
```

Dev deps:

```bash
npm install -D \
  prisma \
  tsx \
  @types/node
```

### Step S3: Initialize Prisma (60 sec)

```bash
npx prisma init --datasource-provider postgresql
```

Edit `.env` so `DATABASE_URL` points at local Postgres. Default working value:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/challengeapp?schema=public"
```

If the DB doesn't exist:

```bash
createdb challengeapp 2>/dev/null || true
```

Replace `prisma/schema.prisma` with this baseline (we'll add product models in Step P1):

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(uuid())
  clerkUserId String?  @unique
  email       String   @unique
  name        String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Run the first migration:

```bash
npx prisma migrate dev --name init
```

### Step S4: Initialize shadcn/ui (60 sec)

```bash
npx shadcn@latest init -d
```

Accept defaults: New York style, neutral base color, CSS variables: yes.

Add the primitives we'll need:

```bash
npx shadcn@latest add button card input label textarea \
  dialog select badge calendar form checkbox separator \
  sheet sonner tabs avatar dropdown-menu slider tooltip \
  skeleton popover
```

Adjust the list per `DESIGN.md` if specific components are noted as needed there.

### Step S5: Install OKLCH design tokens (60 sec)

Replace `app/globals.css` with the token set from `PRODUCT_DESIGN_PLAYBOOK.md` section 2 plus the radius and shadow tokens from section 3. Keep the Tailwind v4 import at the top:

```css
@import "tailwindcss";

:root {
  --background: oklch(0.99 0.005 95);
  --foreground: oklch(0.15 0.01 250);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.15 0.01 250);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.15 0.01 250);
  --primary: oklch(0.55 0.08 180);
  --primary-foreground: oklch(0.99 0.005 95);
  --secondary: oklch(0.96 0.01 95);
  --secondary-foreground: oklch(0.25 0.02 180);
  --muted: oklch(0.95 0.008 95);
  --muted-foreground: oklch(0.5 0.02 250);
  --accent: oklch(0.93 0.03 180);
  --accent-foreground: oklch(0.25 0.05 180);
  --destructive: oklch(0.55 0.15 28);
  --destructive-foreground: oklch(0.99 0.005 95);
  --success: oklch(0.55 0.10 150);
  --success-foreground: oklch(0.99 0.005 95);
  --warning: oklch(0.70 0.12 75);
  --warning-foreground: oklch(0.20 0.05 75);
  --info: oklch(0.60 0.08 230);
  --info-foreground: oklch(0.99 0.005 95);
  --border: oklch(0.90 0.008 95);
  --input: oklch(0.90 0.008 95);
  --ring: oklch(0.55 0.08 180);

  --radius-sm: 6px;
  --radius: 10px;
  --radius-md: 12px;
  --radius-lg: 16px;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: var(--radius-sm);
  --radius: var(--radius);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: ui-sans-serif, system-ui, sans-serif;
}
```

Update `components.json` `tailwind.cssVariables` is already true from `init`.

### Step S6: Create Prisma singleton (30 sec)

Create `lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Step S7: Create error helpers (30 sec)

Create `lib/errors.ts`:

```typescript
export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (code: string, message: string) =>
  new ApiError(code, 400, message);
export const unauthorized = (code = "UNAUTHORIZED", message = "Sign in to continue") =>
  new ApiError(code, 401, message);
export const forbidden = (code: string, message: string) =>
  new ApiError(code, 403, message);
export const notFound = (code: string, message: string) =>
  new ApiError(code, 404, message);
export const conflict = (code: string, message: string) =>
  new ApiError(code, 409, message);

import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status }
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid input", issues: err.issues } },
      { status: 400 }
    );
  }
  console.error("Unexpected error:", err);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
    { status: 500 }
  );
}
```

### Step S8: Create auth helper with inline sync (90 sec)

Create `lib/auth.ts`:

```typescript
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { unauthorized } from "./errors";

const AUTH_MODE = process.env.AUTH_MODE ?? "clerk";

const DEMO_USERS = [
  { id: "demo-user-1", email: "demo1@kiloforge.app", name: "Demo Player 1" },
  { id: "demo-user-2", email: "demo2@kiloforge.app", name: "Demo Player 2" },
  { id: "demo-user-3", email: "demo3@kiloforge.app", name: "Demo Player 3" },
];

/**
 * Returns the local User row for the current request.
 * - Clerk mode: verifies Clerk session, upserts local User by clerkUserId.
 * - Mock mode: reads X-Demo-User-Id header from the request, upserts demo user.
 */
export async function getCurrentUser(req?: Request) {
  if (AUTH_MODE === "mock") {
    const headerId = req?.headers.get("x-demo-user-id") ?? "demo-user-1";
    const demo = DEMO_USERS.find((u) => u.id === headerId) ?? DEMO_USERS[0];
    return prisma.user.upsert({
      where: { email: demo.email },
      update: {},
      create: { email: demo.email, name: demo.name },
    });
  }

  const cu = await currentUser();
  if (!cu) throw unauthorized();

  const email =
    cu.primaryEmailAddress?.emailAddress ??
    cu.emailAddresses[0]?.emailAddress ??
    `${cu.id}@unknown.local`;
  const name =
    [cu.firstName, cu.lastName].filter(Boolean).join(" ").trim() ||
    email.split("@")[0];

  return prisma.user.upsert({
    where: { clerkUserId: cu.id },
    update: { email, name },
    create: { clerkUserId: cu.id, email, name },
  });
}
```

### Step S9: Create middleware and ClerkProvider (60 sec)

Create `middleware.ts` at the repo root:

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/(dashboard)(.*)",
  "/api/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (process.env.AUTH_MODE === "mock") return;
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
```

Update `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "App",
  description: "Built in 60 minutes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Providers>{children}</Providers>
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
```

Create `app/providers.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

Create `app/sign-in/[[...sign-in]]/page.tsx`:

```tsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <SignIn />
    </div>
  );
}
```

Same for `app/sign-up/[[...sign-up]]/page.tsx` with `<SignUp />`.

### Step S10: Set up `.env.local` (30 sec)

Tell the user (in your output) to add this to `.env.local`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/challengeapp?schema=public

AUTH_MODE=clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Optional, email features no-op without this
RESEND_API_KEY=
EMAIL_FROM=
```

If user wants to skip Clerk entirely for the demo, they set `AUTH_MODE=mock` and don't need Clerk keys.

### Step S11: Verify scaffold runs (60 sec)

```bash
npm run dev
```

Open `http://localhost:3000`. Should render the Next.js default page (will replace soon). No errors in terminal or browser console.

If `Module not found` for any dep, install it. If Prisma client errors, run `npx prisma generate`.

**Commit checkpoint:**

```bash
git add . && git commit -m "scaffold: next.js + clerk + prisma + shadcn"
```

---

## 5. THE PRODUCT BUILD STEPS (run in order, ~30 min)

Now build the product per `DESIGN.md`.

### Step P1: Add product models to Prisma schema (3 min)

1. Open `prisma/schema.prisma`
2. Append the schema from `DESIGN.md` section 2 (Prisma schema additions)
3. Add any back-relations needed on User model
4. Run:
   ```bash
   npx prisma migrate dev --name [feature_name]
   ```
5. Verify it ran cleanly (Prisma client regenerates automatically)

If migrate fails: check relation names match on both sides, check cascade rules, check NULL/default for new columns.

### Step P2: Add types and Zod schemas (3 min)

1. Create `lib/types/[feature].ts` per `DESIGN.md` section 3
2. Create `lib/schemas/[feature].ts` per `DESIGN.md` section 4
3. Use `z.coerce.number()` for query params
4. Use `z.string().datetime()` for ISO date strings
5. Use `z.string().uuid()` for ID params

### Step P3: Create services (5 min)

For each service function in `DESIGN.md` section 5:

1. Create `lib/services/[feature].ts`
2. Export named async functions
3. Signatures: `async function xxx(viewerUserId: string, input: T): Promise<R>`
4. Use `prisma` from `@/lib/prisma`
5. Multi-row writes inside `prisma.$transaction(async (tx) => { ... })`
6. Throw `AppError` factories from `@/lib/errors`
7. NEVER touch req/res. Pure business logic.

**Pattern:**

```typescript
// lib/services/players.ts
import { prisma } from "@/lib/prisma";
import { conflict } from "@/lib/errors";
import type { CreatePlayerInput, BrowseFilters } from "@/lib/types/pickle";

export async function upsertPlayer(userId: string, input: CreatePlayerInput) {
  return prisma.player.upsert({
    where: { userId },
    update: input,
    create: { userId, ...input },
  });
}

export async function browsePlayers(viewerUserId: string, filters: BrowseFilters) {
  return prisma.player.findMany({
    where: {
      userId: { not: viewerUserId },
      ...(filters.duprMin !== undefined && { duprRating: { gte: filters.duprMin } }),
      ...(filters.duprMax !== undefined && { duprRating: { lte: filters.duprMax } }),
      ...(filters.court && { preferredCourts: { has: filters.court } }),
      ...(filters.availability && { availability: { has: filters.availability } }),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    take: 50,
    orderBy: { createdAt: "desc" },
  });
}
```

### Step P4: Create Route Handlers (5 min)

For each endpoint in `DESIGN.md` section 5:

1. Create `app/api/[resource]/route.ts` (and `[id]/route.ts` etc.)
2. Export `GET`, `POST`, `PATCH`, `DELETE` named functions
3. Each handler:
   - Wrap in try/catch with `toErrorResponse(err)` in catch
   - Call `getCurrentUser(req)` for auth
   - Parse with Zod (`safeParse` then throw, or just `parse` — both fine)
   - Call service
   - Return `NextResponse.json({ ... }, { status: 200 })`

**Pattern:**

```typescript
// app/api/players/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { upsertPlayerSchema, browsePlayersSchema } from "@/lib/schemas/pickle";
import { upsertPlayer, browsePlayers } from "@/lib/services/players";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    const body = upsertPlayerSchema.parse(await req.json());
    const player = await upsertPlayer(user.id, body);
    return NextResponse.json({ player });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    const filters = browsePlayersSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams)
    );
    const players = await browsePlayers(user.id, filters);
    return NextResponse.json({ players });
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

For dynamic routes:

```typescript
// app/api/matches/[id]/accept/route.ts
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    const { id } = await params;
    uuidParamSchema.parse({ id });
    const match = await acceptMatch(user.id, id);
    return NextResponse.json({ match });
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

Note: Next.js 15+ has params as a Promise. Always `await params`.

### Step P5: Create browser API client (2 min)

Create `lib/api.ts`:

```typescript
export class ApiError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new ApiError(
      json?.error?.code ?? "UNKNOWN",
      res.status,
      json?.error?.message ?? "Request failed"
    );
  }
  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
```

For Clerk auth on client requests, Clerk's `useAuth().getToken()` returns a JWT. Add to fetch headers when in clerk mode. Actually, since we're in the same Next.js app, **the cookie session works automatically for browser fetches.** No token plumbing needed for client→same-origin API. Skip the token gymnastics.

### Step P6: Create components (10 min)

Build in this order:
1. Leaf components (badges, small cards)
2. Form components (dialogs, profile forms)
3. List components
4. Layout components
5. Pages

For each component in `DESIGN.md` section 7:

- File at the exact path specified
- `"use client"` if specified
- Named export, PascalCase
- Props match `DESIGN.md` exactly
- Use shadcn primitives from `@/components/ui/`
- Use lucide icons
- Tokens only, no hex

**Key patterns:**

List with TanStack Query:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PlayerWithUser, BrowseFilters } from "@/lib/types/pickle";

export function PlayerList({ filters }: { filters: BrowseFilters }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["players", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, String(v)));
      const res = await api.get<{ players: PlayerWithUser[] }>(
        `/api/players?${params}`
      );
      return res.players;
    },
  });

  if (isLoading) return <PlayerListSkeleton />;
  if (error || !data) return <PlayerListError />;
  if (data.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((p) => <PlayerCard key={p.id} player={p} />)}
    </div>
  );
}
```

Form dialog with mutation:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
// ... shadcn imports

export function RequestMatchDialog({ open, onOpenChange, player }) {
  const qc = useQueryClient();
  const form = useForm({
    resolver: zodResolver(createMatchSchema),
    defaultValues: { /* ... */ },
  });

  const mutation = useMutation({
    mutationFn: (input: CreateMatchInput) =>
      api.post<{ match: Match }>("/api/matches", input),
    onSuccess: () => {
      toast.success("Match request sent");
      qc.invalidateQueries({ queryKey: ["matches", "me"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Could not send");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
            {/* fields */}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Sending..." : "Send request"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Step P7: Create pages (5 min)

Per `DESIGN.md` section 6.

**Server Component fetching directly via Prisma** (faster than HTTP roundtrip):

```tsx
// app/(dashboard)/profile/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/pickle/profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const player = await prisma.player.findUnique({ where: { userId: user.id } });
  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-semibold mb-2">Your player profile</h1>
      <p className="text-[var(--muted-foreground)] mb-8">How others find you</p>
      <ProfileForm defaultValues={player ?? undefined} />
    </div>
  );
}
```

**Client page** with `useQuery`:

```tsx
// app/(dashboard)/matches/page.tsx
"use client";
// imports
export default function MatchesPage() {
  const { data } = useQuery({
    queryKey: ["matches", "me"],
    queryFn: () => api.get<{ matches: { incoming: Match[]; outgoing: Match[] } }>("/api/matches/me").then(r => r.matches),
    refetchInterval: 5000, // KEY for multi-tab demo
  });
  // ...
}
```

### Step P8: Create the dashboard layout (3 min)

`app/(dashboard)/layout.tsx`:

```tsx
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold">[App name]</Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm">Browse</Link>
            <Link href="/matches" className="text-sm">My matches</Link>
            <Link href="/profile" className="text-sm">Profile</Link>
            <UserButton afterSignOutUrl="/sign-in" />
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
```

If `AUTH_MODE=mock`, swap `UserButton` for the demo user switcher (see DESIGN.md if specified).

### Step P9: Seed data (3 min)

Create `prisma/seed.ts` per `DESIGN.md` section 10. Add to `package.json`:

```json
"scripts": {
  "db:seed": "tsx prisma/seed.ts"
},
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Run:

```bash
npm run db:seed
```

Verify with `npx prisma studio` if needed.

### Step P10: Implement the delight detail (1 min)

Per `DESIGN.md` section 9 and `PRD.md` section 11. Specific words, specific behavior. Add a code comment marking it.

---

## 6. THE SMOKE TEST (~5 min)

Run before declaring done.

### Backend smoke

1. `npm run dev` starts cleanly
2. Visit `http://localhost:3000` — no errors in browser console
3. For each endpoint, hit it once:
   ```bash
   # mock mode
   curl http://localhost:3000/api/players \
     -H "X-Demo-User-Id: demo-user-1" | jq
   
   curl -X POST http://localhost:3000/api/players \
     -H "Content-Type: application/json" \
     -H "X-Demo-User-Id: demo-user-1" \
     -d '{"duprRating":3.5,"preferredCourts":["court-1"],"availability":["weekday-am"]}' | jq
   ```
4. Verify rows in DB via `npx prisma studio`

### Frontend smoke

1. Sign in (Clerk) or pick demo user (mock)
2. Walk the demo path from `DESIGN.md` section 11:
   - Step 1 → step 2 → ... → final state
   - Each step renders without errors
   - The cross-tab update works (open second tab, do action, see update within polling interval)

### Visual smoke

1. Light mode renders with warm whites (not pure white)
2. Cards have soft shadows and rounded corners
3. Buttons are 40px tall (or 48px in comfort mode)
4. Empty states render with icon + title + body + CTA
5. Toasts fire on success and error

### The 30-second timer

Set a timer. Walk the demo flow at narration pace. Should fit in 30 seconds. If it doesn't, polish or cut.

---

## 7. Common mistakes

1. **Forgetting `await params` in dynamic routes.** Next.js 15 changed this.
2. **Using Express patterns.** No `req.appUser`, no `res.json()`. Use `getCurrentUser(req)` and `NextResponse.json()`.
3. **Forgetting `"use client"` on components with hooks.** Build error with cryptic message.
4. **Hardcoded URLs.** Use relative paths for fetches (`"/api/x"`), not `localhost:3000`.
5. **Skipping `npx prisma generate` after schema change.** TS error appears stale.
6. **Skipping `npx prisma migrate dev`.** DB stays old.
7. **Wrong `import` paths.** `@/lib/...` not `~/lib/...`.
8. **Putting business logic in route.ts.** Always in `lib/services/`.
9. **Missing `refetchInterval`.** Multi-tab demo silently breaks.
10. **Polling at 1s.** Burns CPU. 5s is fine.
11. **Toast: "An error occurred."** Useless. Say what failed.
12. **Generic empty states.** Use community vocabulary from PRD section 11.
13. **Forgetting the delight detail.** It's in PRD/DESIGN. Ship it.
14. **Trying to add Express, Pulumi, Docker for the app.** Not in scope.

---

## 8. What to do if you finish early

In priority order:

1. Polish the empty state copy — make it more insider
2. Add count badges on tabs/filters
3. Add Framer Motion stagger on card grid (80ms each)
4. Add "Reset filters" button on empty state
5. Add subtle hover (scale 1.01) on cards
6. Add relative time helper for timestamps via date-fns
7. Improve loading skeleton to match card shape

Do NOT add new features. Stay in PRD scope.

---

## 9. What to do if something breaks

| Symptom | Fix |
|---|---|
| Prisma migrate fails | `npx prisma migrate reset --force`, re-run |
| TS error after schema change | `npx prisma generate` |
| `Module not found` | Install the missing dep, restart dev server |
| Clerk redirect loop | Check `NEXT_PUBLIC_CLERK_SIGN_IN_URL` matches actual route |
| Auth fails locally | Try `AUTH_MODE=mock` in `.env.local` and restart |
| Mutation works but UI stale | Check `qc.invalidateQueries` keys match `useQuery` keys |
| Cross-tab demo doesn't update | Check `refetchInterval` set on the matches query |
| Server Component error | Check it's not using browser APIs; mark `"use client"` if needed |
| Hydration error | Random/Date.now() during SSR. Move to useEffect. |
| `params` undefined | Next.js 15: `await params` |

If something genuinely won't work after 5 min of debugging, **CUT the feature.** Update PRD.md to note. Continue. A demo with 2 working features beats 3 broken ones.

---

## 10. Self-check before declaring done

1. ✅ All scaffold steps S1-S11 ran cleanly?
2. ✅ All files in DESIGN.md tree exist?
3. ✅ Prisma migrate ran cleanly?
4. ✅ `npm run dev` starts without errors?
5. ✅ Sign-in flow works (or mock mode renders demo switcher)?
6. ✅ Every API endpoint returns 200 on happy path?
7. ✅ Demo path runs end-to-end on localhost in under 45 sec?
8. ✅ Multi-tab demo updates within polling interval?
9. ✅ Seed data realistic with community vocabulary?
10. ✅ Empty state has insider copy?
11. ✅ Delight detail implemented?
12. ✅ No console errors?
13. ✅ All colors via tokens (no hex)?
14. ✅ Email gracefully no-ops without RESEND_API_KEY?

If any answer is no, fix before declaring done.

---

## 11. End

You have ~38 minutes total: 10 for scaffold, 30 for product code, ~5 for smoke test (yes that's 45 — buffer is good). Move fast. Follow the steps in order. Ship.
