// Force HTTPS on production live domains
if (location.protocol === 'http:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  location.href = location.href.replace('http:', 'https:');
}

// Global State
const State = {
  currentUser: null,
  currentView: 'home',
  surahs: [],
  activeSurah: null,
  activeAyahs: [],
  activePlan: null,
  currentRevisionQueue: [],
  revisionIndex: 0,
  currentRevisionSessionId: null,
  activePracticeMode: 'read',
  activePracticeAyahIndex: 0,
  reciters: [],
  bookmarks: [],
  notes: []
};

// Application Initialization
document.addEventListener('DOMContentLoaded', async () => {
  AudioPlayer.init();
  setupAudioListeners();
  setupNavListeners();
  setupTheme();

  // Check auth
  if (API.isAuthenticated()) {
    try {
      const res = await API.auth.me();
      State.currentUser = res.data;
      API.setUser(res.data);
      updateUserUI();
    } catch (e) {
      console.warn("Auth token invalid, prompting login");
      API.clearTokens();
    }
  }

  // Load initial catalog data
  await loadSurahs();
  await loadReciters();

  // Navigate to initial view
  const hash = window.location.hash.replace('#', '') || 'home';
  navigateTo(hash);
});

// Setup Audio Event Listeners
function setupAudioListeners() {
  window.addEventListener('audio:statechange', (e) => {
    const playBtn = document.getElementById('audio-play-pause-icon');
    if (playBtn) {
      playBtn.className = e.detail.isPlaying ? 'ri-pause-fill' : 'ri-play-fill';
    }
    const currentAyah = e.detail.ayah;
    if (currentAyah) {
      const titleEl = document.getElementById('audio-current-title');
      const reciterEl = document.getElementById('audio-current-sub');
      if (titleEl) titleEl.innerText = `Surah ${currentAyah.surah_name_english || currentAyah.surah_number} : ${currentAyah.ayah_number}`;
      if (reciterEl) reciterEl.innerText = `Verse ${currentAyah.verse_key}`;

      // Highlight ayah card if visible
      document.querySelectorAll('.ayah-card').forEach(c => c.classList.remove('playing'));
      const activeCard = document.getElementById(`ayah-card-${currentAyah.id}`);
      if (activeCard) activeCard.classList.add('playing');
    }
  });

  window.addEventListener('audio:timeupdate', (e) => {
    const slider = document.getElementById('audio-slider');
    const curTimeEl = document.getElementById('audio-cur-time');
    const durTimeEl = document.getElementById('audio-dur-time');
    if (slider) slider.value = e.detail.percentage || 0;
    if (curTimeEl) curTimeEl.innerText = formatDuration(e.detail.currentTime);
    if (durTimeEl && e.detail.duration) durTimeEl.innerText = formatDuration(e.detail.duration);
  });

  const repeatBtn = document.getElementById('audio-repeat-btn');
  if (repeatBtn) {
    repeatBtn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      quickCycleRepeatAction();
    });
  }

  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }
}

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Navigation Handler
function setupNavListeners() {
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'home';
    navigateTo(hash);
  });

  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-nav');
      window.location.hash = target;
    });
  });
}

function navigateTo(viewName) {
  State.currentView = viewName;
  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-nav') === viewName);
  });

  const headingEl = document.getElementById('page-heading');
  if (headingEl) {
    const titles = {
      'home': 'Dashboard',
      'quran': "The Holy Qur'an",
      'memorize': 'Hifz & Memorization Studio',
      'revision': "Muraja'ah Revision Engine",
      'tajweed': 'Tajweed Rules & Lessons',
      'tafsir': 'Tafsir Exegesis',
      'tawhid': "Tawhid & 'Aqeedah",
      'hadith': 'Hadith Library',
      'duas': 'Duas & Supplications',
      'names-of-allah': '99 Names of Allah',
      'prayer-times': 'Prayer Times & Adhan',
      'qibla': 'Qibla Direction Finder',
      'adhkar': 'Daily Adhkar & Remembrance',
      'tasbih': 'Digital Tasbih Counter',
      'hijri': 'Hijri Calendar & Events',
      'bookmarks': 'Unified Bookmarks',
      'progress-analytics': 'Learning & Worship Analytics',
      'profile': 'Profile & Preferences',
      'weak-verses': 'Weak Verses Review'
    };
    headingEl.innerHTML = `<span>${titles[viewName] || 'Quran Platform'}</span>`;
  }

  const mainViewContainer = document.getElementById('main-view-container');
  if (!mainViewContainer) return;

  window.scrollTo({ top: 0, behavior: 'smooth' });

  switch (viewName) {
    case 'home':
      renderHome(mainViewContainer);
      break;
    case 'quran':
      renderQuran(mainViewContainer);
      break;
    case 'memorize':
      renderMemorize(mainViewContainer);
      break;
    case 'revision':
      renderRevision(mainViewContainer);
      break;
    case 'profile':
      renderProfile(mainViewContainer);
      break;
    case 'weak-verses':
      renderWeakVerses(mainViewContainer);
      break;
    case 'progress-analytics':
      renderProgressAnalytics(mainViewContainer);
      break;
    case 'tajweed':
      renderTajweed(mainViewContainer);
      break;
    case 'tafsir':
      renderTafsir(mainViewContainer);
      break;
    case 'tawhid':
      renderTawhid(mainViewContainer);
      break;
    case 'hadith':
      renderHadith(mainViewContainer);
      break;
    case 'duas':
      renderDuas(mainViewContainer);
      break;
    case 'names-of-allah':
      renderNamesOfAllah(mainViewContainer);
      break;
    case 'prayer-times':
      renderPrayerTimes(mainViewContainer);
      break;
    case 'qibla':
      renderQibla(mainViewContainer);
      break;
    case 'adhkar':
      renderAdhkar(mainViewContainer);
      break;
    case 'tasbih':
      renderTasbih(mainViewContainer);
      break;
    case 'hijri':
      renderHijri(mainViewContainer);
      break;
    case 'bookmarks':
      renderBookmarks(mainViewContainer);
      break;
    default:
      renderHome(mainViewContainer);
  }
}

// Theme handling
function setupTheme() {
  const saved = localStorage.getItem('hifz_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.innerHTML = saved === 'dark' ? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';
    themeBtn.onclick = () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('hifz_theme', next);
      themeBtn.innerHTML = next === 'dark' ? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';
    };
  }
}

// User UI update
function updateUserUI() {
  const userNameEl = document.getElementById('sidebar-user-name');
  const userStreakEl = document.getElementById('sidebar-user-streak');
  const userAvatarEl = document.getElementById('sidebar-user-avatar');

  if (State.currentUser) {
    if (userNameEl) userNameEl.innerText = State.currentUser.name || State.currentUser.username;
    if (userAvatarEl) userAvatarEl.innerText = (State.currentUser.name || State.currentUser.username)[0].toUpperCase();
    if (userStreakEl) userStreakEl.innerText = 'Online Student';
  } else {
    if (userNameEl) userNameEl.innerText = 'Guest Student';
    if (userStreakEl) userStreakEl.innerText = 'Tap to Sign In';
  }
}

// Data loaders
async function loadSurahs() {
  try {
    const res = await API.quran.getSurahs();
    State.surahs = res.data || [];
  } catch (e) {
    console.error("Failed to load surahs:", e);
  }
}

async function loadReciters() {
  try {
    const res = await API.audio.getReciters();
    State.reciters = res.data || [];
    const reciterSelect = document.getElementById('reciter-select');
    if (reciterSelect && State.reciters.length > 0) {
      reciterSelect.innerHTML = State.reciters.map(r => `
        <option value="${r.audio_base_url}">${r.name}</option>
      `).join('');
      reciterSelect.onchange = (e) => AudioPlayer.setReciter(e.target.value);
    }
  } catch (e) {
    console.error("Failed to load reciters:", e);
  }
}

/* ==========================================================================
   VIEW: HOME DASHBOARD (Section 4)
   ========================================================================== */
