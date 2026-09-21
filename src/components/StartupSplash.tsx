import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppLogo from '@/components/AppLogo';
import { colors, spacing, typography } from '@/theme';

export default function StartupSplash() {
  return (
    <LinearGradient colors={[colors.background, '#FBF2DE', '#EED6A4']} style={styles.container}>
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />
      <View style={styles.centerCard}>
        <AppLogo size={132} />
        <Text style={styles.title}>Quran Memorization</Text>
        <Text style={styles.subtitle}>Read, recite, and retain with a calm offline-first flow.</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  orbOne: {
    position: 'absolute',
    top: -100,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(163, 99, 36, 0.12)',
  },
  orbTwo: {
    position: 'absolute',
    bottom: -110,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(45, 69, 46, 0.08)',
  },
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 251, 240, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(150, 98, 37, 0.14)',
  },
  title: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    maxWidth: 280,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});