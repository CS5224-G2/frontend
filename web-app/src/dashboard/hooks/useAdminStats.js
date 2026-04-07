import { useState, useEffect, useCallback } from 'react';
import { authFetch } from './fetchWithAuth';

export function useAdminStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, users] = await Promise.all([
        authFetch('/admin/stats'),
        authFetch('/admin/users'),
      ]);
      setData({
        totalUsers: users.length,
        users: users,
        activeUsers: stats.active_users,
        totalRides: stats.total_rides,
        revenueFormatted: stats.revenue_formatted,
        openReports: stats.open_reports,
      });
    } catch (err) {
      setError(err.message);
      // Auto-retry once after 2s
      setTimeout(async () => {
        try {
          const [stats, users] = await Promise.all([
            authFetch('/admin/stats'),
            authFetch('/admin/users'),
          ]);
          setData({
            totalUsers: users.length,
            activeUsers: stats.active_users,
            totalRides: stats.total_rides,
            revenueFormatted: stats.revenue_formatted,
            openReports: stats.open_reports,
          });
          setError(null);
        } catch (retryErr) {
          setError(retryErr.message);
        }
      }, 2000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
