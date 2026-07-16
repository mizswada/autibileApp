export const DIARY_CATEGORY_KEYS = [
  "category_1",
  "category_2",
  "category_3",
  "category_4",
  "category_5",
] as const;

export type DiaryCategoryKey = (typeof DIARY_CATEGORY_KEYS)[number];

export const DIARY_CATEGORIES: ReadonlyArray<{
  key: DiaryCategoryKey;
  label: string;
}> = [
  { key: "category_1", label: "Category 1" },
  { key: "category_2", label: "Category 2" },
  { key: "category_3", label: "Category 3" },
  { key: "category_4", label: "Category 4" },
  { key: "category_5", label: "Category 5" },
];

export const OPTIONAL_NOTES_LABEL = "Additional Notes (Optional)";

export type DiaryEntryData = {
  description?: string | null;
  category_1?: string | null;
  category_2?: string | null;
  category_3?: string | null;
  category_4?: string | null;
  category_5?: string | null;
};

export const EMPTY_CATEGORIES: Record<DiaryCategoryKey, string> = {
  category_1: "",
  category_2: "",
  category_3: "",
  category_4: "",
  category_5: "",
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
