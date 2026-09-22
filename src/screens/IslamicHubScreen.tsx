import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import Screen from '@/components/Screen';
import Header from '@/components/Header';
import { colors, radius, spacing } from '@/theme';
import {
  fetchPlatformOverview,
  fetchPrayerTimes,
  fetchNigerianCities,
  fetchQibla,
  fetchAdhkar,
  fetchDuas,
  fetchHadiths,
  fetchNamesOfAllah,
  fetchTajweedCategories,
  fetchTawhidCategories,
  fetchHijriToday,
  fetchHijriEvents,
  fetchBookmarks,
  PrayerTimesData,
  QiblaData,
  AdhkarItem,
  DuaItem,
  HadithItem,
  AllahName,
  TajweedCategory,
  TawhidCategory,
  HijriEvent,
  BookmarkItem,
  fetchTafsirAyah,
  TafsirData,
} from '@/services/islamicApi';

type ModuleType =
  | 'prayer-times'
  | 'qibla'
  | 'tasbih'
  | 'adhkar'
  | 'duas'
  | 'hadith'
  | 'names'
  | 'tajweed'
  | 'tafsir'
  | 'tawhid'
  | 'hijri'
  | 'bookmarks';

interface ModuleTab {
  id: ModuleType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const MODULE_TABS: ModuleTab[] = [
  { id: 'prayer-times', label: 'Prayer Times', icon: 'time-outline' },
  { id: 'qibla', label: 'Qibla', icon: 'compass-outline' },
  { id: 'tasbih', label: 'Tasbih', icon: 'finger-print-outline' },
  { id: 'adhkar', label: 'Adhkar', icon: 'heart-outline' },
  { id: 'duas', label: 'Duas', icon: 'hand-left-outline' },
  { id: 'hadith', label: 'Hadith', icon: 'chatbubbles-outline' },
  { id: 'names', label: '99 Names', icon: 'star-outline' },
  { id: 'tajweed', label: 'Tajweed', icon: 'musical-notes-outline' },
  { id: 'tafsir', label: 'Tafsir', icon: 'book-outline' },
  { id: 'tawhid', label: 'Tawhid', icon: 'shield-checkmark-outline' },
  { id: 'hijri', label: 'Hijri', icon: 'calendar-outline' },
  { id: 'bookmarks', label: 'Bookmarks', icon: 'bookmark-outline' },
];

export default function IslamicHubScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const initialModule = (route.params?.initialModule as ModuleType) || 'prayer-times';

  const [activeModule, setActiveModule] = useState<ModuleType>(initialModule);
  const [loading, setLoading] = useState(false);

  // Module States
  const [selectedCity, setSelectedCity] = useState('Abuja');
  const [cities, setCities] = useState<Array<{ name: string; state: string }>>([]);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
  const [qiblaData, setQiblaData] = useState<QiblaData | null>(null);

