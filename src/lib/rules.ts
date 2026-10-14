export type Interval = { start: Date; end: Date };
export function overlaps(a: Interval, b: Interval) {
  return a.start < b.end && b.start < a.end;
}
export function pendingExpiresAt(createdAt: Date, startsAt: Date) {
  if (startsAt <= createdAt)
    throw new Error("O atendimento deve estar no futuro");
  return new Date(
    Math.min(createdAt.getTime() + 24 * 60 * 60 * 1000, startsAt.getTime()),
  );
}
export function canCancel(now: Date, startsAt: Date, minimumHours: number) {
  return (
    minimumHours >= 0 &&
    startsAt > now &&
    startsAt.getTime() - now.getTime() >= minimumHours * 3600000
  );
}
export function availableSlots(
  window: Interval,
  durationMinutes: number,
  stepMinutes: number,
  busy: Interval[],
  beforeMinutes = 0,
  afterMinutes = 0,
) {
  if (
    ![durationMinutes, stepMinutes].every(
      (n) => Number.isInteger(n) && n > 0,
    ) ||
    ![beforeMinutes, afterMinutes].every((n) => Number.isInteger(n) && n >= 0)
  )
    throw new Error("Configuração de agenda inválida");
  const slots: Date[] = [];
  for (
    let t = window.start.getTime() + beforeMinutes * 60000;
    t + (durationMinutes + afterMinutes) * 60000 <= window.end.getTime();
    t += stepMinutes * 60000
  ) {
    const occupied = {
      start: new Date(t - beforeMinutes * 60000),
      end: new Date(t + (durationMinutes + afterMinutes) * 60000),
    };
    if (!busy.some((b) => overlaps(occupied, b))) slots.push(new Date(t));
  }
  return slots;
}
export function capacityAvailable(capacity: number, statuses: string[]) {
  return (
    capacity > 0 &&
    statuses.filter((s) => s === "pending" || s === "confirmed").length <
      capacity
  );
}
