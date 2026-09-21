import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ayah } from '@/types';
import { getEveryAyahAudioUrl } from '@/services/quranApi';

export type PlaybackState = {
  isPlaying: boolean;
  currentAyah: Ayah | null;
  currentIndex: number;
  durationMs: number;
  positionMs: number;
  repeatTarget: number; // 1, 2, 3, 5, 10, Infinity
  currentRepetition: number;
  delaySeconds: number;
  isLoopRange: boolean;
};

type StateListener = (state: PlaybackState) => void;

let activeSound: Audio.Sound | null = null;
let currentAyah: Ayah | null = null;
let currentPlaylist: Ayah[] = [];
let currentIndex = -1;
let currentSpeed = 1.0;
let hasTriedFallback = false;
let audioModeReady = false;

let repeatTarget = 1;
let currentRepetition = 1;
let delaySeconds = 0;
let isLoopRange = false;
let positionMs = 0;
let durationMs = 1;
let isPlaying = false;

const listeners = new Set<StateListener>();

function emitState() {
  const state: PlaybackState = {
    isPlaying,
    currentAyah,
    currentIndex,
    durationMs,
    positionMs,
    repeatTarget,
    currentRepetition,
    delaySeconds,
    isLoopRange,
  };
  listeners.forEach((fn) => fn(state));
}

export function subscribePlaybackState(listener: StateListener): () => void {
  listeners.add(listener);
  listener({
    isPlaying,
    currentAyah,
    currentIndex,
    durationMs,
    positionMs,
    repeatTarget,
    currentRepetition,
    delaySeconds,
    isLoopRange,
  });
  return () => {
    listeners.delete(listener);
  };
}

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    audioModeReady = true;
  } catch (err) {
    console.warn("Audio mode error:", err);
  }
}

function resolveAudioUri(ayah: Ayah): string {
  if (ayah.audioUrl && (ayah.audioUrl.startsWith('http://') || ayah.audioUrl.startsWith('https://') || ayah.audioUrl.startsWith('file://'))) {
    return ayah.audioUrl;
  }
  const surahNum = Number(ayah.id.split(':')[0]) || 1;
  return getEveryAyahAudioUrl(surahNum, ayah.number);
}

export async function stopAudio(): Promise<void> {
  if (activeSound) {
    try {
      await activeSound.stopAsync();
      await activeSound.unloadAsync();
    } catch (e) {
      // ignore
    } finally {
      activeSound = null;
      isPlaying = false;
      emitState();
    }
  }
}

export async function pauseAudio(): Promise<void> {
  if (activeSound) {
    try {
      await activeSound.pauseAsync();
      isPlaying = false;
      emitState();
    } catch (e) {
      console.warn("Pause error:", e);
    }
  }
}

export async function resumeAudio(): Promise<void> {
  if (activeSound) {
    try {
      await activeSound.playAsync();
      isPlaying = true;
      emitState();
    } catch (e) {
      console.warn("Resume error:", e);
    }
  } else if (currentAyah) {
    await playAyah(currentAyah, currentPlaylist);
  }
}

export async function togglePlay(): Promise<void> {
  if (isPlaying) {
    await pauseAudio();
  } else {
    await resumeAudio();
  }
}

export async function playAyah(ayah: Ayah, playlist: Ayah[] = [ayah]): Promise<void> {
  await ensureAudioMode();
  await stopAudio();

  currentAyah = ayah;
  currentPlaylist = playlist;
  currentIndex = playlist.findIndex((a) => a.id === ayah.id || a.number === ayah.number);
  if (currentIndex === -1) currentIndex = 0;
  currentRepetition = 1;
  hasTriedFallback = false;

  await loadAndPlayUri(resolveAudioUri(ayah));
}

async function loadAndPlayUri(uri: string): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, rate: currentSpeed, progressUpdateIntervalMillis: 300 },
      onPlaybackStatusUpdate
    );
    activeSound = sound;
    isPlaying = true;
    emitState();
  } catch (err) {
    console.warn("Audio load error on:", uri, err);
    if (!hasTriedFallback && currentAyah) {
      hasTriedFallback = true;
      const surahNum = Number(currentAyah.id.split(':')[0]) || 1;
      const fallbackUri = getEveryAyahAudioUrl(surahNum, currentAyah.number);
      console.log("Retrying with fallback audio:", fallbackUri);
      await loadAndPlayUri(fallbackUri);
    }
  }
}

