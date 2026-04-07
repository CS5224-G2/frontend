import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Height of the liquid-glass tab dock. Must stay in sync with `navigation.tsx` (`LiquidGlassTabBar`).
 */
export const FLOATING_TAB_BAR_DOCK_HEIGHT = 72;

/** Bottom gap from screen edge to the dock — matches `LiquidGlassTabBar` (`Math.max(insets.bottom, 10)`). */
export function getFloatingTabBarBottomGap(bottomInset: number): number {
  return Math.max(bottomInset, 10);
}

/**
 * Padding to add to `ScrollView` / list `contentContainerStyle` so the last controls sit above the
 * floating tab bar and home indicator.
 */
export function getFloatingTabBarScrollPadding(bottomInset: number, extraGap = 16): number {
  return getFloatingTabBarBottomGap(bottomInset) + FLOATING_TAB_BAR_DOCK_HEIGHT + extraGap;
}

export function useFloatingTabBarScrollPadding(extraGap = 16): number {
  const insets = useSafeAreaInsets();
  return getFloatingTabBarScrollPadding(insets.bottom, extraGap);
}

/**
 * Use inside a parent that already applies bottom safe area (e.g. `SafeAreaView` with `edges={['bottom']}`).
 * Lifts content by the dock height plus a small gap.
 */
export function useFloatingTabBarExtraLift(gap = 12): number {
  return FLOATING_TAB_BAR_DOCK_HEIGHT + gap;
}
