import { addDays, type LogDate } from "./time";

/**
 * Consecutive days with at least one meal logged, counting back from today.
 *
 * Today does not break the streak while it is still going: if nothing has been logged yet today,
 * the count starts from yesterday. The streak only ends once a whole day passes with no log.
 */
export function currentStreak(loggedDates: Iterable<LogDate>, today: LogDate): number {
  const logged = new Set(loggedDates);
  let cursor = logged.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (logged.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** The longest run of consecutive logged days. */
export function longestStreak(loggedDates: Iterable<LogDate>): number {
  const sorted = [...new Set(loggedDates)].sort();
  let best = 0;
  let run = 0;
  let previous: LogDate | null = null;
  for (const date of sorted) {
    run = previous !== null && addDays(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}
