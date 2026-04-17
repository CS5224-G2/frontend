import React, { useEffect, useRef, useState } from 'react';
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
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1700,
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
    outputRange: [0.9, 1.65],
  });

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.35, 0.22, 0],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.ping,
          { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
        ]}
      />
      <View style={styles.halo} />
      <View style={styles.avatar}>
        {source && !imageFailed ? (
          <Image
            source={source}
            style={styles.avatarImage}
            onError={() => setImageFailed(true)}
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
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ping: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(37,99,235,0.24)',
  },
  halo: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(147,197,253,0.18)',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
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
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