async function renderHome(container) {
  container.innerHTML = `
    <div class="card p-5 text-center" style="margin-bottom:20px;">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-2 text-muted">Loading your Islamic Learning & Hifz Dashboard...</p>
    </div>
  `;

  try {
    let dash = {};
    let overview = {};

    try {
      const oRes = await API.overview.getDashboard();
      overview = oRes.data || {};
    } catch (e) {
      console.warn("Overview fetch:", e);
    }

    if (API.isAuthenticated()) {
      try {
        const res = await API.progress.getDashboard();
        dash = res.data || {};
      } catch (e) {
        console.warn("Progress fetch:", e);
      }
    }

    const plan = dash.active_plan;
    const user = State.currentUser;
    const streak = dash.current_streak || 0;
    const revCount = dash.today_revision_target || 0;
    const overallPct = dash.overall_percentage || 0;
    const weakCount = dash.weak_verses_count || 0;

    let planTargetText = 'Al-Fatihah 1–7';
    let planProgressPct = 80;
    if (plan) {
      planTargetText = `Surah ${dash.current_surah} (Ayahs 1–${plan.ayahs_per_day})`;
      planProgressPct = plan.completion_percentage || 0;
    }

    const nextP = overview.next_prayer || { name: 'Dhuhr', time: '12:26', minutes_remaining: 45 };
    const hijri = overview.hijri || { formatted: '9 Rabi\' al-Awwal 1448 AH' };

    container.innerHTML = `
      <!-- Prayer & Hijri Quick Bar -->
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); padding:12px 18px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; box-shadow:var(--shadow-sm);">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="background:var(--primary-subtle); color:var(--primary); width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.15rem;">
            <i class="ri-time-line"></i>
          </div>
          <div>
            <div style="font-size:0.72rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); letter-spacing:0.5px;">Next Prayer: ${nextP.name}</div>
            <div style="font-size:1.05rem; font-weight:800; color:var(--primary);">
              ${nextP.time} <span style="font-size:0.8rem; font-weight:600; color:var(--gold-dark); margin-left:4px;">(${formatPrayerCountdown(nextP.minutes_remaining)})</span>
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:12px;">
          <div style="text-align:right;">
            <div style="font-size:0.72rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); letter-spacing:0.5px;">Hijri Date</div>
            <div style="font-size:0.9rem; font-weight:700; color:var(--text-main);">${hijri.formatted || '9 Rabi\' al-Awwal 1448 AH'}</div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="navigateTo('prayer-times')">
            <i class="ri-notification-3-line"></i> Prayer Times
          </button>
          <button class="btn btn-outline btn-sm" onclick="navigateTo('qibla')">
            <i class="ri-compass-3-line"></i> Qibla
          </button>
        </div>
      </div>

      <!-- Hero Greeting Card -->
      <div class="hero-card" style="margin-bottom: 20px;">
        <div>
          <div class="hero-greeting">Assalamu Alaikum${user ? ', ' + (user.name || user.username) : ''}</div>
          <div class="hero-sub">Daily Quran Memorization & Islamic Worship Platform</div>
          <div class="hero-stats-row">
            <div class="hero-stat-box">
              <div class="hero-stat-val">${streak}d</div>
              <div class="hero-stat-lbl">Active Streak 🔥</div>
            </div>
            <div class="hero-stat-box">
              <div class="hero-stat-val">${dash.memorized_ayahs || 0} / 6,236</div>
              <div class="hero-stat-lbl">Ayahs Memorized</div>
            </div>
            <div class="hero-stat-box">
              <div class="hero-stat-val">${overallPct}%</div>
              <div class="hero-stat-lbl">Quran Progress</div>
            </div>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; z-index:2;">
          <button class="btn btn-gold" onclick="startActiveHifzSession()">
            <i class="ri-play-circle-fill"></i> Continue Hifz
          </button>
          <button class="btn btn-outline" style="color:#fff; border-color:rgba(255,255,255,0.4);" onclick="startMurajaahSession()">
            <i class="ri-loop-right-line"></i> Revision (${revCount})
          </button>
        </div>
      </div>

      <!-- Islamic Learning Modules Hub -->
      <div style="margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <h3 style="font-size:1.05rem; font-weight:800; color:var(--primary); display:flex; align-items:center; gap:6px;">
            <i class="ri-sparkles-fill text-gold"></i> Islamic Learning Hub
          </h3>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:10px;">
          <div class="card p-3" style="cursor:pointer; transition:transform 0.15s;" onclick="navigateTo('tajweed')">
            <div style="font-size:1.4rem; color:var(--gold-dark); margin-bottom:4px;"><i class="ri-music-2-line"></i></div>
            <div style="font-weight:700; font-size:0.9rem; color:var(--text-main);">Tajweed</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Rules & Quizzes</div>
          </div>
          <div class="card p-3" style="cursor:pointer; transition:transform 0.15s;" onclick="navigateTo('tafsir')">
            <div style="font-size:1.4rem; color:var(--primary); margin-bottom:4px;"><i class="ri-article-line"></i></div>
            <div style="font-weight:700; font-size:0.9rem; color:var(--text-main);">Tafsir</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Ibn Kathir Exegesis</div>
          </div>
          <div class="card p-3" style="cursor:pointer; transition:transform 0.15s;" onclick="navigateTo('tawhid')">
            <div style="font-size:1.4rem; color:var(--primary); margin-bottom:4px;"><i class="ri-shield-check-line"></i></div>
            <div style="font-weight:700; font-size:0.9rem; color:var(--text-main);">Tawhid & 'Aqeedah</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Sunni Creed</div>
          </div>
          <div class="card p-3" style="cursor:pointer; transition:transform 0.15s;" onclick="navigateTo('hadith')">
            <div style="font-size:1.4rem; color:var(--gold-dark); margin-bottom:4px;"><i class="ri-double-quotes-l"></i></div>
            <div style="font-weight:700; font-size:0.9rem; color:var(--text-main);">Hadith</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">40 Nawawi & Bukhari</div>
          </div>
          <div class="card p-3" style="cursor:pointer; transition:transform 0.15s;" onclick="navigateTo('duas')">
            <div style="font-size:1.4rem; color:var(--danger); margin-bottom:4px;"><i class="ri-hand-heart-line"></i></div>
            <div style="font-weight:700; font-size:0.9rem; color:var(--text-main);">Duas</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Hisn al-Muslim</div>
          </div>
          <div class="card p-3" style="cursor:pointer; transition:transform 0.15s;" onclick="navigateTo('adhkar')">
            <div style="font-size:1.4rem; color:var(--primary); margin-bottom:4px;"><i class="ri-sun-line"></i></div>
            <div style="font-weight:700; font-size:0.9rem; color:var(--text-main);">Daily Adhkar</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Morning & Evening</div>
          </div>
          <div class="card p-3" style="cursor:pointer; transition:transform 0.15s;" onclick="navigateTo('tasbih')">
            <div style="font-size:1.4rem; color:var(--gold); margin-bottom:4px;"><i class="ri-fingerprint-line"></i></div>
            <div style="font-weight:700; font-size:0.9rem; color:var(--text-main);">Digital Tasbih</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Tap Counter</div>
          </div>
          <div class="card p-3" style="cursor:pointer; transition:transform 0.15s;" onclick="navigateTo('names-of-allah')">
            <div style="font-size:1.4rem; color:var(--primary); margin-bottom:4px;"><i class="ri-star-smile-line"></i></div>
            <div style="font-weight:700; font-size:0.9rem; color:var(--text-main);">99 Names</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Asma'ul Husna</div>
          </div>
        </div>
      </div>

      <!-- Main Dashboard Grid (Hifz & Revision) -->
      <div class="dashboard-grid">
        <!-- Today's Hifz Target -->
        <div class="col-7">
          <div class="card card-primary-edge">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <h3 style="font-size:1.1rem; font-weight:700; color:var(--primary);">
                <i class="ri-book-open-line-half"></i> Today's Hifz Target
              </h3>
              <span class="badge" style="background:var(--primary-subtle); color:var(--primary); padding:4px 10px; border-radius:12px; font-weight:700;">
                ${plan ? plan.title : 'General Goal'}
              </span>
            </div>
            <p style="font-size:1.2rem; font-weight:700; margin-bottom:4px; color:var(--text-main);">
              ${planTargetText}
            </p>
            <p class="text-muted" style="font-size:0.85rem;">Juz ${dash.current_juz || 1} • Goal: ${plan ? plan.ayahs_per_day : 5} Ayahs per day</p>
            
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${planProgressPct}%;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-muted); margin-bottom:18px;">
              <span>Progress</span>
              <span><strong>${planProgressPct}%</strong></span>
            </div>

            <div style="display:flex; gap:10px;">
              <button class="btn btn-primary" style="flex:1;" onclick="startActiveHifzSession()">
                Memorize Now
              </button>
              <button class="btn btn-outline" onclick="window.location.hash='quran'">
                Browse Surah
              </button>
            </div>
          </div>
        </div>

        <!-- Today's Revision & Weak Verses Alert -->
        <div class="col-5">
          <div class="card card-gold-edge" style="height:100%; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <h3 style="font-size:1.1rem; font-weight:700; color:var(--gold);">
                  <i class="ri-history-line"></i> Today's Muraja'ah
                </h3>
                <span style="font-size:1.4rem; font-weight:800; color:var(--gold);">${revCount} Due</span>
              </div>
              <p class="text-muted" style="font-size:0.9rem; line-height:1.5;">
                Verses scheduled by the Spaced Repetition engine to solidify your long-term memory.
              </p>

              ${weakCount > 0 ? `
                <div style="background:#fee2e2; border:1px solid #fca5a5; border-radius:var(--radius-sm); padding:10px 14px; margin-top:14px; display:flex; align-items:center; justify-content:space-between;">
                  <div style="display:flex; align-items:center; gap:8px; color:#991b1b; font-weight:600; font-size:0.85rem;">
                    <i class="ri-alert-line-fill"></i> ${weakCount} Weak Verses Found
                  </div>
                  <button class="btn btn-sm btn-outline" style="border-color:#b91c1c; color:#b91c1c;" onclick="window.location.hash='weak-verses'">Review</button>
                </div>
              ` : `
                <div style="background:var(--primary-subtle); border-radius:var(--radius-sm); padding:10px 14px; margin-top:14px; color:var(--primary); font-size:0.85rem; font-weight:600;">
                  <i class="ri-checkbox-circle-line-fill"></i> All reviewed verses are in solid shape!
                </div>
              `}
            </div>

            <div style="margin-top:20px;">
              <button class="btn btn-gold" style="width:100%;" onclick="startMurajaahSession()">
                Start Daily Revision Session
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Home render error:", err);
    container.innerHTML = `
      <div class="card p-4 text-center">
        <p class="text-danger">Failed to load dashboard data: ${escapeHtml(err.message)}</p>
        <button class="btn btn-primary mt-2" onclick="openAuthModal()">Sign In</button>
      </div>
    `;
  }
}

function renderGuestHome(container) {
  renderHome(container);
}

/* ==========================================================================
   VIEW: QUR'AN BROWSING (Section 5)
   ========================================================================== */
async function renderQuran(container) {
  container.innerHTML = `
    <div class="quran-header">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary);">
          <i class="ri-book-open-line"></i> The Holy Qur'an
        </h2>
        <div class="quran-filters">
          <div class="search-input-wrap">
            <i class="ri-search-2-line search-icon"></i>
            <input type="text" id="quran-search-box" class="search-input" placeholder="Search Surah, Arabic text, or translation...">
          </div>
        </div>
      </div>
      <div id="quran-view-tabs" style="display:flex; gap:10px; border-bottom:1px solid var(--border); padding-bottom:8px;">
        <button class="btn btn-sm btn-primary" id="tab-surahs-btn" onclick="showSurahGrid()">Surahs (114)</button>
        <button class="btn btn-sm btn-outline" id="tab-juz-btn" onclick="showJuzList()">Juz (30)</button>
      </div>
    </div>

    <div id="quran-content-display">
      <div class="surah-grid" id="surah-cards-container"></div>
    </div>
  `;

  // Populate surah cards
  renderSurahGridCards(State.surahs);

  // Setup search input
  const searchInput = document.getElementById('quran-search-box');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => handleQuranSearch(e.target.value), 350);
    });
  }
}

function renderSurahGridCards(surahsList) {
  const container = document.getElementById('surah-cards-container');
  if (!container) return;

  if (surahsList.length === 0) {
    container.innerHTML = `<p class="text-muted p-4">No Surahs found matching your criteria.</p>`;
    return;
  }

  container.innerHTML = surahsList.map(s => `
    <div class="surah-card" onclick="openSurahReader(${s.number})">
      <div class="surah-card-left">
        <div class="surah-number-badge">${s.number}</div>
        <div>
          <div class="surah-title-en">${s.name_english}</div>
          <div class="surah-meta-en">${s.name_translation || ''} • ${s.total_ayahs} Verses</div>
        </div>
      </div>
      <div class="surah-title-ar">${s.name_arabic}</div>
    </div>
  `).join('');
}

async function handleQuranSearch(query) {
  const displayContainer = document.getElementById('quran-content-display');
  if (!query || !query.trim()) {
    displayContainer.innerHTML = `<div class="surah-grid" id="surah-cards-container"></div>`;
    renderSurahGridCards(State.surahs);
    return;
  }

  displayContainer.innerHTML = `<div class="p-4 text-center"><div class="spinner-border text-success"></div><p class="mt-2 text-muted">Searching the Qur'an...</p></div>`;

  try {
    const res = await API.quran.search(query);
    const matches = res.data || [];
    if (matches.length === 0) {
      displayContainer.innerHTML = `<div class="card p-4 text-center"><p class="text-muted">No verses found matching "<strong>${escapeHtml(query)}</strong>"</p></div>`;
      return;
    }

    displayContainer.innerHTML = `
      <div class="ayah-list">
        <div class="text-muted mb-2 font-weight-bold">Found ${matches.length} matching verses:</div>
        ${matches.map(a => renderAyahCardHtml(a)).join('')}
      </div>
    `;
  } catch (e) {
    displayContainer.innerHTML = `<div class="card p-4 text-danger">Search error: ${e.message}</div>`;
  }
}

