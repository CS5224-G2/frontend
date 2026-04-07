import { act, renderHook } from '@testing-library/react-native';

import { mockRoutes } from '../types';
import { useLiveMapRideState } from './useLiveMapRideState';

const mockNavigate = jest.fn();
let mockLiveMapProgressSimulationEnabled = false;

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('../../config/runtime', () => ({
  get LIVE_MAP_PROGRESS_SIMULATION() {
    return mockLiveMapProgressSimulationEnabled;
  },
}));

jest.mock('../../services/routeLookup', () => ({
  resolveRouteById: jest.fn(async () => null),
}));

jest.mock('../../services/rideService', () => ({
  saveRide: jest.fn(async () => undefined),
}));

describe('useLiveMapRideState', () => {
  const originalEnv = process.env;
  const route = mockRoutes[0];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockLiveMapProgressSimulationEnabled = false;
  });

  afterEach(async () => {
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    process.env = { ...originalEnv };
  });

  it('keeps progress at zero by default', async () => {
    const { result } = renderHook(() => useLiveMapRideState(route.id, route));

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.progress).toBe(0);
    expect(result.current.distanceTraveled).toBe('0.00');
    expect(result.current.routeCompleted).toBe(false);
  });

  it('auto-advances progress only when simulation is enabled', async () => {
    mockLiveMapProgressSimulationEnabled = true;

    const { result } = renderHook(() => useLiveMapRideState(route.id, route));

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.progress).toBe(6);
    expect(result.current.distanceTraveled).not.toBe('0.00');
  });

  it('does not end the ride until end is explicitly confirmed', async () => {
    const { result } = renderHook(() => useLiveMapRideState(route.id, route));

    act(() => {
      result.current.stopCycling();
    });

    expect(result.current.showExitModal).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalled();

    await act(async () => {
      result.current.confirmEndRide();
    });

    expect(mockNavigate).toHaveBeenCalledWith('RouteFeedback', {
      routeId: route.id,
      route,
    });
  });
});
