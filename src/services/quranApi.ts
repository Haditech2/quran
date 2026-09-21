import { Ayah, Surah } from '@/types';
import { requestJson } from '@/services/apiClient';

export type ChapterSummary = Pick<Surah, 'id' | 'number' | 'nameArabic' | 'nameEnglish' | 'revelationType'> & {
  ayahCount: number;
};

// Fallback EveryAyah audio generator (128kbps Mishary Alafasy)
export function getEveryAyahAudioUrl(surahNumber: number, ayahNumber: number): string {
  const sStr = String(surahNumber).padStart(3, '0');
  const aStr = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/Alafasy_128kbps/${sStr}${aStr}.mp3`;
}

export async function fetchChapterSummaries(): Promise<ChapterSummary[]> {
  // 1. Try PHP Backend (/api/quran/surahs)
  try {
    const payload = await requestJson<any>('/api/quran/surahs');
    const surahsList = payload.data || payload.surahs || payload;
    if (Array.isArray(surahsList) && surahsList.length > 0) {
      return surahsList.map((s: any) => ({
        id: s.number || s.id,
        number: s.number || s.id,
        nameArabic: s.name_arabic || s.nameArabic || '',
        nameEnglish: s.name_english || s.nameEnglish || '',
        revelationType: (s.revelation_type || s.revelationType || 'Meccan') as Surah['revelationType'],
        ayahCount: s.total_ayahs || s.ayahCount || 0,
      }));
    }
  } catch (err) {
    console.warn("Backend /api/quran/surahs failed, using Al-Quran Cloud catalog:", err);
  }

  // 2. Direct Al-Quran Cloud fallback for all 114 Surahs
  try {
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const json = await res.json();
    if (json && json.data && Array.isArray(json.data)) {
      return json.data.map((s: any) => ({
        id: s.number,
        number: s.number,
        nameArabic: s.name,
        nameEnglish: s.englishName,
        revelationType: (s.revelationType === 'Medinan' ? 'Medinan' : 'Meccan') as Surah['revelationType'],
        ayahCount: s.numberOfAyahs,
      }));
    }
  } catch (err) {
    console.error("Failed to load Quran summaries from API:", err);
  }

  return [];
}

export async function fetchChapterDetail(chapterId: number): Promise<Surah> {
  // 1. Try PHP Backend
  try {
    const res = await requestJson<any>(`/api/quran/surahs/${chapterId}?include_ayahs=true`);
    const surah = res.data || res;
    if (surah && surah.ayahs && surah.ayahs.length > 0) {
      return {
        id: surah.number || chapterId,
        number: surah.number || chapterId,
        nameArabic: surah.name_arabic || surah.nameArabic || '',
        nameEnglish: surah.name_english || surah.nameEnglish || '',
        revelationType: (surah.revelation_type || 'Meccan') as Surah['revelationType'],
        ayahCount: surah.ayahs.length,
        ayahs: surah.ayahs.map((a: any) => ({
          id: `${chapterId}:${a.ayah_number || a.number}`,
          number: a.ayah_number || a.number,
          arabic: a.text_arabic || a.arabic || a.text,
          translation: a.text_translation || a.translation || '',
          audioUrl: a.audio_url || a.audioUrl || getEveryAyahAudioUrl(chapterId, a.ayah_number || a.number),
        })),
      };
    }
  } catch (err) {
    console.warn(`Backend surah ${chapterId} detail error, falling back to direct Quran API:`, err);
  }

  // 2. Live direct Al-Quran Cloud API (Uthmani Arabic + Sahih English + Alafasy Audio)
  const apiRes = await fetch(`https://api.alquran.cloud/v1/surah/${chapterId}/editions/quran-uthmani,en.sahih,ar.alafasy`);
  const apiJson = await apiRes.json();
  if (apiJson && apiJson.data && apiJson.data.length >= 2) {
    const arData = apiJson.data[0];
    const enData = apiJson.data[1];
    const auData = apiJson.data[2] || { ayahs: [] };

    const ayahs: Ayah[] = arData.ayahs.map((a: any, idx: number) => ({
      id: `${chapterId}:${a.numberInSurah}`,
      number: a.numberInSurah,
      arabic: a.text,
      translation: enData.ayahs[idx]?.text || '',
      audioUrl: auData.ayahs[idx]?.audio || getEveryAyahAudioUrl(chapterId, a.numberInSurah),
    }));

    return {
      id: chapterId,
      number: chapterId,
      nameArabic: arData.name,
      nameEnglish: arData.englishName,
      revelationType: (arData.revelationType === 'Medinan' ? 'Medinan' : 'Meccan') as Surah['revelationType'],
      ayahCount: ayahs.length,
      ayahs,
    };
  }

  throw new Error(`Unable to fetch Surah ${chapterId} from API.`);
}

export async function fetchAyahAudioUrl(chapterId: number, ayahNumber: number): Promise<string> {
  return getEveryAyahAudioUrl(chapterId, ayahNumber);
}

export function mergeAyahs(base: Ayah[], incoming: Ayah[]): Ayah[] {
  const merged = new Map<string, Ayah>();
  for (const ayah of base) {
    merged.set(ayah.id, ayah);
  }
  for (const ayah of incoming) {
    merged.set(ayah.id, ayah);
  }
  return Array.from(merged.values()).sort((left, right) => left.number - right.number);
}
