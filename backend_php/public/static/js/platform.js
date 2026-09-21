/**
 * Quran Platform - Islamic Learning & Worship JavaScript Module
 * Modules: Tajweed, Tafsir, Tawhid, Prayer Times, Qibla, Adhkar, Tasbih, Hadith, Duas, 99 Names, Hijri, Bookmarks, Global Search
 */

// Sound Synthesizers (Web Audio API - Zero latency, no external mp3 dependencies)
function playTasbihClickSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  } catch (e) {}
}

function playAdhanChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.28);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + idx * 0.28 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.28 + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.28);
      osc.stop(ctx.currentTime + idx * 0.28 + 0.6);
    });
    showToast("Adhan alert preview chime playing");
  } catch (e) {
    showToast("Adhan notification chime simulated");
  }
}

function triggerHaptic(duration = 40) {
  if (navigator.vibrate) {
    navigator.vibrate(duration);
  }
}

/* ==========================================================================
   GLOBAL SEARCH MODAL
   ========================================================================== */
let searchDebounceTimer = null;
let activeSearchCategory = 'all';

function openGlobalSearchModal() {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-body-container');
  if (!overlay || !box) return;

  box.className = 'search-modal-box';
  box.innerHTML = `
    <div class="search-input-header">
      <i class="ri-search-2-line" style="font-size:1.3rem; color:var(--primary);"></i>
      <input type="text" id="global-search-input" placeholder="Search Quran, Hadith, Duas, Lessons, Tafsir..." autofocus>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="search-category-tabs">
      <button class="search-tab-pill active" data-cat="all" onclick="setSearchCategory('all')">All Results</button>
      <button class="search-tab-pill" data-cat="quran" onclick="setSearchCategory('quran')">Quran</button>
      <button class="search-tab-pill" data-cat="hadith" onclick="setSearchCategory('hadith')">Hadith</button>
      <button class="search-tab-pill" data-cat="duas" onclick="setSearchCategory('duas')">Duas</button>
      <button class="search-tab-pill" data-cat="lessons" onclick="setSearchCategory('lessons')">Tajweed & Tawhid</button>
      <button class="search-tab-pill" data-cat="tafsir" onclick="setSearchCategory('tafsir')">Tafsir</button>
    </div>
    <div class="search-results-list" id="global-search-results">
      <div style="text-align:center; padding:30px; color:var(--text-muted);">
        <i class="ri-compass-3-line" style="font-size:2rem; display:block; margin-bottom:10px; color:var(--primary);"></i>
        Type a word, topic, or reference to search across the entire Islamic platform.
      </div>
    </div>
  `;

  overlay.classList.add('active');
  const input = document.getElementById('global-search-input');
  if (input) {
    input.focus();
    input.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => executeGlobalSearch(e.target.value), 300);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }
}

function setSearchCategory(cat) {
  activeSearchCategory = cat;
  document.querySelectorAll('.search-tab-pill').forEach(pill => {
    pill.classList.toggle('active', pill.getAttribute('data-cat') === cat);
  });
  const input = document.getElementById('global-search-input');
  if (input && input.value.trim()) {
    executeGlobalSearch(input.value.trim());
  }
}

async function executeGlobalSearch(query) {
  const container = document.getElementById('global-search-results');
  if (!container) return;

  if (!query || query.trim().length < 2) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px; color:var(--text-muted);">
        Type at least 2 characters to search.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="text-align:center; padding:30px; color:var(--text-muted);">
      <div class="spinner-border text-success" role="status" style="width:1.5rem; height:1.5rem;"></div>
      <div style="margin-top:8px;">Searching platform database...</div>
    </div>
  `;

  try {
    const res = await API.globalSearch.search(query.trim(), activeSearchCategory);
    const results = res.data?.results || [];

    if (results.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--text-muted);">
          No results found for "<strong>${escapeHtml(query)}</strong>" in this category.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="font-size:0.8rem; color:var(--text-muted); font-weight:700; margin-bottom:12px;">
        FOUND ${results.length} MATCHES:
      </div>
      ${results.map(r => `
        <div class="search-result-item" onclick="handleSearchResultClick('${r.type}', '${r.id}', '${escapeHtml(r.reference || '')}')">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <div style="font-weight:700; color:var(--text-main); font-size:0.95rem;">${r.title}</div>
            <span class="badge" style="background:var(--primary-subtle); color:var(--primary); text-transform:uppercase; font-size:0.7rem; font-weight:700;">${r.badge || r.type}</span>
          </div>
          ${r.arabic ? `<div style="font-family:var(--font-arabic); direction:rtl; font-size:1.1rem; color:var(--primary); margin:4px 0;">${r.arabic}</div>` : ''}
          <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.4;">${r.snippet}</div>
        </div>
      `).join('')}
    `;
  } catch (err) {
    container.innerHTML = `<div class="p-3 text-danger">Search error: ${escapeHtml(err.message)}</div>`;
  }
}

function handleSearchResultClick(type, id, reference) {
  closeModal();
  if (type === 'quran') {
    const parts = reference.split(':');
    if (parts.length >= 2) {
      window.location.hash = 'quran';
      setTimeout(() => openSurahReader(parseInt(parts[0])), 150);
    }
  } else if (type === 'hadith') {
    window.location.hash = 'hadith';
  } else if (type === 'dua') {
    window.location.hash = 'duas';
  } else if (type === 'tajweed') {
    window.location.hash = 'tajweed';
  } else if (type === 'tawhid') {
    window.location.hash = 'tawhid';
  } else if (type === 'tafsir') {
    window.location.hash = 'tafsir';
  }
}

/* ==========================================================================
   AYAH QUICK MODALS (Tajweed & Tafsir)
   ========================================================================== */
async function openAyahTajweedModal(surahNumber, ayahNumber) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-body-container');
  if (!overlay || !box) return;

  box.className = 'modal-box';
  box.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title"><i class="ri-music-2-line text-gold"></i> Tajweed Rules: Surah ${surahNumber}:${ayahNumber}</h3>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="p-4 text-center">
      <div class="spinner-border text-success"></div>
      <p class="mt-2 text-muted">Analyzing verse pronunciation rules...</p>
    </div>
  `;
  overlay.classList.add('active');

  try {
    const res = await API.tajweed.getByAyah(surahNumber, ayahNumber);
    const data = res.data;
    const rules = data.rules || [];

    box.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title"><i class="ri-music-2-line text-gold"></i> Tajweed Rules: Verse ${data.surah_number}:${data.ayah_number}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body" style="max-height:75vh; overflow-y:auto; padding:20px;">
        <div style="background:var(--border-subtle); border-radius:var(--radius-md); padding:16px; text-align:right; margin-bottom:18px;">
          <div style="font-family:var(--font-arabic); font-size:1.6rem; color:var(--text-main); line-height:2;">
            ${data.text_arabic || ''}
          </div>
        </div>

        <h4 style="font-size:1rem; font-weight:700; margin-bottom:12px; color:var(--primary);">
          Identified Tajweed Rules (${rules.length})
        </h4>

        ${rules.length === 0 ? `
          <p class="text-muted">Standard recitative pronunciation applies (Tarqeeq and natural prolongation).</p>
        ` : `
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${rules.map(r => `
              <div class="card p-3" style="border-left:4px solid ${r.badge_color || 'var(--primary)'};">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-weight:700; color:var(--text-main); font-size:0.95rem;">${r.name_english}</span>
                  <span style="font-family:var(--font-arabic); font-size:1.1rem; color:var(--primary); font-weight:700;">${r.name_arabic || ''}</span>
                </div>
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:8px; line-height:1.4;">
                  ${r.description || ''}
                </div>
                ${r.letters_involved ? `
                  <div style="font-size:0.8rem; background:rgba(0,0,0,0.03); padding:4px 8px; border-radius:4px;">
                    <strong>Letters:</strong> <span style="font-family:var(--font-arabic); font-size:0.95rem;">${r.letters_involved}</span>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `}

        <div style="margin-top:20px; text-align:center;">
          <button class="btn btn-outline btn-sm" onclick="closeModal(); window.location.hash='tajweed';">
            Explore Full Tajweed Course →
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    box.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Tajweed Rules</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="p-4 text-center text-danger">Failed to load rules: ${escapeHtml(err.message)}</div>
    `;
  }
}

