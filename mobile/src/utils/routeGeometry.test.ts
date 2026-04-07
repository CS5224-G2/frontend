import type { Route } from '../../../shared/types/index';
import { mockRoutes } from '../app/types';
import {
  boundsFromCoordinates,
  haversineDistanceKm,
  interpolateAlongRoute,
  projectPointOntoRoute,
  routeToLineCoordinates,
} from './routeGeometry';

describe('routeGeometry', () => {
  it('routeToLineCoordinates joins start, checkpoints, end', () => {
    const route = mockRoutes[0];
    const coords = routeToLineCoordinates(route);
    expect(coords[0]).toEqual([route.startPoint.lng, route.startPoint.lat]);
    expect(coords[coords.length - 1]).toEqual([route.endPoint.lng, route.endPoint.lat]);
    expect(coords.length).toBe(1 + route.checkpoints.length + 1);
  });

  it('routeToLineCoordinates prefers routePath when provided', () => {
    const route: Route = {
      ...mockRoutes[0],
      routePath: [
        { lat: 1.3001, lng: 103.7701 },
        { lat: 1.3008, lng: 103.7714 },
        { lat: 1.3015, lng: 103.7722 },
      ],
    };

    const coords = routeToLineCoordinates(route);

    expect(coords).toEqual([
      [103.7701, 1.3001],
      [103.7714, 1.3008],
      [103.7722, 1.3015],
    ]);
  });

  it('interpolateAlongRoute returns start at 0 and end at 1', () => {
    const route = mockRoutes[1];
    const coords = routeToLineCoordinates(route);
    const a = interpolateAlongRoute(coords, 0);
    const b = interpolateAlongRoute(coords, 1);
    expect(a[0]).toBeCloseTo(coords[0][0], 5);
    expect(a[1]).toBeCloseTo(coords[0][1], 5);
    expect(b[0]).toBeCloseTo(coords[coords.length - 1][0], 5);
    expect(b[1]).toBeCloseTo(coords[coords.length - 1][1], 5);
  });

  it('boundsFromCoordinates pads bbox', () => {
    const coords = [
      [0, 0],
      [1, 1],
    ] as [number, number][];
    const { ne, sw } = boundsFromCoordinates(coords);
    expect(ne[0]).toBeGreaterThan(1);
    expect(ne[1]).toBeGreaterThan(1);
    expect(sw[0]).toBeLessThan(0);
    expect(sw[1]).toBeLessThan(0);
  });

  it('projects a point onto the nearest segment of the route', () => {
    const coords: [number, number][] = [
      [103.77, 1.3],
      [103.771, 1.3],
      [103.772, 1.301],
    ];

    const projected = projectPointOntoRoute(coords, [103.7705, 1.3002]);

    expect(projected.progress).toBeGreaterThan(0);
    expect(projected.progress).toBeLessThan(1);
    expect(projected.snappedPoint[0]).toBeCloseTo(103.7705, 4);
    expect(projected.distanceKmFromRoute).toBeGreaterThan(0);
  });

  it('computes haversine distance in kilometers', () => {
    const distanceKm = haversineDistanceKm([103.77, 1.3], [103.771, 1.3]);

    expect(distanceKm).toBeGreaterThan(0.05);
    expect(distanceKm).toBeLessThan(0.2);
  });
});
