import { useState, useEffect, useCallback } from 'react';
import { authFetch } from './fetchWithAuth';

export function useRoutingQualityMetrics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await authFetch('/admin/routing-quality-metrics');
      setData({
        totalReviews: raw.total_reviews,
        overallAvgRating: raw.overall_avg_rating,
        totalRidesLogged: raw.total_rides_logged,
        totalGeneratedRoutes: raw.total_generated_routes,
        avgRouteComputationMs: raw.avg_route_computation_ms,
        minRouteComputationMs: raw.min_route_computation_ms,
        maxRouteComputationMs: raw.max_route_computation_ms,
        topRatedRoutes: raw.top_rated_routes.map(r => ({
          routeId: r.route_id,
          name: r.name,
          rating: r.rating,
          reviewCount: r.review_count,
        })),
        mostReviewedRoutes: raw.most_reviewed_routes.map(r => ({
          routeId: r.route_id,
          name: r.name,
          rating: r.rating,
          reviewCount: r.review_count,
        })),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
