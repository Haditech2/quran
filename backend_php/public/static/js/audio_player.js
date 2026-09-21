/**
 * Audio Player Engine for Quran Recitations
 * Uses dual-source streaming: Al-Quran CDN + EveryAyah fallback
 * Features advanced Hifz repetition controls: 1x, 3x, 5x, 10x, ∞ Loop, and customizable pause delay
 */
const AudioPlayer = (() => {
  const audio = new Audio();
  let currentAyah = null;
  let currentPlaylist = [];
  let currentIndex = -1;
  let currentSpeed = 1.0;
  let currentReciterUrl = 'https://everyayah.com/data/Alafasy_128kbps';
  let hasTriedFallback = false;

  // Repetition & Delay Settings
  let repeatTarget = 1; // 1, 2, 3, 5, 7, 10, Infinity
  let currentRepetition = 1;
  let delaySeconds = 0; // delay between verses in seconds
  let isLoopRange = false;

  // Format verse key to EveryAyah filename, e.g. "1:1" -> "001001.mp3", "112:4" -> "112004.mp3"
  function getEveryAyahAudioUrl(surahNumber, ayahNumber) {
    const sStr = String(surahNumber).padStart(3, '0');
    const aStr = String(ayahNumber).padStart(3, '0');
    return `${currentReciterUrl}/${sStr}${aStr}.mp3`;
  }

  function resolveBestAudioUrl(ayah) {
    if (ayah && ayah.audio_url && ayah.audio_url.startsWith('http')) {
      return ayah.audio_url;
    }
    return getEveryAyahAudioUrl(ayah.surah_number, ayah.ayah_number);
  }

  function updatePlayerUI(ayah) {
    if (!ayah) return;
    const titleEl = document.getElementById('audio-current-title');
    const subEl = document.getElementById('audio-current-sub');
    if (titleEl) {
      titleEl.innerText = `${ayah.surah_name_english || 'Surah ' + ayah.surah_number} : Ayah ${ayah.ayah_number}`;
    }
    if (subEl) {
      subEl.innerText = ayah.text_translation ? (ayah.text_translation.substring(0, 55) + '...') : `Verse ${ayah.verse_key}`;
    }
    updateRepeatStatusUI();
  }

  function updateRepeatStatusUI() {
    const badge = document.getElementById('repeat-badge');
    const repeatBtn = document.getElementById('audio-repeat-btn');
    const readerLbl = document.getElementById('reader-repeat-lbl');
    if (!badge) return;

    if (repeatTarget === 1 && !isLoopRange) {
      badge.innerText = '1x';
      badge.style.background = 'var(--border)';
      badge.style.color = 'var(--text-muted)';
      if (repeatBtn) repeatBtn.style.color = '';
      if (readerLbl) readerLbl.innerText = 'Repeat';
    } else if (repeatTarget === Infinity) {
      badge.innerText = '∞ Ayah';
      badge.style.background = 'var(--gold)';
      badge.style.color = '#fff';
      if (repeatBtn) repeatBtn.style.color = 'var(--gold)';
      if (readerLbl) readerLbl.innerText = '∞ Ayah';
    } else if (repeatTarget > 1) {
      badge.innerText = (currentRepetition > 1) ? `${repeatTarget}x (${currentRepetition}/${repeatTarget})` : `${repeatTarget}x`;
      badge.style.background = 'var(--primary)';
      badge.style.color = '#fff';
      if (repeatBtn) repeatBtn.style.color = 'var(--primary)';
      if (readerLbl) readerLbl.innerText = `${repeatTarget}x`;
    } else if (isLoopRange) {
      badge.innerText = '∞ Surah';
      badge.style.background = 'var(--primary)';
      badge.style.color = '#fff';
      if (repeatBtn) repeatBtn.style.color = 'var(--primary)';
      if (readerLbl) readerLbl.innerText = '∞ Surah';
    }
  }

  function init() {
    audio.playbackRate = currentSpeed;

    audio.addEventListener('timeupdate', () => {
      const cur = audio.currentTime;
      const dur = audio.duration || 1;
      const pct = (cur / dur) * 100;
      window.dispatchEvent(new CustomEvent('audio:timeupdate', {
        detail: { currentTime: cur, duration: dur, percentage: pct }
      }));
    });

    audio.addEventListener('play', () => {
      window.dispatchEvent(new CustomEvent('audio:statechange', { detail: { isPlaying: true, ayah: currentAyah } }));
    });

    audio.addEventListener('pause', () => {
      window.dispatchEvent(new CustomEvent('audio:statechange', { detail: { isPlaying: false, ayah: currentAyah } }));
    });

    audio.addEventListener('ended', () => {
      handleAyahEnd();
    });

    audio.addEventListener('error', (e) => {
      console.warn("Audio playback issue on:", audio.src);
      // Automatic fallback between Al-Quran CDN and EveryAyah
      if (!hasTriedFallback && currentAyah) {
        hasTriedFallback = true;
        let altUrl = '';
        if (audio.src.includes('islamic.network')) {
          altUrl = getEveryAyahAudioUrl(currentAyah.surah_number, currentAyah.ayah_number);
        } else {
          altUrl = currentAyah.audio_url || `https://everyayah.com/data/Alafasy_128kbps/${String(currentAyah.surah_number).padStart(3,'0')}${String(currentAyah.ayah_number).padStart(3,'0')}.mp3`;
        }
        console.log("Switching to secondary recitation stream:", altUrl);
        audio.src = altUrl;
        audio.play().catch(err => console.warn("Fallback play error:", err));
        return;
      }

      window.dispatchEvent(new CustomEvent('audio:error', { detail: { message: "Could not load recitation audio" } }));
    });
  }

  function handleAyahEnd() {
    // Check if current Ayah should repeat
    if (repeatTarget === Infinity || currentRepetition < repeatTarget) {
      currentRepetition++;
      updateRepeatStatusUI();
      setTimeout(() => {
        try {
          audio.currentTime = 0;
          const p = audio.play();
          if (p && p.catch) {
            p.catch(err => {
              console.warn("Replay failed, refreshing audio URL:", err);
              if (currentAyah) {
                audio.src = resolveBestAudioUrl(currentAyah);
                audio.playbackRate = currentSpeed;
                audio.play().catch(e => console.warn("Retry play error:", e));
              }
            });
          }
        } catch (e) {
          if (currentAyah) {
            audio.src = resolveBestAudioUrl(currentAyah);
            audio.playbackRate = currentSpeed;
            audio.play().catch(err => console.warn("Catch play error:", err));
          }
        }
      }, delaySeconds * 1000);
      return;
    }

    // Finished target repeats for this verse, reset counter
    currentRepetition = 1;
    updateRepeatStatusUI();

    // Advance to next verse
    if (currentIndex < currentPlaylist.length - 1) {
      setTimeout(() => {
        playIndex(currentIndex + 1);
      }, delaySeconds * 1000);
    } else if (isLoopRange && currentPlaylist.length > 0) {
      // Loop entire playlist from verse 1
      setTimeout(() => {
        playIndex(0);
      }, delaySeconds * 1000);
    } else {
      window.dispatchEvent(new CustomEvent('audio:statechange', { detail: { isPlaying: false, ayah: null } }));
    }
  }

  function playAyah(ayah, playlist = [ayah]) {
    currentAyah = ayah;
    currentPlaylist = playlist;
    hasTriedFallback = false;
    currentRepetition = 1;
    currentIndex = playlist.findIndex(a => (a.id && a.id === ayah.id) || (a.verse_key === ayah.verse_key));
    if (currentIndex === -1) currentIndex = 0;

    const url = resolveBestAudioUrl(ayah);
    updatePlayerUI(ayah);
    audio.src = url;
    audio.playbackRate = currentSpeed;
    audio.play().catch(err => {
      console.log("Browser playback interaction required:", err);
    });
  }

  function playIndex(idx) {
    if (idx >= 0 && idx < currentPlaylist.length) {
      currentIndex = idx;
      currentAyah = currentPlaylist[idx];
      hasTriedFallback = false;
      currentRepetition = 1;
      const url = resolveBestAudioUrl(currentAyah);
      updatePlayerUI(currentAyah);
      audio.src = url;
      audio.playbackRate = currentSpeed;
      audio.play().catch(err => console.log("Play index err:", err));
    }
  }

  function togglePlay() {
    if (audio.paused) {
      if (audio.src && currentAyah) {
        audio.play().catch(e => console.warn("Audio play err:", e));
      } else if (currentPlaylist.length > 0) {
        playIndex(0);
      } else {
        // Default to first ayah of Al-Fatihah
        const defaultAyah = {
          id: 1,
          surah_number: 1,
          ayah_number: 1,
          verse_key: "1:1",
          surah_name_english: "Al-Fatihah",
          text_translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
          audio_url: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3"
        };
        playAyah(defaultAyah, [defaultAyah]);
      }
    } else {
      audio.pause();
    }
  }

  function next() {
    currentRepetition = 1;
    if (currentIndex < currentPlaylist.length - 1) {
      playIndex(currentIndex + 1);
    } else if (isLoopRange && currentPlaylist.length > 0) {
      playIndex(0);
    }
  }

  function prev() {
    currentRepetition = 1;
    if (currentIndex > 0) {
      playIndex(currentIndex - 1);
    }
  }

  function setSpeed(spd) {
    currentSpeed = spd;
    audio.playbackRate = spd;
  }

  function seek(seconds) {
    if (audio.duration) {
      audio.currentTime = seconds;
    }
  }

  // Quick Cycle: 1x -> 3x -> 5x -> 10x -> ∞ Loop Ayah -> ∞ Loop Surah -> 1x
  function cycleRepeat() {
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
    updateRepeatStatusUI();
    return { repeatTarget, isLoopRange };
  }

  function setRepeatTarget(n) {
    repeatTarget = n === 'Infinity' || n === Infinity ? Infinity : parseInt(n);
    if (repeatTarget > 1 || repeatTarget === Infinity) {
      isLoopRange = false;
    }
    currentRepetition = 1;
    updateRepeatStatusUI();
  }

  function setDelay(seconds) {
    delaySeconds = parseFloat(seconds) || 0;
  }

  function setLoopRange(bool) {
    isLoopRange = Boolean(bool);
    if (isLoopRange) {
      repeatTarget = 1;
    }
    currentRepetition = 1;
    updateRepeatStatusUI();
  }

  function setReciter(base_url) {
    currentReciterUrl = base_url;
    if (currentAyah) {
      const curTime = audio.currentTime;
      const isP = !audio.paused;
      audio.src = getEveryAyahAudioUrl(currentAyah.surah_number, currentAyah.ayah_number);
      audio.currentTime = curTime;
      if (isP) audio.play();
    }
  }

  return {
    init,
    playAyah,
    playIndex,
    togglePlay,
    next,
    prev,
    setSpeed,
    seek,
    cycleRepeat,
    setRepeatTarget,
    setDelay,
    setLoopRange,
    setReciter,
    isPlaying: () => !audio.paused,
    getCurrentAyah: () => currentAyah,
    getRepeatTarget: () => repeatTarget,
    getDelay: () => delaySeconds,
    isLoopRangeActive: () => isLoopRange
  };
})();
