/**
 * ====================================================
 * سیستەمی قوتابی - کۆدی تەواو و سەربەخۆ (student.js)
 * بەبێ پێویستی بە هیچ پاکێج و بەستەرێکی ئاڵۆز
 * ====================================================
 */

// کلیلی هەڵگرتنی داتا لەسەر مۆبایل و براوسەر
const STORE_KEY = 'student_system_kurdish_v1';

// ئەم بەشە خۆکارانە بەکاری دەهێنێت هەمان داتابەیسی Supabase ی ماڵپەڕی
// Kurd Technology (window.SUPABASE_URL/ANON_KEY لە config.js دادەندرێت).
const SUPABASE_URL = window.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "";

// داتاکانی بنەڕەتی کاتێک یەکەمجار ئەپەکە دەکرێتەوە
const defaultDB = {
  classes: [
    { id: '10', name: 'پۆلی 10', icon: '🔟', color: 'from-[#7c5cff]/30 to-[#5f4ae6]/10' },
    { id: '11', name: 'پۆلی 11', icon: '1️⃣', color: 'from-[#39c6ff]/30 to-[#0f72b7]/10' },
    { id: '12', name: 'پۆلی 12', icon: '🎓', color: 'from-[#20d88a]/30 to-[#0ea664]/10' }
  ],
  subjectsByClass: {
    '10': [
      { id: 'kurd', name: 'ئەدەبی کوردی', icon: '📗' },
      { id: 'math', name: 'بیرکاری', icon: '📐' },
      { id: 'eng', name: 'ئینگلیزی', icon: '🅰️' },
      { id: 'history', name: 'مێژوو', icon: '📜' },
      { id: 'physics', name: 'فیزیا', icon: '⚡' }
    ],
    '11': [
      { id: 'kurd', name: 'ئەدەبی کوردی', icon: '📗' },
      { id: 'math', name: 'بیرکاری', icon: '📐' },
      { id: 'eng', name: 'ئینگلیزی', icon: '🅰️' },
      { id: 'chemistry', name: 'کیمیا', icon: '🧪' },
      { id: 'history', name: 'مێژوو', icon: '📜' }
    ],
    '12': [
      { id: 'kurd', name: 'ئەدەبی کوردی', icon: '📗' },
      { id: 'math', name: 'بیرکاری', icon: '📐' },
      { id: 'eng', name: 'ئینگلیزی', icon: '🅰️' },
      { id: 'physics', name: 'فیزیا', icon: '⚡' },
      { id: 'chemistry', name: 'کیمیا', icon: '🧪' }
    ]
  },
  lessons: {
    '10|kurd': [
      {
        id: 'l10k1',
        title: 'پەڕەی 1: پێناسەی ئەدەب',
        explanation: 'ئەدەب بریتییە لە دەربڕینی هەست و نەستی مرۆڤ بە شێوازێکی هونەری و جوان، کە کار لە دەروونی خوێنەر یان گوێگر دەکات.\n\nبەشە سەرەکییەکانی ئەدەب:\n١. شیعر: کێش و سەروا و هەستی تێدایە.\n٢. پەخشان: دەربڕینی ڕوون و بێ کێش و سەروا وەک چیرۆک و ڕۆمان.',
        mcq: 'ئەدەب بە گشتی دابەش دەبێت بەسەر چەند بەشی سەرەکیدا؟\n٢ بەش <12>\n٣ بەش\n٤ بەش\n٥ بەش\n###\nکام لەمانە کێش و سەروای تێدایە؟\nشیعر <12>\nپەخشان\nوتار\nهەواڵ',
        fill: 'ئەدەب بەسەر دوو بەشی سەرەکی ....... و پەخشان دابەش دەبێت.\nشیعر <13>\n###\nئەو بەشەی ئەدەب کە کێش و سەروای نییە پێی دەوترێت .......\nپەخشان <13>'
      },
      {
        id: 'l10k2',
        title: 'پەڕەی 2: کێش و سەروا',
        explanation: 'کێش لە شیعردا بە مانای هاوسەنگی و ڕێکخستنی بڕگەکانی شیعر دێت.\nسەرواش بریتییە لە یەکبوونی دوا پیتی دێڕەکانی شیعر کە ئاوازێکی مۆسیقی خۆش دەبەخشێت.',
        mcq: 'یەکبوونی پیتی کۆتایی لە دێڕەکانی شیعردا پێی دەوترێت؟\nسەروا <12>\nکێش\nپەخشان\nچیرۆک',
        fill: 'هاوسەنگی بڕگەکانی شیعر پێی دەوترێت .......\nکێش <13>'
      }
    ]
  }
};

// باری گشتی سیستمەکە (State)
let db = loadDB();
let currentPage = 'home';
let currentClassId = '10';
let currentSubjectId = 'kurd';
let currentLessonId = '';
let currentLessonTab = 'explain';
let activeQuiz = null;
let soundEnabled = true;
let editingLessonId = null;
let readerFontSize = 'md'; // sm, md, lg, xl
let readerTheme = 'midnight';

// --- ڕێکخستنی مافی بەکارهێنەر (Owner vs Student) ---
// تەنها ئادمینی (owner) پرۆژەکە دەتوانێت وانە/بابەت زیاد بکات، دەستکاری بکات یان بسڕێتەوە.
// بەکارهێنەرانی ئاسایی تەنها دەتوانن ڕونکردنەوە بخوێننەوە و تاقیکردنەوە بکەن.
let isOwner = false;

function applyRolePermissions() {
  document.body.classList.toggle('is-owner', isOwner);
  document.body.classList.toggle('is-student', !isOwner);

  const adminOnlyIds = ['addSubjectBtn', 'addLessonBtn', 'deleteSubjectBtn', 'deleteSingleLessonBtn'];
  adminOnlyIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !isOwner);
  });

  // نوێکردنەوەی لیستەکان تا دوگمەکانی دەستکاری/سڕینەوەی ناو ڕیزەکانیش نوێبنەوە
  renderCurrentPage();
}

