export function reportDays(value: unknown): number {
  return ["7", "30", "90"].includes(String(value)) ? Number(value) : 30;
}
export function csvCell(value: string | number) {
  const text = String(value);
  const safe = /^[\s]*[=+@-]/.test(text) ? "'" + text : text;
  return '"' + safe.replace(/"/g, '""') + '"';
}
export function csvDocument(rows: (string | number)[][]) {
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
}
export type ReportRow = {
  id: string;
  status: string;
  priceCents: number;
  startsAt: Date;
  service: string;
  professional: string;
  establishment: string;
  timezone: string;
};
export function summarizeReport(rows: ReportRow[]) {
  const completed = rows.filter((row) => row.status === "completed");
  const canceled = rows.filter((row) =>
    ["canceled", "declined", "expired"].includes(row.status),
  );
  const group = (key: "service" | "professional" | "status") => {
    const counts = new Map<string, number>();
    rows.forEach((row) =>
      counts.set(row[key], (counts.get(row[key]) ?? 0) + 1),
    );
    return [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };
  return {
    total: rows.length,
    completed: completed.length,
    canceled: canceled.length,
    noShows: rows.filter((row) => row.status === "no_show").length,
    completedValue: completed.reduce((sum, row) => sum + row.priceCents, 0),
    services: group("service"),
    professionals: group("professional"),
    statuses: group("status"),
  };
}
