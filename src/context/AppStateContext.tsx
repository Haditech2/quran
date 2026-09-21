import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, MemorizationGrade, ReviewEntry, SettingsState, Surah } from '@/types';
import { clearKeys, loadJson, saveJson } from '@/services/storage';
import { createReviewEntry, isDue, toStudyLog } from '@/utils/repetition';
import { sameCalendarDay } from '@/utils/date';
import { useQuranCatalog } from '@/context/QuranCatalogContext';
import { getDeviceId } from '@/services/device';
import { syncDeviceState } from '@/services/backendSync';
import { downloadSurahOffline, removeSurahDownload } from '@/services/offlineDownloads';
import { OfflineSurahManifest } from '@/types';

const STORAGE_KEYS = {
  settings: '@quran/settings',
  progress: '@quran/progress',
  downloadedSurahs: '@quran/downloadedSurahs',
  offlineDownloads: '@quran/offlineDownloads',
};

const defaultSettings: SettingsState = {
  showTranslation: true,
  playbackSpeed: 1,
  offlineMode: true,
  repeatCount: 1,
  repeatRange: false,
};

const defaultProgress: AppState['progress'] = {
  memorizedAyahs: {},
  studyHistory: [],
  completedSurahs: {},
  dailyStreak: 0,
  lastStudyDate: undefined,
};

const defaultState: AppState = {
  settings: defaultSettings,
  progress: defaultProgress,
  downloadedSurahs: [1, 112],
  offlineDownloads: {},
};

type AppStateContextValue = AppState & {
  hydrated: boolean;
  deviceId: string;
  dueReviews: ReviewEntry[];
  revisionQueue: ReviewEntry[];
  weakAyahs: ReviewEntry[];
  markAyahGrade: (params: { surahId: number; ayahId: string; ayahNumber: number; grade: MemorizationGrade }) => void;
  updateSettings: (patch: Partial<SettingsState>) => void;
  toggleDownload: (surahId: number) => Promise<void>;
  resetLocalData: () => Promise<void>;
  recomputeSurahCompletion: () => void;
  getOfflineAudioUri: (surahId: number, ayahNumber: number) => string | undefined;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

function calculateCompletedSurahs(catalog: Surah[], memorizedAyahs: Record<string, ReviewEntry>) {
  return catalog.reduce<Record<number, number>>((accumulator, surah) => {
    const memorizedCount = surah.ayahs.filter((ayah) => memorizedAyahs[ayah.id]).length;
    accumulator[surah.id] = Math.round((memorizedCount / surah.ayahs.length) * 100);
    return accumulator;
  }, {});
}

function buildRevisionEntries(memorizedAyahs: Record<string, ReviewEntry>) {
  return Object.values(memorizedAyahs)
    .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime())
    .filter((entry) => isDue(entry));
}

