export function matchesLinks(
  linked: string[],
  selected: string[],
  mode: "all" | "any",
) {
  if (!selected.length) return true;
  const available = new Set(linked);
  return mode === "any"
    ? selected.some((id) => available.has(id))
    : selected.every((id) => available.has(id));
}

export function matchesListSearch(name: string, search: string) {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("pt-BR");
  const text = normalize(name);
  return normalize(search)
    .trim()
    .split(/\s+/)
    .every((word) => text.includes(word));
}
