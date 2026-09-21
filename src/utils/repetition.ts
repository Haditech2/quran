import { MemorizationGrade, ReviewEntry, StudyLog } from '@/types';

const DAY = 24 * 60 * 60 * 1000;

export function getNextReviewDate(grade: MemorizationGrade, from = new Date()): Date {
  const offsetDays = grade === 'correct' ? 7 : grade === 'hard' ? 3 : 1;
  return new Date(from.getTime() + offsetDays * DAY);
}

export function createReviewEntry(params: {
  ayahId: string;
  surahId: number;
  surahName: string;
  ayahNumber: number;
  grade: MemorizationGrade;
  previous?: ReviewEntry;
  reviewedAt?: Date;
}): ReviewEntry {
  const reviewedAt = params.reviewedAt ?? new Date();
  const nextReviewAt = getNextReviewDate(params.grade, reviewedAt);
  const streak = params.grade === 'wrong' ? 0 : (params.previous?.streak ?? 0) + 1;

  return {
    ayahId: params.ayahId,
    surahId: params.surahId,
    surahName: params.surahName,
    ayahNumber: params.ayahNumber,
    grade: params.grade,
    dueAt: nextReviewAt.toISOString(),
    lastReviewedAt: reviewedAt.toISOString(),
    streak,
  };
}

export function isDue(entry: ReviewEntry, reference = new Date()): boolean {
  return new Date(entry.dueAt).getTime() <= reference.getTime();
}

export function toStudyLog(entry: ReviewEntry): StudyLog {
  return {
    id: `${entry.ayahId}-${entry.lastReviewedAt}`,
    ayahId: entry.ayahId,
    surahId: entry.surahId,
    grade: entry.grade,
    reviewedAt: entry.lastReviewedAt,
  };
}
