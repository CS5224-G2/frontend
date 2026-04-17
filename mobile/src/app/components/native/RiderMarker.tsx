import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { getProfileAvatarSource } from '../../utils/profileAvatar';

interface RiderMarkerProps {
  avatarUrl?: string | null;
  avatarColor: string;
  initials: string;
}

export default function RiderMarker({ avatarUrl, avatarColor, initials }: RiderMarkerProps) {
  const source = avatarUrl ? getProfileAvatarSource(avatarUrl) : null;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 2.2],
  });

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.8, 0.5, 0],
  });

  return (
    <View style={styles.container}>
      {/* Expanding ping ring — the Google Maps "beep" */}
      <Animated.View
        style={[
          styles.ping,
          { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
        ]}
      />
      {/* Static soft halo */}
      <View style={styles.halo} />
      {/* Mid accuracy ring */}
      <View style={styles.midRing} />
      {/* Avatar core */}
      <View style={styles.avatar}>
        {source ? (
          <Image
            source={source}
            style={styles.avatarImage}
            testID="rider-marker-image"
          />
        ) : (
          <View
            style={[styles.avatarFallback, { backgroundColor: avatarColor }]}
            testID="rider-marker-fallback"
          >
            <Text style={styles.initialsText} testID="rider-marker-initials">
              {initials}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ping: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(37,99,235,0.55)',
  },
  halo: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(37,99,235,0.18)',
  },
  midRing: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(147,197,253,0.65)',
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    overflow: 'hidden',
    zIndex: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
