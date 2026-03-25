import { useState, useEffect, useCallback } from 'react';
import { getDashboard } from '../api/client.js';

export function useDashboard(citySlug, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!citySlug) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getDashboard(citySlug, options);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [citySlug, options.days, options.source]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
