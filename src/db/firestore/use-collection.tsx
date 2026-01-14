import { useState, useEffect } from 'react';
import { fetchCollection } from '@/lib/db-mapper';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: any | null;
}

/**
 * React hook to subscribe to a database collection.
 * Uses polling to simulate real-time updates with Prisma.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: any | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;

  const [data, setData] = useState<ResultItemType[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const path = typeof memoizedTargetRefOrQuery === 'string'
      ? memoizedTargetRefOrQuery
      : memoizedTargetRefOrQuery.path;

    if (!path) return;

    let isMounted = true;

    const fetchData = async () => {
      try {
        const snapshotDocs = await fetchCollection(path);
        if (!isMounted) return;

        const results: ResultItemType[] = snapshotDocs.map((doc: any) => ({
          ...(doc.data as T),
          id: doc.id
        }));


        setData(results);
        setIsLoading(false);
      } catch (err) {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      }
    };

    fetchData();

    // Polling interval (e.g., every 5 seconds)
    const interval = setInterval(fetchData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