async function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
  if (!status.isLoaded) {
    if (status.error) {
      console.warn("Playback status error:", status.error);
    }
    return;
  }

  positionMs = status.positionMillis;
  durationMs = status.durationMillis || 1;
  isPlaying = status.isPlaying;
  emitState();

  if (status.didJustFinish && !status.isLooping) {
    await handleAyahEnd();
  }
}

async function handleAyahEnd(): Promise<void> {
  // Check if verse should repeat
  if (repeatTarget === Infinity || currentRepetition < repeatTarget) {
    currentRepetition++;
    emitState();

    if (delaySeconds > 0) {
      await new Promise((r) => setTimeout(r, delaySeconds * 1000));
    }

    if (activeSound) {
      try {
        await activeSound.setPositionAsync(0);
        await activeSound.playAsync();
      } catch (err) {
        if (currentAyah) {
          await loadAndPlayUri(resolveAudioUri(currentAyah));
        }
      }
    }
    return;
  }

  // Reset repetition for next verse
  currentRepetition = 1;
  emitState();

  if (delaySeconds > 0) {
    await new Promise((r) => setTimeout(r, delaySeconds * 1000));
  }

  // Next verse in playlist
  if (currentIndex < currentPlaylist.length - 1) {
    await playIndex(currentIndex + 1);
  } else if (isLoopRange && currentPlaylist.length > 0) {
    // Loop whole surah
    await playIndex(0);
  } else {
    isPlaying = false;
    emitState();
  }
}

export async function playIndex(index: number): Promise<void> {
  if (index >= 0 && index < currentPlaylist.length) {
    currentIndex = index;
    currentAyah = currentPlaylist[index];
    currentRepetition = 1;
    hasTriedFallback = false;
    await stopAudio();
    await loadAndPlayUri(resolveAudioUri(currentAyah));
  }
}

export async function next(): Promise<void> {
  if (currentIndex < currentPlaylist.length - 1) {
    await playIndex(currentIndex + 1);
  } else if (isLoopRange && currentPlaylist.length > 0) {
    await playIndex(0);
  }
}

export async function prev(): Promise<void> {
  if (currentIndex > 0) {
    await playIndex(currentIndex - 1);
  }
}

export async function seek(pct: number): Promise<void> {
  if (activeSound && durationMs > 0) {
    const targetMs = Math.round(pct * durationMs);
    await activeSound.setPositionAsync(targetMs);
  }
}

export function cycleRepeat(): { repeatTarget: number; isLoopRange: boolean } {
  if (repeatTarget === 1 && !isLoopRange) {
    repeatTarget = 3;
    isLoopRange = false;
  } else if (repeatTarget === 3) {
    repeatTarget = 5;
    isLoopRange = false;
  } else if (repeatTarget === 5) {
    repeatTarget = 10;
    isLoopRange = false;
  } else if (repeatTarget === 10) {
    repeatTarget = Infinity;
    isLoopRange = false;
  } else if (repeatTarget === Infinity) {
    repeatTarget = 1;
    isLoopRange = true;
  } else {
    repeatTarget = 1;
    isLoopRange = false;
  }
  currentRepetition = 1;
  emitState();
  return { repeatTarget, isLoopRange };
}

export function setRepeatTarget(n: number | string): void {
  repeatTarget = n === 'Infinity' || n === Infinity ? Infinity : Number(n);
  if (repeatTarget > 1 || repeatTarget === Infinity) {
    isLoopRange = false;
  }
  currentRepetition = 1;
  emitState();
}

export function setDelay(seconds: number): void {
  delaySeconds = seconds || 0;
  emitState();
}

export function setLoopRange(bool: boolean): void {
  isLoopRange = Boolean(bool);
  if (isLoopRange) {
    repeatTarget = 1;
  }
  currentRepetition = 1;
  emitState();
}

export async function setPlaybackRate(rate: number): Promise<void> {
  currentSpeed = rate;
  if (activeSound) {
    await activeSound.setRateAsync(rate, true);
  }
  emitState();
}

export function getPlaybackState(): PlaybackState {
  return {
    isPlaying,
    currentAyah,
    currentIndex,
    durationMs,
    positionMs,
    repeatTarget,
    currentRepetition,
    delaySeconds,
    isLoopRange,
  };
}
