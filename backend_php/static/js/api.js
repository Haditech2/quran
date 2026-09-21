/**
 * API Client for Quran Hifz & Muraja'ah Application
 */
const API = (() => {
  const BASE_URL = '/api';

  function getAccessToken() {
    return localStorage.getItem('hifz_access_token');
  }

  function getRefreshToken() {
    return localStorage.getItem('hifz_refresh_token');
  }

  function setTokens(access, refresh) {
    if (access) localStorage.setItem('hifz_access_token', access);
    if (refresh) localStorage.setItem('hifz_refresh_token', refresh);
  }

  function clearTokens() {
    localStorage.removeItem('hifz_access_token');
    localStorage.removeItem('hifz_refresh_token');
    localStorage.removeItem('hifz_user');
  }

  async function request(endpoint, options = {}) {
    options.headers = options.headers || {};
    const token = getAccessToken();
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !options.headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json';
    }

    try {
      let response = await fetch(`${BASE_URL}${endpoint}`, options);

      // Handle token expiration & refresh
      if (response.status === 401 && getRefreshToken() && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
        const refreshed = await refreshToken();
        if (refreshed) {
          options.headers['Authorization'] = `Bearer ${getAccessToken()}`;
          response = await fetch(`${BASE_URL}${endpoint}`, options);
        } else {
          clearTokens();
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
      }

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'API request failed');
      }
      return resData;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }

  async function refreshToken() {
    const rf = getRefreshToken();
    if (!rf) return false;
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${rf}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok && data.data && data.data.access_token) {
        setTokens(data.data.access_token, null);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  return {
    setTokens,
    clearTokens,
    getAccessToken,
    getUser: () => {
      try {
        return JSON.parse(localStorage.getItem('hifz_user'));
      } catch (e) { return null; }
    },
    setUser: (user) => localStorage.setItem('hifz_user', JSON.stringify(user)),
    isAuthenticated: () => !!getAccessToken(),

    // Auth
    auth: {
      register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
      login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
      logout: () => {
        clearTokens();
        return request('/auth/logout', { method: 'POST' }).catch(() => {});
      },
      me: () => request('/auth/me'),
      updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) })
    },

    // Quran
    quran: {
      getSurahs: () => request('/quran/surahs'),
      getSurah: (id, includeAyahs = false) => request(`/quran/surahs/${id}?include_ayahs=${includeAyahs}`),
      getAyahs: (surahId, start = null, end = null) => {
        let q = '';
        if (start && end) q = `?start=${start}&end=${end}`;
        return request(`/quran/surahs/${surahId}/ayahs${q}`);
      },
      getJuz: () => request('/quran/juz'),
      getJuzAyahs: (juzId) => request(`/quran/juz/${juzId}/ayahs`),
      search: (query) => request(`/quran/search?q=${encodeURIComponent(query)}`)
    },

    // Memorization
    memorization: {
      start: (data) => request('/memorization/start', { method: 'POST', body: JSON.stringify(data) }),
      getCurrent: () => request('/memorization/current'),
      complete: (data) => request('/memorization/complete', { method: 'POST', body: JSON.stringify(data) }),
      getProgress: (surah = null) => request(`/memorization/progress${surah ? `?surah=${surah}` : ''}`),
      markMemorized: (ayahId, strength = 85) => request(`/memorization/ayah/${ayahId}/memorized`, { method: 'POST', body: JSON.stringify({ strength }) }),
      markDifficult: (ayahId) => request(`/memorization/ayah/${ayahId}/difficult`, { method: 'POST' })
    },

    // Revision
    revision: {
      getToday: (limit = 30) => request(`/revision/today?limit=${limit}`),
      startSession: (sessionType = 'scheduled') => request('/revision/start', { method: 'POST', body: JSON.stringify({ session_type: sessionType }) }),
      recordResult: (data) => request('/revision/result', { method: 'POST', body: JSON.stringify(data) }),
      completeSession: (data) => request('/revision/complete', { method: 'POST', body: JSON.stringify(data) }),
      getWeak: (limit = 50, threshold = 65) => request(`/revision/weak?limit=${limit}&threshold=${threshold}`),
      getRecent: () => request('/revision/recent'),
      getRandom: (count = 10) => request(`/revision/random?count=${count}`),
      getHistory: () => request('/revision/history')
    },

    // Plans
    plans: {
      create: (data) => request('/plans', { method: 'POST', body: JSON.stringify(data) }),
      list: () => request('/plans'),
      getActive: () => request('/plans/active'),
      updateStatus: (id, status) => request(`/plans/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
      delete: (id) => request(`/plans/${id}`, { method: 'DELETE' })
    },

    // Progress
    progress: {
      getDashboard: () => request('/progress/dashboard'),
      getStatistics: () => request('/progress/statistics'),
      getCalendar: (days = 35) => request(`/progress/calendar?days=${days}`),
      getStreak: () => request('/progress/streak')
    },

    // Bookmarks & Notes
    bookmarks: {
      list: (category = null) => request(`/bookmarks${category ? `?category=${category}` : ''}`),
      toggle: (data) => request('/bookmarks', { method: 'POST', body: JSON.stringify(data) }),
      delete: (id) => request(`/bookmarks/${id}`, { method: 'DELETE' })
    },

    notes: {
      list: (ayahId = null) => request(`/notes${ayahId ? `?ayah_id=${ayahId}` : ''}`),
      create: (data) => request('/notes', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => request(`/notes/${id}`, { method: 'DELETE' })
    },

    // Audio & Recordings
    audio: {
      getReciters: () => request('/audio/reciters'),
      uploadRecording: (formData) => request('/audio/upload', { method: 'POST', body: formData }),
      getRecordings: (ayahId = null) => request(`/audio/recordings${ayahId ? `?ayah_id=${ayahId}` : ''}`),
      deleteRecording: (id) => request(`/audio/recordings/${id}`, { method: 'DELETE' })
    },

    // Achievements & Admin
    achievements: {
      list: () => request('/achievements'),
      check: () => request('/achievements/check', { method: 'POST' })
    },

    admin: {
      getUsers: () => request('/admin/users'),
      getStats: () => request('/admin/stats')
    }
  };
})();
