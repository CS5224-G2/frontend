import AsyncStorage from '@react-native-async-storage/async-storage';

import { getFavoriteRouteIds, setFavoriteRouteIds } from './favoriteRoutesService';
import { getFavoriteRouteIdsLocal, setActiveMockAccountId } from './localDb';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('favoriteRoutesService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(null);
    await setActiveMockAccountId('account-a');
    await setFavoriteRouteIds([]);
    await setActiveMockAccountId('account-b');
    await setFavoriteRouteIds([]);
    await setActiveMockAccountId('account-a');
  });

  it('persists favorite routes separately per logged-in account in the local db', async () => {
    await setFavoriteRouteIds(['route-1', 'route-2']);

    await setActiveMockAccountId('account-b');
    expect(await getFavoriteRouteIds()).toEqual([]);

    await setFavoriteRouteIds(['route-9']);

    await setActiveMockAccountId('account-a');
    expect(await getFavoriteRouteIds()).toEqual(['route-1', 'route-2']);
  });

  it('uses the local db as the source of truth when saving favorites', async () => {
    const persistedIds = await setFavoriteRouteIds(['route-1', 'route-1', 'route-2']);

    expect(persistedIds).toEqual(['route-1', 'route-2']);
    expect(await getFavoriteRouteIdsLocal()).toEqual(['route-1', 'route-2']);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('migrates legacy favorites safely during concurrent startup reads', async () => {
    await setFavoriteRouteIds([]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(['legacy-1', 'legacy-2']));

    const [first, second] = await Promise.all([getFavoriteRouteIds(), getFavoriteRouteIds()]);

    expect(first).toEqual(['legacy-1', 'legacy-2']);
    expect(second).toEqual(['legacy-1', 'legacy-2']);
    expect(await getFavoriteRouteIdsLocal()).toEqual(['legacy-1', 'legacy-2']);
    expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(1);
  });
});