  // Tasbih State
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihTarget, setTasbihTarget] = useState(33);
  const [tasbihPhrase, setTasbihPhrase] = useState('SubhanAllah');
  const [tasbihLap, setTasbihLap] = useState(1);

  // Adhkar State
  const [adhkarCat, setAdhkarCat] = useState('morning');
  const [adhkarList, setAdhkarList] = useState<AdhkarItem[]>([]);
  const [adhkarCounts, setAdhkarCounts] = useState<Record<number, number>>({});

  // Duas State
  const [duaCat, setDuaCat] = useState('daily');
  const [duaList, setDuaList] = useState<DuaItem[]>([]);
  const [duaSearch, setDuaSearch] = useState('');

  // Hadith State
  const [hadithColl, setHadithColl] = useState('nawawi40');
  const [hadithList, setHadithList] = useState<HadithItem[]>([]);

  // 99 Names State
  const [namesList, setNamesList] = useState<AllahName[]>([]);
  const [selectedName, setSelectedName] = useState<AllahName | null>(null);

  // Tajweed State
  const [tajweedCats, setTajweedCats] = useState<TajweedCategory[]>([]);

  // Tafsir State
  const [tafsirSurah, setTafsirSurah] = useState(1);
  const [tafsirAyah, setTafsirAyah] = useState(1);
  const [tafsirData, setTafsirData] = useState<TafsirData | null>(null);

  // Tawhid State
  const [tawhidCats, setTawhidCats] = useState<TawhidCategory[]>([]);

  // Hijri State
  const [hijriDate, setHijriDate] = useState<any>(null);
  const [hijriEvents, setHijriEvents] = useState<HijriEvent[]>([]);

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  // Sync route param when changed
  useEffect(() => {
    if (route.params?.initialModule) {
      setActiveModule(route.params.initialModule);
    }
  }, [route.params?.initialModule]);

  // Load cities once
  useEffect(() => {
    void fetchNigerianCities().then(setCities);
  }, []);

  // Fetch data per module
  useEffect(() => {
    setLoading(true);
    const loadModuleData = async () => {
      try {
        if (activeModule === 'prayer-times') {
          const pt = await fetchPrayerTimes(selectedCity);
          if (pt) setPrayerData(pt);
        } else if (activeModule === 'qibla') {
          const qd = await fetchQibla(selectedCity);
          if (qd) setQiblaData(qd);
        } else if (activeModule === 'adhkar') {
          const al = await fetchAdhkar(adhkarCat);
          setAdhkarList(al);
        } else if (activeModule === 'duas') {
          const dl = await fetchDuas(duaCat);
          setDuaList(dl);
        } else if (activeModule === 'hadith') {
          const hl = await fetchHadiths(hadithColl);
          setHadithList(hl);
        } else if (activeModule === 'names') {
          if (namesList.length === 0) {
            const nl = await fetchNamesOfAllah();
            setNamesList(nl);
          }
        } else if (activeModule === 'tajweed') {
          const tc = await fetchTajweedCategories();
          setTajweedCats(tc);
        } else if (activeModule === 'tafsir') {
          const td = await fetchTafsirAyah(tafsirSurah, tafsirAyah);
          if (td) setTafsirData(td);
        } else if (activeModule === 'tawhid') {
          const twc = await fetchTawhidCategories();
          setTawhidCats(twc);
        } else if (activeModule === 'hijri') {
          const [hd, he] = await Promise.all([fetchHijriToday(), fetchHijriEvents()]);
          setHijriDate(hd);
          setHijriEvents(he);
        } else if (activeModule === 'bookmarks') {
          const bm = await fetchBookmarks();
          setBookmarks(bm);
        }
      } finally {
        setLoading(false);
      }
    };
    void loadModuleData();
  }, [activeModule, selectedCity, adhkarCat, duaCat, hadithColl, tafsirSurah, tafsirAyah]);

  // Tasbih Tap Handlers
  const handleTasbihTap = () => {
    const next = tasbihCount + 1;
    if (next >= tasbihTarget && tasbihTarget > 0) {
      setTasbihCount(0);
      setTasbihLap((l) => l + 1);
    } else {
      setTasbihCount(next);
    }
  };

  const handleTasbihReset = () => {
    setTasbihCount(0);
    setTasbihLap(1);
  };

  // Adhkar Tap
  const handleAdhkarTap = (item: AdhkarItem) => {
    const current = adhkarCounts[item.id] || 0;
    if (current < item.repeat_target) {
      setAdhkarCounts((prev) => ({ ...prev, [item.id]: current + 1 }));
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <Screen>
        <Header title="Islamic Hub" />

        {/* Top Horizontal Module Switcher */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {MODULE_TABS.map((tab) => {
              const isActive = activeModule === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={[styles.moduleTab, isActive && styles.moduleTabActive]}
                  onPress={() => setActiveModule(tab.id)}
                >
                  <Ionicons
                    name={tab.icon}
                    size={16}
                    color={isActive ? '#ffffff' : colors.textMuted}
                  />
                  <Text style={[styles.moduleTabLabel, isActive && styles.moduleTabLabelActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading {activeModule.replace('-', ' ')}...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* ========================================================= */}
            {/* 1. PRAYER TIMES MODULE                                    */}
            {/* ========================================================= */}
            {activeModule === 'prayer-times' && (
              <View>
                {/* City Picker Bar */}
                <Pressable style={styles.cityBar} onPress={() => setCityPickerVisible(true)}>
                  <View style={styles.cityBarLeft}>
                    <Ionicons name="location-sharp" size={18} color={colors.primary} />
                    <Text style={styles.cityBarText}>{selectedCity}, Nigeria</Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                </Pressable>

                {/* Next Prayer Countdown Card */}
                {prayerData?.next_prayer && (
                  <View style={styles.heroPrayerCard}>
                    <View style={styles.prayerBadge}>
                      <Ionicons name="time" size={12} color={colors.accent} />
                      <Text style={styles.prayerBadgeText}>UPCOMING PRAYER</Text>
                    </View>
                    <Text style={styles.heroPrayerName}>{prayerData.next_prayer.name}</Text>
                    <Text style={styles.heroPrayerCountdown}>
                      {prayerData.next_prayer.countdown_formatted} • {prayerData.next_prayer.time}
                    </Text>
                  </View>
                )}

                {/* 5 Daily Prayers Grid */}
                <View style={styles.prayerTimesGrid}>
                  {[
                    { key: 'fajr', label: 'Fajr', icon: 'sunny-outline', time: prayerData?.times.fajr || '05:10' },
                    { key: 'sunrise', label: 'Sunrise', icon: 'partly-sunny-outline', time: prayerData?.times.sunrise || '06:22' },
                    { key: 'dhuhr', label: 'Dhuhr', icon: 'sunny', time: prayerData?.times.dhuhr || '12:28' },
                    { key: 'asr', label: 'Asr', icon: 'cloudy-outline', time: prayerData?.times.asr || '15:37' },
                    { key: 'maghrib', label: 'Maghrib', icon: 'cloud-offline-outline', time: prayerData?.times.maghrib || '18:31' },
                    { key: 'isha', label: 'Isha', icon: 'moon-outline', time: prayerData?.times.isha || '19:42' },
                  ].map((p) => {
                    const isCurrent = prayerData?.current_prayer?.toLowerCase() === p.key;
                    return (
                      <View key={p.key} style={[styles.prayerRowCard, isCurrent && styles.prayerRowActive]}>
                        <View style={styles.prayerRowLeft}>
                          <Ionicons
                            name={p.icon as any}
                            size={20}
                            color={isCurrent ? colors.primary : colors.textMuted}
                          />
                          <Text style={[styles.prayerRowLabel, isCurrent && styles.prayerRowLabelActive]}>
                            {p.label}
                          </Text>
                        </View>
                        <Text style={[styles.prayerRowTime, isCurrent && styles.prayerRowTimeActive]}>
                          {p.time}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ========================================================= */}
            {/* 2. QIBLA DIRECTION                                        */}
            {/* ========================================================= */}
            {activeModule === 'qibla' && (
              <View style={styles.qiblaContainer}>
                <Pressable style={styles.cityBar} onPress={() => setCityPickerVisible(true)}>
                  <View style={styles.cityBarLeft}>
                    <Ionicons name="location-sharp" size={18} color={colors.primary} />
                    <Text style={styles.cityBarText}>{selectedCity}, Nigeria</Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                </Pressable>

                <View style={styles.qiblaCompassCard}>
                  <View style={styles.compassOuter}>
                    <View style={styles.compassInner}>
                      <Ionicons
                        name="navigate"
                        size={56}
                        color={colors.primary}
                        style={{ transform: [{ rotate: ((qiblaData?.bearing_degrees || 64.6) + 'deg') as any }] }}
                      />
                      <Text style={styles.compassDegrees}>{qiblaData?.bearing_degrees || 64.6}°</Text>
                      <Text style={styles.compassDir}>{qiblaData?.compass_direction || 'ENE'}</Text>
                    </View>
                  </View>

                  <Text style={styles.qiblaTitle}>Kaaba Direction from {selectedCity}</Text>
                  <Text style={styles.qiblaSub}>
                    Distance: <Text style={{ fontWeight: '700', color: colors.primary }}>{qiblaData?.distance_km?.toLocaleString() || '3,729'} km</Text>
                  </Text>
                  <Text style={styles.qiblaInstructions}>
                    Turn your device towards the pointer to face the Sacred Mosque in Makkah al-Mukarramah.
                  </Text>
                </View>
              </View>
            )}

            {/* ========================================================= */}
            {/* 3. DIGITAL TASBIH                                         */}
            {/* ========================================================= */}
            {activeModule === 'tasbih' && (
              <View style={styles.tasbihContainer}>
                {/* Phrase Switcher */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tasbihPillRow}>
                  {['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar', 'Astaghfirullah', 'La ilaha illallah'].map((ph) => (
                    <Pressable
                      key={ph}
                      style={[styles.tasbihPill, tasbihPhrase === ph && styles.tasbihPillActive]}
                      onPress={() => setTasbihPhrase(ph)}
                    >
                      <Text style={[styles.tasbihPillText, tasbihPhrase === ph && styles.tasbihPillTextActive]}>
                        {ph}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {/* Big Tactile Tap Circle */}
                <Pressable style={styles.tasbihCircleBtn} onPress={handleTasbihTap}>
                  <Text style={styles.tasbihCirclePhrase}>{tasbihPhrase}</Text>
                  <Text style={styles.tasbihCircleNumber}>{tasbihCount}</Text>
                  <Text style={styles.tasbihCircleTarget}>Target: {tasbihTarget} • Lap {tasbihLap}</Text>
                </Pressable>

                {/* Target & Reset Controls */}
                <View style={styles.tasbihControls}>
                  <View style={styles.tasbihTargetRow}>
                    <Text style={styles.tasbihTargetLabel}>Target:</Text>
                    {[33, 99, 100].map((t) => (
                      <Pressable
                        key={t}
                        style={[styles.targetBtn, tasbihTarget === t && styles.targetBtnActive]}
                        onPress={() => setTasbihTarget(t)}
                      >
                        <Text style={[styles.targetBtnText, tasbihTarget === t && styles.targetBtnTextActive]}>
                          {t}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable style={styles.resetBtn} onPress={handleTasbihReset}>
                    <Ionicons name="refresh" size={16} color={colors.accent} />
                    <Text style={styles.resetBtnText}>Reset Counter</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* ========================================================= */}
            {/* 4. DAILY ADHKAR                                           */}
            {/* ========================================================= */}
            {activeModule === 'adhkar' && (
              <View>
                {/* Category Pills */}
                <View style={styles.categoryPillRow}>
                  {[
                    { id: 'morning', label: 'Morning' },
                    { id: 'evening', label: 'Evening' },
                    { id: 'after_salah', label: 'After Salah' },
                    { id: 'sleep', label: 'Before Sleep' },
                  ].map((c) => (
                    <Pressable
                      key={c.id}
                      style={[styles.catPill, adhkarCat === c.id && styles.catPillActive]}
                      onPress={() => setAdhkarCat(c.id)}
                    >
                      <Text style={[styles.catPillText, adhkarCat === c.id && styles.catPillTextActive]}>
                        {c.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Adhkar Cards */}
                {adhkarList.map((item) => {
                  const currentCount = adhkarCounts[item.id] || 0;
                  const isDone = currentCount >= item.repeat_target;
                  return (
                    <View key={item.id} style={styles.adhkarCard}>
                      <View style={styles.adhkarCardHeader}>
                        <Text style={styles.adhkarCardTitle}>{item.title}</Text>
                        <Pressable
                          style={[styles.adhkarCountBadge, isDone && styles.adhkarCountBadgeDone]}
                          onPress={() => handleAdhkarTap(item)}
                        >
                          <Ionicons
                            name={isDone ? 'checkmark-circle' : 'finger-print'}
                            size={14}
                            color={isDone ? '#ffffff' : colors.primary}
                          />
                          <Text style={[styles.adhkarCountText, isDone && styles.adhkarCountTextDone]}>
                            {currentCount} / {item.repeat_target}
                          </Text>
                        </Pressable>
                      </View>

                      <Text style={styles.arabicText}>{item.text_arabic}</Text>
                      {item.text_transliteration && (
                        <Text style={styles.transliterationText}>{item.text_transliteration}</Text>
                      )}
                      <Text style={styles.translationText}>{item.text_translation}</Text>

                      {item.virtue && (
                        <View style={styles.virtueBox}>
                          <Ionicons name="sparkles" size={13} color={colors.accent} />
                          <Text style={styles.virtueText}>{item.virtue}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* ========================================================= */}
            {/* 5. DUAS & SUPPLICATIONS                                   */}
            {/* ========================================================= */}
            {activeModule === 'duas' && (
              <View>
                <View style={styles.categoryPillRow}>
                  {['daily', 'quranic', 'protection', 'forgiveness', 'anxiety'].map((c) => (
                    <Pressable
                      key={c}
                      style={[styles.catPill, duaCat === c && styles.catPillActive]}
                      onPress={() => setDuaCat(c)}
                    >
                      <Text style={[styles.catPillText, duaCat === c && styles.catPillTextActive]}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {duaList.map((d) => (
                  <View key={d.id} style={styles.duaCard}>
                    <Text style={styles.duaTitle}>{d.title}</Text>
                    <Text style={styles.arabicText}>{d.text_arabic}</Text>
                    {d.text_transliteration && (
                      <Text style={styles.transliterationText}>{d.text_transliteration}</Text>
                    )}
                    <Text style={styles.translationText}>{d.text_translation}</Text>
                    {d.reference && (
                      <Text style={styles.referenceText}>Source: {d.reference}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* ========================================================= */}
            {/* 6. HADITH LIBRARY                                         */}
            {/* ========================================================= */}
            {activeModule === 'hadith' && (
              <View>
                <View style={styles.categoryPillRow}>
                  {[
                    { id: 'nawawi40', label: '40 Hadith Nawawi' },
                    { id: 'bukhari', label: 'Sahih al-Bukhari' },
                    { id: 'muslim', label: 'Sahih Muslim' },
                  ].map((h) => (
                    <Pressable
                      key={h.id}
                      style={[styles.catPill, hadithColl === h.id && styles.catPillActive]}
                      onPress={() => setHadithColl(h.id)}
                    >
                      <Text style={[styles.catPillText, hadithColl === h.id && styles.catPillTextActive]}>
                        {h.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {hadithList.map((item) => (
                  <View key={item.id} style={styles.hadithCard}>
                    <View style={styles.hadithBadgeRow}>
                      <Text style={styles.hadithNumber}>Hadith #{item.hadith_number}</Text>
                      <Text style={styles.hadithGrade}>{item.grade || 'Sahih'}</Text>
                    </View>
                    {item.narrator && (
                      <Text style={styles.hadithNarrator}>Narrated by: {item.narrator}</Text>
                    )}
                    <Text style={styles.arabicText}>{item.text_arabic}</Text>
                    <Text style={styles.translationText}>{item.text_english}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ========================================================= */}
            {/* 7. 99 NAMES OF ALLAH                                      */}
            {/* ========================================================= */}
            {activeModule === 'names' && (
              <View style={styles.namesGrid}>
                {namesList.map((item) => (
                  <Pressable
                    key={item.number}
                    style={styles.nameCard}
                    onPress={() => setSelectedName(item)}
                  >
                    <View style={styles.nameNumberBadge}>
                      <Text style={styles.nameNumberText}>{item.number}</Text>
                    </View>
                    <Text style={styles.nameArabic}>{item.name_arabic}</Text>
                    <Text style={styles.nameTranslit}>{item.name_transliteration}</Text>
                    <Text style={styles.nameMeaning}>{item.meaning}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* ========================================================= */}
            {/* 8. TAJWEED RULES & LESSONS                                */}
            {/* ========================================================= */}
            {activeModule === 'tajweed' && (
              <View>
                {tajweedCats.map((cat) => (
                  <View key={cat.id} style={styles.tajweedCard}>
                    <View style={styles.tajweedHeader}>
                      <View style={styles.tajweedIconBox}>
                        <Ionicons name="musical-notes" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tajweedTitle}>{cat.title}</Text>
                        {cat.title_arabic && <Text style={styles.tajweedArabic}>{cat.title_arabic}</Text>}
                      </View>
                    </View>
                    <Text style={styles.tajweedDesc}>{cat.description}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ========================================================= */}
            {/* 9. TAFSIR EXEGESIS                                        */}
            {/* ========================================================= */}
            {activeModule === 'tafsir' && (
              <View>
                {/* Ayah Navigation Bar */}
                <View style={styles.tafsirNavCard}>
                  <View style={styles.tafsirNavHeader}>
                    <Pressable
                      style={styles.tafsirNavBtn}
                      onPress={() => setTafsirAyah((a) => Math.max(1, a - 1))}
                    >
                      <Ionicons name="chevron-back" size={16} color={colors.primary} />
                      <Text style={styles.tafsirNavBtnText}>Prev Ayah</Text>
                    </Pressable>

                    <Text style={styles.tafsirVerseKeyBadge}>
                      Surah {tafsirSurah}:{tafsirAyah}
                    </Text>

                    <Pressable
                      style={styles.tafsirNavBtn}
                      onPress={() => setTafsirAyah((a) => a + 1)}
                    >
                      <Text style={styles.tafsirNavBtnText}>Next Ayah</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </Pressable>
                  </View>
                  <Text style={styles.tafsirSourceLabel}>
                    Source: {tafsirData?.source_name || 'Tafsir Ibn Kathir (Authentic Classical Exegesis)'}
                  </Text>
                </View>

                {/* Ayah Arabic & Translation Box */}
                <View style={styles.arabicBox}>
                  <Text style={styles.arabicText}>
                    {tafsirData?.text_arabic || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
                  </Text>
                  <Text style={styles.translationText}>
                    {tafsirData?.text_translation ||
                      'In the name of Allah, the Entirely Merciful, the Especially Merciful.'}
                  </Text>
                </View>

                {/* Commentary Card */}
                <View style={styles.tafsirContentCard}>
                  <View style={styles.tafsirHeaderRow}>
                    <Ionicons name="book" size={18} color={colors.primary} />
                    <Text style={styles.tafsirSectionHeading}>Commentary & Insights</Text>
                  </View>
                  <Text style={styles.tafsirBodyText}>
                    {tafsirData?.content ||
                      'The Companions started the Book of Allah with it. Scholars agree that Bismillah is a verse in Surah An-Naml (27:30). The name "Allah" is the Greatest Name of the Lord, derived from Al-Ilah (the One who alone deserves to be worshipped). Ar-Rahman is more intensive than Ar-Rahim, denoting vast, all-encompassing mercy for all creation in this world, while Ar-Rahim denotes special mercy for the believers in the Hereafter.'}
                  </Text>

                  {tafsirData?.related_verses ? (
                    <View style={styles.tafsirMetaBox}>
                      <Text style={styles.tafsirMetaLabel}>Cross References:</Text>
                      <Text style={styles.tafsirMetaVal}>{tafsirData.related_verses}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}

            {/* ========================================================= */}
            {/* 10. TAWHID & 'AQEEDAH                                     */}
            {/* ========================================================= */}
            {activeModule === 'tawhid' && (
              <View>
                {tawhidCats.map((cat) => (
                  <View key={cat.id} style={styles.tawhidCard}>
                    <View style={styles.tawhidHeader}>
                      <View style={styles.tawhidIconBox}>
                        <Ionicons name="shield-checkmark" size={20} color={colors.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tawhidTitle}>{cat.title}</Text>
                        {cat.title_arabic && <Text style={styles.tawhidArabic}>{cat.title_arabic}</Text>}
                      </View>
                    </View>
                    <Text style={styles.tawhidDesc}>{cat.description}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ========================================================= */}
            {/* 10. HIJRI CALENDAR                                        */}
            {/* ========================================================= */}
            {activeModule === 'hijri' && (
              <View>
                {hijriDate && (
                  <View style={styles.hijriHeaderCard}>
                    <Ionicons name="moon" size={28} color={colors.accent} />
                    <Text style={styles.hijriDateFormatted}>{hijriDate.formatted || "9 Rabi' al-Thani 1448 AH"}</Text>
                    <Text style={styles.hijriSub}>Gregorian Date: {new Date().toLocaleDateString()}</Text>
                  </View>
                )}

                <Text style={styles.sectionHeading}>Islamic Events & Milestones</Text>
                {hijriEvents.map((ev, i) => (
                  <View key={i} style={styles.eventCard}>
                    <View style={styles.eventLeft}>
                      <Text style={styles.eventTitle}>{ev.title}</Text>
                      <Text style={styles.eventDesc}>{ev.description}</Text>
                    </View>
                    <View style={styles.eventDateBadge}>
                      <Text style={styles.eventDateText}>Day {ev.hijri_day}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ========================================================= */}
            {/* 11. UNIFIED BOOKMARKS                                     */}
            {/* ========================================================= */}
            {activeModule === 'bookmarks' && (
              <View>
                {bookmarks.length === 0 ? (
                  <View style={styles.emptyBookmarks}>
                    <Ionicons name="bookmark-outline" size={48} color={colors.textLight} />
                    <Text style={styles.emptyBookmarksTitle}>No Bookmarks Yet</Text>
                    <Text style={styles.emptyBookmarksSub}>
                      Save your favorite ayahs, hadiths, and duas across the platform to access them anytime.
                    </Text>
                  </View>
                ) : (
                  bookmarks.map((bm) => (
                    <View key={bm.id} style={styles.bookmarkCard}>
                      <View style={styles.bookmarkBadge}>
                        <Text style={styles.bookmarkType}>{bm.item_type.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.bookmarkTitle}>{bm.title}</Text>
                      {bm.content_snippet && (
                        <Text style={styles.bookmarkSnippet} numberOfLines={2}>
                          {bm.content_snippet}
                        </Text>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        )}

        {/* City Selector Modal */}
        <Modal visible={cityPickerVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Nigerian City</Text>
                <Pressable onPress={() => setCityPickerVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>
              <ScrollView style={{ maxHeight: 350 }}>
                {cities.map((c) => (
                  <Pressable
                    key={c.name}
                    style={[styles.cityItem, selectedCity === c.name && styles.cityItemActive]}
                    onPress={() => {
                      setSelectedCity(c.name);
                      setCityPickerVisible(false);
                    }}
                  >
                    <Text style={[styles.cityItemText, selectedCity === c.name && styles.cityItemTextActive]}>
                      {c.name} ({c.state})
                    </Text>
                    {selectedCity === c.name && (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* 99 Names Detail Modal */}
        <Modal visible={selectedName !== null} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.nameModalContent}>
              {selectedName && (
                <>
                  <Text style={styles.nameModalArabic}>{selectedName.name_arabic}</Text>
                  <Text style={styles.nameModalTranslit}>{selectedName.name_transliteration}</Text>
                  <Text style={styles.nameModalMeaning}>"{selectedName.meaning}"</Text>
                  <Text style={styles.nameModalExplanation}>
                    {selectedName.explanation || 'One of the beautiful and divine names of Allah mentioned in the Quran and Sunnah.'}
                  </Text>
                  {selectedName.quran_reference && (
                    <Text style={styles.nameModalRef}>Reference: {selectedName.quran_reference}</Text>
                  )}
                  <Pressable style={styles.nameModalCloseBtn} onPress={() => setSelectedName(null)}>
                    <Text style={styles.nameModalCloseBtnText}>Close</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Modal>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: colors.background },
  tabContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  tabScroll: { paddingHorizontal: 16, gap: 8 },
  moduleTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  moduleTabActive: { backgroundColor: colors.primary },
  moduleTabLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  moduleTabLabelActive: { color: '#ffffff' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textMuted },
  content: { padding: spacing.md, paddingBottom: 120 },

  // Prayer Times
  cityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cityBarText: { fontSize: 14, fontWeight: '700', color: colors.text },
  heroPrayerCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  prayerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginBottom: 8,
  },
  prayerBadgeText: { fontSize: 11, fontWeight: '800', color: colors.accentSubtle, letterSpacing: 0.5 },
  heroPrayerName: { fontSize: 32, fontWeight: '800', color: '#ffffff' },
  heroPrayerCountdown: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  prayerTimesGrid: { gap: 10 },
  prayerRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prayerRowActive: { borderColor: colors.primary, backgroundColor: colors.surfaceSubtle },
  prayerRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prayerRowLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  prayerRowLabelActive: { color: colors.primary, fontWeight: '700' },
  prayerRowTime: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
  prayerRowTimeActive: { color: colors.primary },

  // Qibla
  qiblaContainer: { alignItems: 'center' },
  qiblaCompassCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  compassOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    backgroundColor: colors.background,
  },
  compassInner: { alignItems: 'center', justifyContent: 'center' },
  compassDegrees: { fontSize: 24, fontWeight: '800', color: colors.primary, marginTop: 6 },
  compassDir: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  qiblaTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 12 },
  qiblaSub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  qiblaInstructions: { fontSize: 12, color: colors.textLight, textAlign: 'center', marginTop: 8, paddingHorizontal: 16 },

  // Tasbih
  tasbihContainer: { alignItems: 'center', paddingVertical: 16 },
  tasbihPillRow: { gap: 8, paddingBottom: 16 },
  tasbihPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tasbihPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tasbihPillText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  tasbihPillTextActive: { color: '#ffffff' },
  tasbihCircleBtn: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  tasbihCirclePhrase: { fontSize: 14, color: colors.accentSubtle, fontWeight: '600' },
  tasbihCircleNumber: { fontSize: 56, fontWeight: '800', color: '#ffffff', marginVertical: 4 },
  tasbihCircleTarget: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  tasbihControls: { width: '100%', alignItems: 'center', gap: 14 },
  tasbihTargetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tasbihTargetLabel: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  targetBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  targetBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  targetBtnText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  targetBtnTextActive: { color: '#ffffff' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  resetBtnText: { fontSize: 13, fontWeight: '600', color: colors.accent },

  // Adhkar & Duas
  categoryPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catPillText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  catPillTextActive: { color: '#ffffff' },
  adhkarCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adhkarCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  adhkarCardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  adhkarCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  adhkarCountBadgeDone: { backgroundColor: colors.success },
  adhkarCountText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  adhkarCountTextDone: { color: '#ffffff' },
  arabicBox: { backgroundColor: colors.surfaceSubtle, borderRadius: radius.md, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.borderSubtle },
  arabicText: { fontSize: 20, textAlign: 'right', color: colors.primaryDark, lineHeight: 34, marginVertical: 8, fontFamily: 'serif' },
  transliterationText: { fontSize: 13, fontStyle: 'italic', color: colors.textMuted, marginBottom: 6 },
  translationText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  virtueBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: colors.accentSubtle, padding: 8, borderRadius: radius.sm },
  virtueText: { fontSize: 12, color: colors.accent, flex: 1 },

  duaCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  duaTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  referenceText: { fontSize: 11, color: colors.textLight, marginTop: 8, fontStyle: 'italic' },

  // Hadith
  hadithCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  hadithBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  hadithNumber: { fontSize: 13, fontWeight: '700', color: colors.primary },
  hadithGrade: { fontSize: 11, fontWeight: '700', color: colors.success, backgroundColor: colors.surfaceSubtle, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm },
  hadithNarrator: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 8 },

  // 99 Names
  namesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nameCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  nameNumberBadge: { alignSelf: 'flex-start', backgroundColor: colors.surfaceMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  nameNumberText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  nameArabic: { fontSize: 24, color: colors.primary, marginVertical: 6, fontFamily: 'serif' },
  nameTranslit: { fontSize: 13, fontWeight: '700', color: colors.text },
  nameMeaning: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 2 },

  // Tajweed & Tawhid
  tajweedCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  tajweedHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  tajweedIconBox: { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.primarySubtle, alignItems: 'center', justifyContent: 'center' },
  tajweedTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  tajweedArabic: { fontSize: 13, color: colors.primary },
  tajweedDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },

  tawhidCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  tawhidHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  tawhidIconBox: { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.accentSubtle, alignItems: 'center', justifyContent: 'center' },
  tawhidTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  tawhidArabic: { fontSize: 13, color: colors.accent },
  tawhidDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },

  // Tafsir
  tafsirNavCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  tafsirNavHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tafsirNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: colors.primarySubtle },
  tafsirNavBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  tafsirVerseKeyBadge: { fontSize: 15, fontWeight: '800', color: colors.text },
  tafsirSourceLabel: { fontSize: 11, color: colors.textMuted, marginTop: 8, textAlign: 'center' },
  tafsirContentCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  tafsirHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tafsirSectionHeading: { fontSize: 14, fontWeight: '800', color: colors.primary },
  tafsirBodyText: { fontSize: 13, color: colors.text, lineHeight: 21 },
  tafsirMetaBox: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  tafsirMetaLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  tafsirMetaVal: { fontSize: 12, color: colors.accent, marginTop: 2 },

  // Hijri
  hijriHeaderCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  hijriDateFormatted: { fontSize: 20, fontWeight: '800', color: colors.primary, marginTop: 8 },
  hijriSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  sectionHeading: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10 },
  eventCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: 14, borderRadius: radius.md, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  eventLeft: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  eventDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  eventDateBadge: { backgroundColor: colors.primarySubtle, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm },
  eventDateText: { fontSize: 11, fontWeight: '700', color: colors.primary },

  // Bookmarks
  emptyBookmarks: { alignItems: 'center', paddingVertical: 40 },
  emptyBookmarksTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 12 },
  emptyBookmarksSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 6, paddingHorizontal: 24 },
  bookmarkCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  bookmarkBadge: { alignSelf: 'flex-start', backgroundColor: colors.surfaceMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm, marginBottom: 4 },
  bookmarkType: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  bookmarkTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  bookmarkSnippet: { fontSize: 12, color: colors.textMuted, marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.surface, borderRadius: radius.lg, width: '100%', padding: 20, maxHeight: 450 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  cityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  cityItemActive: { backgroundColor: colors.surfaceSubtle },
  cityItemText: { fontSize: 14, color: colors.text },
  cityItemTextActive: { fontWeight: '700', color: colors.primary },

  nameModalContent: { backgroundColor: colors.surface, borderRadius: radius.lg, width: '90%', padding: 24, alignItems: 'center' },
  nameModalArabic: { fontSize: 40, color: colors.primary, fontFamily: 'serif' },
  nameModalTranslit: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 6 },
  nameModalMeaning: { fontSize: 15, color: colors.accent, fontWeight: '600', marginTop: 4 },
  nameModalExplanation: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginTop: 12 },
  nameModalRef: { fontSize: 12, color: colors.textLight, marginTop: 8, fontStyle: 'italic' },
  nameModalCloseBtn: { marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: radius.md },
  nameModalCloseBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
