import type { CanonicalTag } from "@/lib/tags";

/** Normalized row from RSS before AI or scoring. */
export type FeedItem = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  url: string;
  venueName: string | null;
  address: string | null;
  imageUrl: string | null;
  categories: CanonicalTag[];
  source: "FUN_CHEAP_RSS";
  priceHint: string | null;
};
