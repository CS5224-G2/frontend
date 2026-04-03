import { useState, useEffect, useCallback, useRef } from 'react';
import { authFetch } from './fetchWithAuth';

export function useInfrastructure() {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [h, m, l] = await Promise.all([
        authFetch('/admin/infrastructure-health'),
        authFetch('/admin/infrastructure-metrics'),
        authFetch('/admin/infrastructure-logs'),
      ]);
      setHealth(h);
      setMetrics(m);
      setLogs(l);
      setError(null);
    } catch (err) {
      setError(err.message);
      // Auto-retry once after 2s
      setTimeout(async () => {
        try {
          const [h, m, l] = await Promise.all([
            authFetch('/admin/infrastructure-health'),
            authFetch('/admin/infrastructure-metrics'),
            authFetch('/admin/infrastructure-logs'),
          ]);
          setHealth(h); setMetrics(m); setLogs(l); setError(null);
        } catch (e) { setError(e.message); }
      }, 2000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchAll]);

  return { health, metrics, logs, loading, error, refetch: fetchAll };
}
