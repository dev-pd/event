export type UserPreferences = {
  categories: string[];
  neighborhoods: string[];
  keywords: string | null;
};

export type ScoreableEvent = {
  title: string;
  description: string | null;
  venueName: string | null;
  address: string | null;
  categories: readonly string[];
};

export type ScoredEvent<T extends ScoreableEvent = ScoreableEvent> = {
  event: T;
  score: number;
  reasons: string[];
};

export function scorePreferenceMatch<T extends ScoreableEvent>(
  event: T,
  pref: UserPreferences,
): ScoredEvent<T> {
  const text = `${event.title} ${event.description ?? ""} ${event.venueName ?? ""} ${event.address ?? ""}`.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  for (const c of pref.categories) {
    if (event.categories.includes(c)) {
      score += 12;
      reasons.push(`Matches your "${c}" interest`);
    } else if (text.includes(c)) {
      score += 4;
      reasons.push(`Mentions ${c}`);
    }
  }

  for (const n of pref.neighborhoods) {
    const nLower = n.toLowerCase();
    if (text.includes(nLower)) {
      score += 10;
      reasons.push(`Near ${n}`);
    }
  }

  if (pref.keywords?.trim()) {
    const kws = pref.keywords
      .toLowerCase()
      .split(/[\s,]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 2);
    for (const k of kws) {
      if (text.includes(k)) {
        score += 6;
        reasons.push(`Keyword “${k}”`);
      }
    }
  }

  return { event, score, reasons };
}
