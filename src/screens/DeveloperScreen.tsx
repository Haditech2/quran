import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '@/components/Screen';
import AppLogo from '@/components/AppLogo';
import { colors, spacing, typography } from '@/theme';

export default function DeveloperScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoWrap}>
          <AppLogo size={140} showWordmark />
        </View>
        <Text style={styles.title}>Developer & Contributing</Text>
        <Text style={styles.paragraph}>
          This project is open for contributions. To contribute:
        </Text>
        <Text style={styles.paragraph}>- Fork the repository and open a pull request.</Text>
        <Text style={styles.paragraph}>- Follow the coding style in the existing codebase.</Text>
        <Text style={styles.paragraph}>- Run type checks and tests before submitting.</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.paragraph}>Create issues for bugs or feature requests on the repository.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  paragraph: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
});
