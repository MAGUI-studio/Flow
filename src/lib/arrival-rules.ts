export function arrivalAvailable(startsAt: Date | string, now = new Date()) {
  return now.getTime() >= new Date(startsAt).getTime() - 60 * 60 * 1000;
}