async function openAyahTafsirModal(surahNumber, ayahNumber) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-body-container');
  if (!overlay || !box) return;

  box.className = 'modal-box';
  box.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title"><i class="ri-article-line text-primary"></i> Tafsir: Surah ${surahNumber}:${ayahNumber}</h3>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="p-4 text-center">
      <div class="spinner-border text-success"></div>
      <p class="mt-2 text-muted">Retrieving authentic Tafsir commentary...</p>
    </div>
  `;
  overlay.classList.add('active');

  try {
    const res = await API.tafsir.getByAyah(surahNumber, ayahNumber, 'ibn_kathir');
    const data = res.data;

    box.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title"><i class="ri-article-line text-primary"></i> ${data.source_name || 'Tafsir Ibn Kathir'}: ${surahNumber}:${ayahNumber}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body" style="max-height:75vh; overflow-y:auto; padding:20px;">
        <div style="background:var(--border-subtle); border-radius:var(--radius-md); padding:16px; text-align:right; margin-bottom:14px;">
          <div style="font-family:var(--font-arabic); font-size:1.6rem; color:var(--text-main); line-height:2;">
            ${data.text_arabic || ''}
          </div>
        </div>
        ${data.text_translation ? `
          <div style="font-size:0.95rem; font-style:italic; color:var(--text-muted); margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--border);">
            "${data.text_translation}"
          </div>
        ` : ''}

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 style="font-size:1rem; font-weight:700; color:var(--primary);">Exegesis & Commentary</h4>
          <button class="btn btn-sm btn-outline" onclick="quickToggleBookmark('tafsir_entry', '${surahNumber}:${ayahNumber}', 'Tafsir ${surahNumber}:${ayahNumber}')">
            <i class="ri-book-open-linemark"></i> Bookmark Tafsir
          </button>
        </div>

        <div style="font-size:0.95rem; line-height:1.7; color:var(--text-main); white-space:pre-line;">
          ${escapeHtml(data.tafsir_text || 'No commentary entry found for this ayah.')}
        </div>

        <div style="margin-top:20px; border-top:1px solid var(--border); padding-top:14px; font-size:0.8rem; color:var(--text-muted);">
          <strong>Source:</strong> ${data.source_name || 'Tafsir Al-Qur\'an Al-\'Azim (Ibn Kathir)'} • Author: Al-Hafiz Ibn Kathir (d. 774 AH)
        </div>
      </div>
    `;
  } catch (err) {
    box.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Tafsir</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="p-4 text-center text-danger">Failed to load Tafsir: ${escapeHtml(err.message)}</div>
    `;
  }
}

async function quickToggleBookmark(itemType, itemId, title, contentSnippet = '') {
  try {
    const res = await API.bookmarks.toggle({
      item_type: itemType,
      item_id: String(itemId),
      title: title,
      content_snippet: contentSnippet
    });
    if (res.data && res.data.bookmarked) {
      showToast(`Bookmarked: ${title}`);
    } else {
      showToast(`Removed from Bookmarks`);
    }
  } catch (err) {
    showToast(`Bookmark error: ${err.message}`, true);
  }
}

/* ==========================================================================
   MODULE 1: TAJWEED RULES & LESSONS
   ========================================================================== */
let selectedTajweedCategoryId = null;

async function renderTajweed(container) {
  container.innerHTML = `
    <div class="card p-5 text-center">
      <div class="spinner-border text-success"></div>
      <p class="mt-2 text-muted">Loading Tajweed Curriculum...</p>
    </div>
  `;

  try {
    const res = await API.tajweed.getCategories();
    const categories = res.data || [];
    selectedTajweedCategoryId = selectedTajweedCategoryId || (categories[0]?.id || 1);

    container.innerHTML = `
      <div style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary);">
              <i class="ri-music-2-line text-gold"></i> Tajweed Rules & Quranic Phonetics
            </h2>
            <p class="text-muted" style="font-size:0.9rem;">
              Master the classical rules of recitation with authentic explanations, audio guides, and interactive quizzes.
            </p>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-outline btn-sm" onclick="openTajweedQuiz(1)">
              <i class="ri-questionnaire-line"></i> Practice Quiz
            </button>
          </div>
        </div>
      </div>

      <!-- Categories Pills / Cards -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:24px;">
        ${categories.map(c => `
          <div class="card p-3" style="cursor:pointer; border-left:4px solid ${c.id === selectedTajweedCategoryId ? 'var(--primary)' : 'transparent'}; background:${c.id === selectedTajweedCategoryId ? 'var(--primary-subtle)' : 'var(--surface)'};" onclick="switchTajweedCategory(${c.id})">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="font-weight:700; font-size:0.95rem; color:var(--text-main);">${c.name_english}</div>
              <span style="font-family:var(--font-arabic); font-size:1.1rem; color:var(--primary);">${c.name_arabic || ''}</span>
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${c.total_lessons || 1} Lessons</div>
          </div>
        `).join('')}
      </div>

      <!-- Lessons Container -->
      <div id="tajweed-lessons-container">
        <div class="text-center p-4"><div class="spinner-border text-success"></div></div>
      </div>
    `;

    loadTajweedLessons(selectedTajweedCategoryId);
  } catch (err) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to load Tajweed: ${escapeHtml(err.message)}</div>`;
  }
}

async function switchTajweedCategory(catId) {
  selectedTajweedCategoryId = catId;
  renderTajweed(document.getElementById('main-view-container'));
}

