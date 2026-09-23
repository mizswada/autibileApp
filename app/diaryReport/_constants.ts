export const DIARY_CATEGORY_KEYS = [
  "two_way_communication",
  "emotional_regulation",
  "focus_and_comprehension",
  "feeding_and_sensory",
  "sleep_and_daily_routines",
  "socialisation_self_confidence",
] as const;

export type DiaryCategoryKey = (typeof DIARY_CATEGORY_KEYS)[number];

export const DIARY_CATEGORIES: ReadonlyArray<{
  key: DiaryCategoryKey;
  label: string;
}> = [
  {
    key: "two_way_communication",
    label: "Two-way communication (Komunikasi dua hala)",
  },
  {
    key: "emotional_regulation",
    label: "Emotional regulation (Kawalan emosi)",
  },
  {
    key: "focus_and_comprehension",
    label: "Focus and comprehension (Fokus dan kefahaman)",
  },
  {
    key: "feeding_and_sensory",
    label: "Feeding and sensory needs (Pemakanan dan sensori)",
  },
  {
    key: "sleep_and_daily_routines",
    label: "Sleep and daily routines (Tidur dan rutin harian)",
  },
  {
    key: "socialisation_self_confidence",
    label: "Socialisation and self-confidence (Sosialisasi dan keyakinan diri)",
  },
];

export const OPTIONAL_NOTES_LABEL = "Additional Notes (Optional)";

export type DiaryEntryData = {
  description?: string | null;
  two_way_communication?: string | null;
  emotional_regulation?: string | null;
  focus_and_comprehension?: string | null;
  feeding_and_sensory?: string | null;
  sleep_and_daily_routines?: string | null;
  socialisation_self_confidence?: string | null;
};

export const EMPTY_CATEGORIES: Record<DiaryCategoryKey, string> = {
  two_way_communication: "",
  emotional_regulation: "",
  focus_and_comprehension: "",
  feeding_and_sensory: "",
  sleep_and_daily_routines: "",
  socialisation_self_confidence: "",
};

export function hasAnyCategoryFilled(
  categories: Record<DiaryCategoryKey, string>,
): boolean {
  return DIARY_CATEGORY_KEYS.some((key) => categories[key].trim().length > 0);
}

export function hasAnyCategoryInEntry(entry: DiaryEntryData): boolean {
  return DIARY_CATEGORY_KEYS.some(
    (key) => typeof entry[key] === "string" && entry[key]!.trim().length > 0,
  );
}

export function isLegacyDiaryEntry(entry: DiaryEntryData): boolean {
  return !hasAnyCategoryInEntry(entry) && !!entry.description?.trim();
}

export function formatDiaryEntryLines(entry: DiaryEntryData): string[] {
  const lines: string[] = [];

  DIARY_CATEGORIES.forEach(({ key, label }) => {
    const value = entry[key]?.trim();
    if (value) {
      lines.push(`${label}: ${value}`);
    }
  });

  if (entry.description?.trim()) {
    lines.push(`${OPTIONAL_NOTES_LABEL}: ${entry.description.trim()}`);
  }

  if (lines.length === 0 && entry.description?.trim()) {
    return [entry.description.trim()];
  }

  return lines;
}
