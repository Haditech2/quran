import { API_BASE_URL } from '@/config';

const BASE_URL = API_BASE_URL || 'https://quran-beige-xi.vercel.app';

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      return null;
    }
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// 1. Overview & Dashboard
export interface PlatformOverview {
  memorization?: {
    memorized_ayahs: number;
    total_ayahs: number;
    overall_percentage: number;
    streak_days: number;
  };
  next_prayer?: {
    name: string;
    time: string;
    minutes_remaining: number;
    countdown_formatted: string;
  };
  current_prayer?: string;
  hijri?: {
    day: number;
    month_number: number;
    year: number;
    month_name_english: string;
    month_name_arabic: string;
    formatted: string;
  };
  tajweed?: { completed_lessons: number; total_lessons: number };
  tawhid?: { completed_lessons: number; total_lessons: number };
  adhkar?: { completed_today: number; target_today: number };
}

export async function fetchPlatformOverview(): Promise<PlatformOverview | null> {
  return apiFetch<PlatformOverview>('/api/dashboard/overview');
}

// 2. Prayer Times
export interface PrayerTimesData {
  city: string;
  latitude: number;
  longitude: number;
  date: string;
  times: {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };
  current_prayer?: string;
  next_prayer?: {
    name: string;
    time: string;
    countdown_formatted: string;
    minutes_remaining: number;
  };
}

export async function fetchPrayerTimes(city = 'Abuja'): Promise<PrayerTimesData | null> {
  return apiFetch<PrayerTimesData>(`/api/prayer/times?city=${encodeURIComponent(city)}`);
}

export async function fetchNigerianCities(): Promise<Array<{ name: string; state: string; latitude: number; longitude: number }>> {
  const cities = await apiFetch<Array<{ name: string; state: string; latitude: number; longitude: number }>>('/api/prayer/cities');
  if (cities && cities.length > 0) return cities;
  return [
    { name: 'Abuja', state: 'FCT', latitude: 9.0765, longitude: 7.3986 },
    { name: 'Lagos', state: 'Lagos', latitude: 6.5244, longitude: 3.3792 },
    { name: 'Kano', state: 'Kano', latitude: 12.0022, longitude: 8.5920 },
    { name: 'Kaduna', state: 'Kaduna', latitude: 10.5105, longitude: 7.4165 },
    { name: 'Port Harcourt', state: 'Rivers', latitude: 4.8156, longitude: 7.0498 },
    { name: 'Ibadan', state: 'Oyo', latitude: 7.3775, longitude: 3.9470 },
    { name: 'Benin City', state: 'Edo', latitude: 6.3350, longitude: 5.6037 },
    { name: 'Maiduguri', state: 'Borno', latitude: 11.8311, longitude: 13.1510 },
    { name: 'Zaria', state: 'Kaduna', latitude: 11.0855, longitude: 7.7199 },
    { name: 'Jos', state: 'Plateau', latitude: 9.8965, longitude: 8.8583 },
    { name: 'Ilorin', state: 'Kwara', latitude: 8.4799, longitude: 4.5418 },
    { name: 'Enugu', state: 'Enugu', latitude: 6.4584, longitude: 7.5464 },
    { name: 'Abeokuta', state: 'Ogun', latitude: 7.1475, longitude: 3.3619 },
    { name: 'Sokoto', state: 'Sokoto', latitude: 13.0059, longitude: 5.2476 },
    { name: 'Keffi', state: 'Nasarawa', latitude: 8.8471, longitude: 7.8736 },
  ];
}

// 3. Qibla
export interface QiblaData {
  city: string;
  latitude: number;
  longitude: number;
  bearing_degrees: number;
  distance_km: number;
  compass_direction: string;
}

export async function fetchQibla(city = 'Abuja'): Promise<QiblaData | null> {
  return apiFetch<QiblaData>(`/api/qibla/calculate?city=${encodeURIComponent(city)}`);
}

