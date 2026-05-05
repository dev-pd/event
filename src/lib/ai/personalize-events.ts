import OpenAI from "openai";
import { z } from "zod";
import type { FeedItem } from "@/lib/feed/types";
import type { MatchedCard } from "@/lib/matched-card";
import { scorePreferenceMatch } from "@/lib/score";
import type { UserPreferences } from "@/lib/score";

const rankResponseSchema = z.object({
  ranked: z.array(
    z.object({
      id: z.string(),
      matchScore: z.number(),
      reasons: z.array(z.string()).max(6),
      cardHook: z.string().max(450).optional(),
    }),
  ),
});

function withinListingWindow(iso: string, now: Date): boolean {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return false;
  const past = new Date(now);
  past.setDate(past.getDate() - 2);
  const future = new Date(now);
  future.setDate(future.getDate() + 120);
  return t >= past && t <= future;
}

function toMatched(
  base: FeedItem,
  score: number,
  reasons: string[],
  description: string | null,
): MatchedCard {
  return {
    id: base.id,
    title: base.title,
    description,
    startAt: base.startAt,
    url: base.url,
    venueName: base.venueName,
    address: base.address,
    imageUrl: base.imageUrl,
    categories: [...base.categories],
    source: base.source,
    priceHint: base.priceHint,
    score: Math.round(score),
    reasons: reasons.slice(0, 6),
  };
}

export function algorithmicRank(
  raw: FeedItem[],
  prefs: UserPreferences,
  now: Date,
): MatchedCard[] {
  const candidates = raw.filter((e) => withinListingWindow(e.startAt, now));

  return candidates
    .map((e) => scorePreferenceMatch(e, prefs))
    .filter((s) => s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(a.event.startAt).getTime() - new Date(b.event.startAt).getTime(),
    )
    .slice(0, 50)
    .map((s) =>
      toMatched(s.event, s.score, s.reasons, s.event.description),
    );
}

export async function personalizeEvents(
  feed: FeedItem[],
  prefs: UserPreferences,
  now: Date,
): Promise<{ items: MatchedCard[]; usedOpenAI: boolean; candidateCount: number }> {
  const candidates = feed.filter((e) => withinListingWindow(e.startAt, now));
  const candidateCount = candidates.length;

  const key = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  if (!key) {
    return {
      items: algorithmicRank(feed, prefs, now),
      usedOpenAI: false,
      candidateCount,
    };
  }

  const payload = candidates.slice(0, 48).map((i) => ({
    id: i.id,
    title: i.title,
    snippet: (i.description ?? "").slice(0, 420),
    link: i.url,
    listedApprox: i.startAt,
    inferredTags: i.categories,
  }));

  const system = [
    "You curate San Francisco Bay Area happenings for a picky local audience.",
    "You receive listings from a public cheap/free events feed (titles and excerpts may omit exact times).",
    "Return ONLY valid JSON: {\"ranked\":[{\"id\":string,\"matchScore\":number,\"reasons\":string[] (2-4 items),\"cardHook\":string|null}]}",
    "matchScore is 0-100 for how well the event fits THIS user's interests, neighborhoods, and keywords.",
    "Include only events with genuine fit (typically matchScore >= 18). Omit events that clearly mismatch.",
    "Each reasons entry must be a crisp, friendly sentence (no boilerplate). cardHook is optional one-line flair for a card (max ~220 chars).",
    "Use the same id values from input. Never invent new ids.",
  ].join("\n");

  const userPayload = JSON.stringify({
    user: {
      interests: prefs.categories,
      neighborhoods: prefs.neighborhoods,
      keywords: prefs.keywords,
    },
    events: payload,
  });

  try {
    const client = new OpenAI({ apiKey: key });
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPayload },
      ],
      temperature: 0.4,
      max_tokens: 3500,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      return {
        items: algorithmicRank(feed, prefs, now),
        usedOpenAI: false,
        candidateCount,
      };
    }

    const parsedJson = JSON.parse(text) as unknown;
    const parsed = rankResponseSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return {
        items: algorithmicRank(feed, prefs, now),
        usedOpenAI: false,
        candidateCount,
      };
    }

    const byId = new Map(candidates.map((i) => [i.id, i]));
    const items: MatchedCard[] = [];

    for (const row of parsed.data.ranked) {
      if (row.matchScore < 15) continue;
      const base = byId.get(row.id);
      if (!base) continue;
      items.push(
        toMatched(base, row.matchScore, row.reasons, row.cardHook ?? base.description),
      );
    }

    items.sort(
      (a, b) =>
        b.score - a.score ||
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

    if (items.length === 0) {
      return {
        items: algorithmicRank(feed, prefs, now),
        usedOpenAI: false,
        candidateCount,
      };
    }

    return {
      items: items.slice(0, 45),
      usedOpenAI: true,
      candidateCount,
    };
  } catch {
    return {
      items: algorithmicRank(feed, prefs, now),
      usedOpenAI: false,
      candidateCount,
    };
  }
}
