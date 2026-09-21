import React, { ReactNode } from 'react';
import { Animated, Platform, StatusBar as RNStatusBar, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import { colors } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  headerScrollY?: Animated.Value;
};

export default function Screen({
  children,
  title,
  showHeader = true,
  headerScrollY,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const androidStatusBar = Platform.OS === 'android' ? Math.max(RNStatusBar.currentHeight || 0, 32) : 0;
  const safeTop = Math.max(insets.top, androidStatusBar);

  return (
    <LinearGradient colors={['#f8fafc', '#ffffff', '#f1f5f9']} style={styles.container}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      {showHeader ? (
        <Header title={title} scrollY={headerScrollY} />
      ) : (
        <View style={{ height: safeTop, backgroundColor: colors.surface }} />
      )}
      <View style={styles.content}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.background,
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(6, 78, 59, 0.04)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -90,
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(217, 119, 6, 0.04)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