// 4. Adhkar
export interface AdhkarItem {
  id: number;
  category: string;
  title: string;
  text_arabic: string;
  text_transliteration?: string;
  text_translation: string;
  virtue?: string;
  repeat_target: number;
}

export async function fetchAdhkar(category = 'morning'): Promise<AdhkarItem[]> {
  const data = await apiFetch<AdhkarItem[]>(`/api/adhkar/items?category=${category}`);
  return data || [];
}

// 5. Duas
export interface DuaItem {
  id: number;
  category: string;
  title: string;
  text_arabic: string;
  text_transliteration?: string;
  text_translation: string;
  reference?: string;
}

export async function fetchDuas(category = 'daily'): Promise<DuaItem[]> {
  const data = await apiFetch<DuaItem[]>(`/api/duas/items?category=${category}`);
  return data || [];
}

// 6. Hadith
export interface HadithItem {
  id: number;
  collection: string;
  hadith_number: number;
  chapter_title?: string;
  text_arabic: string;
  text_english: string;
  narrator?: string;
  grade?: string;
}

export async function fetchHadiths(collection = 'nawawi40'): Promise<HadithItem[]> {
  const data = await apiFetch<HadithItem[]>(`/api/hadith/items?collection=${collection}`);
  return data || [];
}

// 7. 99 Names of Allah
export interface AllahName {
  number: number;
  name_arabic: string;
  name_transliteration: string;
  name_english: string;
  meaning: string;
  explanation?: string;
  quran_reference?: string;
}

export async function fetchNamesOfAllah(): Promise<AllahName[]> {
  const data = await apiFetch<AllahName[]>('/api/names-of-allah/all');
  return data || [];
}

// 8. Tajweed
export interface TajweedCategory {
  id: number;
  title: string;
  title_arabic?: string;
  description?: string;
  icon?: string;
}

export interface TajweedLesson {
  id: number;
  category_id: number;
  title: string;
  summary?: string;
  content: string;
}

export async function fetchTajweedCategories(): Promise<TajweedCategory[]> {
  const data = await apiFetch<TajweedCategory[]>('/api/tajweed/categories');
  return data || [];
}

export async function fetchTajweedLessons(categoryId: number): Promise<TajweedLesson[]> {
  const data = await apiFetch<TajweedLesson[]>(`/api/tajweed/lessons?category_id=${categoryId}`);
  return data || [];
}

// 9. Tawhid
export interface TawhidCategory {
  id: number;
  title: string;
  title_arabic?: string;
  description?: string;
}

export interface TawhidLesson {
  id: number;
  category_id: number;
  title: string;
  content: string;
  evidence_quran?: string;
  evidence_hadith?: string;
}

export async function fetchTawhidCategories(): Promise<TawhidCategory[]> {
  const data = await apiFetch<TawhidCategory[]>('/api/tawhid/categories');
  return data || [];
}

export async function fetchTawhidLessons(categoryId: number): Promise<TawhidLesson[]> {
  const data = await apiFetch<TawhidLesson[]>(`/api/tawhid/lessons?category_id=${categoryId}`);
  return data || [];
}

// 10. Hijri
export interface HijriEvent {
  title: string;
  hijri_month: number;
  hijri_day: number;
  description: string;
}

export async function fetchHijriToday() {
  return apiFetch<any>('/api/hijri/today');
}

export async function fetchHijriEvents(): Promise<HijriEvent[]> {
  const data = await apiFetch<HijriEvent[]>('/api/hijri/events');
  return data || [];
}

// 11. Bookmarks
export interface BookmarkItem {
  id: number;
  item_type: string;
  item_id: string;
  title: string;
  content_snippet?: string;
}

export async function fetchBookmarks(): Promise<BookmarkItem[]> {
  const data = await apiFetch<BookmarkItem[]>('/api/bookmarks/all');
  return data || [];
}

export async function toggleBookmark(item: { item_type: string; item_id: string; title: string; content_snippet?: string }) {
  return apiFetch<any>('/api/bookmarks/toggle', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}
