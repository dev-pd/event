"use client";

import type { KeyboardEvent } from "react";
import { format } from "date-fns";
import { EventCardImage } from "@/components/event-card-image";
import type { MatchedCard } from "@/lib/matched-card";

type Props = {
  event: MatchedCard;
  onSelect: () => void;
};

export function EventMatchCard({ event, onSelect }: Props) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white text-left shadow-sm ring-stone-300/0 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 hover:ring-orange-200/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
    >
      <div className="relative">
        {event.imageUrl ? (
          <EventCardImage primarySrc={event.imageUrl} title={event.title} />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-orange-700/90">
            {format(new Date(event.startAt), "EEE MMM d · h:mm a")}
          </p>
          <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-800">
            {event.score} pts
          </span>
        </div>
        <h3 className="text-lg font-semibold leading-snug text-stone-900 group-hover:text-orange-800">
          {event.title}
        </h3>
        <p className="text-sm text-stone-500 group-hover:text-stone-600">
          Tap for details, match reasons, and the original link
        </p>
        {event.venueName || event.address ? (
          <p className="text-sm text-stone-600">
            {event.venueName}
            {event.venueName && event.address ? " · " : ""}
            {event.address}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          {event.categories.slice(0, 5).map((c) => (
            <span
              key={c}
              className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700"
            >
              {c}
            </span>
          ))}
          {event.priceHint ? (
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-900">
              {event.priceHint}
            </span>
          ) : null}
          <span className="rounded-md bg-stone-50 px-2 py-0.5 text-xs text-stone-500">
            {event.source === "FUN_CHEAP_RSS" ? "FunCheap" : event.source}
          </span>
        </div>
        {event.reasons.length > 0 ? (
          <ul className="space-y-1 border-t border-stone-100 pt-3 text-sm text-stone-500">
            {event.reasons.slice(0, 2).map((r) => (
              <li key={r}>• {r}</li>
            ))}
            {event.reasons.length > 2 ? (
              <li className="text-stone-400">+{event.reasons.length - 2} more in details</li>
            ) : null}
          </ul>
        ) : null}
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-orange-700/90">
          View details
          <span aria-hidden className="transition group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </div>
  );
}
