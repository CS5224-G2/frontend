import {
  FLOATING_TAB_BAR_DOCK_HEIGHT,
  getFloatingTabBarBottomGap,
  getFloatingTabBarScrollPadding,
} from './floatingTabBarInset';

describe('floatingTabBarInset', () => {
  it('uses at least 10px bottom gap like LiquidGlassTabBar', () => {
    expect(getFloatingTabBarBottomGap(0)).toBe(10);
    expect(getFloatingTabBarBottomGap(34)).toBe(34);
  });

  it('computes scroll padding as gap + dock height + extra', () => {
    expect(getFloatingTabBarScrollPadding(34, 16)).toBe(34 + FLOATING_TAB_BAR_DOCK_HEIGHT + 16);
    expect(getFloatingTabBarScrollPadding(0, 16)).toBe(10 + FLOATING_TAB_BAR_DOCK_HEIGHT + 16);
  });
});