async function openSurahReader(surahNumber) {
  const container = document.getElementById('quran-content-display');
  container.innerHTML = `<div class="p-5 text-center"><div class="spinner-border text-success"></div><p class="mt-2 text-muted">Loading Surah Ayahs live from Quran API...</p></div>`;

  try {
    let surah = null;
    let ayahs = [];

    // 1. Try fetching from backend (which fetches live from Al-Quran Cloud API)
    try {
      const res = await API.quran.getSurah(surahNumber, true);
      surah = res.data;
      ayahs = surah?.ayahs || [];
    } catch (err) {
      console.warn("Backend getSurah error, falling back to direct Quran API:", err);
    }

    // 2. Direct browser fallback if backend has no ayahs
    if (!ayahs || ayahs.length === 0) {
      console.log(`Fetching Surah ${surahNumber} live directly from Al-Quran Cloud API...`);
      const apiRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,ar.alafasy`);
      const apiJson = await apiRes.json();
      if (apiJson && apiJson.data && apiJson.data.length >= 2) {
        const arData = apiJson.data[0];
        const enData = apiJson.data[1];
        const auData = apiJson.data[2] || { ayahs: [] };

        ayahs = arData.ayahs.map((a, idx) => ({
          id: a.number,
          surah_id: surahNumber,
          surah_number: surahNumber,
          ayah_number: a.numberInSurah,
          verse_key: `${surahNumber}:${a.numberInSurah}`,
          text_arabic: a.text,
          text_translation: enData.ayahs[idx]?.text || '',
          juz_number: a.juz || 1,
          page_number: a.page || 1,
          audio_url: auData.ayahs[idx]?.audio || `https://everyayah.com/data/Alafasy_128kbps/${String(surahNumber).padStart(3, '0')}${String(a.numberInSurah).padStart(3, '0')}.mp3`,
          surah_name_english: arData.englishName,
          surah_name_arabic: arData.name
        }));

        surah = {
          number: surahNumber,
          name_arabic: arData.name,
          name_english: arData.englishName,
          total_ayahs: ayahs.length,
          revelation_type: arData.revelationType,
          ayahs: ayahs
        };
      }
    }

    if (!surah || !ayahs || ayahs.length === 0) {
      throw new Error("Unable to retrieve Surah verses from API.");
    }

    State.activeSurah = surah;
    State.activeAyahs = ayahs;

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
        <button class="btn btn-outline btn-sm" onclick="renderQuran(document.getElementById('main-view-container'))">
          <i class="ri-arrow-left-line"></i> Back to Surahs
        </button>
        <div style="text-align:center;">
          <h2 style="font-size:1.6rem; font-family:var(--font-arabic); color:var(--primary);">${surah.name_arabic}</h2>
          <div style="font-size:0.9rem; color:var(--text-muted); font-weight:600;">Surah ${surah.name_english} (${ayahs.length} Ayahs • ${surah.revelation_type || ''})</div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="playCurrentSurahAudio()">
            <i class="ri-play-fill"></i> Play All
          </button>
          <button class="btn btn-outline btn-sm" onclick="openRepeatModal()" title="Recitation Repeat Settings">
            <i class="ri-repeat-2-line"></i> <span id="reader-repeat-lbl">Repeat</span>
          </button>
          <button class="btn btn-gold btn-sm" onclick="startMemorizeForSurah(${surah.number})">
            <i class="ri-lightbulb-fill"></i> Memorize
          </button>
        </div>
      </div>

      <!-- Ayahs Stream -->
      <div class="ayah-list" id="ayahs-stream-container">
        ${ayahs.map(a => renderAyahCardHtml(a)).join('')}
      </div>
    `;
  } catch (e) {
    container.innerHTML = `
      <div class="card p-4 text-center">
        <p class="text-danger font-weight-bold"><i class="ri-alert-line"></i> Failed to load Surah: ${e.message}</p>
        <button class="btn btn-sm btn-primary mt-2" onclick="openSurahReader(${surahNumber})">
          <i class="ri-refresh-line"></i> Retry
        </button>
      </div>
    `;
  }
}

function renderAyahCardHtml(ayah) {
  const cardId = ayah.id ? `ayah-card-${ayah.id}` : `ayah-card-${ayah.verse_key.replace(':', '-')}`;
  const sNum = ayah.surah_number || (ayah.verse_key ? parseInt(ayah.verse_key.split(':')[0]) : 1);
  const aNum = ayah.ayah_number || (ayah.verse_key ? parseInt(ayah.verse_key.split(':')[1]) : 1);
  const arabicSafe = (ayah.text_arabic || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  return `
    <div class="ayah-card" id="${cardId}" data-verse="${ayah.verse_key}">
      <div class="ayah-header">
        <span class="verse-badge">${ayah.verse_key}</span>
        <div class="ayah-actions">
          <button class="icon-btn" title="Play Ayah" onclick="playSingleAyahAudio('${ayah.verse_key}')">
            <i class="ri-play-fill"></i>
          </button>
          <button class="icon-btn" title="Tajweed Rules" onclick="openAyahTajweedModal(${sNum}, ${aNum})">
            <i class="ri-music-2-line text-gold"></i>
          </button>
          <button class="icon-btn" title="Read Tafsir" onclick="openAyahTafsirModal(${sNum}, ${aNum})">
            <i class="ri-article-line text-primary"></i>
          </button>
          <button class="icon-btn" title="Bookmark" onclick="quickToggleBookmark('quran_ayah', '${ayah.verse_key}', 'Surah ${ayah.surah_name_english || sNum} : ${aNum}', '${arabicSafe}')">
            <i class="ri-bookmark-line"></i>
          </button>
          <button class="icon-btn" title="Note" onclick="promptNoteAyah(${ayah.id || 0})">
            <i class="ri-edit-line"></i>
          </button>
          <button class="icon-btn" title="Practice" onclick="quickPracticeAyah(${sNum}, ${aNum})">
            <i class="ri-sparkles-line"></i>
          </button>
        </div>
      </div>
      <div class="ayah-arabic">${ayah.text_arabic}</div>
      <div class="ayah-translation">${ayah.text_translation}</div>
    </div>
  `;
}

function playSingleAyahAudio(verseKeyOrId) {
  let ayah = State.activeAyahs.find(a => a.verse_key === String(verseKeyOrId) || a.id === Number(verseKeyOrId));
  if (!ayah && State.activeAyahs.length > 0) {
    ayah = State.activeAyahs[0];
  }
  if (ayah) {
    AudioPlayer.playAyah(ayah, State.activeAyahs);
  }
}

function playCurrentSurahAudio() {
  if (State.activeAyahs && State.activeAyahs.length > 0) {
    AudioPlayer.playAyah(State.activeAyahs[0], State.activeAyahs);
  }
}

/* ==========================================================================
   VIEW: MEMORIZATION STUDIO (Section 6)
   ========================================================================== */
async function renderMemorize(container) {
  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary); margin-bottom:6px;">
        <i class="ri-sparkles-fill"></i> Hifz Memorization Studio
      </h2>
      <p class="text-muted" style="font-size:0.9rem;">Select your practice mode to memorize, test, and record your recitation.</p>
    </div>

    <!-- Mode Selector Tabs -->
    <div class="mode-selector">
      <button class="mode-btn ${State.activePracticeMode === 'read' ? 'active' : ''}" onclick="setPracticeMode('read')">
        <i class="ri-book-open-line"></i> Read Mode
      </button>
      <button class="mode-btn ${State.activePracticeMode === 'hide' ? 'active' : ''}" onclick="setPracticeMode('hide')">
        <i class="ri-eye-line-slash"></i> Hide Mode
      </button>
      <button class="mode-btn ${State.activePracticeMode === 'listen' ? 'active' : ''}" onclick="setPracticeMode('listen')">
        <i class="ri-headphone-line"></i> Listen Mode
      </button>
      <button class="mode-btn ${State.activePracticeMode === 'recite' ? 'active' : ''}" onclick="setPracticeMode('recite')">
        <i class="ri-mic-line"></i> Recitation Mode
      </button>
      <button class="mode-btn ${State.activePracticeMode === 'test' ? 'active' : ''}" onclick="setPracticeMode('test')">
        <i class="ri-checkbox-circle-fill"></i> Test Mode
      </button>
    </div>

    <!-- Practice Range Selector Card -->
    <div class="card p-3 mb-4">
      <div style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
        <div style="flex:1; min-width:180px;">
          <label class="form-label" style="font-size:0.8rem;">Surah</label>
          <select id="practice-surah-select" class="form-control" onchange="loadPracticeRangeAyahs()">
            ${State.surahs.map(s => `<option value="${s.number}">${s.number}. ${s.name_english} (${s.name_arabic})</option>`).join('')}
          </select>
        </div>
        <div style="width:100px;">
          <label class="form-label" style="font-size:0.8rem;">From Ayah</label>
          <input type="number" id="practice-start-ayah" class="form-control" value="1" min="1" onchange="loadPracticeRangeAyahs()">
        </div>
        <div style="width:100px;">
          <label class="form-label" style="font-size:0.8rem;">To Ayah</label>
          <input type="number" id="practice-end-ayah" class="form-control" value="7" min="1" onchange="loadPracticeRangeAyahs()">
        </div>
        <div style="margin-top:24px;">
          <button class="btn btn-primary" onclick="loadPracticeRangeAyahs()">Load Verses</button>
        </div>
      </div>
    </div>

    <!-- Active Practice Stage Container -->
    <div id="practice-stage-area">
      <div class="card p-5 text-center text-muted">
        Select a Surah and Ayah range above to begin your memorization session.
      </div>
    </div>
  `;

  // Auto-load default (Surah 1: 1-7)
  loadPracticeRangeAyahs();
}

