export function professionalList<
  T extends { name: string; services: unknown[] },
>(rows: T[], order: string, links: string) {
  return rows
    .filter((row) =>
      links === "linked"
        ? row.services.length > 0
        : links === "unlinked"
          ? row.services.length === 0
          : true,
    )
    .sort((a, b) => {
      const byName = a.name.localeCompare(b.name, "pt-BR", {
        sensitivity: "base",
      });
      if (order === "name_desc") return -byName;
      if (order === "services_desc")
        return b.services.length - a.services.length || byName;
      if (order === "services_asc")
        return a.services.length - b.services.length || byName;
      return byName;
    });
}
