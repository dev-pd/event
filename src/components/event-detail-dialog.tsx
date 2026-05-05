"use client";

import { useEffect, useId, useRef } from "react";
import { format, formatDistanceToNow, isFuture } from "date-fns";
import { EventCardImage } from "@/components/event-card-image";
import type { MatchedCard } from "@/lib/matched-card";

type Props = {
  event: MatchedCard | null;
  onClose: () => void;
};

export function EventDetailDialog({ event, onClose }: Props) {
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!event) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeBtnRef.current?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [event, onClose]);

  if (!event) return null;

  const start = new Date(event.startAt);
  const soon = isFuture(start)
    ? formatDistanceToNow(start, { addSuffix: true })
    : "Starting soon";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 cursor-default bg-stone-950/55 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-stone-200/90 bg-white shadow-2xl ring-1 ring-black/5 sm:max-h-[min(85vh,880px)] sm:rounded-3xl"
      >
        <div className="max-h-[40vh] shrink-0 sm:max-h-[min(42vh,360px)]">
          {event.imageUrl ? (
            <EventCardImage primarySrc={event.imageUrl} title={event.title} />
          ) : (
            <div className="flex aspect-[16/9] max-h-[min(40vh,320px)] items-center justify-center bg-gradient-to-br from-stone-200 to-stone-400 px-6 text-center text-sm font-medium text-stone-800">
              {event.title}
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-100 bg-white/95 px-5 pb-4 pt-5 backdrop-blur-sm sm:px-7">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700/90">
                {format(start, "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-sm text-stone-500">
                {format(start, "h:mm a")} · {soon}
              </p>
              <h2
                id={titleId}
                className="pt-1 text-xl font-semibold leading-snug tracking-tight text-stone-950 sm:text-2xl"
              >
                {event.title}
              </h2>
            </div>
            <button
              type="button"
              ref={closeBtnRef}
              onClick={onClose}
              className="shrink-0 rounded-full border border-stone-200 bg-white p-2 text-stone-500 transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-800"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-8 px-5 py-6 sm:px-7">
            {(event.venueName || event.address) && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  Where
                </h3>
                <p className="mt-2 text-base text-stone-800">
                  {event.venueName ? <span className="font-medium">{event.venueName}</span> : null}
                  {event.venueName && event.address ? (
                    <span className="text-stone-400"> · </span>
                  ) : null}
                  {event.address}
                </p>
              </section>
            )}

            {event.description ? (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                  About
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-stone-600">{event.description}</p>
              </section>
            ) : null}

            <section className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/90 to-amber-50/50 p-4 sm:p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-800/80">
                Why this matched you
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-semibold text-orange-950 ring-1 ring-orange-200/80">
                  Match score: {event.score}
                </span>
                <span className="text-xs text-stone-500">
                  Higher = stronger overlap with your tastes and keywords.
                </span>
              </div>
              {event.reasons.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm text-stone-700">
                  {event.reasons.map((r) => (
                    <li key={r} className="flex gap-2">
                      <span className="text-orange-500" aria-hidden>
                        ✓
                      </span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                Tags & price
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {event.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium capitalize text-stone-700"
                  >
                    {c}
                  </span>
                ))}
                {event.priceHint ? (
                  <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                    {event.priceHint}
                  </span>
                ) : null}
                <span className="rounded-lg border border-dashed border-stone-200 px-2.5 py-1 text-xs text-stone-500">
                  {event.source === "FUN_CHEAP_RSS" ? "FunCheap feed" : event.source}
                </span>
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 flex flex-col gap-3 border-t border-stone-100 bg-white/95 p-5 backdrop-blur-sm sm:flex-row sm:justify-end sm:px-7 sm:py-5">
            <button
              type="button"
              onClick={onClose}
              className="order-2 h-12 rounded-xl border border-stone-200 bg-white px-6 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 sm:order-1"
            >
              Close
            </button>
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="order-1 flex h-12 items-center justify-center rounded-xl bg-stone-900 px-6 text-sm font-semibold text-white transition hover:bg-stone-800 sm:order-2"
            >
              Open original listing ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
