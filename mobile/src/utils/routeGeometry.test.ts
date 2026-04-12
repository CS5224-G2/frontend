import { mockRoutes } from '../app/types';
import {
  boundsFromCoordinates,
  interpolateAlongRoute,
  projectPointOntoPolyline,
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

  it('routeToLineCoordinates prefers routePath when present', () => {
    const path = [
      { lat: 1.0, lng: 2.0 },
      { lat: 1.1, lng: 2.1 },
      { lat: 1.2, lng: 2.2 },
    ];
    const route = {
      ...mockRoutes[0],
      routePath: path,
    };
    const coords = routeToLineCoordinates(route);
    expect(coords).toEqual([
      [2.0, 1.0],
      [2.1, 1.1],
      [2.2, 1.2],
    ]);
  });

  it('projectPointOntoPolyline finds nearest segment', () => {
    const line: [number, number][] = [
      [0, 0],
      [0.001, 0],
    ];
    const { distToRouteM, progress01 } = projectPointOntoPolyline(0, 0.0005, line);
    expect(distToRouteM).toBeLessThan(200);
    expect(progress01).toBeGreaterThan(0.2);
    expect(progress01).toBeLessThan(0.8);
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
});
