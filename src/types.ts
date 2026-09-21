export type MemorizationGrade = 'correct' | 'hard' | 'wrong';

export type Ayah = {
  id: string;
  number: number;
  arabic: string;
  translation: string;
  transliteration?: string;
  audioUrl?: string;
};

export type DownloadedAyahFile = {
  ayahId: string;
  ayahNumber: number;
  remoteAudioUrl: string;
  localAudioUri: string;
};

export type OfflineSurahManifest = {
  surahId: number;
  surahNumber: number;
  surahName: string;
  chapterFileUri: string;
  downloadedAt: string;
  ayahs: DownloadedAyahFile[];
};

export type Surah = {
  id: number;
  number: number;
  nameArabic: string;
  nameEnglish: string;
  revelationType: 'Meccan' | 'Medinan';
  ayahCount?: number;
  ayahs: Ayah[];
};

export type ReviewEntry = {
  ayahId: string;
  surahId: number;
  surahName: string;
  ayahNumber: number;
  grade: MemorizationGrade;
  dueAt: string;
  lastReviewedAt: string;
  streak: number;
};

export type StudyLog = {
  id: string;
  ayahId: string;
  surahId: number;
  grade: MemorizationGrade;
  reviewedAt: string;
};

export type SettingsState = {
  showTranslation: boolean;
  playbackSpeed: number;
  offlineMode: boolean;
  repeatCount: number;
  repeatRange: boolean;
  preferredRecitationId?: number;
};

export type ProgressState = {
  memorizedAyahs: Record<string, ReviewEntry>;
  studyHistory: StudyLog[];
  completedSurahs: Record<number, number>;
  dailyStreak: number;
  lastStudyDate?: string;
};

export type AppState = {
  settings: SettingsState;
  progress: ProgressState;
  downloadedSurahs: number[];
  offlineDownloads: Record<number, OfflineSurahManifest>;
};
