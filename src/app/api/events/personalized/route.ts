import { NextResponse } from "next/server";
import { z } from "zod";
import { personalizeEvents } from "@/lib/ai/personalize-events";
import { fetchFunCheapFeedItems } from "@/lib/rss/fetchFunCheap";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  categories: z.array(z.string()).min(1),
  neighborhoods: z.array(z.string()).default([]),
  keywords: z.string().max(220).nullable().optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const prefs = {
    categories: parsed.data.categories,
    neighborhoods: parsed.data.neighborhoods,
    keywords: parsed.data.keywords ?? null,
  };

  try {
    const feed = await fetchFunCheapFeedItems();
    const result = await personalizeEvents(feed, prefs, new Date());
    return NextResponse.json({
      needsPreferences: false,
      items: result.items,
      matchedCount: result.items.length,
      totalCandidates: result.candidateCount,
      meta: {
        usedOpenAI: result.usedOpenAI,
        rawFeedCount: feed.length,
        hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY?.trim()),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build feed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
