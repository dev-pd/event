/** Canonical tags used for preferences and normalized event classification. */
export const CANONICAL_TAGS = [
  "music",
  "tech",
  "food",
  "outdoors",
  "art",
  "comedy",
  "film",
  "fitness",
  "community",
  "nightlife",
  "family",
] as const;

export type CanonicalTag = (typeof CANONICAL_TAGS)[number];

export const SF_NEIGHBORHOODS = [
  "SoMa",
  "Mission",
  "Castro",
  "Marina",
  "North Beach",
  "Chinatown",
  "Financial District",
  "Hayes Valley",
  "Nob Hill",
  "Russian Hill",
  "Potrero Hill",
  "Dogpatch",
  "Outer Sunset",
  "Inner Sunset",
  "Richmond",
  "Berkeley",
  "Oakland",
  "Alameda",
] as const;

const KEYWORD_TO_TAG: ReadonlyArray<{ words: string[]; tag: CanonicalTag }> = [
  { words: ["music", "concert", "dj", "jazz", "band", "symphony", "opera", "live music"], tag: "music" },
  { words: ["tech", "startup", "developer", "code", "hackathon", "ai ", " data"], tag: "tech" },
  { words: ["food", "tasting", "brunch", "dinner", "wine", "beer", "restaurant", "chef"], tag: "food" },
  { words: ["outdoor", "hike", "park", "bay trail", "golden gate", "beach"], tag: "outdoors" },
  { words: ["art", "gallery", "museum", "exhibit", "design", "installation"], tag: "art" },
  { words: ["comedy", "standup", "improv"], tag: "comedy" },
  { words: ["film", "cinema", "movie", "screening"], tag: "film" },
  { words: ["yoga", "run club", "fitness", "marathon", "cycling"], tag: "fitness" },
  { words: ["community", "meetup", "volunteer", "fundraiser", "neighborhood"], tag: "community" },
  { words: ["nightlife", "club", "party", "late night"], tag: "nightlife" },
  { words: ["kid", "family", "children", "stroller"], tag: "family" },
];

export function inferTagsFromText(title: string, description: string | null): CanonicalTag[] {
  const blob = `${title} ${description ?? ""}`.toLowerCase();
  const found = new Set<CanonicalTag>();
  for (const { words, tag } of KEYWORD_TO_TAG) {
    if (words.some((w) => blob.includes(w))) {
      found.add(tag);
    }
  }
  return Array.from(found);
}

export function labelForTag(tag: CanonicalTag): string {
  const labels: Record<CanonicalTag, string> = {
    music: "Music & live",
    tech: "Tech & startups",
    food: "Food & drink",
    outdoors: "Outdoors",
    art: "Art & museums",
    comedy: "Comedy",
    film: "Film",
    fitness: "Fitness & runs",
    community: "Community",
    nightlife: "Nightlife",
    family: "Family",
  };
  return labels[tag];
}