function setPracticeMode(mode) {
  State.activePracticeMode = mode;
  renderMemorize(document.getElementById('main-view-container'));
}

async function loadPracticeRangeAyahs() {
  const surahSelect = document.getElementById('practice-surah-select');
  const startInput = document.getElementById('practice-start-ayah');
  const endInput = document.getElementById('practice-end-ayah');
  const stage = document.getElementById('practice-stage-area');

  if (!surahSelect || !stage) return;
  const surahNum = parseInt(surahSelect.value);
  const startA = parseInt(startInput.value);
  const endA = parseInt(endInput.value);

  stage.innerHTML = `<div class="p-5 text-center"><div class="spinner-border text-success"></div><p class="mt-2 text-muted">Loading practice verses...</p></div>`;

  try {
    let ayahs = [];

    // 1. If logged in, start tracked session
    if (API.isAuthenticated()) {
      try {
        const res = await API.memorization.start({
          surah_number: surahNum,
          start_ayah: startA,
          end_ayah: endA,
          mode: State.activePracticeMode
        });
        ayahs = res.data?.ayahs || [];
      } catch (err) {
        console.warn("Memorization start error, falling back to public quran api:", err);
      }
    }

    // 2. Guest Mode or Fallback: Load verses without requiring login
    if (!ayahs || ayahs.length === 0) {
      try {
        const qRes = await API.quran.getAyahs(surahNum, startA, endA);
        ayahs = qRes.data || [];
      } catch (err) {
        console.warn("API.quran.getAyahs error:", err);
      }
    }

    // 3. Direct Al-Quran Cloud API browser fallback
    if (!ayahs || ayahs.length === 0) {
      const apiRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-uthmani,en.sahih,ar.alafasy`);
      const apiJson = await apiRes.json();
      if (apiJson && apiJson.data && apiJson.data.length >= 2) {
        const ar = apiJson.data[0].ayahs;
        const en = apiJson.data[1].ayahs;
        const au = apiJson.data[2]?.ayahs || [];
        ayahs = ar
          .filter(a => a.numberInSurah >= startA && a.numberInSurah <= endA)
          .map(a => ({
            id: a.number,
            surah_number: surahNum,
            ayah_number: a.numberInSurah,
            verse_key: `${surahNum}:${a.numberInSurah}`,
            text_arabic: a.text,
            text_translation: en.find(e => e.numberInSurah === a.numberInSurah)?.text || '',
            audio_url: au.find(u => u.numberInSurah === a.numberInSurah)?.audio || `https://everyayah.com/data/Alafasy_128kbps/${String(surahNum).padStart(3,'0')}${String(a.numberInSurah).padStart(3,'0')}.mp3`
          }));
      }
    }

    State.activeAyahs = ayahs;

    if (!ayahs || ayahs.length === 0) {
      stage.innerHTML = `<div class="card p-4 text-center text-muted">No verses found in specified range.</div>`;
      return;
    }

    renderPracticeStage(stage, ayahs);
  } catch (e) {
    stage.innerHTML = `<div class="card p-4 text-danger">Failed to load verses: ${e.message}</div>`;
  }
}

function renderPracticeStage(container, ayahs) {
  const mode = State.activePracticeMode;
  const isGuest = !API.isAuthenticated();

  container.innerHTML = `
    ${isGuest ? `
      <div class="alert alert-info p-3 mb-3" style="background:var(--primary-subtle); border:1px solid var(--border-gold); border-radius:var(--radius); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div style="font-size:0.85rem; color:var(--text);">
          <i class="ri-information-fill text-warning"></i> <strong>Guest Mode:</strong> You can read, listen, and practice freely! Sign in to save your Hifz streaks and SRS revision memory.
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-sm btn-gold" onclick="demoSignIn()">⚡ Quick Demo Sign In</button>
          <button class="btn btn-sm btn-outline" onclick="openAuthModal('login')">Sign In</button>
        </div>
      </div>
    ` : ''}

    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
      <span class="badge" style="background:var(--primary); color:#fff; padding:6px 12px; border-radius:var(--radius-sm); font-weight:700;">
        Mode: ${mode.toUpperCase()}
      </span>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-sm btn-primary" onclick="playCurrentSurahAudio()">
          <i class="ri-play-fill"></i> Play Verses
        </button>
        <button class="btn btn-outline btn-sm" onclick="finishPracticeSession(${ayahs.length})">
          <i class="ri-checkbox-circle-line"></i> Complete Session
        </button>
      </div>
    </div>

    <!-- Mode Specific Content -->
    ${mode === 'recite' ? renderReciterVoiceRecorderHtml(ayahs[0]) : ''}

    <div class="ayah-list">
      ${ayahs.map(a => `
        <div class="ayah-card" id="practice-card-${a.id}">
          <div class="ayah-header">
            <span class="verse-badge">${a.verse_key}</span>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-sm btn-outline" onclick="markAyahMemorizedAction(${a.id || 0})">
                <i class="ri-check-double-line text-success"></i> Mark Memorized
              </button>
              <button class="btn btn-sm btn-outline" onclick="markAyahDifficultAction(${a.id || 0})">
                <i class="ri-error-warning-line text-warning"></i> Mark Difficult
              </button>
              <button class="icon-btn" title="Play Ayah Audio" onclick="playSingleAyahAudio('${a.verse_key}')">
                <i class="ri-play-fill"></i>
              </button>
            </div>
          </div>

          <!-- Arabic Text with Hide/Reveal Support -->
          <div class="ayah-arabic ${mode === 'hide' || mode === 'test' ? 'hidden-mode' : ''}" id="arabic-text-${a.id}" onclick="toggleRevealArabic(${a.id})">
            ${a.text_arabic}
          </div>

          ${mode !== 'test' ? `<div class="ayah-translation">${a.text_translation}</div>` : `
            <div style="text-align:center; padding:10px 0;">
              <button class="btn btn-sm btn-outline" onclick="toggleRevealArabic(${a.id})">
                <i class="ri-eye-line"></i> Tap to Check / Reveal Arabic Text
              </button>
            </div>
          `}
        </div>
      `).join('')}
    </div>
  `;
}

function toggleRevealArabic(ayahId) {
  const el = document.getElementById(`arabic-text-${ayahId}`);
  if (el) {
    el.classList.toggle('hidden-mode');
  }
}

function renderReciterVoiceRecorderHtml(firstAyah) {
  return `
    <div class="card p-4 mb-4 text-center" style="background:linear-gradient(135deg, var(--surface), var(--primary-subtle)); border:1px solid var(--border-gold);">
      <h3 style="font-size:1.1rem; font-weight:700; color:var(--primary); margin-bottom:8px;">
        <i class="ri-mic-line-fill"></i> Voice Recitation Studio
      </h3>
      <p class="text-muted" style="font-size:0.85rem; margin-bottom:16px;">
        Recite from memory. Listen back to your pronunciation or upload your recording to track your progress.
      </p>

      <div style="display:flex; justify-content:center; align-items:center; gap:16px;">
        <button class="btn btn-primary" id="rec-toggle-btn" onclick="toggleRecordingAction(${firstAyah.id})">
          <i class="ri-fingerprint-line"></i> Start Recording
        </button>
        <audio id="rec-preview-player" controls style="display:none;"></audio>
        <button class="btn btn-gold" id="rec-upload-btn" style="display:none;" onclick="uploadCurrentRecording(${firstAyah.id})">
          <i class="ri-upload-cloud-line"></i> Save Recording
        </button>
      </div>
      <div id="rec-status-text" class="text-muted mt-2" style="font-size:0.8rem;"></div>
    </div>
  `;
}

async function toggleRecordingAction(ayahId) {
  const btn = document.getElementById('rec-toggle-btn');
  const statusEl = document.getElementById('rec-status-text');
  const preview = document.getElementById('rec-preview-player');
  const uploadBtn = document.getElementById('rec-upload-btn');

  if (AudioRecorder.isRecording()) {
    statusEl.innerText = 'Processing recording...';
    const result = await AudioRecorder.stop();
    btn.innerHTML = `<i class="ri-fingerprint-line"></i> Record Again`;
    btn.className = 'btn btn-outline';
    if (result && result.url) {
      preview.src = result.url;
      preview.style.display = 'inline-block';
      uploadBtn.style.display = 'inline-block';
      statusEl.innerText = `Recording ready (${formatDuration(result.duration)})`;
    }
  } else {
    try {
      await AudioRecorder.start();
      btn.innerHTML = `<i class="ri-stop-circle-fill text-danger"></i> Stop Recording`;
      btn.className = 'btn btn-primary';
      preview.style.display = 'none';
      uploadBtn.style.display = 'none';
      statusEl.innerText = 'Recording in progress... (Speak into microphone)';
    } catch (err) {
      statusEl.innerText = `Microphone error: ${err.message}`;
    }
  }
}

