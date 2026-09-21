import * as FileSystem from 'expo-file-system/legacy';
import { fetchAyahAudioUrl, fetchChapterDetail } from '@/services/quranApi';
import { OfflineSurahManifest, Surah } from '@/types';

const DOWNLOAD_ROOT = `${FileSystem.documentDirectory ?? ''}quran-downloads`;

async function ensureDownloadRoot() {
  await FileSystem.makeDirectoryAsync(DOWNLOAD_ROOT, { intermediates: true });
}

async function writeManifest(manifest: OfflineSurahManifest): Promise<void> {
  await ensureDownloadRoot();
  const surahDir = `${DOWNLOAD_ROOT}/${manifest.surahId}`;
  await FileSystem.makeDirectoryAsync(surahDir, { intermediates: true });
  await FileSystem.writeAsStringAsync(`${surahDir}/manifest.json`, JSON.stringify(manifest, null, 2));
  await FileSystem.writeAsStringAsync(`${surahDir}/chapter.json`, JSON.stringify(manifest, null, 2));
}

export async function downloadSurahOffline(surah: Surah): Promise<OfflineSurahManifest> {
  await ensureDownloadRoot();
  const canonicalSurah = await fetchChapterDetail(surah.id);
  const surahDir = `${DOWNLOAD_ROOT}/${canonicalSurah.id}`;
  await FileSystem.makeDirectoryAsync(surahDir, { intermediates: true });

  const ayahs = [];
  for (const ayah of canonicalSurah.ayahs) {
    const remoteAudioUrl = ayah.audioUrl ?? (await fetchAyahAudioUrl(canonicalSurah.id, ayah.number));
    const localAudioUri = `${surahDir}/${String(ayah.number).padStart(3, '0')}.mp3`;
    await FileSystem.downloadAsync(remoteAudioUrl, localAudioUri);
    ayahs.push({
      ayahId: ayah.id,
      ayahNumber: ayah.number,
      remoteAudioUrl,
      localAudioUri,
    });
  }

  const manifest: OfflineSurahManifest = {
    surahId: canonicalSurah.id,
    surahNumber: canonicalSurah.number,
    surahName: canonicalSurah.nameEnglish,
    chapterFileUri: `${surahDir}/chapter.json`,
    downloadedAt: new Date().toISOString(),
    ayahs,
  };

  await writeManifest(manifest);
  await FileSystem.writeAsStringAsync(manifest.chapterFileUri, JSON.stringify(canonicalSurah, null, 2));
  return manifest;
}

export async function removeSurahDownload(surahId: number): Promise<void> {
  const surahDir = `${DOWNLOAD_ROOT}/${surahId}`;
  const info = await FileSystem.getInfoAsync(surahDir);
  if (info.exists) {
    await FileSystem.deleteAsync(surahDir, { idempotent: true });
  }
}

export async function readManifest(surahId: number): Promise<OfflineSurahManifest | null> {
  const manifestUri = `${DOWNLOAD_ROOT}/${surahId}/manifest.json`;
  const info = await FileSystem.getInfoAsync(manifestUri);
  if (!info.exists) {
    return null;
  }

  const raw = await FileSystem.readAsStringAsync(manifestUri);
  return JSON.parse(raw) as OfflineSurahManifest;
}

export async function getOfflineAudioUri(surahId: number, ayahNumber: number): Promise<string | null> {
  const manifest = await readManifest(surahId);
  if (!manifest) {
    return null;
  }

  const match = manifest.ayahs.find((ayah) => ayah.ayahNumber === ayahNumber);
  return match?.localAudioUri ?? null;
}
