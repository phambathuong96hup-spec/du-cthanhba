import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRepairs, type RepairData } from '../services/api';

/** Cache TTL: 5 minutes */
const CACHE_TTL = 5 * 60 * 1000;

/** Module-level cache shared across all hook instances. */
let cache: { data: RepairData[]; timestamp: number } | null = null;

/** Pending promise for request deduplication. */
let pendingPromise: Promise<RepairData[]> | null = null;

/** Subscribers notified when data changes (refetch / mutate). */
const subscribers = new Set<() => void>();

function isCacheValid(): boolean {
  return cache !== null && Date.now() - cache.timestamp < CACHE_TTL;
}

function notifySubscribers() {
  subscribers.forEach((cb) => cb());
}

async function loadData(): Promise<RepairData[]> {
  // Deduplicate: if a request is already in-flight, reuse it
  if (pendingPromise) return pendingPromise;

  pendingPromise = fetchRepairs()
    .then((data) => {
      cache = { data, timestamp: Date.now() };
      pendingPromise = null;
      notifySubscribers();
      return data;
    })
    .catch((err) => {
      pendingPromise = null;
      throw err;
    });

  return pendingPromise;
}

export interface UseRepairsReturn {
  repairs: RepairData[];
  isLoading: boolean;
  error: Error | null;
  /** Force a fresh fetch, ignoring the cache. Updates all consumers. */
  refetch: () => Promise<void>;
  /** Optimistic update: replace cached data without a network call. */
  mutate: (data: RepairData[]) => void;
}

export function useRepairs(): UseRepairsReturn {
  const [repairs, setRepairs] = useState<RepairData[]>(cache?.data ?? []);
  const [isLoading, setIsLoading] = useState(!isCacheValid());
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  // Sync local state from shared cache when other instances update it
  const syncFromCache = useCallback(() => {
    if (cache && mountedRef.current) {
      setRepairs(cache.data);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    subscribers.add(syncFromCache);

    if (!isCacheValid()) {
      setIsLoading(true);
      loadData()
        .then((data) => {
          if (mountedRef.current) {
            setRepairs(data);
            setIsLoading(false);
            setError(null);
          }
        })
        .catch((err) => {
          if (mountedRef.current) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setIsLoading(false);
          }
        });
    } else {
      syncFromCache();
    }

    return () => {
      mountedRef.current = false;
      subscribers.delete(syncFromCache);
    };
  }, [syncFromCache]);

  const refetch = useCallback(async () => {
    // Invalidate cache so loadData fetches fresh
    cache = null;
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadData();
      if (mountedRef.current) {
        setRepairs(data);
        setIsLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }
  }, []);

  const mutate = useCallback((data: RepairData[]) => {
    cache = { data, timestamp: Date.now() };
    notifySubscribers();
  }, []);

  return { repairs, isLoading, error, refetch, mutate };
}
