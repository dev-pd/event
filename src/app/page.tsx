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
      setError("Pick at least one vibe so we can match you.");
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
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700/80">
            San Francisco &amp; Bay Area
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
            Events matched to you—not another endless scroll.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-stone-600">
            Live picks from the{" "}
            <a
              href="https://sf.funcheap.com/"
              className="font-medium text-orange-800 underline decoration-orange-200 underline-offset-2 hover:text-orange-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              FunCheap
            </a>{" "}
            feed, ranked with{" "}
            <span className="font-medium text-stone-800">OpenAI</span> for fit and copy (when{" "}
            <code className="rounded bg-stone-200/80 px-1 text-sm">OPENAI_API_KEY</code> is set).
            Your tastes stay in the browser (localStorage)—no account or database.
          </p>
        </header>

        <section className="rounded-2xl border border-stone-200/80 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-6">
            <h2 className="text-lg font-medium text-stone-900">Your taste</h2>
            <p className="text-sm text-stone-500">
              Pick overlapping interests—more tags widen the funnel; keywords sharpen it.
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
            <p className="text-sm font-medium text-stone-700">Neighborhoods &amp; nearby</p>
            <p className="text-sm text-stone-500">Optional. Helps surface hyper-local copy.</p>
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
              Keywords
            </label>
            <input
              id="kw"
              className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-orange-400/60"
              placeholder="e.g. jazz, rooftop, fermentation, comedy cellar…"
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
            className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-stone-900 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50 sm:w-auto sm:px-10"
          >
            {saving ? "Fetching & ranking…" : "Save & refresh matches"}
          </button>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-stone-900">Your matches</h2>
              <p className="text-sm text-stone-500">
                Click a card for the full write-up and why it matched. Links go to the original
                listing.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-stone-600">
              <span className="rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-stone-200/80">
                <strong className="text-stone-900">{matchedCount}</strong> matched
              </span>
              <span className="rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-stone-200/80">
                <strong className="text-stone-900">{totalCandidates}</strong> in date window
              </span>
              {meta ? (
                <span
                  className={`rounded-full px-3 py-1 shadow-sm ring-1 ring-stone-200/80 ${
                    meta.usedOpenAI ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
                  }`}
                >
                  {meta.usedOpenAI
                    ? "AI-ranked + copy"
                    : meta.hasOpenAIKey
                      ? "Rules-based (AI parse failed)"
                      : "Rules-based — add OPENAI_API_KEY on Vercel"}
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
                Set your taste above—we&apos;ll pull fresh FunCheap listings and rank them for you.
              </p>
              <p className="mt-2 text-sm text-stone-500">
                Tip: start with <em>music + food + nightlife</em>, then refine with keywords like
                &quot;jazz&quot; or &quot;free&quot;.
              </p>
            </div>
          ) : saving && items.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white/80 p-12 text-center text-stone-600">
              Loading public events and ranking…
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white/80 p-8 text-center">
              <p className="text-stone-700">
                Nothing in this window matched strongly—try broader tags, fewer neighborhood filters,
                or different keywords. The live feed also changes throughout the week.
              </p>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {items.map((ev) => (
                <li key={ev.id}>
                  <EventMatchCard event={ev} onSelect={() => setSelectedEvent(ev)} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="border-t border-stone-200/80 pt-8 text-center text-xs leading-relaxed text-stone-500">
          Data © listing authors / FunCheap. This app aggregates and personalizes; always confirm
          details on the source page.
          {meta ? (
            <>
              {" "}
              Raw feed items this run: <strong>{meta.rawFeedCount}</strong>.
            </>
          ) : null}
        </footer>

        <EventDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      </div>
    </div>
  );
}