function computeWeakEntries(memorizedAyahs: Record<string, ReviewEntry>) {
  return Object.values(memorizedAyahs)
    .filter((entry) => entry.grade !== 'correct')
    .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime());
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { chapters, getSurahById } = useQuranCatalog();
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [progress, setProgress] = useState<AppState['progress']>(defaultProgress);
  const [downloadedSurahs, setDownloadedSurahs] = useState<number[]>(defaultState.downloadedSurahs);
  const [offlineDownloads, setOfflineDownloads] = useState<Record<number, OfflineSurahManifest>>(defaultState.offlineDownloads);
  const [hydrated, setHydrated] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const [savedSettings, savedProgress, savedDownloads, savedOfflineDownloads] = await Promise.all([
        loadJson<SettingsState>(STORAGE_KEYS.settings, defaultSettings),
        loadJson<AppState['progress']>(STORAGE_KEYS.progress, defaultProgress),
        loadJson<number[]>(STORAGE_KEYS.downloadedSurahs, defaultState.downloadedSurahs),
        loadJson<Record<number, OfflineSurahManifest>>(STORAGE_KEYS.offlineDownloads, defaultState.offlineDownloads),
      ]);

      if (!active) {
        return;
      }

      setSettings(savedSettings);
      setProgress({
        ...savedProgress,
        completedSurahs: calculateCompletedSurahs(chapters, savedProgress.memorizedAyahs),
      });
      setDownloadedSurahs(savedDownloads);
      setOfflineDownloads(savedOfflineDownloads);
      setHydrated(true);
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void getDeviceId().then((value) => setDeviceId(value));
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveJson(STORAGE_KEYS.settings, settings);
  }, [hydrated, settings]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveJson(STORAGE_KEYS.progress, progress);
  }, [hydrated, progress]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveJson(STORAGE_KEYS.downloadedSurahs, downloadedSurahs);
  }, [hydrated, downloadedSurahs]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveJson(STORAGE_KEYS.offlineDownloads, offlineDownloads);
  }, [hydrated, offlineDownloads]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setProgress((current) => ({
      ...current,
      completedSurahs: calculateCompletedSurahs(chapters, current.memorizedAyahs),
    }));
  }, [chapters, hydrated]);

  useEffect(() => {
    if (!hydrated || !deviceId) {
      return;
    }

    const timeout = setTimeout(() => {
      void syncDeviceState({
        deviceId,
        settings,
        progress,
        downloads: Object.values(offlineDownloads),
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [deviceId, hydrated, offlineDownloads, progress, settings]);

  const markAyahGrade: AppStateContextValue['markAyahGrade'] = ({ surahId, ayahId, ayahNumber, grade }) => {
    const surah = getSurahById(surahId);
    if (!surah) {
      return;
    }

    const previous = progress.memorizedAyahs[ayahId];
    const nextEntry = createReviewEntry({
      ayahId,
      surahId,
      surahName: surah.nameEnglish,
      ayahNumber,
      grade,
      previous,
    });

    const today = new Date();
    setProgress((current) => {
      const updatedMemorizedAyahs = {
        ...current.memorizedAyahs,
        [ayahId]: nextEntry,
      };

      const completedSurahs = calculateCompletedSurahs(chapters, updatedMemorizedAyahs);
      const previousStudyDate = current.lastStudyDate ? new Date(current.lastStudyDate) : undefined;
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const dailyStreak = !previousStudyDate
        ? 1
        : sameCalendarDay(previousStudyDate, today)
          ? current.dailyStreak
          : sameCalendarDay(previousStudyDate, yesterday)
            ? current.dailyStreak + 1
            : 1;
      const lastStudyDate = sameCalendarDay(previousStudyDate ?? today, today) ? current.lastStudyDate : today.toISOString();

      return {
        memorizedAyahs: updatedMemorizedAyahs,
        studyHistory: [toStudyLog(nextEntry), ...current.studyHistory].slice(0, 200),
        completedSurahs,
        dailyStreak,
        lastStudyDate,
      };
    });
  };

  const updateSettings = (patch: Partial<SettingsState>) => {
    setSettings((current) => ({ ...current, ...patch }));
  };

  const toggleDownload = async (surahId: number) => {
    if (downloadedSurahs.includes(surahId)) {
      try {
        await removeSurahDownload(surahId);
        setDownloadedSurahs((current) => current.filter((id) => id !== surahId));
        setOfflineDownloads((current) => {
          const next = { ...current };
          delete next[surahId];
          return next;
        });
      } catch {
        return;
      }
      return;
    }

    const surah = getSurahById(surahId);
    if (!surah) {
      return;
    }

    try {
      const manifest = await downloadSurahOffline(surah);
      setDownloadedSurahs((current) => [...current, surahId]);
      setOfflineDownloads((current) => ({ ...current, [surahId]: manifest }));
    } catch {
      return;
    }
  };

  const resetLocalData = async () => {
    await clearKeys([STORAGE_KEYS.settings, STORAGE_KEYS.progress, STORAGE_KEYS.downloadedSurahs, STORAGE_KEYS.offlineDownloads]);
    setSettings(defaultSettings);
    setProgress(defaultProgress);
    setDownloadedSurahs(defaultState.downloadedSurahs);
    setOfflineDownloads(defaultState.offlineDownloads);
  };

  const completedSurahs = useMemo(() => calculateCompletedSurahs(chapters, progress.memorizedAyahs), [chapters, progress.memorizedAyahs]);
  const revisionQueue = useMemo(() => buildRevisionEntries(progress.memorizedAyahs), [progress.memorizedAyahs]);
  const weakAyahs = useMemo(() => computeWeakEntries(progress.memorizedAyahs), [progress.memorizedAyahs]);
  const dueReviews = useMemo(
    () => revisionQueue.filter((entry) => isDue(entry)),
    [revisionQueue],
  );

  const value: AppStateContextValue = {
    settings,
    progress: { ...progress, completedSurahs },
    downloadedSurahs,
    offlineDownloads,
    hydrated,
    deviceId,
    dueReviews,
    revisionQueue,
    weakAyahs,
    markAyahGrade,
    updateSettings,
    toggleDownload,
    resetLocalData,
    recomputeSurahCompletion: () => {
      setProgress((current) => ({
        ...current,
        completedSurahs: calculateCompletedSurahs(chapters, current.memorizedAyahs),
      }));
    },
    getOfflineAudioUri: (surahId: number, ayahNumber: number) => {
      const manifest = offlineDownloads[surahId];
      if (!manifest) {
        return undefined;
      }

      return manifest.ayahs.find((ayah) => ayah.ayahNumber === ayahNumber)?.localAudioUri;
    },
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }

  return context;
}
