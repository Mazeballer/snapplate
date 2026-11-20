/** Saved copy of the app's data on this device, so opening the app shows last numbers at once. */

export const CACHE_KEY_PREFIX = "snapplate-cache-";
export const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
/** Bump when the shape of cached data changes, so old copies are thrown away. */
export const CACHE_VERSION = "1";

/** One copy per account, so a second person on the same device never sees the first's data. */
export function cacheKeyFor(userId: string): string {
  return `${CACHE_KEY_PREFIX}${userId}`;
}

/** Only these kinds of data are saved; anything else (like Apple Health keys) never touches disk. */
const PERSISTED = new Set(["profile", "meals", "water", "activity", "exercise", "weights", "saved-meals"]);

export function shouldPersist(queryKey: readonly unknown[], status: string): boolean {
  return status === "success" && typeof queryKey[0] === "string" && PERSISTED.has(queryKey[0]);
}

/** Removes every saved copy from this device (used when logging out). */
export function clearSavedCaches(storage: Pick<Storage, "length" | "key" | "removeItem">): void {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(CACHE_KEY_PREFIX)) keys.push(key);
  }
  for (const key of keys) storage.removeItem(key);
}