function guardOwnerAction(msg) {
  if (isOwner) return true;
  showToast(msg || 'تەنها ئادمینی پڕۆژە دەتوانێت ئەم کارە بکات.');
  return false;
}

// هەڵگرتن و خوێندنەوەی داتا
function loadDB() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.classes && parsed?.subjectsByClass && parsed?.lessons) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading DB', e);
  }
  return defaultDB;
}

function saveDB() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(db));
    syncWithSupabase();
  } catch (e) {
    console.error('Error saving DB', e);
  }
}

// پەیوەندی بە داتابەیسی سەرهێڵی Supabase
async function syncWithSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.length < 10) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/student_system`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ id: 'main', data: db, updated_at: new Date().toISOString() })
    });
  } catch (err) {
    console.warn('Supabase sync error', err);
  }
}

async function fetchFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.length < 10) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/student_system?id=eq.main&select=data`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const result = await res.json();
    if (result && result[0]?.data) {
      db = result[0].data;
      localStorage.setItem(STORE_KEY, JSON.stringify(db));
      renderCurrentPage();
      showToast('داتا لە داتابەیسی Supabase وەرگیرایەوە ☁️');
    }
  } catch (e) {
    console.warn('Supabase fetch error', e);
  }
}

// دۆزینەوەی دەقی ڕاست و پاککردنەوە
function normalizeText(s = '') {
  return String(s)
    .toLowerCase()
    .replace(/[ـ\s]/g, '')
    .replace(/[؟!.,:()[\]{}"']/g, '')
    .trim();
}

// پارسەری پرسیارەکانی هەڵبژاردن (<12>)
function parseMCQ(raw = '') {
  if (!raw) return [];
  return raw.split('###').map((block, i) => {
    const lines = block.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    if (lines.length < 2) return null;
    const question = lines[0].replace(/^\s*\d+[\).\-\:]\s*/, '').trim();
    const answers = lines.slice(1).map(line => {
      const correct = line.includes('<12>');
      return { text: line.replace('<12>', '').trim(), correct };
    }).filter(x => x.text);
    if (!question || !answers.length) return null;
    const correctIndex = answers.findIndex(a => a.correct);
    return { id: `mcq_${i}`, question, answers, correctIndex: correctIndex !== -1 ? correctIndex : 0 };
  }).filter(Boolean);
}

// پارسەری پرسیارەکانی بۆشایی (<13>)
function parseFill(raw = '') {
  if (!raw) return [];
  return raw.split('###').map((block, i) => {
    const lines = block.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    if (lines.length < 2) return null;
    const question = lines[0];
    const answerLine = lines.slice(1).find(x => x.includes('<13>')) || lines[1];
    const answer = answerLine.replace('<13>', '').trim();
    const accepted = answer.split('|').map(x => normalizeText(x)).filter(Boolean);
    if (!question || !accepted.length) return null;
    return { id: `fill_${i}`, question, answer, accepted };
  }).filter(Boolean);
}

// دەنگی ڕاست و هەڵەی تاقیکردنەوە
function playSound(type) {
  if (!soundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.16);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {}
}

// پەیامی کاتی (Toast)
function showToast(msg) {
  const el = document.getElementById('toastAlert');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2200);
}

// گۆڕینی لاپەڕەکان
function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.view-page').forEach(v => v.classList.remove('active'));
  const backBtn = document.getElementById('backBtn');
  if (page === 'home') {
    backBtn.classList.add('hidden');
  } else {
    backBtn.classList.remove('hidden');
  }

  const target = document.getElementById('view' + page.charAt(0).toUpperCase() + page.slice(1));
  if (target) target.classList.add('active');
  renderCurrentPage();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// هەڵسەنگاندن و پیشاندانی ناوەڕۆکی پەڕە
function renderCurrentPage() {
  if (currentPage === 'home') renderHome();
  else if (currentPage === 'subjects') renderSubjects();
  else if (currentPage === 'lessons') renderLessons();
  else if (currentPage === 'lesson') renderSingleLesson();
  else if (currentPage === 'quiz') renderQuiz();
  else if (currentPage === 'settings') renderSettings();
}

// ١. لاپەڕەی سەرەکی
function renderHome() {
  const grid = document.getElementById('classesGrid');
  if (!grid) return;
  grid.innerHTML = db.classes.map(c => {
    const subCount = (db.subjectsByClass[c.id] || []).length;
    return `
      <div class="class-card" onclick="openClass('${c.id}')">
        <div class="class-icon-wrapper">${c.icon}</div>
        <div>
          <b>${c.name}</b>
          <small>${subCount} وانەی فەرمی</small>
        </div>
      </div>
    `;
  }).join('');

  // ژماردنی ئامار
  let totalL = 0;
  let totalQ = 0;
  Object.values(db.lessons).forEach(list => {
    totalL += list.length;
    list.forEach(l => {
      totalQ += parseMCQ(l.mcq).length + parseFill(l.fill).length;
    });
  });
  document.getElementById('statTotalLessons').textContent = totalL;
  document.getElementById('statTotalQuestions').textContent = totalQ;
}

function openClass(classId) {
  currentClassId = classId;
  navigate('subjects');
}

