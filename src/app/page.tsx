"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CANONICAL_TAGS,
  type CanonicalTag,
  labelForTag,
  SF_NEIGHBORHOODS,
} from "@/lib/tags";
import { EventDetailDialog } from "@/components/event-detail-dialog";
import { EventMatchCard } from "@/components/event-match-card";
import { Spinner } from "@/components/spinner";
import { loadStoredPrefs, saveStoredPrefs } from "@/lib/prefs-storage";
import type { MatchedCard } from "@/lib/matched-card";
import type { UserPreferences } from "@/lib/score";

type PrefState = {
  categories: string[];
  neighborhoods: string[];
  keywords: string;
};

type FeedMeta = {
  usedOpenAI: boolean;
  rawFeedCount: number;
  hasOpenAIKey: boolean;
};

function allowedCategories(cats: string[]): CanonicalTag[] {
  const allow = new Set<string>(CANONICAL_TAGS as unknown as string[]);
  return cats.filter((c): c is CanonicalTag => allow.has(c));
}

export default function Home() {
  const [pref, setPref] = useState<PrefState>({
    categories: [],
    neighborhoods: [],
    keywords: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [items, setItems] = useState<MatchedCard[]>([]);
  const [needsPreferences, setNeedsPreferences] = useState(true);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<MatchedCard | null>(null);
  const [meta, setMeta] = useState<FeedMeta | null>(null);

  const loadMatches = useCallback(async (p: PrefState) => {
    const cats = allowedCategories(p.categories);
    const userPrefs: UserPreferences | null =
      cats.length > 0
        ? {
            categories: cats,
            neighborhoods: p.neighborhoods,
            keywords: p.keywords.trim() ? p.keywords.trim() : null,
          }
        : null;

    if (!userPrefs) {
      setNeedsPreferences(true);
      setItems([]);
      setTotalCandidates(0);
      setMatchedCount(0);
      setMeta(null);
      return;
    }

    setSaving(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/events/personalized", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: userPrefs.categories,
          neighborhoods: userPrefs.neighborhoods,
          keywords: userPrefs.keywords,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        items?: MatchedCard[];
        matchedCount?: number;
        totalCandidates?: number;
        needsPreferences?: boolean;
        meta?: FeedMeta;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Could not load events");
      }

      setNeedsPreferences(data.needsPreferences ?? false);
      setItems(data.items ?? []);
      setMatchedCount(data.matchedCount ?? 0);
      setTotalCandidates(data.totalCandidates ?? 0);
      setMeta(
        data.meta ?? {
          usedOpenAI: false,
          rawFeedCount: 0,
          hasOpenAIKey: false,
        },
      );
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Something went wrong");
      setItems([]);
      setMeta(null);
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = loadStoredPrefs();
      if (!stored) return;
      const next: PrefState = {
        categories: allowedCategories(stored.categories),
        neighborhoods: stored.neighborhoods,
        keywords: stored.keywords,
      };
      setPref(next);
      void loadMatches(next);
    });
  }, [loadMatches]);

  useEffect(() => {
    if (!selectedEvent || items.some((i) => i.id === selectedEvent.id)) {
      return;
    }
    queueMicrotask(() => {
      setSelectedEvent(null);
    });
  }, [items, selectedEvent]);

  const toggleCategory = (tag: CanonicalTag) => {
    setPref((p) => {
      const has = p.categories.includes(tag);
      return {
        ...p,
        categories: has
          ? p.categories.filter((c) => c !== tag)
          : [...p.categories, tag],
      };
    });
  };

  const toggleNeighborhood = (n: string) => {
    setPref((p) => ({
      ...p,
      neighborhoods: p.neighborhoods.includes(n)
        ? p.neighborhoods.filter((x) => x !== n)
        : [...p.neighborhoods, n],
    }));
  };

  const save = () => {
    if (pref.categories.length === 0) {
      setError("Choose at least one vibe above—we need a starting point to rank against.");
      return;
    }
    setError(null);
    saveStoredPrefs({
      categories: allowedCategories(pref.categories),
      neighborhoods: pref.neighborhoods,
      keywords: pref.keywords,
    });
    void loadMatches(pref);
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-amber-50 via-orange-50/80 to-stone-100 text-stone-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700/80">
            San Francisco &amp; Bay Area
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
            A shorter list of Bay events—sorted for how you actually like to go out.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-stone-600">
            We start from{" "}
            <a
              href="https://sf.funcheap.com/"
              className="font-medium text-orange-800 underline decoration-orange-200 underline-offset-2 hover:text-orange-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              FunCheap
            </a>
            —the long-running guide to free and cheap things to do—then score what fits your vibes.
            When AI is enabled, you also get tighter explanations and punchier hooks; otherwise you
            still get a ranked list from the same feed.
          </p>
          <p className="max-w-2xl text-base leading-relaxed text-stone-500">
            No sign-up—your interests live in{" "}
            <span className="font-medium text-stone-600">this browser only</span>. Each refresh
            sends your picks to rank the latest listings; we don&apos;t store a profile in a
            database.
          </p>
        </header>

        <section className="rounded-2xl border border-stone-200/80 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-6">
            <h2 className="text-lg font-medium text-stone-900">What sounds like you?</h2>
            <p className="text-sm text-stone-500">
              Choose one or more vibes. More tags cast a wider net; keywords (below) narrow it to
              the mood you want tonight.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {CANONICAL_TAGS.map((tag) => {
              const active = pref.categories.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleCategory(tag)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                      : "border-stone-200 bg-white text-stone-700 hover:border-orange-200"
                  }`}
                >
                  {labelForTag(tag)}
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <p className="text-sm font-medium text-stone-700">Neighborhoods (optional)</p>
            <p className="text-sm text-stone-500">
              Nudge results toward parts of the city you care about—perfect if you hate crossing the
              bridge for a weeknight.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SF_NEIGHBORHOODS.map((n) => {
                const active = pref.neighborhoods.includes(n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggleNeighborhood(n)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                      active
                        ? "border-amber-600 bg-amber-50 text-amber-900"
                        : "border-stone-200 bg-stone-50 text-stone-600 hover:border-amber-200"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <label htmlFor="kw" className="text-sm font-medium text-stone-700">
              Keywords (optional)
            </label>
            <input
              id="kw"
              className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-orange-400/60"
              placeholder="e.g. jazz, rooftop, no cover, comedy, farmers market…"
              value={pref.keywords}
              onChange={(e) =>
                setPref((p) => ({ ...p, keywords: e.target.value.slice(0, 200) }))
              }
            />
          </div>

          {error ? (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            aria-busy={saving}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-80 sm:w-auto sm:px-10"
          >
            {saving ? (
              <>
                <Spinner size="sm" className="text-white" />
                <span>Pulling feed &amp; ranking…</span>
              </>
            ) : (
              "Update my matches"
            )}
          </button>
        </section>

        <section className="space-y-4" aria-busy={saving}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-stone-900">Your shortlist</h2>
              <p className="text-sm text-stone-500">
                Open any card for the full blurb, why it landed for you, and a link out to the
                original FunCheap listing.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-stone-600">
              <span className="rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-stone-200/80">
                <strong className="text-stone-900">{matchedCount}</strong> strong fits
              </span>
              <span className="rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-stone-200/80">
                <strong className="text-stone-900">{totalCandidates}</strong> listings in range
              </span>
              {meta ? (
                <span
                  className={`rounded-full px-3 py-1 shadow-sm ring-1 ring-stone-200/80 ${
                    meta.usedOpenAI ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
                  }`}
                  title={
                    meta.usedOpenAI
                      ? "Ranked and summarized with AI."
                      : meta.hasOpenAIKey
                        ? "Used rule-based ranking this run; AI output was unavailable."
                        : "Ranked with your rules; add an OpenAI API key on the server for richer copy."
                  }
                >
                  {meta.usedOpenAI
                    ? "AI-tuned summaries"
                    : meta.hasOpenAIKey
                      ? "Classic ranking this run"
                      : "Classic ranking"}
                </span>
              ) : null}
            </div>
          </div>

          {fetchError ? (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {fetchError}
            </div>
          ) : null}

          {needsPreferences ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-8 text-center">
              <p className="text-base font-medium text-stone-700">
                Tell us what you&apos;re into above—then we&apos;ll hit the feed and build your first
                shortlist.
              </p>
              <p className="mt-2 text-sm text-stone-500">
                Not sure where to start? Try <em>music + food + arts</em>, then add keywords like
                &quot;jazz&quot;, &quot;free&quot;, or &quot;outdoor.&quot;
              </p>
            </div>
          ) : saving && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-stone-200 bg-white/80 p-12 text-center text-stone-600">
              <Spinner size="lg" className="text-orange-600" />
              <p className="text-base font-medium text-stone-700">
                Scanning the latest listings and scoring them for you…
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white/80 p-8 text-center">
              <p className="text-stone-700">
                Nothing scored high enough yet—try adding a vibe or two, loosening neighborhoods, or
                swapping keywords. The feed refreshes often, so it&apos;s worth another pass later
                this week.
              </p>
            </div>
          ) : (
            <div className="relative">
              {saving ? (
                <div
                  className="absolute inset-0 z-10 flex min-h-[12rem] items-center justify-center rounded-2xl bg-white/75 backdrop-blur-[2px]"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-stone-200/80 bg-white/95 px-8 py-6 shadow-lg">
                    <Spinner size="lg" className="text-orange-600" />
                    <p className="text-sm font-medium text-stone-800">Updating your shortlist…</p>
                    <p className="max-w-xs text-center text-xs text-stone-500">
                      Grabbing the newest posts from the feed and re-scoring with your latest picks.
                    </p>
                  </div>
                </div>
              ) : null}
              <ul
                className={`grid gap-5 sm:grid-cols-2 ${saving ? "pointer-events-none select-none opacity-50" : ""}`}
              >
                {items.map((ev) => (
                  <li key={ev.id}>
                    <EventMatchCard event={ev} onSelect={() => setSelectedEvent(ev)} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <footer className="border-t border-stone-200/80 pt-8 text-center text-xs leading-relaxed text-stone-500">
          Event copy and details belong to their publishers and{" "}
          <a
            href="https://sf.funcheap.com/"
            className="font-medium text-stone-600 underline decoration-stone-300 underline-offset-2 hover:text-stone-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            FunCheap
          </a>
          . Double-check times, prices, and tickets on the original listing before you head out.
          {meta ? (
            <>
              {" "}
              This refresh pulled <strong>{meta.rawFeedCount}</strong> items from the feed.
            </>
          ) : null}
        </footer>

        <EventDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      </div>
    </div>
  );
}