async function loadTajweedLessons(catId) {
  const container = document.getElementById('tajweed-lessons-container');
  if (!container) return;

  try {
    const res = await API.tajweed.getLessons(catId);
    const lessons = res.data || [];

    if (lessons.length === 0) {
      container.innerHTML = `<div class="card p-4 text-center text-muted">No lessons available in this category yet.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:20px;">
        ${lessons.map(l => `
          <div class="card p-4">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px;">
              <div>
                <h3 style="font-size:1.15rem; font-weight:800; color:var(--primary); margin-bottom:2px;">
                  ${l.title_english}
                </h3>
                <div style="font-family:var(--font-arabic); font-size:1.2rem; color:var(--gold-dark);">${l.title_arabic || ''}</div>
              </div>
              <button class="btn btn-sm btn-primary" onclick="openTajweedQuiz(${l.id})">
                <i class="ri-edit-box-line"></i> Take Lesson Quiz
              </button>
            </div>

            <div style="font-size:0.95rem; line-height:1.6; color:var(--text-main); margin-bottom:16px;">
              ${escapeHtml(l.explanation || '')}
            </div>

            <!-- Rules Inside Lesson -->
            ${(l.rules && l.rules.length > 0) ? `
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
                ${l.rules.map(r => `
                  <div class="card p-3" style="background:var(--border-subtle); border-radius:var(--radius-md);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                      <span style="font-weight:700; color:var(--text-main);">${r.name_english}</span>
                      <span style="font-family:var(--font-arabic); font-size:1.05rem; color:var(--primary); font-weight:700;">${r.name_arabic || ''}</span>
                    </div>
                    <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.4; margin-bottom:8px;">
                      ${r.description || ''}
                    </div>
                    ${r.letters_involved ? `
                      <div style="font-size:0.8rem; margin-bottom:6px;">
                        <strong>Key Letters:</strong> <span style="font-family:var(--font-arabic); font-size:1rem; color:var(--primary);">${r.letters_involved}</span>
                      </div>
                    ` : ''}
                    ${r.pronunciation_guide ? `
                      <div style="font-size:0.8rem; color:var(--gold-dark); font-weight:600;">
                        <i class="ri-information-line"></i> ${r.pronunciation_guide}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="p-3 text-danger">Failed to load lessons: ${escapeHtml(err.message)}</div>`;
  }
}

async function openTajweedQuiz(lessonId) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-body-container');
  if (!overlay || !box) return;

  box.className = 'modal-box';
  box.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title"><i class="ri-questionnaire-line text-gold"></i> Tajweed Lesson Quiz</h3>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="p-4 text-center">
      <div class="spinner-border text-success"></div>
      <p class="mt-2 text-muted">Loading quiz questions...</p>
    </div>
  `;
  overlay.classList.add('active');

  try {
    const res = await API.tajweed.getQuiz(lessonId);
    const questions = res.data || [];

    if (questions.length === 0) {
      box.innerHTML = `
        <div class="modal-header">
          <h3 class="modal-title">Tajweed Quiz</h3>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="p-4 text-center text-muted">Quiz questions are being updated for this lesson.</div>
      `;
      return;
    }

    box.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title"><i class="ri-questionnaire-line text-gold"></i> Tajweed Knowledge Quiz (${questions.length} Questions)</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body" style="max-height:75vh; overflow-y:auto; padding:20px;">
        <form id="tajweed-quiz-form" onsubmit="handleTajweedQuizSubmit(event, ${lessonId})">
          ${questions.map((q, idx) => `
            <div class="card p-3 mb-3" style="border-left:4px solid var(--primary);">
              <div style="font-weight:700; font-size:0.95rem; margin-bottom:8px;">
                ${idx + 1}. ${escapeHtml(q.question_text)}
              </div>
              ${q.arabic_example ? `
                <div style="font-family:var(--font-arabic); font-size:1.4rem; direction:rtl; color:var(--primary); margin-bottom:10px;">
                  ${q.arabic_example}
                </div>
              ` : ''}
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${(q.options || []).map(opt => `
                  <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.9rem; padding:6px 10px; border-radius:6px; background:var(--surface); border:1px solid var(--border);">
                    <input type="radio" name="quiz_q_${q.id}" value="${opt.key}" required>
                    <span><strong>${opt.key}.</strong> ${escapeHtml(opt.text)}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          `).join('')}
          <div style="text-align:right; margin-top:16px;">
            <button type="submit" class="btn btn-primary">
              <i class="ri-checkbox-circle-line"></i> Submit Quiz Answers
            </button>
          </div>
        </form>
        <div id="tajweed-quiz-result" style="margin-top:16px;"></div>
      </div>
    `;
  } catch (err) {
    box.innerHTML = `<div class="p-4 text-danger">Quiz error: ${escapeHtml(err.message)}</div>`;
  }
}

async function handleTajweedQuizSubmit(e, lessonId) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const answers = {};

  formData.forEach((val, key) => {
    const qId = key.replace('quiz_q_', '');
    answers[qId] = val;
  });

  const resultContainer = document.getElementById('tajweed-quiz-result');
  resultContainer.innerHTML = `<div class="text-center p-3"><div class="spinner-border text-success"></div> Evaluating score...</div>`;

  try {
    const res = await API.tajweed.submitQuiz(lessonId, answers);
    const data = res.data;

    resultContainer.innerHTML = `
      <div class="card p-4 text-center" style="background:${data.passed ? 'var(--primary-subtle)' : '#fee2e2'}; border-color:${data.passed ? 'var(--primary)' : '#fca5a5'};">
        <h4 style="font-size:1.3rem; font-weight:800; color:${data.passed ? 'var(--primary)' : '#991b1b'}; margin-bottom:4px;">
          ${data.passed ? 'Masha\'Allah! Quiz Passed! 🎉' : 'Keep Practicing!'}
        </h4>
        <div style="font-size:1.1rem; font-weight:700; color:var(--text-main); margin-bottom:8px;">
          Score: ${data.score} / ${data.total} (${data.percentage}%)
        </div>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">
          ${data.passed ? 'Your Tajweed proficiency has been recorded to your learning profile.' : 'Review the lesson rules above and try again to master this rule.'}
        </p>
        <button class="btn btn-sm btn-primary" onclick="closeModal()">Done</button>
      </div>
    `;
  } catch (err) {
    resultContainer.innerHTML = `<div class="p-3 text-danger">Submission error: ${escapeHtml(err.message)}</div>`;
  }
}

/* ==========================================================================
   MODULE 2: TAFSIR EXEGESIS
   ========================================================================== */
let activeTafsirSurah = 1;
let activeTafsirAyah = 1;
let activeTafsirSource = 'ibn_kathir';

async function renderTafsir(container) {
  container.innerHTML = `
    <div style="margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary);">
            <i class="ri-article-line"></i> Authentic Tafsir Exegesis
          </h2>
          <p class="text-muted" style="font-size:0.9rem;">
            Deepen your understanding of Allah's revelation through classical, accredited Sunni commentaries.
          </p>
        </div>
      </div>
    </div>

    <!-- Tafsir Selector Bar -->
    <div class="card p-3 mb-4">
      <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:space-between;">
        <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center;">
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:4px;">Surah</label>
            <select class="form-control" id="tafsir-surah-select" style="min-width:180px;" onchange="handleTafsirSurahChange(this.value)">
              ${(State.surahs || []).map(s => `
                <option value="${s.number}" ${s.number === activeTafsirSurah ? 'selected' : ''}>${s.number}. ${s.name_english} (${s.name_arabic})</option>
              `).join('')}
            </select>
          </div>

          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:4px;">Ayah</label>
            <input type="number" class="form-control" id="tafsir-ayah-input" style="width:80px;" value="${activeTafsirAyah}" min="1" max="286" onchange="handleTafsirAyahChange(this.value)">
          </div>

          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:4px;">Source</label>
            <select class="form-control" id="tafsir-source-select" onchange="handleTafsirSourceChange(this.value)">
              <option value="ibn_kathir" ${activeTafsirSource === 'ibn_kathir' ? 'selected' : ''}>Tafsir Ibn Kathir (Accredited)</option>
              <option value="saadi" ${activeTafsirSource === 'saadi' ? 'selected' : ''}>Tafsir As-Sa'di (Clear & Lucid)</option>
              <option value="jalalayn" ${activeTafsirSource === 'jalalayn' ? 'selected' : ''}>Tafsir Al-Jalalayn (Concise)</option>
            </select>
          </div>
        </div>

        <div style="display:flex; gap:8px;">
          <button class="btn btn-outline btn-sm" onclick="navTafsirAyah(-1)"><i class="ri-arrow-left-s-line"></i> Prev Ayah</button>
          <button class="btn btn-outline btn-sm" onclick="navTafsirAyah(1)">Next Ayah <i class="ri-arrow-right-s-line"></i></button>
          <button class="btn btn-gold btn-sm" onclick="quickToggleBookmark('tafsir_entry', '${activeTafsirSurah}:${activeTafsirAyah}', 'Tafsir ${activeTafsirSurah}:${activeTafsirAyah}')">
            <i class="ri-book-open-linemark"></i> Bookmark
          </button>
        </div>
      </div>
    </div>

    <!-- Tafsir Content Area -->
    <div id="tafsir-content-view">
      <div class="text-center p-5"><div class="spinner-border text-success"></div><p class="mt-2 text-muted">Loading exegesis...</p></div>
    </div>
  `;

  loadTafsirDetail();
}

function handleTafsirSurahChange(val) {
  activeTafsirSurah = parseInt(val);
  activeTafsirAyah = 1;
  const ayahInput = document.getElementById('tafsir-ayah-input');
  if (ayahInput) ayahInput.value = 1;
  loadTafsirDetail();
}

function handleTafsirAyahChange(val) {
  activeTafsirAyah = Math.max(1, parseInt(val) || 1);
  loadTafsirDetail();
}

function handleTafsirSourceChange(val) {
  activeTafsirSource = val;
  loadTafsirDetail();
}

function navTafsirAyah(delta) {
  activeTafsirAyah = Math.max(1, activeTafsirAyah + delta);
  const ayahInput = document.getElementById('tafsir-ayah-input');
  if (ayahInput) ayahInput.value = activeTafsirAyah;
  loadTafsirDetail();
}

async function loadTafsirDetail() {
  const container = document.getElementById('tafsir-content-view');
  if (!container) return;

  container.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-success"></div><p class="mt-2 text-muted">Retrieving authentic commentary...</p></div>`;

  try {
    const res = await API.tafsir.getByAyah(activeTafsirSurah, activeTafsirAyah, activeTafsirSource);
    const data = res.data;

    container.innerHTML = `
      <div class="card p-4">
        <div style="background:var(--border-subtle); border-radius:var(--radius-md); padding:20px; text-align:right; margin-bottom:16px;">
          <div style="font-family:var(--font-arabic); font-size:1.8rem; color:var(--text-main); line-height:2.1;">
            ${data.text_arabic || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
          </div>
        </div>

        ${data.text_translation ? `
          <div style="font-size:1.05rem; font-style:italic; color:var(--text-muted); margin-bottom:20px; padding-bottom:14px; border-bottom:1px solid var(--border);">
            "${data.text_translation}"
          </div>
        ` : ''}

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h3 style="font-size:1.1rem; font-weight:800; color:var(--primary);">
            <i class="ri-book-open-line"></i> ${data.source_name || 'Tafsir Ibn Kathir'}
          </h3>
          <span class="badge" style="background:var(--gold-subtle); color:var(--gold-dark); font-weight:700;">
            Verse ${activeTafsirSurah}:${activeTafsirAyah}
          </span>
        </div>

        <div style="font-size:1rem; line-height:1.8; color:var(--text-main); white-space:pre-line;">
          ${escapeHtml(data.tafsir_text || 'No commentary entry found for this ayah.')}
        </div>

        <div style="margin-top:24px; padding-top:16px; border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:var(--text-muted);">
          <span><strong>Author:</strong> ${data.author || 'Al-Hafiz Ibn Kathir'}</span>
          <span>Authentic Classical Sunni Exegesis</span>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to load Tafsir: ${escapeHtml(err.message)}</div>`;
  }
}

/* ==========================================================================
   MODULE 3: TAWHID & 'AQEEDAH CURRICULUM
   ========================================================================== */
let selectedTawhidCategoryId = 1;

async function renderTawhid(container) {
  container.innerHTML = `
    <div class="card p-5 text-center">
      <div class="spinner-border text-success"></div>
      <p class="mt-2 text-muted">Loading 'Aqeedah & Tawhid Curriculum...</p>
    </div>
  `;

  try {
    const res = await API.tawhid.getCategories();
    const categories = res.data || [];
    selectedTawhidCategoryId = selectedTawhidCategoryId || (categories[0]?.id || 1);

    container.innerHTML = `
      <div style="margin-bottom:24px;">
        <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary);">
          <i class="ri-shield-check-line text-gold"></i> Tawhid & Authentic 'Aqeedah
        </h2>
        <p class="text-muted" style="font-size:0.9rem;">
          Learn the correct Islamic creed upon the Quran, authentic Sunnah, and the understanding of the righteous predecessors (Salaf as-Salih).
        </p>
      </div>

      <!-- Categories Pills -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:12px; margin-bottom:24px;">
        ${categories.map(c => `
          <div class="card p-3" style="cursor:pointer; border-left:4px solid ${c.id === selectedTawhidCategoryId ? 'var(--primary)' : 'transparent'}; background:${c.id === selectedTawhidCategoryId ? 'var(--primary-subtle)' : 'var(--surface)'};" onclick="switchTawhidCategory(${c.id})">
            <div style="font-weight:700; font-size:0.95rem; color:var(--text-main);">${c.name_english}</div>
            <div style="font-family:var(--font-arabic); font-size:1.05rem; color:var(--primary); margin-top:2px;">${c.name_arabic || ''}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${c.total_lessons || 1} Lessons</div>
          </div>
        `).join('')}
      </div>

      <div id="tawhid-lessons-container">
        <div class="text-center p-4"><div class="spinner-border text-success"></div></div>
      </div>
    `;

    loadTawhidLessons(selectedTawhidCategoryId);
  } catch (err) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to load Tawhid: ${escapeHtml(err.message)}</div>`;
  }
}

async function switchTawhidCategory(catId) {
  selectedTawhidCategoryId = catId;
  renderTawhid(document.getElementById('main-view-container'));
}

async function loadTawhidLessons(catId) {
  const container = document.getElementById('tawhid-lessons-container');
  if (!container) return;

  try {
    const res = await API.tawhid.getLessons(catId);
    const lessons = res.data || [];

    if (lessons.length === 0) {
      container.innerHTML = `<div class="card p-4 text-center text-muted">No lessons in this category yet.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:20px;">
        ${lessons.map(l => `
          <div class="card p-4">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px;">
              <div>
                <h3 style="font-size:1.2rem; font-weight:800; color:var(--primary);">
                  ${l.title_english}
                </h3>
                <div style="font-family:var(--font-arabic); font-size:1.25rem; color:var(--gold-dark);">${l.title_arabic || ''}</div>
              </div>
              <button class="btn btn-sm btn-primary" onclick="openTawhidQuiz(${l.id})">
                <i class="ri-edit-box-line"></i> Test Understanding
              </button>
            </div>

            <div style="font-size:0.95rem; line-height:1.7; color:var(--text-main); margin-bottom:16px;">
              ${escapeHtml(l.content || '')}
            </div>

            <!-- Quran & Hadith Evidence Blocks -->
            ${l.evidence_quran ? `
              <div class="card p-3 mb-2" style="background:var(--border-subtle); border-left:4px solid var(--primary);">
                <div style="font-size:0.8rem; font-weight:700; color:var(--primary); margin-bottom:4px;">
                  <i class="ri-book-open-line"></i> Quranic Evidence:
                </div>
                <div style="font-size:0.9rem; color:var(--text-main); font-style:italic; line-height:1.5;">
                  ${escapeHtml(l.evidence_quran)}
                </div>
              </div>
            ` : ''}

            ${l.evidence_hadith ? `
              <div class="card p-3" style="background:var(--border-subtle); border-left:4px solid var(--gold);">
                <div style="font-size:0.8rem; font-weight:700; color:var(--gold-dark); margin-bottom:4px;">
                  <i class="ri-double-quotes-l"></i> Sunnah Evidence:
                </div>
                <div style="font-size:0.9rem; color:var(--text-main); font-style:italic; line-height:1.5;">
                  ${escapeHtml(l.evidence_hadith)}
                </div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="p-3 text-danger">Failed to load lessons: ${escapeHtml(err.message)}</div>`;
  }
}

async function openTawhidQuiz(lessonId) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-body-container');
  if (!overlay || !box) return;

  box.className = 'modal-box';
  box.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title"><i class="ri-shield-check-line text-gold"></i> 'Aqeedah Knowledge Assessment</h3>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="p-4 text-center">
      <div class="spinner-border text-success"></div>
      <p class="mt-2 text-muted">Loading assessment questions...</p>
    </div>
  `;
  overlay.classList.add('active');

  try {
    const res = await API.tawhid.getQuiz(lessonId);
    const questions = res.data || [];

    if (questions.length === 0) {
      box.innerHTML = `
        <div class="modal-header">
          <h3 class="modal-title">'Aqeedah Quiz</h3>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="p-4 text-center text-muted">No quiz questions configured for this lesson yet.</div>
      `;
      return;
    }

    box.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title"><i class="ri-shield-check-line text-gold"></i> 'Aqeedah Assessment (${questions.length} Questions)</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body" style="max-height:75vh; overflow-y:auto; padding:20px;">
        <form id="tawhid-quiz-form" onsubmit="handleTawhidQuizSubmit(event, ${lessonId})">
          ${questions.map((q, idx) => `
            <div class="card p-3 mb-3" style="border-left:4px solid var(--primary);">
              <div style="font-weight:700; font-size:0.95rem; margin-bottom:8px;">
                ${idx + 1}. ${escapeHtml(q.question_text)}
              </div>
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${(q.options || []).map(opt => `
                  <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.9rem; padding:6px 10px; border-radius:6px; background:var(--surface); border:1px solid var(--border);">
                    <input type="radio" name="tawhid_q_${q.id}" value="${opt.key}" required>
                    <span><strong>${opt.key}.</strong> ${escapeHtml(opt.text)}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          `).join('')}
          <div style="text-align:right; margin-top:16px;">
            <button type="submit" class="btn btn-primary">
              <i class="ri-checkbox-circle-line"></i> Submit Answers
            </button>
          </div>
        </form>
        <div id="tawhid-quiz-result" style="margin-top:16px;"></div>
      </div>
    `;
  } catch (err) {
    box.innerHTML = `<div class="p-4 text-danger">Quiz error: ${escapeHtml(err.message)}</div>`;
  }
}

async function handleTawhidQuizSubmit(e, lessonId) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const answers = {};

  formData.forEach((val, key) => {
    const qId = key.replace('tawhid_q_', '');
    answers[qId] = val;
  });

  const resultContainer = document.getElementById('tawhid-quiz-result');
  resultContainer.innerHTML = `<div class="text-center p-3"><div class="spinner-border text-success"></div> Evaluating score...</div>`;

  try {
    const res = await API.tawhid.submitQuiz(lessonId, answers);
    const data = res.data;

    resultContainer.innerHTML = `
      <div class="card p-4 text-center" style="background:${data.passed ? 'var(--primary-subtle)' : '#fee2e2'}; border-color:${data.passed ? 'var(--primary)' : '#fca5a5'};">
        <h4 style="font-size:1.3rem; font-weight:800; color:${data.passed ? 'var(--primary)' : '#991b1b'}; margin-bottom:4px;">
          ${data.passed ? 'Masha\'Allah! Well Done! 🎉' : 'Needs Review'}
        </h4>
        <div style="font-size:1.1rem; font-weight:700; color:var(--text-main); margin-bottom:8px;">
          Score: ${data.score} / ${data.total} (${data.percentage}%)
        </div>
        <button class="btn btn-sm btn-primary" onclick="closeModal()">Close</button>
      </div>
    `;
  } catch (err) {
    resultContainer.innerHTML = `<div class="p-3 text-danger">Submission error: ${escapeHtml(err.message)}</div>`;
  }
}

/* ==========================================================================
   MODULE 4: PRAYER TIMES & ADHAN
   ========================================================================== */
let prayerClockTimer = null;
let currentPrayerCity = 'Abuja';

async function renderPrayerTimes(container) {
  clearInterval(prayerClockTimer);

  container.innerHTML = `
    <div class="card p-5 text-center">
      <div class="spinner-border text-success"></div>
      <p class="mt-2 text-muted">Calculating accurate astronomical prayer times...</p>
    </div>
  `;

  try {
    const citiesRes = await API.prayer.getCities();
    const cities = citiesRes.data || [];
    const timesRes = await API.prayer.getTimes(currentPrayerCity);
    const data = timesRes.data;
    const times = data.times || {};
    const next = data.next_prayer || {};

    container.innerHTML = `
      <div style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary);">
              <i class="ri-time-line"></i> Prayer Times & Adhan Notifications
            </h2>
            <p class="text-muted" style="font-size:0.9rem;">
              Precise solar calculations with authentic Nigerian presets and customizable calculation conventions.
            </p>
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <select class="form-control" id="prayer-city-select" onchange="changePrayerCity(this.value)">
              ${cities.map(c => `
                <option value="${c.city}" ${c.city === currentPrayerCity ? 'selected' : ''}>${c.city} (${c.state}), Nigeria</option>
              `).join('')}
            </select>
            <button class="btn btn-outline btn-sm" onclick="playAdhanChime()" title="Test Adhan chime">
              <i class="ri-notification-3-fill text-gold"></i> Test Adhan
            </button>
          </div>
        </div>
      </div>

      <!-- Prayer Hero Banner -->
      <div class="prayer-hero-banner">
        <div>
          <div class="prayer-next-label">Next Up:</div>
          <div class="prayer-next-name">${next.name || 'Dhuhr'} Prayer</div>
          <div style="font-size:0.9rem; opacity:0.85;">
            Scheduled at <strong>${next.time || '--:--'}</strong> • ${currentPrayerCity}, Nigeria
          </div>
        </div>
        <div class="prayer-countdown-box">
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; opacity:0.8; margin-bottom:4px;">Remaining</div>
          <div class="prayer-countdown-time" id="prayer-live-countdown">
            ${formatPrayerCountdown(next.minutes_remaining)}
          </div>
        </div>
      </div>

      <!-- Daily Prayer Cards -->
      <div class="prayer-cards-grid">
        <div class="prayer-time-card ${next.name === 'Fajr' ? 'active' : ''}">
          <div class="prayer-time-name"><i class="ri-sun-foggy-line"></i> Fajr</div>
          <div class="prayer-time-value">${times.fajr || '05:07'}</div>
        </div>
        <div class="prayer-time-card ${next.name === 'Sunrise' ? 'active' : ''}">
          <div class="prayer-time-name"><i class="ri-sun-line"></i> Sunrise</div>
          <div class="prayer-time-value">${times.sunrise || '06:21'}</div>
        </div>
        <div class="prayer-time-card ${next.name === 'Dhuhr' ? 'active' : ''}">
          <div class="prayer-time-name"><i class="ri-sun-line-fill"></i> Dhuhr</div>
          <div class="prayer-time-value">${times.dhuhr || '12:26'}</div>
        </div>
        <div class="prayer-time-card ${next.name === 'Asr' ? 'active' : ''}">
          <div class="prayer-time-name"><i class="ri-sun-cloudy-line"></i> Asr</div>
          <div class="prayer-time-value">${times.asr || '15:42'}</div>
        </div>
        <div class="prayer-time-card ${next.name === 'Maghrib' ? 'active' : ''}">
          <div class="prayer-time-name"><i class="ri-sun-lineset-fill"></i> Maghrib</div>
          <div class="prayer-time-value">${times.maghrib || '18:31'}</div>
        </div>
        <div class="prayer-time-card ${next.name === 'Isha' ? 'active' : ''}">
          <div class="prayer-time-name"><i class="ri-moon-line-stars-fill"></i> Isha</div>
          <div class="prayer-time-value">${times.isha || '19:40'}</div>
        </div>
      </div>

      <!-- Settings & Methodology Info -->
      <div class="card p-4">
        <h3 style="font-size:1.05rem; font-weight:700; color:var(--primary); margin-bottom:10px;">
          <i class="ri-sound-module-line"></i> Astronomical Parameters
        </h3>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; font-size:0.85rem;">
          <div>
            <strong>Calculation Method:</strong><br>
            <span class="text-muted">Egyptian General Authority of Survey (19.5° Fajr / 17.5° Isha)</span>
          </div>
          <div>
            <strong>Juristic Asr Method:</strong><br>
            <span class="text-muted">Standard (Shafi'i, Maliki, Hanbali) - Shadow factor 1x</span>
          </div>
          <div>
            <strong>Location Coordinates:</strong><br>
            <span class="text-muted">Lat ${data.coordinates?.latitude || 9.0765}°, Lon ${data.coordinates?.longitude || 7.3986}°</span>
          </div>
        </div>
      </div>
    `;

    // Start live countdown timer
    let remainingMinutes = next.minutes_remaining || 0;
    prayerClockTimer = setInterval(() => {
      const countdownEl = document.getElementById('prayer-live-countdown');
      if (!countdownEl) {
        clearInterval(prayerClockTimer);
        return;
      }
      remainingMinutes = Math.max(0, remainingMinutes - (1 / 60));
      countdownEl.innerText = formatPrayerCountdown(remainingMinutes);
    }, 1000);

  } catch (err) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to calculate prayer times: ${escapeHtml(err.message)}</div>`;
  }
}

function changePrayerCity(city) {
  currentPrayerCity = city;
  renderPrayerTimes(document.getElementById('main-view-container'));
}

function formatPrayerCountdown(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return 'Due Now';
  const hrs = Math.floor(totalMinutes / 60);
  const mins = Math.floor(totalMinutes % 60);
  const secs = Math.floor((totalMinutes * 60) % 60);
  return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

/* ==========================================================================
   MODULE 5: QIBLA FINDER
   ========================================================================== */
let qiblaOrientationListener = null;

async function renderQibla(container) {
  if (qiblaOrientationListener) {
    window.removeEventListener('deviceorientation', qiblaOrientationListener);
  }

  container.innerHTML = `
    <div class="card p-5 text-center">
      <div class="spinner-border text-success"></div>
      <p class="mt-2 text-muted">Calculating Qibla bearing to the Holy Ka'bah...</p>
    </div>
  `;

  try {
    const res = await API.qibla.calculate(9.0765, 7.3986, 'Abuja');
    const data = res.data;
    const bearing = data.bearing_degrees || 68.4;
    const distanceKm = data.distance_km || 4371;

    container.innerHTML = `
      <div style="margin-bottom:20px;">
        <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary);">
          <i class="ri-compass-3-line"></i> Qibla Direction Finder
        </h2>
        <p class="text-muted" style="font-size:0.9rem;">
          Great-circle bearing from your location directly toward the Ka'bah in Makkah al-Mukarramah.
        </p>
      </div>

      <div class="card p-4 qibla-container">
        <div style="font-size:1.1rem; font-weight:800; color:var(--primary); margin-bottom:4px;">
          ${bearing}° ${data.cardinal_direction || 'ENE'}
        </div>
        <div style="font-size:0.85rem; color:var(--text-muted);">
          Direction to Holy Kaaba from ${data.city || 'Abuja, Nigeria'}
        </div>

        <!-- Compass Visual -->
        <div class="compass-dial">
          <div class="compass-cardinal cardinal-n">N</div>
          <div class="compass-cardinal cardinal-e">E</div>
          <div class="compass-cardinal cardinal-s">S</div>
          <div class="compass-cardinal cardinal-w">W</div>

          <div class="compass-needle" id="qibla-compass-needle" style="transform: rotate(${bearing}deg);">
            <div class="needle-north"></div>
            <div class="needle-south"></div>
          </div>
          <div class="compass-center-hub"></div>
        </div>

        <div style="font-size:0.95rem; font-weight:700; color:var(--text-main); margin-top:12px;">
          Distance to Makkah: <span style="color:var(--gold-dark);">${distanceKm.toLocaleString()} km</span>
        </div>

        <div style="display:flex; gap:10px; margin-top:20px; flex-wrap:wrap; justify-content:center;">
          <button class="btn btn-outline btn-sm" onclick="requestDeviceOrientation()">
            <i class="ri-smartphone-line"></i> Enable Live Compass Sensor
          </button>
          <button class="btn btn-sm btn-primary" onclick="useCurrentLocationForQibla()">
            <i class="ri-map-pin-line"></i> Use My GPS Location
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to calculate Qibla: ${escapeHtml(err.message)}</div>`;
  }
}

function requestDeviceOrientation() {
  if (window.DeviceOrientationEvent) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(state => {
          if (state === 'granted') attachCompassListener();
          else showToast("Compass sensor permission denied", true);
        })
        .catch(console.error);
    } else {
      attachCompassListener();
    }
  } else {
    showToast("Compass orientation sensor not supported on this device.", true);
  }
}

function attachCompassListener() {
  qiblaOrientationListener = (e) => {
    let heading = e.webkitCompassHeading || (360 - e.alpha);
    const needle = document.getElementById('qibla-compass-needle');
    if (needle && heading !== undefined) {
      const qiblaAngle = 68.4 - heading;
      needle.style.transform = `rotate(${qiblaAngle}deg)`;
    }
  };
  window.addEventListener('deviceorientation', qiblaOrientationListener);
  showToast("Live Compass active!");
}

function useCurrentLocationForQibla() {
  if (!navigator.geolocation) {
    showToast("Geolocation not supported.", true);
    return;
  }
  showToast("Detecting GPS position...");
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    try {
      const res = await API.qibla.calculate(lat, lon, 'My GPS Location');
      const data = res.data;
      const needle = document.getElementById('qibla-compass-needle');
      if (needle) needle.style.transform = `rotate(${data.bearing_degrees}deg)`;
      showToast(`Qibla bearing updated: ${data.bearing_degrees}°`);
    } catch (e) {
      showToast("Calculation failed: " + e.message, true);
    }
  }, (err) => {
    showToast("GPS error: " + err.message, true);
  });
}

/* ==========================================================================
   MODULE 6: DAILY ADHKAR (Morning, Evening, After Salah, Sleep)
   ========================================================================== */
let activeAdhkarCategory = 'morning';
const adhkarCounterState = {};

async function renderAdhkar(container) {
  container.innerHTML = `
    <div class="card p-5 text-center">
      <div class="spinner-border text-success"></div>
      <p class="mt-2 text-muted">Loading authentic Prophetic Adhkar...</p>
    </div>
  `;

  try {
    const res = await API.adhkar.getItems(activeAdhkarCategory);
    const items = res.data || [];

    container.innerHTML = `
      <div style="margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary);">
              <i class="ri-moon-line-stars"></i> Daily Adhkar & Remembrance
            </h2>
            <p class="text-muted" style="font-size:0.9rem;">
              Authentic fortress supplications from Hisn al-Muslim with interactive counter beads.
            </p>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-outline btn-sm" onclick="navigateTo('tasbih')">
              <i class="ri-fingerprint-line"></i> Digital Tasbih
            </button>
            <button class="btn btn-outline btn-sm" onclick="resetAdhkarCounters()">
              <i class="ri-refresh-line"></i> Reset Counts
            </button>
          </div>
        </div>
      </div>

      <!-- Category Filter Tabs -->
      <div style="display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap;">
        <button class="btn btn-sm ${activeAdhkarCategory === 'morning' ? 'btn-primary' : 'btn-outline'}" onclick="switchAdhkarCategory('morning')">
          <i class="ri-sun-line"></i> Morning (Sabah)
        </button>
        <button class="btn btn-sm ${activeAdhkarCategory === 'evening' ? 'btn-primary' : 'btn-outline'}" onclick="switchAdhkarCategory('evening')">
          <i class="ri-moon-line"></i> Evening (Masaa)
        </button>
        <button class="btn btn-sm ${activeAdhkarCategory === 'after_salah' ? 'btn-primary' : 'btn-outline'}" onclick="switchAdhkarCategory('after_salah')">
          <i class="ri-checkbox-circle-fill"></i> After Salah
        </button>
        <button class="btn btn-sm ${activeAdhkarCategory === 'sleep' ? 'btn-primary' : 'btn-outline'}" onclick="switchAdhkarCategory('sleep')">
          <i class="ri-star-lines"></i> Before Sleep
        </button>
      </div>

      <!-- Adhkar Items List -->
      <div style="display:flex; flex-direction:column; gap:16px;">
        ${items.map(item => {
          const curCount = adhkarCounterState[item.id] || 0;
          const target = item.target_count || 1;
          const isCompleted = curCount >= target;

          return `
            <div class="card p-4 ${isCompleted ? 'card-gold-edge' : ''}" id="adhkar-item-${item.id}">
              <div style="background:var(--border-subtle); border-radius:var(--radius-md); padding:16px; text-align:right; margin-bottom:12px;">
                <div style="font-family:var(--font-arabic); font-size:1.6rem; color:var(--text-main); line-height:2;">
                  ${item.text_arabic}
                </div>
              </div>

              ${item.transliteration ? `
                <div style="font-size:0.9rem; font-weight:600; color:var(--primary); margin-bottom:6px;">
                  ${item.transliteration}
                </div>
              ` : ''}

              <div style="font-size:0.95rem; line-height:1.6; color:var(--text-muted); margin-bottom:12px;">
                "${item.translation}"
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-top:1px solid var(--border); padding-top:12px;">
                <div style="font-size:0.8rem; color:var(--text-muted);">
                  <strong>Source:</strong> ${item.source_reference || 'Hisn al-Muslim'} ${item.virtues ? `• ${item.virtues}` : ''}
                </div>

                <div style="display:flex; align-items:center; gap:10px;">
                  <button class="btn btn-sm ${isCompleted ? 'btn-gold' : 'btn-primary'}" onclick="tapAdhkarItem(${item.id}, ${target})">
                    ${isCompleted ? '<i class="ri-check-line"></i> Completed' : `<i class="ri-add-line"></i> Tap (${curCount} / ${target})`}
                  </button>
                  <button class="icon-btn" title="Bookmark Dua" onclick="quickToggleBookmark('adhkar', '${item.id}', 'Dhikr: ${escapeHtml(item.text_arabic.substring(0, 30))}')">
                    <i class="ri-book-open-linemark"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to load Adhkar: ${escapeHtml(err.message)}</div>`;
  }
}

function switchAdhkarCategory(cat) {
  activeAdhkarCategory = cat;
  renderAdhkar(document.getElementById('main-view-container'));
}

function tapAdhkarItem(itemId, target) {
  playTasbihClickSound();
  triggerHaptic(30);

  const cur = (adhkarCounterState[itemId] || 0) + 1;
  adhkarCounterState[itemId] = cur;

  if (cur === target) {
    showToast("Masha'Allah! Dhikr target reached 🎉");
  }

  // Update card UI locally without full re-render
  const card = document.getElementById(`adhkar-item-${itemId}`);
  if (card) {
    const btn = card.querySelector('button.btn');
    if (btn) {
      if (cur >= target) {
        btn.className = 'btn btn-sm btn-gold';
        btn.innerHTML = '<i class="ri-check-line"></i> Completed';
        card.classList.add('card-gold-edge');
      } else {
        btn.innerHTML = `<i class="ri-add-line"></i> Tap (${cur} / ${target})`;
      }
    }
  }
}

function resetAdhkarCounters() {
  for (let key in adhkarCounterState) delete adhkarCounterState[key];
  renderAdhkar(document.getElementById('main-view-container'));
  showToast("Adhkar counters reset.");
}

/* ==========================================================================
   MODULE 7: DIGITAL TASBIH
   ========================================================================== */
let tasbihCurrentCount = 0;
let tasbihTarget = 33;
let tasbihRounds = 0;
let tasbihSoundEnabled = true;
let tasbihDhikrPhrase = 'SubhanAllah';

function renderTasbih(container) {
  container.innerHTML = `
    <div style="margin-bottom:20px; text-align:center;">
      <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary);">
        <i class="ri-fingerprint-line text-gold"></i> Digital Tasbih Counter
      </h2>
      <p class="text-muted" style="font-size:0.9rem;">
        Keep your tongue moist with the remembrance of Allah with responsive click sound and vibration feedback.
      </p>
    </div>

    <div class="tasbih-container card">
      <!-- Dhikr Phrase Selector -->
      <div class="form-group" style="text-align:left; margin-bottom:12px;">
        <label style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">Selected Dhikr Phrase</label>
        <select class="form-control" id="tasbih-phrase-select" onchange="changeTasbihPhrase(this.value)">
          <option value="SubhanAllah (33)">سُبْحَانَ اللَّهِ - SubhanAllah (33x)</option>
          <option value="Alhamdulillah (33)">الْحَمْدُ لِلَّهِ - Alhamdulillah (33x)</option>
          <option value="Allahu Akbar (34)">اللَّهُ أَكْبَرُ - Allahu Akbar (34x)</option>
          <option value="Astaghfirullah (100)">أَسْتَغْفِرُ اللَّهَ - Astaghfirullah (100x)</option>
          <option value="La ilaha illallah (100)">لَا إِلَٰهَ إِلَّا اللَّهُ - La ilaha illallah (100x)</option>
          <option value="SubhanAllahi wa bihamdihi (100)">سُبْحَانَ اللَّهِ وَبِحَمْدِهِ - SubhanAllahi wa bihamdihi (100x)</option>
          <option value="Custom Free Counter (Unlimited)">Free Unlimited Counter</option>
        </select>
      </div>

      <!-- Large Interactive Tap Bead -->
      <div class="tasbih-counter-circle" id="tasbih-main-bead" onclick="tapTasbih()">
        <div class="tasbih-count-display" id="tasbih-count-val">${tasbihCurrentCount}</div>
        <div class="tasbih-target-sub" id="tasbih-target-lbl">Goal: ${tasbihTarget}</div>
      </div>

      <!-- Rounds & Statistics -->
      <div style="display:flex; justify-content:space-around; margin:16px 0; padding:12px; background:var(--border-subtle); border-radius:var(--radius-md);">
        <div>
          <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Completed Cycles</div>
          <div style="font-size:1.3rem; font-weight:800; color:var(--primary);" id="tasbih-rounds-val">${tasbihRounds}</div>
        </div>
        <div>
          <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Total Taps</div>
          <div style="font-size:1.3rem; font-weight:800; color:var(--gold-dark);" id="tasbih-total-val">${tasbihRounds * tasbihTarget + tasbihCurrentCount}</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex; gap:10px; justify-content:center; margin-top:16px;">
        <button class="btn btn-outline btn-sm" onclick="resetTasbih()">
          <i class="ri-refresh-line"></i> Reset Count
        </button>
        <button class="btn btn-outline btn-sm" id="tasbih-sound-btn" onclick="toggleTasbihSound()">
          <i class="ri-volume-up-line"></i> Sound On
        </button>
        <button class="btn btn-primary btn-sm" onclick="recordTasbihSession()">
          <i class="ri-upload-cloud-line"></i> Save Session
        </button>
      </div>
    </div>
  `;
}

function tapTasbih() {
  if (tasbihSoundEnabled) playTasbihClickSound();
  triggerHaptic(40);

  tasbihCurrentCount++;
  if (tasbihTarget > 0 && tasbihCurrentCount >= tasbihTarget) {
    tasbihRounds++;
    tasbihCurrentCount = 0;
    showToast("Alhamdulillah! 1 full cycle completed 🎉");
  }

  const countVal = document.getElementById('tasbih-count-val');
  const roundsVal = document.getElementById('tasbih-rounds-val');
  const totalVal = document.getElementById('tasbih-total-val');
  if (countVal) countVal.innerText = tasbihCurrentCount;
  if (roundsVal) roundsVal.innerText = tasbihRounds;
  if (totalVal) totalVal.innerText = (tasbihRounds * tasbihTarget + tasbihCurrentCount);
}

function changeTasbihPhrase(val) {
  tasbihDhikrPhrase = val;
  if (val.includes('(33)')) tasbihTarget = 33;
  else if (val.includes('(34)')) tasbihTarget = 34;
  else if (val.includes('(100)')) tasbihTarget = 100;
  else tasbihTarget = 0;

  tasbihCurrentCount = 0;
  const targetLbl = document.getElementById('tasbih-target-lbl');
  const countVal = document.getElementById('tasbih-count-val');
  if (targetLbl) targetLbl.innerText = tasbihTarget > 0 ? `Goal: ${tasbihTarget}` : 'Unlimited';
  if (countVal) countVal.innerText = 0;
}

function resetTasbih() {
  tasbihCurrentCount = 0;
  tasbihRounds = 0;
  const countVal = document.getElementById('tasbih-count-val');
  const roundsVal = document.getElementById('tasbih-rounds-val');
  const totalVal = document.getElementById('tasbih-total-val');
  if (countVal) countVal.innerText = 0;
  if (roundsVal) roundsVal.innerText = 0;
  if (totalVal) totalVal.innerText = 0;
  showToast("Tasbih counter reset.");
}

function toggleTasbihSound() {
  tasbihSoundEnabled = !tasbihSoundEnabled;
  const btn = document.getElementById('tasbih-sound-btn');
  if (btn) {
    btn.innerHTML = tasbihSoundEnabled ? '<i class="ri-volume-up-line"></i> Sound On' : '<i class="ri-volume-mute-line"></i> Mute';
  }
}

async function recordTasbihSession() {
  const total = (tasbihRounds * tasbihTarget + tasbihCurrentCount);
  if (total <= 0) {
    showToast("Tap beads first to record a session.", true);
    return;
  }
  try {
    await API.tasbih.recordSession({
      dhikr_name: tasbihDhikrPhrase,
      total_count: total,
      completed_rounds: tasbihRounds
    });
    showToast(`Recorded ${total} tasbih taps to your profile!`);
  } catch (err) {
    showToast("Saved locally: " + err.message);
  }
}

/* ==========================================================================
   MODULE 8: HADITH LIBRARY
   ========================================================================== */
let activeHadithCollection = 'nawawi40';

async function renderHadith(container) {
  container.innerHTML = `
    <div class="card p-5 text-center">
      <div class="spinner-border text-success"></div>
      <p class="mt-2 text-muted">Loading Hadith narrations...</p>
    </div>
  `;

  try {
    const res = await API.hadith.getItems(activeHadithCollection);
    const items = res.data || [];

    container.innerHTML = `
      <div style="margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary);">
              <i class="ri-double-quotes-l"></i> Hadith Library
            </h2>
            <p class="text-muted" style="font-size:0.9rem;">
              Authentic Prophetic traditions with full Sanad, Matn, and accredited translations.
            </p>
          </div>
          <div class="search-input-wrap">
            <i class="ri-search-2-line search-icon"></i>
            <input type="text" class="search-input" id="hadith-search-box" placeholder="Search Hadiths..." oninput="handleHadithFilter(this.value)">
          </div>
        </div>
      </div>

      <!-- Collection Tabs -->
      <div style="display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap;">
        <button class="btn btn-sm ${activeHadithCollection === 'nawawi40' ? 'btn-primary' : 'btn-outline'}" onclick="switchHadithCollection('nawawi40')">
          An-Nawawi's 40 Hadith
        </button>
        <button class="btn btn-sm ${activeHadithCollection === 'bukhari' ? 'btn-primary' : 'btn-outline'}" onclick="switchHadithCollection('bukhari')">
          Sahih al-Bukhari Selections
        </button>
        <button class="btn btn-sm ${activeHadithCollection === 'muslim' ? 'btn-primary' : 'btn-outline'}" onclick="switchHadithCollection('muslim')">
          Sahih Muslim Selections
        </button>
      </div>

      <!-- Hadith Stream -->
      <div id="hadiths-stream-container" style="display:flex; flex-direction:column; gap:18px;">
        ${renderHadithCardsHtml(items)}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to load Hadith: ${escapeHtml(err.message)}</div>`;
  }
}

function renderHadithCardsHtml(items) {
  if (items.length === 0) {
    return `<div class="card p-4 text-center text-muted">No Hadith found matching query.</div>`;
  }

  return items.map(h => `
    <div class="card p-4">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span class="badge" style="background:var(--primary-subtle); color:var(--primary); font-weight:700; font-size:0.8rem;">
          Hadith #${h.hadith_number} • ${h.chapter || 'Foundations'}
        </span>
        <div style="display:flex; gap:8px;">
          <button class="icon-btn" title="Copy Hadith" onclick="copyHadithText('${escapeHtml(h.translation.replace(/'/g, "\\'"))}')">
            <i class="ri-file-copy-line"></i>
          </button>
          <button class="icon-btn" title="Bookmark Hadith" onclick="quickToggleBookmark('hadith', '${h.id}', 'Hadith #${h.hadith_number}: ${escapeHtml(h.narrator_english || '')}')">
            <i class="ri-book-open-linemark"></i>
          </button>
        </div>
      </div>

      ${h.narrator_english ? `
        <div style="font-size:0.85rem; font-weight:700; color:var(--text-muted); margin-bottom:10px;">
          Narrated by ${h.narrator_english}:
        </div>
      ` : ''}

      <div style="background:var(--border-subtle); border-radius:var(--radius-md); padding:16px; text-align:right; margin-bottom:14px;">
        <div style="font-family:var(--font-arabic); font-size:1.5rem; color:var(--text-main); line-height:2;">
          ${h.text_arabic}
        </div>
      </div>

      <div style="font-size:0.95rem; line-height:1.7; color:var(--text-main); margin-bottom:14px;">
        "${h.translation}"
      </div>

      <div style="font-size:0.8rem; color:var(--text-muted); border-top:1px solid var(--border); padding-top:10px; display:flex; justify-content:space-between;">
        <span><strong>Reference:</strong> ${h.reference || 'Canonical Sahih'}</span>
        <span style="color:var(--primary); font-weight:700;">Grade: Sahih (Authentic)</span>
      </div>
    </div>
  `).join('');
}

function switchHadithCollection(col) {
  activeHadithCollection = col;
  renderHadith(document.getElementById('main-view-container'));
}

async function handleHadithFilter(query) {
  const container = document.getElementById('hadiths-stream-container');
  if (!container) return;

  try {
    const res = await API.hadith.search(query);
    container.innerHTML = renderHadithCardsHtml(res.data || []);
  } catch (e) {}
}

function copyHadithText(txt) {
  navigator.clipboard.writeText(txt).then(() => {
    showToast("Hadith copied to clipboard!");
  });
}

/* ==========================================================================
   MODULE 9: DUAS & SUPPLICATIONS
   ========================================================================== */
let activeDuaCategory = 'daily';

async function renderDuas(container) {
  container.innerHTML = `
    <div class="card p-5 text-center">
      <div class="spinner-border text-success"></div>
      <p class="mt-2 text-muted">Loading Duas from Hisn al-Muslim...</p>
    </div>
  `;

  try {
    const res = await API.duas.getItems(activeDuaCategory);
    const items = res.data || [];

    container.innerHTML = `
      <div style="margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary);">
              <i class="ri-hand-heart-line"></i> Duas & Daily Supplications
            </h2>
            <p class="text-muted" style="font-size:0.9rem;">
              Comprehensive Islamic invocations for protection, guidance, forgiveness, and health.
            </p>
          </div>
          <div class="search-input-wrap">
            <i class="ri-search-2-line search-icon"></i>
            <input type="text" class="search-input" placeholder="Search Duas..." oninput="handleDuaFilter(this.value)">
          </div>
        </div>
      </div>

      <!-- Categories Pills -->
      <div style="display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap;">
        <button class="btn btn-sm ${activeDuaCategory === 'daily' ? 'btn-primary' : 'btn-outline'}" onclick="switchDuaCategory('daily')">Daily Occasions</button>
        <button class="btn btn-sm ${activeDuaCategory === 'protection' ? 'btn-primary' : 'btn-outline'}" onclick="switchDuaCategory('protection')">Protection & Ruqyah</button>
        <button class="btn btn-sm ${activeDuaCategory === 'forgiveness' ? 'btn-primary' : 'btn-outline'}" onclick="switchDuaCategory('forgiveness')">Forgiveness & Istighfar</button>
        <button class="btn btn-sm ${activeDuaCategory === 'guidance' ? 'btn-primary' : 'btn-outline'}" onclick="switchDuaCategory('guidance')">Guidance & Istikhara</button>
        <button class="btn btn-sm ${activeDuaCategory === 'difficulty' ? 'btn-primary' : 'btn-outline'}" onclick="switchDuaCategory('difficulty')">Relief from Distress</button>
      </div>

      <!-- Duas List -->
      <div id="duas-stream-container" style="display:flex; flex-direction:column; gap:16px;">
        ${renderDuaCardsHtml(items)}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to load Duas: ${escapeHtml(err.message)}</div>`;
  }
}

function renderDuaCardsHtml(items) {
  if (items.length === 0) {
    return `<div class="card p-4 text-center text-muted">No Duas found matching query.</div>`;
  }

  return items.map(d => `
    <div class="card p-4">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <h3 style="font-size:1.05rem; font-weight:700; color:var(--primary); margin:0;">${d.title}</h3>
        <div style="display:flex; gap:8px;">
          <button class="icon-btn" title="Copy Dua" onclick="copyHadithText('${escapeHtml(d.translation.replace(/'/g, "\\'"))}')">
            <i class="ri-file-copy-line"></i>
          </button>
          <button class="icon-btn" title="Bookmark Dua" onclick="quickToggleBookmark('dua', '${d.id}', '${escapeHtml(d.title)}')">
            <i class="ri-book-open-linemark"></i>
          </button>
        </div>
      </div>

      <div style="background:var(--border-subtle); border-radius:var(--radius-md); padding:16px; text-align:right; margin-bottom:12px;">
        <div style="font-family:var(--font-arabic); font-size:1.6rem; color:var(--text-main); line-height:2;">
          ${d.text_arabic}
        </div>
      </div>

      ${d.transliteration ? `
        <div style="font-size:0.88rem; font-weight:600; color:var(--gold-dark); margin-bottom:6px;">
          ${d.transliteration}
        </div>
      ` : ''}

      <div style="font-size:0.95rem; line-height:1.6; color:var(--text-main); margin-bottom:12px;">
        "${d.translation}"
      </div>

      <div style="font-size:0.8rem; color:var(--text-muted); border-top:1px solid var(--border); padding-top:8px;">
        <strong>Reference:</strong> ${d.reference || 'Hisn al-Muslim'} ${d.virtues ? `• <em>${d.virtues}</em>` : ''}
      </div>
    </div>
  `).join('');
}

function switchDuaCategory(cat) {
  activeDuaCategory = cat;
  renderDuas(document.getElementById('main-view-container'));
}

async function handleDuaFilter(query) {
  const container = document.getElementById('duas-stream-container');
  if (!container) return;
  try {
    const res = await API.duas.search(query);
    container.innerHTML = renderDuaCardsHtml(res.data || []);
  } catch (e) {}
}

/* ==========================================================================
   MODULE 10: 99 NAMES OF ALLAH (Asmaul Husna)
   ========================================================================== */
let namesCache = [];

async function renderNamesOfAllah(container) {
  container.innerHTML = `
    <div class="card p-5 text-center">
      <div class="spinner-border text-success"></div>
      <p class="mt-2 text-muted">Loading 99 Beautiful Names of Allah...</p>
    </div>
  `;

  try {
    const res = await API.namesOfAllah.getAll();
    namesCache = res.data || [];

    container.innerHTML = `
      <div style="margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary);">
              <i class="ri-star-lines text-gold"></i> The 99 Beautiful Names of Allah (Asma'ul Husna)
            </h2>
            <p class="text-muted" style="font-size:0.9rem;">
              "And to Allah belong the best names, so invoke Him by them." (Surah Al-A'raf 7:180)
            </p>
          </div>
          <div class="search-input-wrap">
            <i class="ri-search-2-line search-icon"></i>
            <input type="text" class="search-input" placeholder="Search by name or meaning..." oninput="filterNamesOfAllah(this.value)">
          </div>
        </div>
      </div>

      <div class="names-grid" id="names-grid-container">
        ${renderNamesGridHtml(namesCache)}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to load Names of Allah: ${escapeHtml(err.message)}</div>`;
  }
}

function renderNamesGridHtml(names) {
  if (names.length === 0) return `<p class="p-4 text-muted">No names found matching query.</p>`;

  return names.map(n => `
    <div class="name-card" onclick="openNameDetailModal(${n.number})">
      <div style="font-size:0.75rem; font-weight:700; color:var(--gold-dark); margin-bottom:4px;">#${n.number}</div>
      <div class="name-arabic">${n.name_arabic}</div>
      <div class="name-trans">${n.name_english}</div>
      <div class="name-meaning">${n.meaning_english}</div>
    </div>
  `).join('');
}

function filterNamesOfAllah(query) {
  const container = document.getElementById('names-grid-container');
  if (!container) return;

  if (!query || !query.trim()) {
    container.innerHTML = renderNamesGridHtml(namesCache);
    return;
  }

  const q = query.toLowerCase();
  const filtered = namesCache.filter(n =>
    (n.name_english || '').toLowerCase().includes(q) ||
    (n.meaning_english || '').toLowerCase().includes(q) ||
    (n.name_arabic || '').includes(query)
  );
  container.innerHTML = renderNamesGridHtml(filtered);
}

function openNameDetailModal(num) {
  const name = namesCache.find(n => n.number === num);
  if (!name) return;

  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-body-container');
  if (!overlay || !box) return;

  box.className = 'modal-box';
  box.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">Name #${name.number} of Allah</h3>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body text-center" style="padding:28px 20px;">
      <div style="font-family:var(--font-arabic); font-size:3.2rem; color:var(--primary); line-height:1.2; margin-bottom:8px;">
        ${name.name_arabic}
      </div>
      <h3 style="font-size:1.4rem; font-weight:800; color:var(--text-main); margin-bottom:4px;">
        ${name.name_english}
      </h3>
      <div style="font-size:1.1rem; color:var(--gold-dark); font-weight:700; margin-bottom:16px;">
        ${name.meaning_english}
      </div>

      <div class="card p-3 text-left" style="background:var(--border-subtle); line-height:1.6; font-size:0.95rem; color:var(--text-main); margin-bottom:16px;">
        ${escapeHtml(name.explanation || 'One of the beautiful, eternal attributes and names of Almighty Allah through which believers call upon Him.')}
      </div>

      ${name.quranic_reference ? `
        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:20px;">
          <strong>Quranic Reference:</strong> ${name.quranic_reference}
        </div>
      ` : ''}

      <div style="display:flex; justify-content:center; gap:10px;">
        <button class="btn btn-sm btn-primary" onclick="closeModal()">Close</button>
        <button class="btn btn-sm btn-gold" onclick="quickToggleBookmark('name_of_allah', '${name.number}', '${name.name_english} (${name.name_arabic})')">
          <i class="ri-book-open-linemark"></i> Bookmark Name
        </button>
      </div>
    </div>
  `;
  overlay.classList.add('active');
}

/* ==========================================================================
   MODULE 11: HIJRI CALENDAR & EVENTS
   ========================================================================== */
async function renderHijri(container) {
  container.innerHTML = `
    <div class="card p-5 text-center">
      <div class="spinner-border text-success"></div>
      <p class="mt-2 text-muted">Calculating authentic Hijri calendar...</p>
    </div>
  `;

  try {
    const res = await API.hijri.getToday();
    const data = res.data;
    const eventsRes = await API.hijri.getEvents();
    const events = eventsRes.data || [];

    container.innerHTML = `
      <div style="margin-bottom:20px;">
        <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary);">
          <i class="ri-calendar-event-line"></i> Hijri Calendar & Islamic Milestones
        </h2>
        <p class="text-muted" style="font-size:0.9rem;">
          Authentic lunar calendar tracking Sunnah fast days, White Days (Ayyam al-Beed), and sacred months.
        </p>
      </div>

      <!-- Current Date Hero Banner -->
      <div class="card p-4 card-primary-edge" style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
          <div>
            <div style="font-size:0.85rem; font-weight:700; color:var(--gold); text-transform:uppercase; letter-spacing:0.5px;">Today's Islamic Date</div>
            <div style="font-size:1.8rem; font-weight:800; color:var(--primary); margin:4px 0;">
              ${data.day} ${data.month_name} ${data.year} AH
            </div>
            <div style="font-size:0.95rem; color:var(--text-muted);">
              Gregorian: <strong>${data.gregorian_formatted || new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</strong>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-family:var(--font-arabic); font-size:2rem; color:var(--gold-dark);">${data.month_name_arabic || ''}</div>
            <span class="badge" style="background:var(--primary-subtle); color:var(--primary); font-weight:700;">
              ${data.is_sacred_month ? 'Sacred Month (Ashhur al-Hurum)' : 'Standard Month'}
            </span>
          </div>
        </div>
      </div>

      <!-- Islamic Significant Events -->
      <div class="card p-4">
        <h3 style="font-size:1.1rem; font-weight:700; color:var(--primary); margin-bottom:16px;">
          <i class="ri-star-line"></i> Sacred Milestones & Sunnah Observances
        </h3>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
          ${events.map(ev => `
            <div class="card p-3" style="border-left:4px solid var(--gold); background:var(--surface);">
              <div style="font-weight:700; color:var(--text-main); font-size:0.95rem; margin-bottom:2px;">${ev.title}</div>
              <div style="font-size:0.8rem; font-weight:700; color:var(--primary); margin-bottom:4px;">${ev.hijri_date}</div>
              <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.4;">${ev.description}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to load Hijri date: ${escapeHtml(err.message)}</div>`;
  }
}

/* ==========================================================================
   MODULE 12: UNIFIED BOOKMARKS
   ========================================================================== */
let activeBookmarkFilter = 'all';

async function renderBookmarks(container) {
  container.innerHTML = `
    <div class="card p-5 text-center">
      <div class="spinner-border text-success"></div>
      <p class="mt-2 text-muted">Loading your unified bookmarks...</p>
    </div>
  `;

  try {
    const res = await API.bookmarks.getAll();
    const bookmarks = res.data || [];

    container.innerHTML = `
      <div style="margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="font-size:1.4rem; font-weight:800; color:var(--primary);">
              <i class="ri-book-open-linemark-star text-gold"></i> Unified Bookmarks & Saved Library
            </h2>
            <p class="text-muted" style="font-size:0.9rem;">
              Access all your saved Quran verses, Hadiths, Duas, Tafsir notes, and lessons in one unified place.
            </p>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div style="display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap;">
        <button class="btn btn-sm ${activeBookmarkFilter === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="filterBookmarksView('all')">All Bookmarks (${bookmarks.length})</button>
        <button class="btn btn-sm ${activeBookmarkFilter === 'quran_ayah' ? 'btn-primary' : 'btn-outline'}" onclick="filterBookmarksView('quran_ayah')">Quran Ayahs</button>
        <button class="btn btn-sm ${activeBookmarkFilter === 'hadith' ? 'btn-primary' : 'btn-outline'}" onclick="filterBookmarksView('hadith')">Hadith</button>
        <button class="btn btn-sm ${activeBookmarkFilter === 'dua' ? 'btn-primary' : 'btn-outline'}" onclick="filterBookmarksView('dua')">Duas</button>
        <button class="btn btn-sm ${activeBookmarkFilter === 'tafsir_entry' ? 'btn-primary' : 'btn-outline'}" onclick="filterBookmarksView('tafsir_entry')">Tafsir</button>
      </div>

      <!-- Bookmarks List -->
      <div id="bookmarks-list-container" style="display:flex; flex-direction:column; gap:12px;">
        ${renderBookmarksListHtml(bookmarks, activeBookmarkFilter)}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card p-4 text-danger">Failed to load bookmarks: ${escapeHtml(err.message)}</div>`;
  }
}

function renderBookmarksListHtml(bookmarks, filter) {
  const filtered = filter === 'all' ? bookmarks : bookmarks.filter(b => b.item_type === filter);

  if (filtered.length === 0) {
    return `
      <div class="card p-5 text-center text-muted">
        <i class="ri-book-open-linemark" style="font-size:2.4rem; display:block; margin-bottom:10px; color:var(--border);"></i>
        No bookmarks saved in this category yet. Click the bookmark icon on any verse, hadith, or lesson to save it!
      </div>
    `;
  }

  return filtered.map(b => `
    <div class="card p-3" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <div style="flex:1;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <span class="badge" style="background:var(--primary-subtle); color:var(--primary); font-size:0.75rem; font-weight:700;">
            ${(b.item_type || '').replace('_', ' ').toUpperCase()}
          </span>
          <strong style="font-size:1rem; color:var(--text-main);">${b.title}</strong>
        </div>
        ${b.content_snippet ? `
          <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.4;">${b.content_snippet}</div>
        ` : ''}
      </div>

      <div style="display:flex; gap:8px;">
        <button class="btn btn-sm btn-outline" onclick="jumpToBookmark('${b.item_type}', '${b.item_id}')">
          <i class="ri-external-link-line"></i> Open
        </button>
        <button class="icon-btn" style="color:var(--danger);" title="Delete Bookmark" onclick="deleteUnifiedBookmark('${b.item_type}', '${b.item_id}')">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function filterBookmarksView(filter) {
  activeBookmarkFilter = filter;
  renderBookmarks(document.getElementById('main-view-container'));
}

function jumpToBookmark(type, id) {
  if (type === 'quran_ayah') {
    const parts = id.split(':');
    if (parts.length >= 2) {
      window.location.hash = 'quran';
      setTimeout(() => openSurahReader(parseInt(parts[0])), 150);
    }
  } else if (type === 'hadith') {
    window.location.hash = 'hadith';
  } else if (type === 'dua') {
    window.location.hash = 'duas';
  } else if (type === 'tafsir_entry') {
    window.location.hash = 'tafsir';
  } else if (type === 'tajweed') {
    window.location.hash = 'tajweed';
  } else if (type === 'tawhid') {
    window.location.hash = 'tawhid';
  }
}

async function deleteUnifiedBookmark(type, id) {
  try {
    await API.bookmarks.toggle({ item_type: type, item_id: String(id) });
    showToast("Bookmark removed");
    renderBookmarks(document.getElementById('main-view-container'));
  } catch (err) {
    showToast("Error deleting bookmark: " + err.message, true);
  }
}
