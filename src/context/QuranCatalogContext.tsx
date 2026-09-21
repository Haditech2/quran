import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { sampleQuran, getSurahById as getFallbackSurahById } from '@/data/quran';
import { Surah } from '@/types';
import { ChapterSummary, fetchChapterDetail, fetchChapterSummaries, mergeAyahs } from '@/services/quranApi';

function mergeChapter(existing: Surah | undefined, summary: ChapterSummary): Surah {
  return {
    id: summary.id,
    number: summary.number,
    nameArabic: summary.nameArabic || existing?.nameArabic || '',
    nameEnglish: summary.nameEnglish || existing?.nameEnglish || '',
    revelationType: (summary.revelationType as Surah['revelationType']) || existing?.revelationType || 'Meccan',
    ayahCount: summary.ayahCount || existing?.ayahCount,
    ayahs: existing?.ayahs?.length ? existing.ayahs : [],
  };
}

type QuranCatalogContextValue = {
  chapters: Surah[];
  loading: boolean;
  error: string | null;
  refreshCatalog: () => Promise<void>;
  refreshSurah: (surahId: number) => Promise<Surah | undefined>;
  getSurahById: (surahId: number) => Surah | undefined;
};

const QuranCatalogContext = createContext<QuranCatalogContextValue | undefined>(undefined);

export function QuranCatalogProvider({ children }: { children: ReactNode }) {
  const [chapters, setChapters] = useState<Surah[]>(sampleQuran);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCatalog = async () => {
    try {
      const summaries = await fetchChapterSummaries();
      setChapters((current) => {
        const merged = new Map<number, Surah>();
        for (const chapter of current) {
          merged.set(chapter.id, chapter);
        }
        for (const summary of summaries) {
          merged.set(summary.id, mergeChapter(merged.get(summary.id), summary));
        }
        return Array.from(merged.values()).sort((left, right) => left.number - right.number);
      });
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load Quran catalog.');
    } finally {
      setLoading(false);
    }
  };

  const refreshSurah = async (surahId: number) => {
    try {
      const detail = await fetchChapterDetail(surahId);
      const enriched = {
        ...detail,
        ayahCount: detail.ayahs.length,
        ayahs: detail.ayahs.map((ayah) => ({
          ...ayah,
          audioUrl: ayah.audioUrl,
        })),
      };
      setChapters((current) => {
        const next = current.map((chapter) =>
          chapter.id === surahId ? { ...chapter, ...enriched, ayahs: mergeAyahs(chapter.ayahs, enriched.ayahs) } : chapter,
        );
        if (!next.some((chapter) => chapter.id === surahId)) {
          next.push(enriched);
        }
        return next.sort((left, right) => left.number - right.number);
      });
      setError(null);
      return enriched;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load surah text.';
      setError(message);
      return getFallbackSurahById(surahId);
    }
  };

  useEffect(() => {
    void refreshCatalog();
  }, []);

  const getSurahById = (surahId: number) => {
    const chapter = chapters.find((item) => item.id === surahId);
    if (chapter && chapter.ayahs.length > 0) {
      return chapter;
    }
    const fallback = getFallbackSurahById(surahId);
    if (fallback) {
      return fallback;
    }
    return chapter;
  };

  const value = useMemo(
    () => ({ chapters, loading, error, refreshCatalog, refreshSurah, getSurahById }),
    [chapters, loading, error],
  );

  return <QuranCatalogContext.Provider value={value}>{children}</QuranCatalogContext.Provider>;
}

export function useQuranCatalog() {
  const context = useContext(QuranCatalogContext);
  if (!context) {
    throw new Error('useQuranCatalog must be used within QuranCatalogProvider');
  }
  return context;
}
