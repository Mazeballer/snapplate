"use client";

import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useQueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState, type ReactNode } from "react";
import { cacheKeyFor, CACHE_MAX_AGE_MS, CACHE_VERSION, shouldPersist } from "@/lib/persist";

/**
 * Keeps the app's data on this device so the next open shows the last numbers instantly while the
 * fresh ones load. One copy per account; it is wiped when logging out.
 */
export function PersistedCache({ userId, children }: { userId: string; children: ReactNode }) {
  const client = useQueryClient();
  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window === "undefined" ? undefined : window.localStorage,
      key: cacheKeyFor(userId),
      throttleTime: 1500,
    }),
  );

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: CACHE_MAX_AGE_MS,
        buster: CACHE_VERSION,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => shouldPersist(query.queryKey, query.state.status),
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
