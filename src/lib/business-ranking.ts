type RatedBusiness = {
  id: string;
  name: string;
  slug: string;
  rating?: number | null;
  ratingCount?: number;
};
export function topRatedBusinessIds(rows: RatedBusiness[]) {
  return new Set(
    rows
      .filter(
        (row) =>
          row.rating !== null &&
          row.rating !== undefined &&
          Number.isFinite(row.rating) &&
          (row.ratingCount ?? 0) > 0,
      )
      .sort(
        (a, b) =>
          b.rating! - a.rating! ||
          (b.ratingCount ?? 0) - (a.ratingCount ?? 0) ||
          a.name.localeCompare(b.name, "pt-BR") ||
          a.slug.localeCompare(b.slug, "pt-BR"),
      )
      .slice(0, 5)
      .map((row) => row.id),
  );
}
