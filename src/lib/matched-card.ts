/** Shape consumed by match cards and the detail dialog. */
export type MatchedCard = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  url: string;
  venueName: string | null;
  address: string | null;
  imageUrl: string | null;
  categories: string[];
  source: string;
  priceHint: string | null;
  score: number;
  reasons: string[];
};
