import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';

type AppLogoProps = {
  size?: number;
  showWordmark?: boolean;
};

export default function AppLogo({ size = 64, showWordmark = false }: AppLogoProps) {
  let logoSource: any | null = null;

  try {
    // Prefer the real image the user placed in src/assets/logo.png.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    logoSource = require('../assets/logo.png');
  } catch {
    logoSource = null;
  }

  const coverWidth = size;
  const coverHeight = size * 0.72;

  return (
    <View style={[styles.container, { width: coverWidth, height: coverHeight }]}>
      {logoSource ? (
        <Image source={logoSource} style={[styles.image, { width: coverWidth, height: coverHeight }]} resizeMode="contain" />
      ) : (
        <LinearGradient
          colors={['#7C4320', '#B37A3C', '#8B4C27']}
          start={{ x: 0.05, y: 0.05 }}
          end={{ x: 0.95, y: 0.95 }}
          style={[styles.cover, { borderRadius: Math.round(size * 0.1) }]}
        >
          <View style={styles.ring} />
          <View style={styles.medallion}>
            <Text style={styles.medallionText}>Q</Text>
          </View>
          <View style={styles.spine} />
        </LinearGradient>
      )}

      {showWordmark ? (
        <View style={styles.wordmarkWrap}>
          <Text style={styles.wordmarkTitle}>Quran Memorization</Text>
          <Text style={styles.wordmarkSubtitle}>Read, recite, retain</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: 10,
  },
  cover: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 243, 217, 0.55)',
    position: 'relative',
    shadowColor: '#2C160A',
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 8,
  },
  ring: {
    position: 'absolute',
    top: 6,
    right: 6,
    bottom: 6,
    left: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(250, 231, 186, 0.95)',
  },
  medallion: {
    position: 'absolute',
    top: '28%',
    alignSelf: 'center',
    width: '30%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(71, 34, 14, 0.82)',
    borderWidth: 2,
    borderColor: '#F2D89C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionText: {
    color: '#F2D89C',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 1,
  },
  spine: {
    position: 'absolute',
    left: '4%',
    top: '12%',
    bottom: '12%',
    width: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 234, 186, 0.72)',
  },
  wordmarkWrap: {
    marginTop: 10,
    alignItems: 'center',
  },
  wordmarkTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
  },
  wordmarkSubtitle: {
    color: colors.textMuted,
    marginTop: 2,
    fontSize: 12,
  },
});