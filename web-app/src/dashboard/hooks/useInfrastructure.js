import { useState, useEffect, useCallback, useRef } from 'react';
import { authFetch } from './fetchWithAuth';

function isAlbResponsePoint(point) {
  return (
    point &&
    typeof point === 'object' &&
    'timestamp' in point &&
    'value' in point
  );
}

export function normalizeAlbResponseSeries(payload) {
  const rawSeries =
    Array.isArray(payload) ? payload
      : Array.isArray(payload?.TargetResponseTime) ? payload.TargetResponseTime
        : Array.isArray(payload?.alb?.TargetResponseTime) ? payload.alb.TargetResponseTime
          : Array.isArray(payload?.data) ? payload.data
            : [];

  return rawSeries
    .filter(isAlbResponsePoint)
    .map((point) => {
      const value = typeof point.value === 'number' ? point.value : Number(point.value);
      return {
        timestamp: point.timestamp,
        value,
      };
    })
    .filter((point) => Number.isFinite(point.value));
}

export function mergeInfrastructureMetrics(metrics, albResponsePayload) {
  const albResponseSeries = normalizeAlbResponseSeries(albResponsePayload);

  if (albResponseSeries.length === 0) {
    return metrics;
  }

  return {
    ...(metrics ?? {}),
    alb: {
      ...(metrics?.alb ?? {}),
      TargetResponseTime: albResponseSeries,
    },
  };
}

export function useInfrastructure() {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [h, m, l, albResponse] = await Promise.all([
        authFetch('/admin/infrastructure-health'),
        authFetch('/admin/infrastructure-metrics'),
        authFetch('/admin/infrastructure-logs'),
        authFetch('/admin/infrastructure-alb-response').catch(() => null),
      ]);
      setHealth(h);
      setMetrics(mergeInfrastructureMetrics(m, albResponse));
      setLogs(l);
      setError(null);
    } catch (err) {
      setError(err.message);
      // Auto-retry once after 2s
      setTimeout(async () => {
        try {
          const [h, m, l, albResponse] = await Promise.all([
            authFetch('/admin/infrastructure-health'),
            authFetch('/admin/infrastructure-metrics'),
            authFetch('/admin/infrastructure-logs'),
            authFetch('/admin/infrastructure-alb-response').catch(() => null),
          ]);
          setHealth(h);
          setMetrics(mergeInfrastructureMetrics(m, albResponse));
          setLogs(l);
          setError(null);
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