// ٢. لاپەڕەی بابەتەکان
function renderSubjects() {
  const currentClass = db.classes.find(c => c.id === currentClassId);
  document.getElementById('subjectClassBreadcrumb').textContent = currentClass ? currentClass.name : 'پۆل';
  const subjects = db.subjectsByClass[currentClassId] || [];
  const search = normalizeText(document.getElementById('subjectSearchInput')?.value || '');
  const filtered = subjects.filter(s => !search || normalizeText(s.name).includes(search));

  const grid = document.getElementById('subjectsGrid');
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="p-3 muted-text text-center font-12" style="grid-column: span 2;">هیچ بابەتێک نەدۆزرایەوە.</div>';
    return;
  }

  grid.innerHTML = filtered.map(s => {
    const lCount = (db.lessons[`${currentClassId}|${s.id}`] || []).length;
    return `
      <div class="subject-item-card" onclick="openSubject('${s.id}')">
        <div class="subject-top-row">
          <div class="subject-icon-box">${s.icon}</div>
          ${isOwner ? `<button class="danger-btn-sm" onclick="event.stopPropagation(); confirmDelete('subject', '${s.id}', '${s.name}')">🗑️</button>` : ''}
        </div>
        <div>
          <b>${s.name}</b>
          <div class="flex-between mt-2 font-12 muted-text">
            <span>${lCount} پەڕە</span>
            <span class="cyan-text font-bold">خوێندنەوە ❮</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openSubject(subId) {
  currentSubjectId = subId;
  navigate('lessons');
}

// ٣. لاپەڕەی پەڕەکان و وانەکان
function renderLessons() {
  const currentSub = (db.subjectsByClass[currentClassId] || []).find(s => s.id === currentSubjectId);
  const currentClass = db.classes.find(c => c.id === currentClassId);
  document.getElementById('lessonSubjectBreadcrumb').textContent = `${currentClass?.name || ''} / ${currentSub?.name || ''}`;
  document.getElementById('lessonsPageTitle').textContent = currentSub ? currentSub.name : 'پەڕەکان';

  const list = db.lessons[`${currentClassId}|${currentSubjectId}`] || [];
  const container = document.getElementById('lessonsList');
  if (list.length === 0) {
    container.innerHTML = `
      <div class="p-3 text-center muted-text font-12">
        <div class="font-16 mb-2">📖</div>
        هیچ پەڕەیەک تۆمار نەکراوە، یەکەم پەڕە بنووسە.
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((l, i) => {
    const mcqLen = parseMCQ(l.mcq).length;
    const fillLen = parseFill(l.fill).length;
    return `
      <div class="lesson-card">
        <div class="lesson-card-header">
          <div class="lesson-info-click" onclick="openSingleLesson('${l.id}')">
            <div class="lesson-num-badge">${i + 1}</div>
            <div>
              <b class="font-16 block">${l.title}</b>
              <small class="muted-text">کلیک بکە بۆ خوێندنەوەی تەواوی وانەکە</small>
            </div>
          </div>
          ${isOwner ? `<div class="lesson-card-actions">
            <button class="secondary-btn-sm" onclick="openLessonModal('${l.id}')">✏️</button>
            <button class="danger-btn-sm" onclick="confirmDelete('lesson', '${l.id}', '${l.title}')">🗑️</button>
          </div>` : ''}
        </div>
        <div class="lesson-tags">
          <span class="tag-item">📖 خوێندنەوە</span>
          <span class="tag-item tag-green">☑️ ${mcqLen} هەڵبژاردن</span>
          <span class="tag-item tag-yellow">✍️ ${fillLen} بۆشایی</span>
        </div>
        <div class="lesson-btns-bar">
          <button class="primary-btn-sm" onclick="openSingleLesson('${l.id}')">خوێندنەوە</button>
          <button class="secondary-btn-sm" onclick="startSingleQuiz('${l.id}', 'mcq')">تاقیکردنەوەی هەڵبژاردن</button>
          <button class="secondary-btn-sm" onclick="startSingleQuiz('${l.id}', 'fill')">تاقیکردنەوەی بۆشایی</button>
        </div>
      </div>
    `;
  }).join('');
}

function openSingleLesson(lessonId) {
  currentLessonId = lessonId;
  currentLessonTab = 'explain';
  navigate('lesson');
}

// ٤. لاپەڕەی وانەی دیاریکراو (Single Lesson)
function renderSingleLesson() {
  const list = db.lessons[`${currentClassId}|${currentSubjectId}`] || [];
  const lesson = list.find(l => l.id === currentLessonId);
  if (!lesson) { navigate('lessons'); return; }

  const currentSub = (db.subjectsByClass[currentClassId] || []).find(s => s.id === currentSubjectId);
  document.getElementById('singleLessonBreadcrumb').textContent = `${currentSub?.name || ''} / ${lesson.title}`;
  document.getElementById('singleLessonTitle').textContent = lesson.title;

  const mcqs = parseMCQ(lesson.mcq);
  const fills = parseFill(lesson.fill);
  document.getElementById('tabMcqCount').textContent = mcqs.length;
  document.getElementById('tabFillCount').textContent = fills.length;

  // تاب ١: ڕوونکردنەوە
  document.getElementById('lessonExplainBody').textContent = lesson.explanation || 'هیچ ڕوونکردنەوەیەک بۆ ئەم بابەتە تۆمار نەکراوە.';

  // تاب ٢: پێداچوونەوەی هەڵبژاردن
  const mcqContainer = document.getElementById('lessonMcqList');
  mcqContainer.innerHTML = mcqs.map((q, idx) => `
    <div class="review-item">
      <div class="review-q">${idx + 1}. ${q.question}</div>
      <div class="mt-2 flex-gap flex-wrap">
        ${q.answers.map(a => `
          <span class="tag-item ${a.correct ? 'tag-green font-bold' : ''}">${a.text} ${a.correct ? '✓' : ''}</span>
        `).join('')}
      </div>
    </div>
  `).join('');

  // تاب ٣: پێداچوونەوەی بۆشایی
  const fillContainer = document.getElementById('lessonFillList');
  fillContainer.innerHTML = fills.map((q, idx) => `
    <div class="review-item">
      <div class="review-q">${idx + 1}. ${q.question}</div>
      <div class="mt-1 green-text font-12 font-bold">وەڵامی ڕاست: ${q.answer}</div>
    </div>
  `).join('');

  switchTab(currentLessonTab);
}

function switchTab(tab) {
  currentLessonTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const activeContent = document.getElementById('tabContent' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if (activeContent) activeContent.classList.add('active');
}

// ٥. تاقیکردنەوە (Quiz System)
function startSingleQuiz(lessonId, type) {
  const list = db.lessons[`${currentClassId}|${currentSubjectId}`] || [];
  const lesson = list.find(l => l.id === lessonId);
  if (!lesson) return;
  const questions = type === 'mcq' ? parseMCQ(lesson.mcq) : parseFill(lesson.fill);
  if (!questions.length) {
    showToast('هیچ پرسیارێک بۆ ئەم بەشە نییە.');
    return;
  }

  activeQuiz = {
    type,
    title: lesson.title,
    modeLabel: `${type === 'mcq' ? 'تاقیکردنەوەی هەڵبژاردن' : 'تاقیکردنەوەی بۆشایی'} • ${lesson.title}`,
    questions,
    index: 0,
    answers: new Array(questions.length).fill(null),
    result: null
  };
  navigate('quiz');
}

function renderQuiz() {
  if (!activeQuiz) { navigate('lessons'); return; }
  const q = activeQuiz.questions[activeQuiz.index];
  document.getElementById('quizModeBadge').textContent = activeQuiz.type === 'mcq' ? '☑️ هەڵبژاردن' : '✍️ بۆشایی';
  document.getElementById('quizProgressText').textContent = `${activeQuiz.index + 1} لە ${activeQuiz.questions.length}`;

  const pct = Math.round(((activeQuiz.index + 1) / activeQuiz.questions.length) * 100);
  document.getElementById('quizProgressBarFill').style.width = `${pct}%`;

  // نیشاندەری پرسیارەکان (Chips)
  const chipsContainer = document.getElementById('quizQuestionChips');
  chipsContainer.innerHTML = activeQuiz.questions.map((_, i) => {
    const ans = activeQuiz.answers[i];
    let cls = 'q-chip';
    if (i === activeQuiz.index) cls += ' active';
    if (ans) cls += ans.correct ? ' correct' : ' wrong';
    return `<button class="${cls}" onclick="jumpQuizQuestion(${i})">${i + 1}</button>`;
  }).join('');

  document.getElementById('quizQuestionNum').textContent = `#${activeQuiz.index + 1}`;
  document.getElementById('quizPageTag').textContent = q.pageNumber ? `پەڕەی ${q.pageNumber}` : '';
  document.getElementById('quizQuestionText').textContent = q.question;

  const answered = activeQuiz.answers[activeQuiz.index];
  const mcqBox = document.getElementById('quizMcqOptions');
  const fillBox = document.getElementById('quizFillContainer');

  if (activeQuiz.type === 'mcq') {
    mcqBox.classList.remove('hidden');
    fillBox.classList.add('hidden');
    const letters = ['A', 'B', 'C', 'D', 'E'];
    mcqBox.innerHTML = q.answers.map((ans, idx) => {
      let optCls = 'mcq-option-btn';
      if (answered) {
        if (idx === q.correctIndex) optCls += ' opt-correct';
        else if (idx === answered.choice) optCls += ' opt-wrong';
      }
      return `
        <button class="${optCls}" ${answered ? 'disabled' : ''} onclick="chooseMCQAnswer(${idx})">
          <div class="flex-gap">
            <span class="opt-letter">${letters[idx] || (idx + 1)}</span>
            <span>${ans.text}</span>
          </div>
          ${answered && idx === q.correctIndex ? '<span class="green-text font-bold">✓ ڕاستە</span>' : ''}
          ${answered && idx === answered.choice && !answered.correct ? '<span class="red-text font-bold">✕ هەڵە</span>' : ''}
        </button>
      `;
    }).join('');
  } else {
    mcqBox.classList.add('hidden');
    fillBox.classList.remove('hidden');
    const input = document.getElementById('quizFillInput');
    const feedback = document.getElementById('fillFeedbackBox');
    input.value = answered ? answered.value : '';
    input.disabled = !!answered;
    if (answered) {
      feedback.classList.remove('hidden');
      feedback.className = `feedback-banner ${answered.correct ? 'feedback-correct' : 'feedback-wrong'}`;
      feedback.innerHTML = answered.correct ? '✅ وەڵامەکەت تەواو و ڕاستە!' : `❌ وەڵامی ڕاست: <b>${q.answer}</b>`;
    } else {
      feedback.classList.add('hidden');
    }
  }

  // دوگمەکانی خوارەوە
  document.getElementById('prevQuizQBtn').style.visibility = activeQuiz.index > 0 ? 'visible' : 'hidden';
  const isLast = activeQuiz.index === activeQuiz.questions.length - 1;
  document.getElementById('nextQuizQBtn').textContent = isLast ? 'کۆتایی و ئەنجام' : 'پرسیاری دواتر';
}

function chooseMCQAnswer(choiceIdx) {
  if (!activeQuiz || activeQuiz.answers[activeQuiz.index]) return;
  const q = activeQuiz.questions[activeQuiz.index];
  const isCorrect = choiceIdx === q.correctIndex;
  playSound(isCorrect ? 'correct' : 'wrong');

  activeQuiz.answers[activeQuiz.index] = {
    choice: choiceIdx,
    correct: isCorrect,
    userAnswer: q.answers[choiceIdx]?.text || '',
    correctAnswer: q.answers[q.correctIndex]?.text || ''
  };

  renderQuiz();
  setTimeout(() => {
    if (activeQuiz.index < activeQuiz.questions.length - 1) {
      activeQuiz.index++;
      renderQuiz();
    } else {
      finishQuiz();
    }
  }, 600);
}

function submitFillAnswer() {
  if (!activeQuiz || activeQuiz.answers[activeQuiz.index]) return;
  const input = document.getElementById('quizFillInput');
  const val = input.value.trim();
  if (!val) { showToast('تکایە وەڵامێک بنووسە.'); return; }

  const q = activeQuiz.questions[activeQuiz.index];
  const isCorrect = q.accepted.includes(normalizeText(val));
  playSound(isCorrect ? 'correct' : 'wrong');

  activeQuiz.answers[activeQuiz.index] = {
    value: val,
    correct: isCorrect,
    userAnswer: val,
    correctAnswer: q.answer
  };

  renderQuiz();
  setTimeout(() => {
    if (activeQuiz.index < activeQuiz.questions.length - 1) {
      activeQuiz.index++;
      renderQuiz();
    } else {
      finishQuiz();
    }
  }, 750);
}

function jumpQuizQuestion(idx) {
  if (!activeQuiz) return;
  activeQuiz.index = idx;
  renderQuiz();
}

function finishQuiz() {
  if (!activeQuiz) return;
  const items = activeQuiz.questions.map((q, i) => {
    const a = activeQuiz.answers[i];
    return {
      question: q.question,
      correct: !!a?.correct,
      userAnswer: a?.userAnswer || a?.value || 'وەڵام نەدراوەتەوە',
      correctAnswer: activeQuiz.type === 'mcq' ? q.answers[q.correctIndex]?.text : q.answer
    };
  });

  const correct = items.filter(x => x.correct).length;
  const total = items.length;
  const percent = Math.round((correct / Math.max(1, total)) * 100);

  activeQuiz.result = { correct, wrong: total - correct, total, percent, items };
  navigate('result');
}

// ٦. لاپەڕەی ئەنجام (Result)
function renderResult() {
  if (!activeQuiz?.result) { navigate('lessons'); return; }
  const res = activeQuiz.result;
  document.getElementById('resultPercentText').textContent = `${res.percent}%`;
  document.getElementById('resultCorrectCount').textContent = res.correct;
  document.getElementById('resultWrongCount').textContent = res.wrong;
  document.getElementById('resultTotalCount').textContent = res.total;
  document.getElementById('resultDetailText').textContent = `ڕاست: ${res.correct} • هەڵە: ${res.wrong} • کۆی گشتی: ${res.total}`;

  const container = document.getElementById('resultAnswersList');
  container.innerHTML = res.items.map((it, idx) => `
    <div class="review-item ${it.correct ? 'rev-correct' : 'rev-wrong'}">
      <div class="review-q">${idx + 1}. ${it.question}</div>
      <div class="review-a">وەڵامی تۆ: <b>${it.userAnswer}</b></div>
      ${!it.correct ? `<div class="green-text font-12 mt-1">وەڵامی ڕاست: ${it.correctAnswer}</div>` : ''}
    </div>
  `).join('');
}

// ٧. لاپەڕەی ڕێکخستنەکان (Settings)
function renderSettings() {
  let lessonsCount = 0;
  let questionsCount = 0;
  let subjectsCount = 0;
  Object.values(db.subjectsByClass).forEach(s => subjectsCount += s.length);
  Object.values(db.lessons).forEach(l => {
    lessonsCount += l.length;
    l.forEach(item => {
      questionsCount += parseMCQ(item.mcq).length + parseFill(item.fill).length;
    });
  });

  document.getElementById('settingsLessonsCount').textContent = lessonsCount;
  document.getElementById('settingsQuestionsCount').textContent = questionsCount;
  document.getElementById('settingsSubjectsCount').textContent = subjectsCount;

  const dbStatus = document.getElementById('dbStatusBadge');
  const dbText = document.getElementById('dbStatusText');
  if (SUPABASE_URL && SUPABASE_URL.length > 10) {
    dbStatus.textContent = 'سەرهێڵ (Supabase)';
    dbStatus.className = 'badge-pill tag-green';
    dbText.textContent = `پەیوەستکراوە بە داتابەیسی سەرهێڵی: ${SUPABASE_URL}`;
  } else {
    dbStatus.textContent = 'ناوخۆیی (Offline)';
    dbText.textContent = 'داتاکان لەسەر ئەم ئامێرە هەڵگیراون. دەتوانیت لە ڕێگەی SUPABASE_URL بە داتابەیسی سەرەکی بیبەستیتەوە.';
  }
}

// فول سکرین خوێنەر (Fullscreen Reader)
function openFullScreenReader() {
  const list = db.lessons[`${currentClassId}|${currentSubjectId}`] || [];
  const lesson = list.find(l => l.id === currentLessonId);
  if (!lesson) return;

  const currentSub = (db.subjectsByClass[currentClassId] || []).find(s => s.id === currentSubjectId);
  const currentClass = db.classes.find(c => c.id === currentClassId);
  document.getElementById('readerClassSubjectText').textContent = `${currentClass?.name || ''} • ${currentSub?.name || ''}`;
  document.getElementById('readerLessonTitle').textContent = lesson.title;
  document.getElementById('readerHeroTitle').textContent = lesson.title;
  document.getElementById('readerTextBox').textContent = lesson.explanation || 'هیچ دەقێک نییە.';

  // گۆڕینی وانەی پێشوو و دواتر
  const idx = list.findIndex(l => l.id === lesson.id);
  const prevBtn = document.getElementById('readerPrevBtn');
  const nextBtn = document.getElementById('readerNextBtn');
  if (idx > 0) {
    prevBtn.classList.remove('hidden');
    prevBtn.onclick = () => { currentLessonId = list[idx - 1].id; openFullScreenReader(); };
  } else {
    prevBtn.classList.add('hidden');
  }
  if (idx < list.length - 1) {
    nextBtn.classList.remove('hidden');
    nextBtn.onclick = () => { currentLessonId = list[idx + 1].id; openFullScreenReader(); };
  } else {
    nextBtn.classList.add('hidden');
  }

  document.getElementById('fullScreenReader').classList.remove('hidden');
}

// مۆداڵی وانە (Add/Edit Lesson)
function openLessonModal(lessonId = null) {
  if (!guardOwnerAction('تەنها ئادمینی پڕۆژە دەتوانێت پەڕە زیاد بکات یان دەستکاری بکات.')) return;
  editingLessonId = lessonId;
  const modal = document.getElementById('lessonModal');
  const title = document.getElementById('formLessonTitle');
  const explain = document.getElementById('formLessonExplain');
  const mcq = document.getElementById('formLessonMcq');
  const fill = document.getElementById('formLessonFill');

  if (lessonId) {
    const list = db.lessons[`${currentClassId}|${currentSubjectId}`] || [];
    const item = list.find(l => l.id === lessonId);
    if (item) {
      document.getElementById('lessonModalTitle').textContent = '✏️ دەستکاریکردنی پەڕە';
      title.value = item.title;
      explain.value = item.explanation;
      mcq.value = item.mcq;
      fill.value = item.fill;
    }
  } else {
    document.getElementById('lessonModalTitle').textContent = '✨ دروستکردنی پەڕەی نوێ';
    title.value = '';
    explain.value = '';
    mcq.value = '';
    fill.value = '';
  }
  modal.classList.remove('hidden');
}

function saveLesson() {
  if (!guardOwnerAction('تەنها ئادمینی پڕۆژە دەتوانێت پەڕە پاشەکەوت بکات.')) return;
  const title = document.getElementById('formLessonTitle').value.trim();
  const explain = document.getElementById('formLessonExplain').value.trim();
  const mcq = document.getElementById('formLessonMcq').value.trim();
  const fill = document.getElementById('formLessonFill').value.trim();
  if (!title) { showToast('تکایە تایتڵی پەڕەکە بنووسە.'); return; }

  const key = `${currentClassId}|${currentSubjectId}`;
  if (!db.lessons[key]) db.lessons[key] = [];

  if (editingLessonId) {
    const item = db.lessons[key].find(l => l.id === editingLessonId);
    if (item) {
      item.title = title;
      item.explanation = explain;
      item.mcq = mcq;
      item.fill = fill;
    }
    showToast('پەڕەکە نوێکرایەوە.');
  } else {
    db.lessons[key].push({
      id: `l_${Date.now()}`,
      title,
      explanation: explain,
      mcq,
      fill
    });
    showToast('پەڕەی نوێ زیادکرا.');
  }

  saveDB();
  document.getElementById('lessonModal').classList.add('hidden');
  renderCurrentPage();
}

// مۆداڵی دروستکردنی بابەت
function saveSubject() {
  if (!guardOwnerAction('تەنها ئادمینی پڕۆژە دەتوانێت بابەتی نوێ دروست بکات.')) return;
  const name = document.getElementById('formSubjectName').value.trim();
  const icon = document.getElementById('formSubjectIcon').value.trim() || '📗';
  if (!name) { showToast('تکایە ناوی بابەتەکە بنووسە.'); return; }

  const id = `sub_${Date.now()}`;
  if (!db.subjectsByClass[currentClassId]) db.subjectsByClass[currentClassId] = [];
  db.subjectsByClass[currentClassId].push({ id, name, icon });
  db.lessons[`${currentClassId}|${id}`] = [];

  saveDB();
  document.getElementById('subjectModal').classList.add('hidden');
  document.getElementById('formSubjectName').value = '';
  showToast('بابەتەکە زیادکرا.');
  renderSubjects();
}

// مۆداڵی سڕینەوە
let deletePending = null;
function confirmDelete(type, id, title) {
  if (!guardOwnerAction('تەنها ئادمینی پڕۆژە دەتوانێت بسڕێتەوە.')) return;
  deletePending = { type, id, title };
  document.getElementById('deleteConfirmText').innerHTML = `دڵنیایت لە سڕینەوەی <b>"${title}"</b>؟`;
  document.getElementById('deleteConfirmModal').classList.remove('hidden');
}

function executeDelete() {
  if (!deletePending) return;
  const { type, id, title } = deletePending;
  if (type === 'lesson') {
    const key = `${currentClassId}|${currentSubjectId}`;
    db.lessons[key] = (db.lessons[key] || []).filter(l => l.id !== id);
    saveDB();
    showToast(`پەڕەی "${title}" سڕایەوە.`);
    if (currentPage === 'lesson' && currentLessonId === id) navigate('lessons');
    else renderLessons();
  } else if (type === 'subject') {
    db.subjectsByClass[currentClassId] = (db.subjectsByClass[currentClassId] || []).filter(s => s.id !== id);
    delete db.lessons[`${currentClassId}|${id}`];
    saveDB();
    showToast(`بابەتی "${title}" سڕایەوە.`);
    if (currentPage === 'lessons' || currentPage === 'lesson') navigate('subjects');
    else renderSubjects();
  }
  document.getElementById('deleteConfirmModal').classList.add('hidden');
  deletePending = null;
}

// تاقیکردنەوەی پەڕە هەڵبژێردراوەکان (Aggregate Exam Modal)
function openAggregateModal() {
  const classSelect = document.getElementById('aggClassSelect');
  classSelect.innerHTML = db.classes.map(c => `
    <option value="${c.id}" ${c.id === currentClassId ? 'selected' : ''}>${c.name}</option>
  `).join('');

  updateAggSubjects();
  document.getElementById('aggregateModal').classList.remove('hidden');
}

function updateAggSubjects() {
  const cId = document.getElementById('aggClassSelect').value;
  const subSelect = document.getElementById('aggSubjectSelect');
  const subs = db.subjectsByClass[cId] || [];
  subSelect.innerHTML = subs.map(s => `
    <option value="${s.id}" ${s.id === currentSubjectId ? 'selected' : ''}>${s.name}</option>
  `).join('');
  updateAggPages();
}

function updateAggPages() {
  const cId = document.getElementById('aggClassSelect').value;
  const sId = document.getElementById('aggSubjectSelect').value;
  const list = db.lessons[`${cId}|${sId}`] || [];
  const container = document.getElementById('aggPagesCheckboxList');

  if (list.length === 0) {
    container.innerHTML = '<div class="p-2 muted-text font-12">هیچ پەڕەیەک لەم بابەتەدا نییە.</div>';
    document.getElementById('aggSelectedCountText').textContent = '٠ پەڕە';
    return;
  }

  container.innerHTML = list.map((l, i) => `
    <label class="page-check-row">
      <input type="checkbox" class="agg-page-checkbox" value="${i + 1}" checked onchange="updateAggCount()">
      <span>${i + 1}. ${l.title}</span>
    </label>
  `).join('');
  updateAggCount();
}

function updateAggCount() {
  const checked = document.querySelectorAll('.agg-page-checkbox:checked').length;
  document.getElementById('aggSelectedCountText').textContent = `${checked} پەڕە هەڵبژێردراوە`;
}

function runAggregate(type) {
  const cId = document.getElementById('aggClassSelect').value;
  const sId = document.getElementById('aggSubjectSelect').value;
  const list = db.lessons[`${cId}|${sId}`] || [];
  const checkedBoxes = Array.from(document.querySelectorAll('.agg-page-checkbox:checked')).map(cb => parseInt(cb.value));

  if (!checkedBoxes.length) {
    showToast('تکایە لانیکەم یەک پەڕە هەڵبژێرە.');
    return;
  }

  const selectedLessons = checkedBoxes.map(num => list[num - 1]).filter(Boolean);
  const questions = [];
  selectedLessons.forEach((l, idx) => {
    const parsed = type === 'mcq' ? parseMCQ(l.mcq) : parseFill(l.fill);
    parsed.forEach(q => {
      questions.push({ ...q, pageNumber: checkedBoxes[idx], lessonTitle: l.title });
    });
  });

  if (!questions.length) {
    showToast('هیچ پرسیارێک لەم پەڕانەدا نەدۆزرایەوە.');
    return;
  }

  const subName = (db.subjectsByClass[cId] || []).find(s => s.id === sId)?.name || '';
  document.getElementById('aggregateModal').classList.add('hidden');

  activeQuiz = {
    type,
    title: 'تاقیکردنەوەی گشتی',
    modeLabel: `${subName} • پەڕەکانی: ${checkedBoxes.join('، ')}`,
    questions,
    index: 0,
    answers: new Array(questions.length).fill(null),
    result: null
  };
  navigate('quiz');
}

// دەستپێکردنی گوێگرەکان (Event Listeners) لە کاتی بارکردنی لاپەڕەدا
document.addEventListener('DOMContentLoaded', () => {
  // ڕۆڵی بەکارهێنەر لە guard.js دێت (window.kurdtechProfile.role === 'owner').
  // ئەگەر guard.js پێشتر تەواو بووبێت، ڕاستەوخۆ بیخوێنەوە، ئەگەر نا چاوەڕوانی ڕووداوەکەی بکە.
  if (window.kurdtechProfile) {
    isOwner = window.kurdtechProfile.role === 'owner';
  }
  window.addEventListener('kurdtech:ready', () => {
    isOwner = !!(window.kurdtechProfile && window.kurdtechProfile.role === 'owner');
    applyRolePermissions();
  });

  renderCurrentPage();
  applyRolePermissions();
  fetchFromSupabase();

  // هەڵسوڕێنەرەکانی دوگمەکان
  document.getElementById('brandBtn')?.addEventListener('click', () => navigate('home'));
  document.getElementById('backBtn')?.addEventListener('click', () => {
    if (currentPage === 'subjects') navigate('home');
    else if (currentPage === 'lessons') navigate('subjects');
    else if (currentPage === 'lesson') navigate('lessons');
    else if (currentPage === 'quiz' || currentPage === 'result') navigate('lessons');
    else navigate('home');
  });

  document.getElementById('headerAggExamBtn')?.addEventListener('click', openAggregateModal);
  document.getElementById('homeAggExamBtn')?.addEventListener('click', openAggregateModal);
  document.getElementById('lessonsAggBtn')?.addEventListener('click', openAggregateModal);
  document.getElementById('settingsBtn')?.addEventListener('click', () => navigate('settings'));
  document.getElementById('homeQuickLessonsBtn')?.addEventListener('click', () => { currentClassId = '10'; navigate('subjects'); });

  // گەڕان لە ناو بابەتەکان
  document.getElementById('subjectSearchInput')?.addEventListener('input', renderSubjects);
  document.getElementById('addSubjectBtn')?.addEventListener('click', () => {
    if (!guardOwnerAction('تەنها ئادمینی پڕۆژە دەتوانێت بابەتی نوێ دروست بکات.')) return;
    document.getElementById('subjectModal').classList.remove('hidden');
  });
  document.getElementById('closeSubjectModalBtn')?.addEventListener('click', () => document.getElementById('subjectModal').classList.add('hidden'));
  document.getElementById('saveSubjectBtn')?.addEventListener('click', saveSubject);

  // وانەکان
  document.getElementById('addLessonBtn')?.addEventListener('click', () => openLessonModal());
  document.getElementById('closeLessonModalBtn')?.addEventListener('click', () => document.getElementById('lessonModal').classList.add('hidden'));
  document.getElementById('saveLessonBtn')?.addEventListener('click', saveLesson);
  document.getElementById('deleteSubjectBtn')?.addEventListener('click', () => {
    const sub = (db.subjectsByClass[currentClassId] || []).find(s => s.id === currentSubjectId);
    if (sub) confirmDelete('subject', sub.id, sub.name);
  });
  document.getElementById('deleteSingleLessonBtn')?.addEventListener('click', () => {
    const list = db.lessons[`${currentClassId}|${currentSubjectId}`] || [];
    const item = list.find(l => l.id === currentLessonId);
    if (item) confirmDelete('lesson', item.id, item.title);
  });

  // تابەکانی وانە
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // تاقیکردنەوەکان
  document.getElementById('startLessonMcqBtn')?.addEventListener('click', () => startSingleQuiz(currentLessonId, 'mcq'));
  document.getElementById('startLessonMcqBigBtn')?.addEventListener('click', () => startSingleQuiz(currentLessonId, 'mcq'));
  document.getElementById('startLessonFillBtn')?.addEventListener('click', () => startSingleQuiz(currentLessonId, 'fill'));
  document.getElementById('startLessonFillBigBtn')?.addEventListener('click', () => startSingleQuiz(currentLessonId, 'fill'));
  document.getElementById('submitFillBtn')?.addEventListener('click', submitFillAnswer);
  document.getElementById('quizFillInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') submitFillAnswer(); });

  document.getElementById('cancelQuizBtn')?.addEventListener('click', () => {
    if (confirm('دڵنیایت لە بەجێهێشتنی تاقیکردنەوەکە؟')) navigate('lessons');
  });
  document.getElementById('prevQuizQBtn')?.addEventListener('click', () => {
    if (activeQuiz && activeQuiz.index > 0) { activeQuiz.index--; renderQuiz(); }
  });
  document.getElementById('nextQuizQBtn')?.addEventListener('click', () => {
    if (!activeQuiz) return;
    if (activeQuiz.index < activeQuiz.questions.length - 1) {
      activeQuiz.index++;
      renderQuiz();
    } else {
      finishQuiz();
    }
  });

  document.getElementById('retryQuizBtn')?.addEventListener('click', () => {
    if (!activeQuiz) return;
    activeQuiz.index = 0;
    activeQuiz.answers = new Array(activeQuiz.questions.length).fill(null);
    activeQuiz.result = null;
    navigate('quiz');
  });
  document.getElementById('exitResultBtn')?.addEventListener('click', () => navigate('lessons'));

  // دەنگ
  document.getElementById('quizSoundToggle')?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    document.getElementById('quizSoundToggle').textContent = soundEnabled ? '🔊' : '🔇';
    showToast(soundEnabled ? 'دەنگ چالاک کرا' : 'دەنگ بێدەنگ کرا');
  });

  // فول سکرین
  document.getElementById('openFullScreenBtn')?.addEventListener('click', openFullScreenReader);
  document.getElementById('openFullScreenBtn2')?.addEventListener('click', openFullScreenReader);
  document.getElementById('closeFullScreenBtn')?.addEventListener('click', () => {
    document.getElementById('fullScreenReader').classList.add('hidden');
  });
  document.getElementById('readerStartMcqBtn')?.addEventListener('click', () => {
    document.getElementById('fullScreenReader').classList.add('hidden');
    startSingleQuiz(currentLessonId, 'mcq');
  });
  document.getElementById('readerStartFillBtn')?.addEventListener('click', () => {
    document.getElementById('fullScreenReader').classList.add('hidden');
    startSingleQuiz(currentLessonId, 'fill');
  });

  // فۆنت و تیمی خوێنەر
  document.getElementById('readerFontUpBtn')?.addEventListener('click', () => {
    const box = document.getElementById('readerTextBox');
    const cur = parseInt(window.getComputedStyle(box).fontSize) || 16;
    box.style.fontSize = `${Math.min(26, cur + 2)}px`;
  });
  document.getElementById('readerFontDownBtn')?.addEventListener('click', () => {
    const box = document.getElementById('readerTextBox');
    const cur = parseInt(window.getComputedStyle(box).fontSize) || 16;
    box.style.fontSize = `${Math.max(13, cur - 2)}px`;
  });

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const reader = document.getElementById('fullScreenReader');
      reader.classList.remove('theme-obsidian', 'theme-sepia');
      if (btn.dataset.theme === 'obsidian') reader.classList.add('theme-obsidian');
      if (btn.dataset.theme === 'sepia') reader.classList.add('theme-sepia');
    });
  });

  // پەڕە هەڵبژێردراوەکان
  document.getElementById('aggClassSelect')?.addEventListener('change', updateAggSubjects);
  document.getElementById('aggSubjectSelect')?.addEventListener('change', updateAggPages);
  document.getElementById('closeAggModalBtn')?.addEventListener('click', () => document.getElementById('aggregateModal').classList.add('hidden'));
  document.getElementById('aggSelectAllBtn')?.addEventListener('click', () => {
    document.querySelectorAll('.agg-page-checkbox').forEach(cb => cb.checked = true);
    updateAggCount();
  });
  document.getElementById('aggDeselectAllBtn')?.addEventListener('click', () => {
    document.querySelectorAll('.agg-page-checkbox').forEach(cb => cb.checked = false);
    updateAggCount();
  });
  document.getElementById('startAggMcqBtn')?.addEventListener('click', () => runAggregate('mcq'));
  document.getElementById('startAggFillBtn')?.addEventListener('click', () => runAggregate('fill'));

  // سڕینەوە
  document.getElementById('confirmDeleteYesBtn')?.addEventListener('click', executeDelete);
  document.getElementById('confirmDeleteNoBtn')?.addEventListener('click', () => document.getElementById('deleteConfirmModal').classList.add('hidden'));
});
