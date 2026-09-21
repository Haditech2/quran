import React from 'react';
import {
  Animated,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppLogo from './AppLogo';
import { colors, spacing } from '@/theme';

type Props = {
  title?: string;
  scrollY?: Animated.Value;
};

export default function Header({ title, scrollY }: Props) {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // Accurately calculate safe area top for physical device notches, status bars, and punch-holes
  const androidStatusBar = Platform.OS === 'android' ? Math.max(RNStatusBar.currentHeight || 0, 32) : 0;
  const safeTop = Math.max(insets.top, androidStatusBar);
  const barHeight = 54;
  const totalHeaderHeight = barHeight + safeTop;

  const translateY = scrollY
    ? scrollY.interpolate({
        inputRange: [0, totalHeaderHeight],
        outputRange: [0, -totalHeaderHeight],
        extrapolate: 'clamp',
      })
    : 0;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: safeTop,
          minHeight: totalHeaderHeight,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.innerBar}>
        <View style={styles.left}>
          <AppLogo size={32} />
        </View>
        <View style={styles.center}>
          <Text numberOfLines={1} style={styles.title}>
            {title ?? 'Quran Memorization'}
          </Text>
        </View>
        <View style={styles.right}>
          <TouchableOpacity
            onPress={() => nav.navigate('Settings' as never)}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 3,
  },
  innerBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