async function uploadCurrentRecording(ayahId) {
  const statusEl = document.getElementById('rec-status-text');
  statusEl.innerText = 'Uploading to server...';
  try {
    await AudioRecorder.upload(ayahId, 30);
    statusEl.innerHTML = `<span class="text-success"><i class="ri-checkbox-circle-line-fill"></i> Recording saved successfully!</span>`;
  } catch (e) {
    statusEl.innerText = `Upload failed: ${e.message}`;
  }
}

async function markAyahMemorizedAction(ayahId) {
  try {
    const res = await API.memorization.markMemorized(ayahId, 85.0);
    showToast("Ayah marked as memorized! Strength score: 85%");
  } catch (e) {
    showToast("Error updating ayah: " + e.message, true);
  }
}

async function markAyahDifficultAction(ayahId) {
  try {
    const res = await API.memorization.markDifficult(ayahId);
    showToast("Ayah marked as difficult. Added to priority revision queue.");
  } catch (e) {
    showToast("Error updating ayah: " + e.message, true);
  }
}

async function finishPracticeSession(count) {
  try {
    await API.memorization.complete({
      surah_number: State.activeSurah ? State.activeSurah.number : 1,
      start_ayah: 1,
      end_ayah: count,
      mode: State.activePracticeMode,
      ayahs_practiced: count,
      duration_seconds: 300
    });
    showToast("Practice session completed and logged!");
    navigateTo('home');
  } catch (e) {
    showToast("Failed to complete session: " + e.message, true);
  }
}

