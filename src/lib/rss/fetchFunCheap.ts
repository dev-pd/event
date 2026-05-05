import { createHash } from "node:crypto";
import Parser from "rss-parser";
import type { FeedItem } from "@/lib/feed/types";
import type { CanonicalTag } from "@/lib/tags";
import { inferTagsFromText } from "@/lib/tags";

const FEEDS = [
  "https://sf.funcheap.com/feed/",
  "https://www.funcheap.com/feed/",
] as const;

const parser = new Parser({
  timeout: 20000,
  headers: {
    "User-Agent":
      "SF-EventAggregator/1.1 (events app; contact site owner if you see issues)",
  },
});

function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 24);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function fetchFunCheapFeedItems(): Promise<FeedItem[]> {
  const byUrl = new Map<string, FeedItem>();

  for (const feedUrl of FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      for (const item of feed.items ?? []) {
        const link = item.link?.trim();
        if (!link) continue;
        const title = (item.title ?? "Event").trim();
        const raw =
          item["content:encoded"] && typeof item["content:encoded"] === "string"
            ? item["content:encoded"]
            : item.content ?? item.summary ?? "";
        const description = stripHtml(String(raw)).slice(0, 6000) || null;
        const pub = item.pubDate ?? item.isoDate;
        let startAt = pub ? new Date(pub) : new Date();
        if (Number.isNaN(startAt.getTime())) {
          startAt = new Date();
        }
        const inferred = inferTagsFromText(title, description);
        const categories: CanonicalTag[] =
          inferred.length > 0 ? inferred : ["community"];
        let imageUrl: string | null = null;
        const enc = item.enclosure;
        if (enc && typeof enc === "object" && "url" in enc) {
          imageUrl = String((enc as { url?: string }).url ?? "") || null;
        }
        const thumb = (item as { "media:thumbnail"?: { $?: { url?: string } } })[
          "media:thumbnail"
        ];
        if (!imageUrl && thumb?.$?.url) {
          imageUrl = thumb.$.url;
        }

        const id = hashUrl(link);
        const fi: FeedItem = {
          id,
          title,
          description,
          startAt: startAt.toISOString(),
          url: link,
          venueName: null,
          address: null,
          imageUrl,
          categories,
          source: "FUN_CHEAP_RSS",
          priceHint: null,
        };
        if (!byUrl.has(link)) {
          byUrl.set(link, fi);
        }
      }
    } catch {
      /* one feed may fail; continue */
    }
  }

  return Array.from(byUrl.values());
}
