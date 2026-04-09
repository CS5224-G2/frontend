import { mockRoutes } from '../app/types';
import { advanceActiveRideSession, type ActiveRideSession } from './activeRideSession';

describe('advanceActiveRideSession', () => {
  const route = mockRoutes[1];

  it('updates last known position, distance, and progress from a new point', () => {
    const session: ActiveRideSession = {
      version: 1,
      routeId: route.id,
      route,
      startedAt: '2026-04-08T00:00:00.000Z',
      lastKnownPosition: {
        lat: route.startPoint.lat,
        lng: route.startPoint.lng,
      },
      distanceKm: 0,
      progressPct: 0,
    };

    const next = advanceActiveRideSession(session, {
      lat: (route.startPoint.lat + route.checkpoints[0].lat) / 2,
      lng: (route.startPoint.lng + route.checkpoints[0].lng) / 2,
    });

    expect(next.lastKnownPosition).toBeTruthy();
    expect(next.distanceKm).toBeGreaterThan(0);
    expect(next.progressPct).toBeGreaterThan(0);
  });

  it('ignores low-quality updates', () => {
    const session: ActiveRideSession = {
      version: 1,
      routeId: route.id,
      route,
      startedAt: '2026-04-08T00:00:00.000Z',
      distanceKm: 0.5,
      progressPct: 12,
      lastKnownPosition: {
        lat: route.startPoint.lat,
        lng: route.startPoint.lng,
      },
    };

    const next = advanceActiveRideSession(
      session,
      { lat: route.checkpoints[0].lat, lng: route.checkpoints[0].lng },
      250,
    );

    expect(next).toEqual(
      expect.objectContaining({
        ...session,
        status: 'active',
        totalPausedMs: 0,
      }),
    );
  });

  it('does not advance distance or progress when the rider is far off-route', () => {
    const session: ActiveRideSession = {
      version: 1,
      routeId: route.id,
      route,
      startedAt: '2026-04-08T00:00:00.000Z',
      distanceKm: 0.5,
      progressPct: 12,
      lastKnownPosition: {
        lat: route.startPoint.lat,
        lng: route.startPoint.lng,
      },
    };

    const next = advanceActiveRideSession(session, {
      lat: route.startPoint.lat + 0.0015,
      lng: route.startPoint.lng + 0.0015,
    });

    expect(next).toEqual(
      expect.objectContaining({
        ...session,
        status: 'active',
        totalPausedMs: 0,
      }),
    );
  });
});