// Global Repeat Modal & Settings Controller
function openRepeatModal() {
  const curTarget = AudioPlayer.getRepeatTarget();
  const curDelay = AudioPlayer.getDelay();
  const isLoop = AudioPlayer.isLoopRangeActive();

  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-body-container');
  if (!overlay || !box) return;

  box.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border); padding-bottom:12px;">
      <h3 style="font-size:1.18rem; font-weight:800; color:var(--primary); margin:0; display:flex; align-items:center; gap:8px;">
        <i class="ri-repeat-2-line"></i> Recitation Repeat Settings
      </h3>
      <button class="icon-btn" onclick="closeModal()" style="font-size:1.4rem; padding:4px;" title="Close">&times;</button>
    </div>

    <div style="margin-bottom:20px;">
      <label class="form-label" style="font-weight:700; margin-bottom:8px; display:block; font-size:0.88rem;">
        Repeat Each Ayah (Verse):
      </label>
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
        <button type="button" class="btn btn-sm ${curTarget === 1 && !isLoop ? 'btn-primary' : 'btn-outline'}" onclick="applyRepeatSetting(1)">1x (Normal)</button>
        <button type="button" class="btn btn-sm ${curTarget === 2 ? 'btn-primary' : 'btn-outline'}" onclick="applyRepeatSetting(2)">2x Repeat</button>
        <button type="button" class="btn btn-sm ${curTarget === 3 ? 'btn-primary' : 'btn-outline'}" onclick="applyRepeatSetting(3)">3x (Sunnah)</button>
        <button type="button" class="btn btn-sm ${curTarget === 5 ? 'btn-primary' : 'btn-outline'}" onclick="applyRepeatSetting(5)">5x Repeat</button>
        <button type="button" class="btn btn-sm ${curTarget === 10 ? 'btn-primary' : 'btn-outline'}" onclick="applyRepeatSetting(10)">10x Repeat</button>
        <button type="button" class="btn btn-sm ${curTarget === Infinity ? 'btn-gold' : 'btn-outline'}" onclick="applyRepeatSetting('Infinity')">∞ Loop Ayah</button>
      </div>
    </div>

    <div style="margin-bottom:20px;">
      <label class="form-label" style="font-weight:700; margin-bottom:8px; display:block; font-size:0.88rem;">
        Pause Delay Between Verses (recite along):
      </label>
      <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:6px;">
        <button type="button" class="btn btn-sm ${curDelay === 0 ? 'btn-primary' : 'btn-outline'}" onclick="applyDelaySetting(0)">0s</button>
        <button type="button" class="btn btn-sm ${curDelay === 1 ? 'btn-primary' : 'btn-outline'}" onclick="applyDelaySetting(1)">1s</button>
        <button type="button" class="btn btn-sm ${curDelay === 2 ? 'btn-primary' : 'btn-outline'}" onclick="applyDelaySetting(2)">2s</button>
        <button type="button" class="btn btn-sm ${curDelay === 3 ? 'btn-primary' : 'btn-outline'}" onclick="applyDelaySetting(3)">3s</button>
        <button type="button" class="btn btn-sm ${curDelay === 5 ? 'btn-primary' : 'btn-outline'}" onclick="applyDelaySetting(5)">5s</button>
      </div>
    </div>

    <div style="margin-bottom:24px; padding:12px 14px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-sm);">
      <label style="display:flex; align-items:center; gap:10px; cursor:pointer; margin:0;">
        <input type="checkbox" id="loop-surah-check" ${isLoop ? 'checked' : ''} onchange="toggleLoopSurah(this.checked)" style="width:18px; height:18px; accent-color:var(--primary); cursor:pointer;">
        <div>
          <div style="font-size:0.88rem; font-weight:700; color:var(--text-main);">Loop Entire Surah Continuously</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Replays the full Surah / playlist from the beginning when finished</div>
        </div>
      </label>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
      <button type="button" class="btn btn-outline btn-sm" onclick="quickCycleRepeatAction()">
        <i class="ri-loop-right-line"></i> Quick Cycle Mode
      </button>
      <button type="button" class="btn btn-primary btn-sm" onclick="closeModal()" style="min-width:80px;">Done</button>
    </div>
  `;

  overlay.classList.add('active');
  overlay.style.display = 'flex';
}

function applyRepeatSetting(n) {
  AudioPlayer.setRepeatTarget(n);
  const label = n === 'Infinity' || n === Infinity ? '∞ Loop Ayah' : `${n}x`;
  showToast(`Recitation repeat set to: ${label}`);
  openRepeatModal();
}

function applyDelaySetting(s) {
  AudioPlayer.setDelay(s);
  showToast(`Pause delay set to: ${s}s`);
  openRepeatModal();
}

function toggleLoopSurah(checked) {
  AudioPlayer.setLoopRange(checked);
  showToast(checked ? "Surah loop enabled (infinite playback)" : "Surah loop disabled");
  openRepeatModal();
}

function quickCycleRepeatAction() {
  const result = AudioPlayer.cycleRepeat();
  const label = result.repeatTarget === Infinity ? '∞ Loop Ayah' : (result.isLoopRange ? '∞ Loop Surah' : `${result.repeatTarget}x`);
  showToast(`Repeat mode: ${label}`);
  const overlay = document.getElementById('modal-overlay');
  if (overlay && overlay.classList.contains('active')) {
    openRepeatModal();
  }
}

/* ==========================================================================
   VIEW: MURAJA'AH / REVISION (Section 8 & 9)
   ========================================================================== */
async function renderRevision(container) {
  if (!API.isAuthenticated()) {
    container.innerHTML = `
      <div class="hero-card" style="margin-bottom: 24px;">
        <div>
          <div class="hero-greeting"><i class="ri-loop-right-line"></i> Muraja'ah & Spaced Repetition (SRS)</div>
          <div class="hero-sub">The systematic revision engine tracks your retention intervals (1d → 3d → 7d → 14d → 30d) and automatically schedules weak verses.</div>
          <div style="margin-top:20px; display:flex; gap:12px; flex-wrap:wrap;">
            <button class="btn btn-gold" onclick="demoSignIn()"><i class="ri-flashlight-fill"></i> ⚡ Quick Demo Sign In</button>
            <button class="btn btn-outline" style="color:#fff; border-color:#fff;" onclick="openAuthModal('login')">Sign In to Your Account</button>
            <button class="btn btn-outline" style="color:#fff; border-color:#fff;" onclick="openAuthModal('register')">Create Account</button>
          </div>
        </div>
      </div>

      <div class="card p-4">
        <h3 style="margin-bottom:12px; font-weight:700; color:var(--primary);"><i class="ri-shield-check-line"></i> How Muraja'ah Spaced Repetition Works:</h3>
        <p class="text-muted mb-3">Muraja'ah calculates your memory retention score (0–100%) for each Ayah using adaptive intervals:</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
          <div class="card p-3 text-center"><strong>Day 1</strong><br><small class="text-muted">Immediate Retention</small></div>
          <div class="card p-3 text-center"><strong>Day 3</strong><br><small class="text-muted">First Reinforcement</small></div>
          <div class="card p-3 text-center"><strong>Day 7</strong><br><small class="text-muted">Weekly Consolidation</small></div>
          <div class="card p-3 text-center"><strong>Day 14–30</strong><br><small class="text-muted">Long-Term Memory</small></div>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
      <div>
        <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary); margin-bottom:4px;">
          <i class="ri-loop-right-line"></i> Muraja'ah (Revision)
        </h2>
        <p class="text-muted" style="font-size:0.9rem;">Spaced Repetition System (SRS) prioritizing weak verses and retention intervals.</p>
      </div>
      <div>
        <button class="btn btn-gold" onclick="startMurajaahSession()">
          <i class="ri-play-circle-fill"></i> Start Interactive Session
        </button>
      </div>
    </div>

    <!-- Revision Tabs -->
    <div style="display:flex; gap:10px; border-bottom:1px solid var(--border); padding-bottom:8px; margin-bottom:20px;">
      <button class="btn btn-sm btn-primary" onclick="loadRevisionTab('today')">Today's Due</button>
      <button class="btn btn-sm btn-outline" onclick="loadRevisionTab('weak')">Weak Verses</button>
      <button class="btn btn-sm btn-outline" onclick="loadRevisionTab('recent')">Recently Memorized</button>
      <button class="btn btn-sm btn-outline" onclick="loadRevisionTab('history')">Revision History</button>
    </div>

    <div id="revision-tab-content">
      <div class="p-5 text-center"><div class="spinner-border text-success"></div></div>
    </div>
  `;

  loadRevisionTab('today');
}

async function loadRevisionTab(tabName) {
  const container = document.getElementById('revision-tab-content');
  if (!container) return;

  container.innerHTML = `<div class="p-4 text-center"><div class="spinner-border text-success"></div></div>`;

  try {
    let items = [];
    if (tabName === 'today') {
      const res = await API.revision.getToday();
      items = res.data || [];
    } else if (tabName === 'weak') {
      const res = await API.revision.getWeak();
      items = res.data || [];
    } else if (tabName === 'recent') {
      const res = await API.revision.getRecent();
      items = res.data || [];
    } else if (tabName === 'history') {
      const res = await API.revision.getHistory();
      renderRevisionHistoryTable(container, res.data || []);
      return;
    }

    if (items.length === 0) {
      container.innerHTML = `<div class="card p-4 text-center text-muted">No verses in this queue right now. Great job keeping up!</div>`;
      return;
    }

    container.innerHTML = `
      <div class="card p-0" style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
          <thead style="background:var(--border-subtle); text-align:left;">
            <tr>
              <th style="padding:12px 16px;">Verse</th>
              <th style="padding:12px 16px;">Strength Score</th>
              <th style="padding:12px 16px;">Reviewed / Correct</th>
              <th style="padding:12px 16px;">Next Review</th>
              <th style="padding:12px 16px; text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(p => `
              <tr style="border-bottom:1px solid var(--border-subtle);">
                <td style="padding:12px 16px; font-weight:700;">${p.verse_key}</td>
                <td style="padding:12px 16px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-weight:700; color:${p.strength_score < 60 ? 'var(--danger)' : 'var(--primary)'};">${p.strength_score}%</span>
                    <div style="width:60px; height:6px; background:var(--border); border-radius:4px; overflow:hidden;">
                      <div style="width:${p.strength_score}%; height:100%; background:${p.strength_score < 60 ? 'var(--danger)' : 'var(--primary)'};"></div>
                    </div>
                  </div>
                </td>
                <td style="padding:12px 16px;">${p.times_reviewed} (${p.times_correct}✓ / ${p.times_incorrect}✗)</td>
                <td style="padding:12px 16px; color:var(--text-muted); font-size:0.82rem;">${p.next_review_at ? new Date(p.next_review_at).toLocaleDateString() : 'Due Now'}</td>
                <td style="padding:12px 16px; text-align:right;">
                  <button class="btn btn-sm btn-outline" onclick="startSingleVerseRevision(${p.ayah_id})">Revise</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to load queue: ${e.message}</div>`;
  }
}

function renderRevisionHistoryTable(container, historyList) {
  if (historyList.length === 0) {
    container.innerHTML = `<div class="card p-4 text-center text-muted">No revision sessions recorded yet.</div>`;
    return;
  }
  container.innerHTML = `
    <div class="card p-0" style="overflow-x:auto;">
      <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
        <thead style="background:var(--border-subtle); text-align:left;">
          <tr>
            <th style="padding:12px 16px;">Date & Time</th>
            <th style="padding:12px 16px;">Type</th>
            <th style="padding:12px 16px;">Reviewed</th>
            <th style="padding:12px 16px;">Accuracy</th>
            <th style="padding:12px 16px;">Duration</th>
          </tr>
        </thead>
        <tbody>
          ${historyList.map(h => {
            const acc = h.total_reviewed > 0 ? Math.round((h.total_correct / h.total_reviewed) * 100) : 100;
            return `
              <tr style="border-bottom:1px solid var(--border-subtle);">
                <td style="padding:12px 16px; font-weight:600;">${new Date(h.started_at).toLocaleString()}</td>
                <td style="padding:12px 16px; text-transform:capitalize;">${h.session_type}</td>
                <td style="padding:12px 16px;">${h.total_reviewed} Verses</td>
                <td style="padding:12px 16px; color:var(--primary); font-weight:700;">${acc}% (${h.total_correct}✓)</td>
                <td style="padding:12px 16px; color:var(--text-muted);">${formatDuration(h.duration_seconds)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Start Interactive Muraja'ah Session (Section 9)
async function startMurajaahSession(customQueue = null) {
  const container = document.getElementById('main-view-container');
  container.innerHTML = `<div class="p-5 text-center"><div class="spinner-border text-success"></div><p class="mt-2 text-muted">Initializing Muraja'ah session...</p></div>`;

  try {
    const sessionRes = await API.revision.startSession('scheduled');
    State.currentRevisionSessionId = sessionRes.data.id;

    let queue = customQueue;
    if (!queue) {
      const todayRes = await API.revision.getToday(20);
      queue = todayRes.data || [];
      if (queue.length === 0) {
        const randRes = await API.revision.getRandom(10);
        queue = randRes.data || [];
      }
    }

    if (queue.length === 0) {
      container.innerHTML = `
        <div class="card p-5 text-center">
          <h3 style="font-weight:700; color:var(--primary); margin-bottom:10px;">No Verses Currently in Revision Queue</h3>
          <p class="text-muted mb-4">Please memorize some Ayahs in the Memorize studio first, or mark verses for review.</p>
          <button class="btn btn-primary" onclick="window.location.hash='memorize'">Go to Memorization Studio</button>
        </div>
      `;
      return;
    }

    State.currentRevisionQueue = queue;
    State.revisionIndex = 0;
    renderInteractiveRevisionCard(container);
  } catch (e) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to start session: ${e.message}</div>`;
  }
}

function renderInteractiveRevisionCard(container) {
  const q = State.currentRevisionQueue;
  const idx = State.revisionIndex;
  if (idx >= q.length) {
    finishInteractiveRevisionSession(container);
    return;
  }

  const item = q[idx];
  const ayah = item.ayah || { verse_key: item.verse_key, text_arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', text_translation: 'Praise be to Allah' };

  container.innerHTML = `
    <div class="revision-stage">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <span style="font-weight:700; color:var(--primary); font-size:1.1rem;">
          Muraja'ah Session • Ayah ${idx + 1} of ${q.length}
        </span>
        <button class="btn btn-sm btn-outline" onclick="finishInteractiveRevisionSession(document.getElementById('main-view-container'))">
          Finish Early
        </button>
      </div>

      <div class="progress-bar-container" style="margin-bottom:24px;">
        <div class="progress-bar-fill progress-bar-gold" style="width:${((idx + 1) / q.length) * 100}%;"></div>
      </div>

      <div class="revision-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <span class="verse-badge" style="font-size:0.9rem;">${item.verse_key}</span>
          <span style="font-size:0.85rem; font-weight:700; color:var(--gold);">
            Strength: ${item.strength_score}%
          </span>
        </div>

        <div class="ayah-arabic hidden-mode" id="revision-arabic-text" onclick="document.getElementById('revision-arabic-text').classList.toggle('hidden-mode')">
          ${ayah.text_arabic}
        </div>

        <div style="margin:16px 0;">
          <button class="btn btn-outline btn-sm" onclick="document.getElementById('revision-arabic-text').classList.toggle('hidden-mode')">
            <i class="ri-eye-line"></i> Hide / Reveal Arabic Text
          </button>
          <button class="btn btn-outline btn-sm" style="margin-left:8px;" onclick="playSingleAyahAudio(${ayah.id || item.ayah_id})">
            <i class="ri-volume-up-line"></i> Listen
          </button>
        </div>

        <p class="ayah-translation" style="margin-top:16px;">
          ${ayah.text_translation}
        </p>

        <!-- Grading Action Buttons -->
        <div class="revision-grade-actions">
          <button class="btn btn-grade btn-grade-correct" onclick="submitRevisionGrade('correct')">
            <i class="ri-checkbox-circle-line-fill"></i> Correct (Mutqin)
          </button>
          <button class="btn btn-grade btn-grade-difficult" onclick="submitRevisionGrade('difficult')">
            <i class="ri-indeterminate-circle-fill"></i> Difficult (Sa'b)
          </button>
          <button class="btn btn-grade btn-grade-mistake" onclick="submitRevisionGrade('mistake')">
            <i class="ri-close-circle-fill"></i> Mistake (Khata')
          </button>
        </div>
      </div>
    </div>
  `;
}

async function submitRevisionGrade(grade) {
  const item = State.currentRevisionQueue[State.revisionIndex];
  try {
    const res = await API.revision.recordResult({
      ayah_id: item.ayah_id || (item.ayah ? item.ayah.id : 1),
      grade: grade,
      session_id: State.currentRevisionSessionId
    });

    const data = res.data;
    showToast(`Graded: ${grade.toUpperCase()} • New strength: ${data.strength_after}%`);

    State.revisionIndex += 1;
    renderInteractiveRevisionCard(document.getElementById('main-view-container'));
  } catch (e) {
    showToast("Error saving grade: " + e.message, true);
  }
}

async function finishInteractiveRevisionSession(container) {
  container.innerHTML = `<div class="p-5 text-center"><div class="spinner-border text-success"></div><p class="mt-2 text-muted">Saving revision session results...</p></div>`;
  try {
    const res = await API.revision.completeSession({
      session_id: State.currentRevisionSessionId,
      duration_seconds: 240
    });
    const session = res.data.session;

    container.innerHTML = `
      <div class="card p-5 text-center" style="max-width:540px; margin:40px auto;">
        <div style="font-size:3rem; color:var(--primary); margin-bottom:12px;">
          <i class="ri-checkbox-circle-fill"></i>
        </div>
        <h2 style="font-weight:800; color:var(--primary); margin-bottom:6px;">Muraja'ah Completed!</h2>
        <p class="text-muted mb-4">May Allah make this Quran a companion for you on the Day of Judgment.</p>

        <div style="display:flex; justify-content:space-around; background:var(--border-subtle); padding:16px; border-radius:var(--radius-md); margin-bottom:24px;">
          <div>
            <div style="font-size:1.4rem; font-weight:800; color:var(--text-main);">${session.total_reviewed}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Reviewed</div>
          </div>
          <div>
            <div style="font-size:1.4rem; font-weight:800; color:#10b981;">${session.total_correct}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Correct</div>
          </div>
          <div>
            <div style="font-size:1.4rem; font-weight:800; color:#ef4444;">${session.total_incorrect}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Mistakes</div>
          </div>
        </div>

        <button class="btn btn-primary" style="width:100%;" onclick="navigateTo('home')">
          Return to Dashboard
        </button>
      </div>
    `;
  } catch (e) {
    navigateTo('home');
  }
}

/* ==========================================================================
   VIEW: WEAK VERSES (Section 12)
   ========================================================================== */
async function renderWeakVerses(container) {
  container.innerHTML = `<div class="p-5 text-center"><div class="spinner-border text-success"></div><p class="mt-2 text-muted">Analyzing weak verses...</p></div>`;

  try {
    const res = await API.revision.getWeak(50, 70);
    const verses = res.data || [];

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="font-size:1.4rem; font-weight:800; color:var(--danger);">
            <i class="ri-shield-alert-line"></i> Weak Verses Priority Queue
          </h2>
          <p class="text-muted" style="font-size:0.9rem;">Verses with repeated mistakes or memorization strength below 70%.</p>
        </div>
        <div>
          <button class="btn btn-gold" onclick="startMurajaahSession()">
            <i class="ri-play-circle-fill"></i> Revise All Weak Verses
          </button>
        </div>
      </div>

      ${verses.length === 0 ? `
        <div class="card p-5 text-center">
          <div style="font-size:2.5rem; color:var(--primary); margin-bottom:10px;"><i class="ri-shield-check-line"></i></div>
          <h3 style="font-weight:700; color:var(--text-main);">No Weak Verses Detected!</h3>
          <p class="text-muted">Your memorization is robust across all reviewed portions.</p>
        </div>
      ` : `
        <div class="card p-0" style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
            <thead style="background:var(--border-subtle); text-align:left;">
              <tr>
                <th style="padding:12px 16px;">Verse Key</th>
                <th style="padding:12px 16px;">Strength Score</th>
                <th style="padding:12px 16px;">Mistake Count</th>
                <th style="padding:12px 16px;">Last Reviewed</th>
                <th style="padding:12px 16px; text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${verses.map(v => `
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:12px 16px; font-weight:700;">${v.verse_key}</td>
                  <td style="padding:12px 16px; font-weight:700; color:var(--danger);">${v.strength_score}%</td>
                  <td style="padding:12px 16px; font-weight:600;">${v.times_incorrect} mistakes</td>
                  <td style="padding:12px 16px; color:var(--text-muted); font-size:0.82rem;">${v.last_reviewed_at ? new Date(v.last_reviewed_at).toLocaleDateString() : 'Never'}</td>
                  <td style="padding:12px 16px; text-align:right;">
                    <button class="btn btn-sm btn-primary" onclick="quickPracticeAyah(${v.ayah ? v.ayah.surah_number : 1}, ${v.ayah ? v.ayah.ayah_number : 1})">
                      Practice
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;
  } catch (e) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to load weak verses: ${e.message}</div>`;
  }
}

/* ==========================================================================
   VIEW: PROGRESS & ANALYTICS (Section 11)
   ========================================================================== */
async function renderProgressAnalytics(container) {
  container.innerHTML = `<div class="p-5 text-center"><div class="spinner-border text-success"></div></div>`;

  try {
    const statsRes = await API.progress.getStatistics();
    const calRes = await API.progress.getCalendar(35);
    const stats = statsRes.data;
    const cal = calRes.data;

    container.innerHTML = `
      <div style="margin-bottom:24px;">
        <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary); margin-bottom:4px;">
          <i class="ri-bar-chart-box-line"></i> Progress & Memorization Analytics
        </h2>
        <p class="text-muted" style="font-size:0.9rem;">Comprehensive breakdown of your Hifz journey and retention stats.</p>
      </div>

      <!-- Overview Cards -->
      <div class="dashboard-grid mb-4">
        <div class="col-3">
          <div class="card">
            <div class="stat-widget">
              <div class="stat-icon-wrap stat-icon-emerald"><i class="ri-book-open-line"></i></div>
              <div>
                <div class="stat-value">${stats.total_memorized_ayahs}</div>
                <div class="stat-label">Ayahs Preserved</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-3">
          <div class="card">
            <div class="stat-widget">
              <div class="stat-icon-wrap stat-icon-gold"><i class="ri-medal-line"></i></div>
              <div>
                <div class="stat-value">${stats.completed_surahs} / 114</div>
                <div class="stat-label">Surahs Completed</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-3">
          <div class="card">
            <div class="stat-widget">
              <div class="stat-icon-wrap stat-icon-emerald"><i class="ri-focus-3-line"></i></div>
              <div>
                <div class="stat-value">${stats.revision_accuracy}%</div>
                <div class="stat-label">Muraja'ah Accuracy</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-3">
          <div class="card">
            <div class="stat-widget">
              <div class="stat-icon-wrap stat-icon-gold"><i class="ri-fire-fill"></i></div>
              <div>
                <div class="stat-value">${stats.current_streak} Days</div>
                <div class="stat-label">Current Streak</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Progress Bar Matrix -->
      <div class="card mb-4">
        <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:14px; color:var(--text-main);">
          Weekly Activity Breakdown
        </h3>
        <div style="display:flex; justify-content:space-between; align-items:flex-end; height:120px; padding-top:20px;">
          ${(stats.weekly_chart || []).map(day => {
            const h = Math.min(100, (day.memorized + day.revisions) * 15 + 10);
            return `
              <div style="display:flex; flex-direction:column; align-items:center; gap:6px; flex:1;">
                <div style="font-size:0.75rem; font-weight:700; color:var(--primary);">${day.memorized + day.revisions}</div>
                <div style="width:24px; height:${h}px; background:linear-gradient(180deg, var(--primary), #047857); border-radius:4px;"></div>
                <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">${day.day}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 35-Day Activity Calendar Heatmap -->
      <div class="card mb-4">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:1.05rem; font-weight:700; color:var(--text-main);">
            35-Day Activity Heatmap
          </h3>
          <span style="font-size:0.75rem; color:var(--text-muted);">Green indicates practice or revision activity</span>
        </div>
        <div class="calendar-grid">
          ${cal.map(c => `
            <div class="cal-day-cell active-${c.intensity}" title="${c.date}: ${c.memorization_count} memorized, ${c.revision_count} revised">
              <div>${new Date(c.date).getDate()}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to load analytics: ${e.message}</div>`;
  }
}

/* ==========================================================================
   VIEW: USER PROFILE & ACHIEVEMENTS (Section 16, 19, 21)
   ========================================================================== */
async function renderProfile(container) {
  if (!API.isAuthenticated()) {
    renderGuestHome(container);
    return;
  }

  const user = State.currentUser || {};
  container.innerHTML = `<div class="p-5 text-center"><div class="spinner-border text-success"></div></div>`;

  try {
    const achRes = await API.achievements.list();
    const badges = achRes.data || [];

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
        <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary);">
          <i class="ri-user-smile-line"></i> Student Profile & Settings
        </h2>
        <div style="display:flex; gap:8px;">
          ${user.role === 'admin' ? `<button class="btn btn-gold btn-sm" onclick="openAdminModal()"><i class="ri-shield-keyhole-line"></i> Admin Dashboard</button>` : ''}
          <button class="btn btn-outline btn-sm" onclick="logoutUser()">
            <i class="ri-logout-box-r-line"></i> Sign Out
          </button>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- User Info Card -->
        <div class="col-5">
          <div class="card card-primary-edge">
            <div style="text-align:center; padding:10px 0 20px 0;">
              <div style="width:72px; height:72px; border-radius:50%; background:var(--gold); color:#fff; font-size:1.8rem; font-weight:700; display:flex; align-items:center; justify-content:center; margin:0 auto 12px auto;">
                ${(user.name || user.username || 'U')[0].toUpperCase()}
              </div>
              <h3 style="font-size:1.2rem; font-weight:700;">${user.name || user.username}</h3>
              <div style="color:var(--text-muted); font-size:0.85rem;">${user.email}</div>
              <span class="badge" style="background:var(--primary-subtle); color:var(--primary); margin-top:8px; display:inline-block; padding:4px 10px; border-radius:12px; font-weight:700;">
                Role: ${user.role ? user.role.toUpperCase() : 'STUDENT'}
              </span>
            </div>

            <div style="border-top:1px solid var(--border-subtle); padding-top:16px;">
              <div style="margin-bottom:12px;">
                <label class="form-label" style="font-size:0.8rem;">Memorization Goal</label>
                <div style="font-weight:600; font-size:0.95rem;">${user.memorization_goal || 'Memorize the Quran'}</div>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                <span class="text-muted" style="font-size:0.85rem;">Daily Hifz Goal</span>
                <span style="font-weight:700;">${user.daily_goal_ayahs || 5} Ayahs</span>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:18px;">
                <span class="text-muted" style="font-size:0.85rem;">Daily Revision Goal</span>
                <span style="font-weight:700;">${user.daily_revision_goal_ayahs || 15} Ayahs</span>
              </div>
              <button class="btn btn-outline" style="width:100%;" onclick="openEditProfileModal()">Edit Profile</button>
            </div>
          </div>
        </div>

        <!-- Achievements Grid (Section 19) -->
        <div class="col-7">
          <div class="card card-gold-edge">
            <h3 style="font-size:1.1rem; font-weight:700; color:var(--gold); margin-bottom:16px;">
              <i class="ri-trophy-fill"></i> Achievements & Milestones
            </h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
              ${badges.map(b => `
                <div class="card p-3 text-center" style="opacity:${b.unlocked ? '1' : '0.45'}; border:1px solid ${b.unlocked ? 'var(--gold)' : 'var(--border)'};">
                  <div style="font-size:1.8rem; color:${b.unlocked ? 'var(--gold)' : 'var(--text-light)'}; margin-bottom:6px;">
                    <i class="bi bi-${b.icon || 'award'}"></i>
                  </div>
                  <div style="font-weight:700; font-size:0.88rem; margin-bottom:2px;">${b.title}</div>
                  <div style="font-size:0.72rem; color:var(--text-muted); line-height:1.3;">${b.description}</div>
                  ${b.unlocked ? `<span class="badge" style="background:#fef3c7; color:#b45309; font-size:0.65rem; margin-top:6px;">Unlocked ✓</span>` : `<span class="badge" style="background:var(--border-subtle); color:var(--text-light); font-size:0.65rem; margin-top:6px;">Locked</span>`}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to load profile: ${e.message}</div>`;
  }
}

/* ==========================================================================
   MODAL CONTROLS & POPUPS
   ========================================================================== */
function openAuthModal(mode = 'login') {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-body-container');
  overlay.classList.add('active');

  box.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">${mode === 'login' ? 'Sign In to Your Hifz Account' : 'Create Student Account'}</h3>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <form id="auth-form" onsubmit="handleAuthSubmit(event, '${mode}')">
      ${mode === 'register' ? `
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" id="auth-name" class="form-control" placeholder="e.g. Abdul Hadi">
        </div>
      ` : ''}
      <div class="form-group">
        <label class="form-label">Username or Email</label>
        <input type="text" id="auth-identifier" class="form-control" required placeholder="student@quran.com">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="auth-password" class="form-control" required placeholder="••••••••">
      </div>
      <div id="auth-error-msg" class="text-danger mb-3" style="font-size:0.85rem;"></div>

      <button type="submit" class="btn btn-primary" style="width:100%;">
        ${mode === 'login' ? 'Sign In' : 'Register Account'}
      </button>

      <div style="margin-top:16px; text-align:center; font-size:0.85rem;">
        ${mode === 'login' ? `
          Don't have an account? <a href="#" style="color:var(--primary); font-weight:700;" onclick="openAuthModal('register')">Sign Up</a>
        ` : `
          Already have an account? <a href="#" style="color:var(--primary); font-weight:700;" onclick="openAuthModal('login')">Sign In</a>
        `}
      </div>

      <div style="margin-top:14px; border-top:1px solid var(--border-subtle); padding-top:12px; text-align:center;">
        <button type="button" class="btn btn-sm btn-outline" style="width:100%;" onclick="demoSignIn()">
          🚀 Quick Fill Demo Student Account
        </button>
      </div>
    </form>
  `;
}

async function handleAuthSubmit(e, mode) {
  e.preventDefault();
  const errorMsg = document.getElementById('auth-error-msg');
  errorMsg.innerText = '';

  const idVal = document.getElementById('auth-identifier').value.trim();
  const passVal = document.getElementById('auth-password').value;

  try {
    let res;
    if (mode === 'login') {
      res = await API.auth.login({ identifier: idVal, password: passVal });
    } else {
      const nameVal = document.getElementById('auth-name').value.trim();
      res = await API.auth.register({ username: idVal, email: idVal, password: passVal, name: nameVal });
    }

    API.setTokens(res.data.access_token, res.data.refresh_token);
    API.setUser(res.data.user);
    State.currentUser = res.data.user;
    updateUserUI();
    closeModal();
    showToast("Signed in successfully!");
    navigateTo('home');
  } catch (err) {
    errorMsg.innerText = err.message || 'Authentication failed.';
  }
}

async function demoSignIn() {
  try {
    const res = await API.auth.login({ identifier: 'student@quran.com', password: 'Student123!' });
    API.setTokens(res.data.access_token, res.data.refresh_token);
    API.setUser(res.data.user);
    State.currentUser = res.data.user;
    updateUserUI();
    closeModal();
    showToast("Signed in as Demo Student!");
    navigateTo('home');
  } catch (err) {
    showToast("Demo sign in failed: " + err.message, true);
  }
}

function logoutUser() {
  API.auth.logout();
  State.currentUser = null;
  updateUserUI();
  showToast("Signed out.");
  navigateTo('home');
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.style.display = '';
  }
}

// Plan Creator Modal (Section 10)
function openPlanModal() {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-body-container');
  overlay.classList.add('active');

  box.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">Create Personalized Hifz Plan</h3>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <form onsubmit="handleCreatePlan(event)">
      <div class="form-group">
        <label class="form-label">Plan Title</label>
        <input type="text" id="plan-title" class="form-control" required value="Complete Juz Amma">
      </div>
      <div style="display:flex; gap:12px;">
        <div class="form-group" style="flex:1;">
          <label class="form-label">Start Surah</label>
          <select id="plan-start-surah" class="form-control">
            ${State.surahs.map(s => `<option value="${s.number}">${s.number}. ${s.name_english}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="flex:1;">
          <label class="form-label">End Surah</label>
          <select id="plan-end-surah" class="form-control">
            ${State.surahs.map(s => `<option value="${s.number}" ${s.number === 114 ? 'selected' : ''}>${s.number}. ${s.name_english}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="display:flex; gap:12px;">
        <div class="form-group" style="flex:1;">
          <label class="form-label">Ayahs / Day</label>
          <input type="number" id="plan-ayahs-day" class="form-control" value="5" min="1">
        </div>
        <div class="form-group" style="flex:1;">
          <label class="form-label">Days / Week</label>
          <input type="number" id="plan-days-week" class="form-control" value="6" min="1" max="7">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Rest Day</label>
        <select id="plan-rest-day" class="form-control">
          <option value="Friday">Friday (Jumu'ah)</option>
          <option value="Sunday">Sunday</option>
          <option value="None">No Rest Days</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%; margin-top:10px;">
        Save & Activate Plan
      </button>
    </form>
  `;
}

async function handleCreatePlan(e) {
  e.preventDefault();
  const data = {
    title: document.getElementById('plan-title').value,
    start_surah: parseInt(document.getElementById('plan-start-surah').value),
    end_surah: parseInt(document.getElementById('plan-end-surah').value),
    ayahs_per_day: parseInt(document.getElementById('plan-ayahs-day').value),
    days_per_week: parseInt(document.getElementById('plan-days-week').value),
    rest_days: document.getElementById('plan-rest-day').value
  };

  try {
    await API.plans.create(data);
    closeModal();
    showToast("Hifz plan activated!");
    navigateTo('home');
  } catch (err) {
    showToast("Error creating plan: " + err.message, true);
  }
}

// Bookmarking prompt
async function promptBookmarkAyah(ayahId) {
  const cat = prompt("Select category (important, difficult, review, favorite):", "favorite");
  if (!cat) return;
  try {
    await API.bookmarks.toggle({ ayah_id: ayahId, category: cat.toLowerCase() });
    showToast("Bookmark updated!");
  } catch (e) {
    showToast("Bookmark error: " + e.message, true);
  }
}

// Private Note prompt
async function promptNoteAyah(ayahId) {
  const content = prompt("Add your reflection / note for this verse:");
  if (!content) return;
  try {
    await API.notes.create({ ayah_id: ayahId, content: content });
    showToast("Private note saved!");
  } catch (e) {
    showToast("Note error: " + e.message, true);
  }
}

// Admin Modal (Section 21)
async function openAdminModal() {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-body-container');
  overlay.classList.add('active');

  box.innerHTML = `<div class="p-5 text-center"><div class="spinner-border text-success"></div><p class="mt-2 text-muted">Loading admin system data...</p></div>`;

  try {
    const statsRes = await API.admin.getStats();
    const usersRes = await API.admin.getUsers();
    const stats = statsRes.data;
    const users = usersRes.data || [];

    box.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title"><i class="ri-shield-keyhole-line-fill"></i> Admin System Oversight</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:18px;">
        <div class="card p-2 text-center">
          <div style="font-weight:800; font-size:1.2rem;">${stats.total_users}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Users</div>
        </div>
        <div class="card p-2 text-center">
          <div style="font-weight:800; font-size:1.2rem;">${stats.total_memorized_ayahs}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Memorized</div>
        </div>
        <div class="card p-2 text-center">
          <div style="font-weight:800; font-size:1.2rem;">${stats.total_revision_sessions}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Revisions</div>
        </div>
      </div>

      <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:10px;">User Accounts</h4>
      <div style="max-height:220px; overflow-y:auto;">
        <table style="width:100%; font-size:0.85rem; border-collapse:collapse;">
          <thead style="background:var(--border-subtle);">
            <tr>
              <th style="padding:6px 10px;">User</th>
              <th style="padding:6px 10px;">Role</th>
              <th style="padding:6px 10px;">Memorized</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr style="border-bottom:1px solid var(--border-subtle);">
                <td style="padding:6px 10px;"><strong>${u.name || u.username}</strong><br><small class="text-muted">${u.email}</small></td>
                <td style="padding:6px 10px;">${u.role}</td>
                <td style="padding:6px 10px;">${u.memorized_ayahs || 0} Ayahs</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    box.innerHTML = `<div class="card p-4 text-danger">Admin access denied: ${e.message}</div>`;
  }
}

// Helpers
function quickPracticeAyah(surahNum, ayahNum) {
  State.activePracticeMode = 'read';
  navigateTo('memorize');
  setTimeout(() => {
    const sSel = document.getElementById('practice-surah-select');
    const sStart = document.getElementById('practice-start-ayah');
    const sEnd = document.getElementById('practice-end-ayah');
    if (sSel) sSel.value = surahNum;
    if (sStart) sStart.value = ayahNum;
    if (sEnd) sEnd.value = ayahNum;
    loadPracticeRangeAyahs();
  }, 100);
}

function startActiveHifzSession() {
  navigateTo('memorize');
}

function startMemorizeForSurah(surahNum) {
  navigateTo('memorize');
  setTimeout(() => {
    const sSel = document.getElementById('practice-surah-select');
    if (sSel) {
      sSel.value = surahNum;
      loadPracticeRangeAyahs();
    }
  }, 100);
}

function showToast(message, isError = false) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
      position: fixed;
      bottom: 95px;
      right: 24px;
      background: var(--surface);
      color: var(--text-main);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px 20px;
      box-shadow: var(--shadow-lg);
      font-size: 0.9rem;
      font-weight: 600;
      z-index: 300;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(toast);
  }
  toast.innerText = message;
  toast.style.borderColor = isError ? 'var(--danger)' : 'var(--primary)';
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}
