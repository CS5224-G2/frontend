import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Strong, user-visible feedback when a ride completes (destination reached).
 * Complements the completion modal with haptics and a screen-reader announcement.
 */
export function useRideCompletionFeedback(routeCompleted: boolean) {
  const fired = useRef(false);

  useEffect(() => {
    if (!routeCompleted || fired.current) {
      return;
    }
    fired.current = true;

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
        /* ignore on unsupported devices / simulators */
      });
    }

    if (Platform.OS === 'web') {
      return;
    }
    void AccessibilityInfo.announceForAccessibility('Route completed. You have reached your destination.');
  }, [routeCompleted]);
}
