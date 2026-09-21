import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '@/components/Screen';
import { useAppState } from '@/context/AppStateContext';
import { useQuranCatalog } from '@/context/QuranCatalogContext';
import { colors, radius, spacing, typography } from '@/theme';
import AudioPlayerBar from '@/components/AudioPlayerBar';

export default function SurahListScreen() {
  const navigation = useNavigation<any>();
  const { chapters, loading, refreshCatalog } = useQuranCatalog();
  const { progress } = useAppState();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const q = searchQuery.toLowerCase().trim();
    return chapters.filter(
      (c) =>
        c.number.toString() === q ||
        c.nameEnglish.toLowerCase().includes(q) ||
        c.nameArabic.includes(q)
    );
  }, [chapters, searchQuery]);

  return (
    <View style={styles.screenWrapper}>
      <Screen>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.kicker}>THE NOBLE QUR'AN</Text>
              <Text style={styles.title}>Surah Library</Text>
            </View>
            <Pressable onPress={() => refreshCatalog()} style={styles.refreshBtn}>
              <Ionicons name="reload" size={18} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Explore all 114 Surahs with authentic text, translations, and audio recitation.
          </Text>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Surah by name or number..."
              placeholderTextColor={colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <FlatList
          data={filteredChapters}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                {loading ? 'Loading Surahs from Qur\'an API...' : 'No Surahs found matching your search.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const completion = progress.completedSurahs[item.id] ?? 0;

            return (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate('AyahReader', { surahId: item.id })}
              >
                <View style={styles.cardMain}>
                  <View style={styles.numberBadge}>
                    <Text style={styles.numberBadgeText}>{item.number}</Text>
                  </View>

                  <View style={styles.metaCol}>
                    <Text style={styles.nameEnglish}>{item.nameEnglish}</Text>
                    <Text style={styles.metaSub}>
                      {item.revelationType} • {item.ayahCount || item.ayahs.length} Verses
                    </Text>
                  </View>

                  <Text style={styles.nameArabic}>{item.nameArabic}</Text>
                </View>

                {completion > 0 ? (
                  <View style={styles.progressRow}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${completion}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{completion}%</Text>
                  </View>
                ) : null}

                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.actionBtnPrimary}
                    onPress={() => navigation.navigate('AyahReader', { surahId: item.id })}
                  >
                    <Ionicons name="book-outline" size={14} color="#fff" />
                    <Text style={styles.actionBtnPrimaryText}>Read & Listen</Text>
                  </Pressable>

                  <Pressable
                    style={styles.actionBtnSecondary}
                    onPress={() => navigation.navigate('MemorizationMode', { surahId: item.id })}
                  >
                    <Ionicons name="school-outline" size={14} color={colors.primary} />
                    <Text style={styles.actionBtnSecondaryText}>Memorize</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      </Screen>

      <AudioPlayerBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  refreshBtn: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySubtle,
  },
  subtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  list: {
    paddingBottom: 40,
    paddingTop: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  numberBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  metaCol: {
    flex: 1,
  },
  nameEnglish: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  metaSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  nameArabic: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderSubtle,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  actionBtnPrimaryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  actionBtnSecondaryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: 10,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
