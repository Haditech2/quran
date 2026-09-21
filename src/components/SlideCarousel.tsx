import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, typography, colors } from '@/theme';

const { width } = Dimensions.get('window');

const slides = [
  { title: 'Daily Rhythm', subtitle: 'Keep a short consistent schedule for steady memorization.' },
  { title: 'Offline Ready', subtitle: 'Download recitations and read without interruption.' },
  { title: 'Recite Confidently', subtitle: 'Practice with audio and revision schedules.' },
];

export default function SlideCarousel() {
  const ref = useRef<ScrollView | null>(null);
  const idx = useRef(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      idx.current = (idx.current + 1) % slides.length;
      setActive(idx.current);
      ref.current?.scrollTo({ x: idx.current * width, animated: true });
    }, 4200);
    return () => clearInterval(t);
  }, []);

  function onMomentum(e: any) {
    const x = e.nativeEvent.contentOffset.x || 0;
    const newIndex = Math.round(x / width);
    idx.current = newIndex;
    setActive(newIndex);
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentum}
        decelerationRate="fast"
      >
        {slides.map((s, i) => (
          <LinearGradient key={i} colors={[i % 2 === 0 ? '#FFF7EA' : '#F6EFD9', '#FFFDF7']} style={[styles.slide, { width }]}>
            <Text style={styles.kicker}>{s.title}</Text>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.subtitle}>{s.subtitle}</Text>
          </LinearGradient>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === active ? styles.dotActive : null]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 180,
  },
  slide: {
    padding: spacing.md,
    justifyContent: 'center',
  },
  kicker: {
    color: colors.accent,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 12,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '900',
    marginTop: 6,
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 8,
    maxWidth: 560,
  },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 14,
  },
});
