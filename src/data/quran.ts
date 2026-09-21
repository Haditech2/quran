import { Surah } from '@/types';

export const sampleQuran: Surah[] = [
  {
    id: 1,
    number: 1,
    nameArabic: 'الفاتحة',
    nameEnglish: 'Al-Fatihah',
    revelationType: 'Meccan',
    ayahs: [
      {
        id: '1:1',
        number: 1,
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        translation: 'In the name of Allah, the Most Compassionate, the Most Merciful.',
      },
      {
        id: '1:2',
        number: 2,
        arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        translation: 'All praise is for Allah—Lord of all worlds.',
      },
      {
        id: '1:3',
        number: 3,
        arabic: 'الرَّحْمَٰنِ الرَّحِيمِ',
        translation: 'The Most Compassionate, the Most Merciful.',
      },
      {
        id: '1:4',
        number: 4,
        arabic: 'مَالِكِ يَوْمِ الدِّينِ',
        translation: 'Master of the Day of Judgment.',
      },
      {
        id: '1:5',
        number: 5,
        arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        translation: 'You alone we worship, and You alone we ask for help.',
      },
      {
        id: '1:6',
        number: 6,
        arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
        translation: 'Guide us along the straight path.',
      },
      {
        id: '1:7',
        number: 7,
        arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ',
        translation: 'The path of those You have blessed.',
      },
    ],
  },
  {
    id: 112,
    number: 112,
    nameArabic: 'الإخلاص',
    nameEnglish: 'Al-Ikhlas',
    revelationType: 'Meccan',
    ayahs: [
      {
        id: '112:1',
        number: 1,
        arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
        translation: 'Say, He is Allah, One.',
      },
      {
        id: '112:2',
        number: 2,
        arabic: 'اللَّهُ الصَّمَدُ',
        translation: 'Allah, the Sustainer needed by all.',
      },
      {
        id: '112:3',
        number: 3,
        arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
        translation: 'He has never had offspring, nor was He born.',
      },
      {
        id: '112:4',
        number: 4,
        arabic: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
        translation: 'And there is none comparable to Him.',
      },
    ],
  },
  {
    id: 103,
    number: 103,
    nameArabic: 'العصر',
    nameEnglish: 'Al-Asr',
    revelationType: 'Meccan',
    ayahs: [
      {
        id: '103:1',
        number: 1,
        arabic: 'وَالْعَصْرِ',
        translation: 'By the passage of time.',
      },
      {
        id: '103:2',
        number: 2,
        arabic: 'إِنَّ الْإِنسَانَ لَفِي خُسْرٍ',
        translation: 'Surely humanity is in loss.',
      },
      {
        id: '103:3',
        number: 3,
        arabic: 'إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ',
        translation: 'Except those who believe and do good.',
      },
    ],
  },
];

export function getSurahById(surahId: number): Surah | undefined {
  return sampleQuran.find((surah) => surah.id === surahId);
}

export function getAllAyahIds(): string[] {
  return sampleQuran.flatMap((surah) => surah.ayahs.map((ayah) => ayah.id));
}
