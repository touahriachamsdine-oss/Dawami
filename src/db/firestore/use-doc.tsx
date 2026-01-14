import { useState, useEffect } from 'react';
import { fetchDocument } from '@/lib/db-mapper';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: any | null;
}

/**
 * React hook to subscribe to a single database document.
 * Uses polling to simulate real-time updates with Prisma.
 */
export function useDoc<T = any>(
  memoizedDocRef: any | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const path = typeof memoizedDocRef === 'string'
      ? memoizedDocRef
      : memoizedDocRef.path;

    if (!path) return;

    let isMounted = true;

    const fetchData = async () => {
      try {
        const snapshot = await fetchDocument(path);
        if (!isMounted) return;

        if (snapshot.exists) {
          setData({ ...(snapshot.data as T), id: snapshot.id });
        } else {
          setData(null);
        }

        setError(null);
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
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
