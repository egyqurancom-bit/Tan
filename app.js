/* ================================================
   EGY QURAN — app.js (Sheikh Al-Ma'asrawi Edition - Resume From Exact Time)
   ================================================ */

'use strict';

// ── دوال المساعدة ──

let toastTimeout;

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

function safeLocalGet(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
}

function safeLocalSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* صامت */ }
}

function safeLocalCheck(key) {
    try { return !!localStorage.getItem(key); }
    catch { return false; }
}

// ── التعامل مع بانر الاستئناف والتثبيت ──

function closeResumeBanner() {
    const banner = document.getElementById('resume-banner');
    if (banner) banner.classList.remove('show');
}

// تعديل: دالة المتابعة أصبحت تدعم الوقت وتنتظر تحميل الرواية
async function resumePlayback() {
    closeResumeBanner();
    if (window.resumeData) {
        if (window.resumeData.edition && window.resumeData.edition !== currentEdition) {
            await selectEdition(window.resumeData.edition);
        }
        playSurah(window.resumeData.id, window.resumeData.url, window.resumeData.time);
        showReadingView(window.resumeData.id, window.resumeData.time || 0);
    }
}

function closeInstallBanner() {
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.remove('show');
}

// ── بيانات السور، الأجزاء، والترجمة ──

const surahNamesEn = [
    "", "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa", "Al-Ma'idah", "Al-An'am",
    "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus", "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim",
    "Al-Hijr", "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam", "Taha", "Al-Anbiya", "Al-Hajj",
    "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara", "An-Naml", "Al-Qasas", "Al-'Ankabut",
    "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab", "Saba", "Fatir", "Ya-Sin", "As-Saffat", "Sad",
    "Az-Zumar", "Ghafir", "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah",
    "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adh-Dhariyat", "At-Tur", "An-Najm",
    "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadila", "Al-Hashr", "Al-Mumtahanah",
    "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk",
    "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir",
    "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "'Abasa", "At-Takwir",
    "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah",
    "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Layl", "Ad-Duhaa", "Ash-Sharh", "At-Tin", "Al-'Alaq",
    "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat", "Al-Qari'ah", "At-Takathur", "Al-'Asr",
    "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr",
    "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

// قاموس لترجمة الأجزاء للإنجليزية
const partsMap = {
    "الجزء الأول": "Part 1", "الجزء الثاني": "Part 2", "الجزء الثالث": "Part 3", "الجزء الرابع": "Part 4", "الجزء الخامس": "Part 5",
    "الجزء السادس": "Part 6", "الجزء السابع": "Part 7", "الجزء الثامن": "Part 8", "الجزء التاسع": "Part 9", "الجزء العاشر": "Part 10",
    "الجزء الحادي عشر": "Part 11", "الجزء الثاني عشر": "Part 12", "الجزء الثالث عشر": "Part 13", "الجزء الرابع عشر": "Part 14", "الجزء الخامس عشر": "Part 15",
    "الجزء السادس عشر": "Part 16", "الجزء السابع عشر": "Part 17", "الجزء الثامن عشر": "Part 18", "الجزء التاسع عشر": "Part 19", "الجزء العشرون": "Part 20",
    "الجزء الحادي والعشرون": "Part 21", "الجزء الثاني والعشرون": "Part 22", "الجزء الثالث والعشرون": "Part 23", "الجزء الرابع والعشرون": "Part 24", "الجزء الخامس والعشرون": "Part 25",
    "الجزء السادس والعشرون": "Part 26", "الجزء السابع والعشرون": "Part 27", "الجزء الثامن والعشرون": "Part 28", "الجزء التاسع والعشرون": "Part 29", "الجزء الثلاثون": "Part 30"
};

const translations = {
    ar: {
        langLabel: "EN",
        mainTitle: "الشيخ <strong>أحمد عيسى المعصراوي</strong>",
        subtitle: "القراءات القرآنية المتواترة",
        surahPrefix: "سورة",
        downloading: "جاري تحميل",
        downloadComplete: "تم التحميل بنجاح!",
        resumeBtn: "متابعة الاستماع",
        cancelBtn: "إلغاء",
        resumeTextDef: "هل تود إكمال الاستماع؟",
        installTitle: "تثبيت تطبيق Egy Quran",
        installDesc: "تجربة استماع أسرع وتعمل بدون إنترنت",
        focusOn: "تم تفعيل وضع الاستماع الهادئ",
        focusOff: "تم إيقاف وضع الاستماع الهادئ",
        installed: "تم تثبيت التطبيق بنجاح!",
        networkError: "خطأ في الاتصال، يرجى التحقق من الإنترنت",
        reconnected: "تمت استعادة الاتصال، جاري التشغيل...",
        disconnected: "انقطع الاتصال بالإنترنت",
        editionPrefix: "الرواية الحالية:",
        fileNotFound: "عذراً، ملف الرواية غير متوفر حالياً"
    },
    en: {
        langLabel: "AR",
        mainTitle: "Sheikh <strong>Ahmed Eisa Al-Ma'asrawi</strong>",
        subtitle: "Authentic Quranic Narrations",
        surahPrefix: "Surah",
        downloading: "Downloading",
        downloadComplete: "Download Complete!",
        resumeBtn: "Resume Listening",
        cancelBtn: "Cancel",
        resumeTextDef: "Resume listening?",
        installTitle: "Install Egy Quran",
        installDesc: "Faster experience with offline support",
        focusOn: "Focus Mode Enabled",
        focusOff: "Focus Mode Disabled",
        installed: "App installed successfully!",
        networkError: "Network error, please check connection",
        reconnected: "Connection restored, playing...",
        disconnected: "Internet connection lost",
        editionPrefix: "Current Edition:",
        fileNotFound: "Sorry, the edition file is not available."
    }
};

let currentLang = 'ar';

const editionsConfig = {
    1: { nameAr: "قَالُونُ عَنْ نَافِعٍ الْمَدَنِيِّ", nameEn: "Qalun A'n Nafi'", file: "qalon.json" },
    2: { nameAr: "وَرْشٌ عَنْ نَافِعٍ الْمَدَنِيِّ", nameEn: "Warsh A'n Nafi'", file: "warsh.json" },
    3: { nameAr: "الْبَزِّيُّ عَنِ ابْنِ كَثِيرٍ الْمَكِّيِّ", nameEn: "Al-Bazzi A'n Ibn Kathir", file: "bazzi.json" },
    4: { nameAr: "قُنْبُلٌ عَنِ ابْنِ كَثِيرٍ الْمَكِّيِّ", nameEn: "Qunbul A'n Ibn Kathir", file: "qunbul.json" },
    5: { nameAr: "الدُّورِيُّ عَنْ أَبِي عَمْرٍو الْبَصْرِيِّ", nameEn: "Al-Duri A'n Abi Amr", file: "duri_abu_amr.json" },
    6: { nameAr: "السُّوسِيُّ عَنْ أَبِي عَمْرٍو الْبَصْرِيِّ", nameEn: "Al-Susi A'n Abi Amr", file: "susi.json" },
    7: { nameAr: "هِشَامٌ عَنِ ابْنِ عَامِرٍ الشَّامِيِّ", nameEn: "Hisham A'n Ibn Amir", file: "hisham.json" },
    8: { nameAr: "ابْنُ ذَكْوَانَ عَنِ ابْنِ عَامِرٍ الشَّامِيِّ", nameEn: "Ibn Dhakwan A'n Ibn Amir", file: "ibn_dhakwan.json" },
    9: { nameAr: "شُعْبَةُ عَنْ عَاصِمٍ الْكُوفِيِّ", nameEn: "Shu'bah A'n Asim", file: "shubah.json" },
    10: { nameAr: "حَفْصٌ عَنْ عَاصِمٍ الْكُوفِيِّ", nameEn: "Hafs A'n Asim", file: "hafs.json" },
    11: { nameAr: "خَلَفٌ عَنْ حَمْزَةَ الْكُوفِيِّ", nameEn: "Khalaf A'n Hamzah", file: "khalaf_an_hamzah.json" },
    12: { nameAr: "خَلَّادٌ عَنْ حَمْزَةَ الْكُوفِيِّ", nameEn: "Khallad A'n Hamzah", file: "khallad.json" },
    13: { nameAr: "أَبُو الْحَارِثِ عَنِ الْكِسَائِيِّ الْكُوفِيِّ", nameEn: "Abu Al-Harith A'n Al-Kisa'i", file: "abu_alharith.json" },
    14: { nameAr: "الدُّورِيُّ عَنِ الْكِسَائِيِّ الْكُوفِيِّ", nameEn: "Al-Duri A'n Al-Kisa'i", file: "duri_alkisai.json" },
    15: { nameAr: "ابْنُ وَرْدَانَ عَنْ أَبِي جَعْفَرٍ الْمَدَنِيِّ", nameEn: "Ibn Wardan A'n Abu Ja'far", file: "ibn_wardan.json" },
    16: { nameAr: "ابْنُ جَمَّازٍ عَنْ أَبِي جَعْفَرٍ الْمَدَنِيِّ", nameEn: "Ibn Jammaz A'n Abu Ja'far", file: "ibn_jammaz.json" },
    17: { nameAr: "رُوَيْسٌ عَنْ يَعْقُوبَ الْحَضْرَمِيِّ", nameEn: "Ruwais A'n Ya'qub", file: "ruwais.json" },
    18: { nameAr: "رَوْحٌ عَنْ يَعْقُوبَ الْحَضْرَمِيِّ", nameEn: "Rawh A'n Ya'qub", file: "rawh.json" },
    19: { nameAr: "إِسْحَاقُ عَنْ خَلَفٍ الْعَاشِرِ", nameEn: "Ishaq A'n Khalaf", file: "ishaq.json" },
    20: { nameAr: "إِدْرِيسُ عَنْ خَلَفٍ الْعَاشِرِ", nameEn: "Idris A'n Khalaf", file: "idris.json" }
};

const icons = {
    play:     '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause:    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    loading:  '<svg class="loading-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>',
    sun:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    moon:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    mushaf:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6.5c-1.6-1.2-3.8-1.8-6.2-1.8-.5 0-.8.4-.8.8v11.7c0 .5.4.9.9.9 2.2 0 4.3.6 5.8 1.7.2.1.5.1.7 0 1.5-1.1 3.6-1.7 5.8-1.7.5 0 .9-.4.9-.9V5.5c0-.4-.3-.8-.8-.8-2.4 0-4.6.6-6.2 1.8-.2.1-.3.2-.3.4v12.6"/></svg>'
};

// ── المشغل الصوتي ──

const audioInstance = new Audio();
// audioInstance.crossOrigin = "anonymous"; // تم تعطيله للسماح بتشغيل الروابط التي لا تدعم CORS
let audioCtx, gainNode, audioSource;

function initAudioBoost() {
    try {
        if (!audioInstance.crossOrigin || audioInstance.crossOrigin === "null") {
            return;
        }

        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            audioCtx = new AudioContext();
            audioSource = audioCtx.createMediaElementSource(audioInstance);
            gainNode = audioCtx.createGain();
            gainNode.gain.value = 2.8; 
            audioSource.connect(gainNode);
            gainNode.connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(e => console.warn("AudioContext resume:", e));
        }
    } catch (e) {
        console.warn("Web Audio API:", e);
    }
}

// ── حالة التطبيق ──

let currentTheme       = 'light';
let currentEdition     = null; // لا يوجد رواية محملة افتراضياً
let activeSurahsData   = [];
let playingSurahId     = null;
let playingEditionId   = null;
let isBuffering        = false;
let isFocusMode        = false;
let playbackMode       = 'autonext';
let playbackMenuOpen   = false;
let isDropdownOpen     = false;
let activeDownloads    = {};

let isDragging         = false;
let currentSeekPct     = 0;
let lastSaveTime       = 0;

const preloadAudioObj = new Audio();
let preloadedSurahId  = null;

// ── حالة شاشة القراءة والمزامنة ──

let readingJuzNum      = null;   // رقم الجزء المعروض حالياً في شاشة القراءة
let readingViewOpen    = false;  // هل شاشة القراءة مفتوحة
let currentAyahIndex   = -1;     // فهرس الآية المظللة حالياً
const juzDataCache     = {};     // تخزين مؤقت لكل جزء
const QURAN_TEXT_API    = 'https://api.alquran.cloud/v1/juz/';
const QURAN_TEXT_EDITION = 'quran-uthmani';

// ── معالجة الأسماء ──

function getTrackName(sData) {
    if (!sData) return "";
    let name = sData.name;
    
    if (currentLang === 'en' && partsMap[name]) {
        return partsMap[name];
    } else if (name.includes('الجزء') || name.includes('مقطع') || name.includes('Part')) {
        return name;
    }
    
    const cleanName = name.replace(/^\s*سورة\s+/, '').trim();
    const baseName = currentLang === 'ar' ? cleanName : (surahNamesEn[sData.id] || cleanName);
    return baseName;
}

function formatTime(s) {
    if (isNaN(s) || s === Infinity) return "00:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' + sec : sec}`;
}

// ── تغيير اللغة والمظهر ──

function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    const dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = currentLang;
    document.documentElement.style.setProperty('--dir', dir);

    document.getElementById('lang-label').textContent = translations[currentLang].langLabel;
    
    const mainTitleEl = document.getElementById('main-title');
    if (mainTitleEl) mainTitleEl.innerHTML = translations[currentLang].mainTitle;
    
    const resumeYes = document.getElementById('resume-btn-yes');
    if (resumeYes) resumeYes.textContent = translations[currentLang].resumeBtn;
    
    const resumeNo = document.getElementById('resume-btn-no');
    if (resumeNo) resumeNo.textContent = translations[currentLang].cancelBtn;
    
    const resumeTextEl = document.getElementById('resume-text');
    if (resumeTextEl && !window.resumeData) {
        resumeTextEl.textContent = translations[currentLang].resumeTextDef;
    }

    const installTitle = document.getElementById('install-title');
    if (installTitle) installTitle.textContent = translations[currentLang].installTitle;
    
    const installDesc = document.getElementById('install-desc');
    if (installDesc) installDesc.textContent = translations[currentLang].installDesc;
    
    const dropdownLabel = document.getElementById('dropdown-label');
    if (dropdownLabel) dropdownLabel.textContent = translations[currentLang].editionPrefix;

    const dlModalTitle = document.getElementById('dl-modal-title');
    if (dlModalTitle && (dlModalTitle.textContent.includes('جاري') || dlModalTitle.textContent.includes('Down'))) {
        dlModalTitle.textContent = translations[currentLang].downloading + "...";
    }

    updatePageMeta();
    setPlaybackMode(playbackMode);
    updateDropdownUI();
    updateFocusHeader();

    if (activeSurahsData.length > 0) renderSurahsList();

    if (playingSurahId) {
        const sData = activeSurahsData.find(s => s.id === playingSurahId);
        if (sData) {
            document.getElementById('player-track-title').textContent = getTrackName(sData);
        }
    }
}

function updatePageMeta() {
    const metaDesc = document.querySelector('meta[name="description"]');
    document.title = currentLang === 'ar' 
        ? "Egy Quran - الشيخ أحمد عيسى المعصراوي" 
        : "Egy Quran - Sheikh Ahmed Eisa Al-Ma'asrawi";
        
    if (metaDesc) {
        metaDesc.setAttribute("content", currentLang === 'ar'
            ? "استمع إلى القرآن الكريم بالروايات المتواترة بصوت الشيخ أحمد عيسى المعصراوي."
            : "Listen to the Holy Quran in various authentic narrations by Sheikh Ahmed Eisa Al-Ma'asrawi."
        );
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.className = currentTheme === 'dark' ? 'dark-theme' : '';
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.innerHTML = currentTheme === 'dark' ? icons.moon : icons.sun;
        themeBtn.setAttribute('aria-label', currentTheme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن');
    }
}

// ── وضع الاستماع الهادئ (Focus Mode) مع History API ──

function toggleFocusMode(forceState = null, fromHistory = false) {
    let newState;
    if (typeof forceState === 'boolean') {
        newState = forceState;
    } else {
        newState = !isFocusMode;
    }

    if (isFocusMode === newState) return;
    
    isFocusMode = newState;
    const focusBtn = document.getElementById('focus-toggle-btn');
    document.body.classList.toggle('focus-mode-active', isFocusMode);

    if (isFocusMode) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        focusBtn?.classList.add('active-feature');
        focusBtn?.setAttribute('aria-pressed', 'true');
        
        if (!fromHistory) {
            history.pushState({ focusMode: true }, '');
        }
    } else {
        focusBtn?.classList.remove('active-feature');
        focusBtn?.setAttribute('aria-pressed', 'false');
        
        if (!fromHistory && history.state && history.state.focusMode) {
            history.back();
        }
    }

    updateFocusHeader();
}

window.addEventListener('popstate', (e) => {
    if (isFocusMode) {
        toggleFocusMode(false, true);
    }
    if (readingViewOpen) {
        closeReadingView(true);
    }
});

function updateFocusHeader() {
    const subtitleEl = document.getElementById('header-subtitle');
    if (!subtitleEl) return;
    
    if (isFocusMode) {
        const config = editionsConfig[currentEdition];
        subtitleEl.textContent = currentLang === 'ar' ? config.nameAr : config.nameEn;
    } else {
        subtitleEl.textContent = translations[currentLang].subtitle;
    }
}

// ── القائمة المنسدلة للروايات ──

function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
    const list = document.getElementById('edition-list');
    const header = document.querySelector('.dropdown-header');
    if (list) list.classList.toggle('show', isDropdownOpen);
    if (header) header.classList.toggle('open', isDropdownOpen);
}

document.addEventListener('click', (e) => {
    if (isDropdownOpen && !e.target.closest('#edition-dropdown')) {
        toggleDropdown();
    }
});

function renderDropdownOptions() {
    const list = document.getElementById('edition-list');
    if (!list) return;

    list.innerHTML = Object.keys(editionsConfig).map(key => {
        const config = editionsConfig[key];
        const name = currentLang === 'ar' ? config.nameAr : config.nameEn;
        return `
            <div class="dropdown-item ${currentEdition == key ? 'active' : ''}" 
                 onclick="selectEdition(${key}, event)"
                 role="option">
                <span>${name}</span>
            </div>
        `;
    }).join('');
}

function updateDropdownUI() {
    const config = editionsConfig[currentEdition];
    const nameEl = document.getElementById('selected-edition-name');
    
    if (nameEl) {
        if (config) {
            nameEl.textContent = currentLang === 'ar' ? config.nameAr : config.nameEn;
        } else {
            nameEl.textContent = currentLang === 'ar' ? "اختر الرواية" : "Choose Edition";
        }
    }
    renderDropdownOptions();
    syncUIWithAudioState();
}

async function selectEdition(num, event) {
    if (event) event.stopPropagation();
    if (isDropdownOpen) toggleDropdown();
    if (currentEdition == num) return;

    currentEdition = num;
    safeLocalSet('maasrawi_edition', num);
    updateDropdownUI();
    await loadEditionData(num);
    updateFocusHeader();

    if (playingSurahId && playingEditionId === currentEdition) {
        const sData = activeSurahsData.find(sur => sur.id === playingSurahId);
        if (sData && !audioInstance.src) {
            audioInstance.src = sData.url;
            const player = document.getElementById('global-player');
            if (player) player.style.display = 'block';
            const trackTitle = document.getElementById('player-track-title');
            if (trackTitle) trackTitle.textContent = getTrackName(sData);
            syncUIWithAudioState();
        }
    }
}

// ── تحميل وتنسيق بيانات الطبعة ──

async function loadEditionData(editionNum) {
    const config = editionsConfig[editionNum];
    if (!config) return;

    activeSurahsData = [];
    renderSurahsList();

    const cacheKey = `cache_${config.file}`;
    const cached = safeLocalGet(cacheKey);
    
    if (cached) {
        processAndSetData(cached);
    }

    try {
        const res = await fetch(config.file);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        processAndSetData(data);
        safeLocalSet(cacheKey, data);
    } catch (e) {
        console.error("تعذّر تحميل بيانات الرواية:", e);
        if (!cached) {
            showToast(translations[currentLang].fileNotFound);
        }
    }
}

function processAndSetData(rawData) {
    activeSurahsData = rawData.map((item, index) => ({
        id: item.id !== undefined ? item.id : (index + 1),
        name: item.title || item.name || `مقطع ${index + 1}`,
        url: item.url
    }));
    renderSurahsList();
}

// ── رسم قائمة السور/الأجزاء ──

function renderSurahsList() {
    const container = document.getElementById('main-surah-list');
    if (!container) return;

    if (!currentEdition) {
        container.innerHTML = `
            <div class="choose-edition-msg" style="text-align: center; padding: 50px 20px; background: var(--bg-card); border-radius: 20px; margin: 20px 0; border: 2px dashed var(--accent-gold); animation: fadeIn 0.8s ease-out;">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" stroke-width="2" style="width: 50px; height: 50px; margin-bottom: 15px; animation: bounceUp 2s infinite;">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
                <p style="font-size: 1.2rem; font-weight: 700; color: var(--accent-gold); margin-bottom: 5px; font-family: 'Cairo', sans-serif;">
                    ${currentLang === 'ar' ? 'يرجى اختيار الرواية من القائمة أعلاه للبدء' : 'Please choose an edition from the menu above to start'}
                </p>
                <p style="font-size: 0.9rem; color: var(--text-muted); opacity: 0.8;">
                    ${currentLang === 'ar' ? 'استمتع بتلاوات الشيخ المعصراوي بالقراءات العشر' : 'Enjoy Sheikh Al-Ma\'asrawi\'s recitations in the ten readings'}
                </p>
                <style>
                    @keyframes bounceUp {
                        0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
                        40% {transform: translateY(-10px);}
                        60% {transform: translateY(-5px);}
                    }
                    @keyframes fadeIn {
                        from {opacity: 0; transform: translateY(10px);}
                        to {opacity: 1; transform: translateY(0);}
                    }
                </style>
            </div>
        `;
        return;
    }

    container.innerHTML = activeSurahsData.map(s => {
        const displayName = getTrackName(s);
        const actionsDir = currentLang === 'ar' ? 'row' : 'row-reverse';
        
        return `
            <div class="surah-row" data-id="${s.id}">
                <div class="surah-info">
                    <span class="surah-number">${String(s.id).padStart(3, '0')}</span>
                    <span class="surah-name">${displayName}</span>
                </div>
                <div class="surah-actions" style="flex-direction:${actionsDir}">
                    <button class="surah-action-btn play-cell"
                            onclick="event.stopPropagation(); playRowAudio(${s.id}, '${s.url}')"
                            aria-label="تشغيل ${displayName}">
                        ${icons.play}
                    </button>
                    <button class="surah-action-btn mushaf-cell"
                            onclick="event.stopPropagation(); openReadingJuz(${s.id}, '${s.url}')"
                            aria-label="فتح المصحف - الاستماع الهادئ لـ ${displayName}"
                            title="الاستماع الهادئ">
                        ${icons.mushaf}
                    </button>
                    <button class="surah-action-btn"
                            onclick="event.stopPropagation(); startDownload(${s.id}, '${s.url}')"
                            aria-label="تحميل ${displayName}">
                        ${icons.download}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    syncUIWithAudioState();
}

// ── قائمة وضع التشغيل ──

function togglePlaybackMenu(event) {
    if (event) event.stopPropagation();
    playbackMenuOpen = !playbackMenuOpen;
    const menu = document.getElementById('playback-menu');
    const btn  = document.getElementById('btn-playback-mode');
    if (menu) menu.classList.toggle('show', playbackMenuOpen);
    if (btn) btn.setAttribute('aria-expanded', playbackMenuOpen ? 'true' : 'false');
}

document.addEventListener('click', (e) => {
    if (playbackMenuOpen && !e.target.closest('#playback-wrapper')) {
        togglePlaybackMenu();
    }
});

function setPlaybackMode(mode, event) {
    if (event) event.stopPropagation();
    playbackMode = mode;
    audioInstance.loop = (mode === 'loop');

    const btn      = document.getElementById('btn-playback-mode');
    const textSpan = document.getElementById('playback-text');
    const iconSvg  = document.getElementById('playback-icon');

    const modeMap = {
        autonext: {
            active: true, textAr: 'تلقائي', textEn: 'Auto',
            icon: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
        },
        loop: {
            active: true, textAr: 'تكرار', textEn: 'Loop',
            icon: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'
        },
        off: {
            active: false, textAr: 'إيقاف', textEn: 'Off',
            icon: '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>'
        }
    };

    const cfg = modeMap[mode] || modeMap.off;
    if (btn) btn.classList.toggle('active-feature', cfg.active);
    if (textSpan) textSpan.textContent = currentLang === 'ar' ? cfg.textAr : cfg.textEn;
    if (iconSvg) iconSvg.innerHTML = cfg.icon;

    renderPlaybackMenu();
    if (playbackMenuOpen) togglePlaybackMenu();
}

function renderPlaybackMenu() {
    const menu = document.getElementById('playback-menu');
    if (!menu) return;
    const items = [
        { id: 'autonext', textAr: 'تشغيل تلقائي', textEn: 'Auto-Next' },
        { id: 'loop',     textAr: 'تكرار المقطع',  textEn: 'Loop Track' },
        { id: 'off',      textAr: 'إيقاف',          textEn: 'Off' }
    ];
    menu.innerHTML = items.map(item => `
        <div class="playback-menu-item ${playbackMode === item.id ? 'active' : ''}"
             role="menuitem"
             onclick="setPlaybackMode('${item.id}', event)">
            ${currentLang === 'ar' ? item.textAr : item.textEn}
        </div>
    `).join('');
}

// ── مزامنة واجهة المشغل مع حالة الصوت ──

function syncUIWithAudioState() {
    const isPlaying = !audioInstance.paused;
    const statusIcon = isBuffering ? icons.loading : (isPlaying ? icons.pause : icons.play);
    
    const playBtn = document.getElementById('player-play-btn');
    if (playBtn) {
        playBtn.innerHTML = statusIcon;
        playBtn.setAttribute('aria-label', isPlaying ? 'إيقاف مؤقت' : 'تشغيل');
    }

    const headerEq = document.getElementById('header-equalizer');
    if (headerEq) {
        headerEq.classList.toggle('playing', isPlaying && !isBuffering && currentEdition == playingEditionId);
    }

    document.querySelectorAll('.surah-row').forEach(row => {
        const sId = parseInt(row.getAttribute('data-id'), 10);
        const playBtnCell = row.querySelector('.play-cell');
        
        const isActive = (sId === playingSurahId && currentEdition === playingEditionId);
        
        row.classList.toggle('active-row', isActive);
        if (playBtnCell) {
            playBtnCell.innerHTML = isActive
                ? (isBuffering ? icons.loading : (isPlaying ? icons.pause : icons.play))
                : icons.play;
        }
    });
}

// ── تشغيل المقطع وتلقي وقت البداية ──

function playSurah(id, url, startTime = 0, activateFocus = true) {
    initAudioBoost();

    // إذا كان المقطع نفسه يعمل بالفعل، سنقوم بالتبديل بين التشغيل والإيقاف
    if (playingSurahId === id && playingEditionId === currentEdition) {
        togglePlayPause(activateFocus);
        return;
    }

    if (radioState.isPlaying) pauseRadio();

    // تفعيل وضع الاستماع الهادئ فقط عند بدء تشغيل مقطع جديد (ما لم يُطلب تخطي ذلك)
    if (activateFocus && !isFocusMode) {
        toggleFocusMode(true);
    }

    playingSurahId   = id;
    playingEditionId = currentEdition;
    isBuffering      = true;

    // إذا كانت شاشة القراءة مرتبطة بجزء آخر، حدّثها لتتابع الجزء الجديد تلقائياً
    if (readingJuzNum !== null && readingJuzNum !== id) {
        switchReadingJuz(id, startTime || 0);
    } else {
        currentAyahIndex = -1;
    }

    audioInstance.pause();
    audioInstance.src  = url;
    audioInstance.loop = (playbackMode === 'loop');
    audioInstance.load();

    // القفز للدقيقة المحفوظة بمجرد أن تصبح بيانات الصوت جاهزة
    if (startTime > 0) {
        const onLoadedMeta = () => {
            audioInstance.currentTime = startTime;
            audioInstance.removeEventListener('loadedmetadata', onLoadedMeta);
        };
        audioInstance.addEventListener('loadedmetadata', onLoadedMeta);
    }

    audioInstance.play().catch(e => {
        console.warn("Play error:", e);
        isBuffering = false;
        syncUIWithAudioState();
    });

    // الحفظ المبدئي
    safeLocalSet('lastPlayedQuran', {
        edition: playingEditionId,
        surah: playingSurahId,
        time: startTime || 0,
        ayahIndex: currentAyahIndex
    });
    lastSaveTime = startTime || 0;

    const sData = activeSurahsData.find(s => s.id === id);
    const sName = getTrackName(sData);

    const player = document.getElementById('global-player');
    if (player) {
        player.style.display = 'block';
        player.classList.remove('radio-mode');
    }
    
    const trackTitle = document.getElementById('player-track-title');
    if (trackTitle) trackTitle.textContent = sName;

    syncUIWithAudioState();

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title:   sName,
            artist:  currentLang === 'ar' ? 'الشيخ أحمد عيسى المعصراوي' : 'Sheikh Ahmed Eisa Al-Ma\'asrawi',
            album:   currentLang === 'ar' ? editionsConfig[currentEdition].nameAr : editionsConfig[currentEdition].nameEn,
            artwork: [{ src: 'maasrawi.jpg', sizes: '512x512', type: 'image/jpeg' }]
        });
        navigator.mediaSession.setActionHandler('play',          () => togglePlayPause());
        navigator.mediaSession.setActionHandler('pause',         () => togglePlayPause());
        navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
        navigator.mediaSession.setActionHandler('nexttrack',     () => playNext());
        navigator.mediaSession.setActionHandler('seekto',        (d) => { audioInstance.currentTime = d.seekTime; });
    }
}

function playRowAudio(id, url) {
    playSurah(id, url, 0, false);
}

// ── التحكم الأساسي ──

function togglePlayPause(activateFocus = true) {
    initAudioBoost();

    if (audioInstance.paused && audioInstance.src) {
        if (activateFocus && !isFocusMode) {
            toggleFocusMode(true);
        }
        
        isBuffering = true;
        syncUIWithAudioState();
        audioInstance.play().catch(e => {
            console.warn("Play error:", e);
            isBuffering = false;
            syncUIWithAudioState();
        });
    } else {
        audioInstance.pause();
    }
}

function playNext() {
    const idx = activeSurahsData.findIndex(s => s.id === playingSurahId);
    if (idx !== -1 && idx < activeSurahsData.length - 1) {
        const next = activeSurahsData[idx + 1];
        playSurah(next.id, next.url);
    }
}

function playPrevious() {
    const idx = activeSurahsData.findIndex(s => s.id === playingSurahId);
    if (idx > 0) {
        const prev = activeSurahsData[idx - 1];
        playSurah(prev.id, prev.url);
    }
}

// ── أحداث المشغل ──

audioInstance.addEventListener('waiting', () => { isBuffering = true;  syncUIWithAudioState(); });
audioInstance.addEventListener('playing', () => { isBuffering = false; syncUIWithAudioState(); });
audioInstance.addEventListener('play',    () => { isBuffering = true;  syncUIWithAudioState(); });

audioInstance.addEventListener('pause',   () => { 
    isBuffering = false; 
    syncUIWithAudioState(); 
    if (playingSurahId) {
        safeLocalSet('lastPlayedQuran', {
            edition: playingEditionId,
            surah: playingSurahId,
            time: audioInstance.currentTime,
            ayahIndex: currentAyahIndex
        });
    }
});

audioInstance.addEventListener('error', () => {
    isBuffering = !navigator.onLine;
    syncUIWithAudioState();
    showToast(translations[currentLang].networkError);
});

audioInstance.addEventListener('ended', () => {
    if (playbackMode === 'autonext') {
        playNext();
    }
});

// ── تحديث شريط التقدم وحفظ الوقت تلقائياً ──

const progressContainer = document.getElementById('progress-container');

audioInstance.addEventListener('timeupdate', () => {
    const fill  = document.getElementById('progress-bar-fill');
    const curr  = document.getElementById('curr-time');
    const total = document.getElementById('total-time');

    updateHighlight(audioInstance.currentTime);

    if (audioInstance.duration && !isDragging) {
        const pct = (audioInstance.currentTime / audioInstance.duration) * 100;
        if (fill)  fill.style.width = pct + '%';
        if (curr)  curr.textContent = formatTime(audioInstance.currentTime);
        if (total) total.textContent = formatTime(audioInstance.duration);

        if (progressContainer) progressContainer.setAttribute('aria-valuenow', Math.round(pct));

        if (Math.abs(audioInstance.currentTime - lastSaveTime) > 5) {
            if (playingSurahId) {
                safeLocalSet('lastPlayedQuran', {
                    edition: playingEditionId,
                    surah: playingSurahId,
                    time: audioInstance.currentTime,
                    ayahIndex: currentAyahIndex
                });
            }
            lastSaveTime = audioInstance.currentTime;
        }

        if (playbackMode === 'autonext' && (audioInstance.duration - audioInstance.currentTime) < 15) {
            const idx = activeSurahsData.findIndex(s => s.id === playingSurahId);
            if (idx !== -1 && idx < activeSurahsData.length - 1) {
                const nextSurah = activeSurahsData[idx + 1];
                if (preloadedSurahId !== nextSurah.id) {
                    preloadAudioObj.src = nextSurah.url;
                    preloadAudioObj.preload = "auto";
                    preloadedSurahId = nextSurah.id;
                }
            }
        }
    }
});

// ── شريط التقدم — سحب وإفلات ──

const seek = (e) => {
    if (!progressContainer) return currentSeekPct;
    const rect = progressContainer.getBoundingClientRect();
    let clientX = 0;

    if (e.type.includes('touch')) {
        clientX = e.touches?.[0]?.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
    } else {
        clientX = e.clientX;
    }

    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const fill = document.getElementById('progress-bar-fill');
    if (fill) fill.style.width = (pct * 100) + '%';
    currentSeekPct = pct;
    return pct;
};

if (progressContainer) {
    progressContainer.addEventListener('mousedown', (e) => { isDragging = true; seek(e); });
    progressContainer.addEventListener('touchstart', (e) => { isDragging = true; seek(e); }, { passive: false });
    progressContainer.addEventListener('click', (e) => {
        if (audioInstance.duration && audioInstance.duration !== Infinity) {
            audioInstance.currentTime = seek(e) * audioInstance.duration;
        }
    });
}

window.addEventListener('mousemove', (e) => { if (isDragging) seek(e); });
window.addEventListener('touchmove', (e) => { if (isDragging) seek(e); }, { passive: false });

window.addEventListener('mouseup', (e) => {
    if (isDragging) {
        isDragging = false;
        if (audioInstance.duration && audioInstance.duration !== Infinity) {
            audioInstance.currentTime = currentSeekPct * audioInstance.duration;
        }
    }
});

window.addEventListener('touchend', (e) => {
    if (isDragging) {
        isDragging = false;
        if (e.changedTouches) seek(e);
        if (audioInstance.duration && audioInstance.duration !== Infinity) {
            audioInstance.currentTime = currentSeekPct * audioInstance.duration;
        }
    }
});

// ── التحميل ──

const dlModal = document.getElementById('download-modal');
const dlFill  = document.getElementById('dl-progress-fill');
const dlPct   = document.getElementById('dl-modal-pct');
const dlTitle = document.getElementById('dl-modal-title');
const dlTrack = document.querySelector('.dl-progress-track');

async function startDownload(id, url) {
    if (activeDownloads[id]) return;
    activeDownloads[id] = true;

    const sData = activeSurahsData.find(s => s.id === id);
    const sName = getTrackName(sData);

    if (dlModal) dlModal.style.display = 'flex';
    if (dlFill)  dlFill.style.width = '0%';
    if (dlPct)   dlPct.textContent = '0%';
    if (dlTitle) dlTitle.textContent = `${translations[currentLang].downloading} ${sName}...`;
    if (dlTrack) dlTrack.setAttribute('aria-valuenow', '0');

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';

    xhr.onprogress = (event) => {
        if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            if (dlFill)  dlFill.style.width = pct + '%';
            if (dlPct)   dlPct.textContent = pct + '%';
            if (dlTrack) dlTrack.setAttribute('aria-valuenow', pct);
        }
    };

    xhr.onload = () => {
        if (xhr.status === 200) {
            const blob = xhr.response;
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = `${sName}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(objectUrl);
            finishDownloadUI(id);
        } else {
            fallbackDownload(id, url, sName);
        }
    };

    xhr.onerror = () => {
        fallbackDownload(id, url, sName);
    };

    xhr.send();
}

function fallbackDownload(id, url, sName) {
    console.warn("XHR Download failed (CORS), using direct link.");
    if (dlModal) dlModal.style.display = 'none';
    delete activeDownloads[id];
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sName}.mp3`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showToast(currentLang === 'ar' ? "بدء التحميل المباشر..." : "Starting direct download...");
}

function finishDownloadUI(id) {
    if (dlTitle) dlTitle.textContent = translations[currentLang].downloadComplete;
    if (dlFill)  dlFill.style.width = '100%';
    if (dlPct)   dlPct.textContent = '100%';
    if (dlTrack) dlTrack.setAttribute('aria-valuenow', '100');
    setTimeout(() => {
        if (dlModal) dlModal.style.display = 'none';
        delete activeDownloads[id];
    }, 1600);
}

// ================================================
// شاشة القراءة والمزامنة (نص القرآن + التوقيتات)
// ================================================

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function bareSurahName(seg) {
    if (!seg) return '';
    if (currentLang === 'ar') {
        return (seg.surahName || '').replace(/^\s*سورة\s+/, '').trim();
    }
    return surahNamesEn[seg.surahNumber] || (seg.surahName || '').replace(/^\s*سورة\s+/, '').trim();
}

const ARABIC_DIACRITICS_RE   = /[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u08D4-\u08E1\u08E3-\u08FF\u0670]/;
const ARABIC_DIACRITICS_RE_G = /[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u08D4-\u08E1\u08E3-\u08FF\u0670]/g;

function stripArabicDiacritics(str) {
    return (str || '').replace(ARABIC_DIACRITICS_RE_G, '');
}

const BASMALA_PLAIN = stripArabicDiacritics('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ');

function stripLeadingBasmala(text) {
    if (!text) return text;
    
    const plainText = stripArabicDiacritics(text);
    
    if (plainText.startsWith(BASMALA_PLAIN)) {
        let plainCount = 0;
        let cutIndex = text.length;
        for (let i = 0; i < text.length; i++) {
            if (!ARABIC_DIACRITICS_RE.test(text[i])) plainCount++;
            if (plainCount === BASMALA_PLAIN.length) { 
                cutIndex = i + 1; 
                break; 
            }
        }
        const rest = text.slice(cutIndex).replace(/^[\s۞ۚۖۗۘۙۛ]+/, '').trim();
        return rest || text;
    }
    
    const basmalaPattern = /^بِسْمِ\s+اللَّهِ\s+الرَّحْمَٰنِ\s+الرَّحِيمِ\s*/;
    if (basmalaPattern.test(text)) {
        return text.replace(basmalaPattern, '').trim();
    }

    return text;
}

async function fetchJuzText(juzId) {
    const cacheKey = `quran_juz_text_${juzId}`;
    try {
        const res = await fetch(`${QURAN_TEXT_API}${juzId}/${QURAN_TEXT_EDITION}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const ayahs = (json && json.data && Array.isArray(json.data.ayahs)) ? json.data.ayahs : [];
        if (ayahs.length) safeLocalSet(cacheKey, ayahs);
        return ayahs;
    } catch (e) {
        console.warn('تعذر تحميل نص الجزء من الإنترنت، سيتم استخدام النسخة المخزّنة إن وجدت:', e);
        const cached = safeLocalGet(cacheKey);
        return cached || [];
    }
}

async function fetchJuzTimings(juzId) {
    const fileName = `susi_time/${String(juzId).padStart(3, '0')}_timings.json`;
    const res = await fetch(fileName);
    if (!res.ok) throw new Error(`تعذر تحميل ملف التوقيتات: ${fileName}`);
    return await res.json();
}

async function loadJuzReadingData(juzId) {
    if (juzDataCache[juzId]) return juzDataCache[juzId];

    const loadingEl   = document.getElementById('reading-loading');
    const containerEl = document.getElementById('ayat-container');
    if (loadingEl)   loadingEl.classList.add('show');
    if (containerEl) containerEl.innerHTML = '';

    try {
        const [ayahs, timings] = await Promise.all([fetchJuzText(juzId), fetchJuzTimings(juzId)]);

        if (!timings || !timings.length) {
            throw new Error('ملف التوقيتات فارغ أو غير موجود لهذا الجزء');
        }

        if (ayahs.length && ayahs.length !== timings.length) {
            console.warn(`عدم تطابق بين عدد آيات الجزء ${juzId} (${ayahs.length}) وعدد مقاطع التوقيت (${timings.length}).`);
        }

        const segments = timings.map((t, i) => {
            const a = ayahs[i] || null;
            return {
                start: t.start,
                end: t.end,
                text: (a && a.text) ? a.text : t.text,
                surahNumber: a ? a.surah.number : null,
                surahName: a ? a.surah.name : null,
                numberInSurah: a ? a.numberInSurah : null
            };
        });

        let lastSurahForBasmala = null;
        segments.forEach((seg, i) => {
            if (seg.surahNumber !== null && seg.surahNumber !== lastSurahForBasmala) {
                if (i > 0 && seg.surahNumber !== 1) {
                    seg.text = stripLeadingBasmala(seg.text);
                }
                lastSurahForBasmala = seg.surahNumber;
            }
        });

        const data = { segments };
        juzDataCache[juzId] = data;
        return data;
    } catch (e) {
        console.error(e);
        return { segments: [] };
    } finally {
        if (loadingEl) loadingEl.classList.remove('show');
    }
}

function renderReadingView(juzId, data) {
    const container = document.getElementById('ayat-container');
    if (!container) return;

    if (!data.segments.length) {
        container.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:40px 10px;">
            ${currentLang === 'ar' ? 'تعذر عرض النص لهذا الجزء' : 'Unable to display text for this juz'}
        </p>`;
        return;
    }

    let html = '';
    let lastSurah  = undefined;
    let blockOpen  = false;

    data.segments.forEach((seg, i) => {
        if (seg.surahNumber !== null && seg.surahNumber !== lastSurah) {
            if (blockOpen) html += `</p>`;
            const surahLabel = bareSurahName(seg);
            html += `<div class="surah-divider">${surahLabel}</div><p class="ayah-block">`;
            blockOpen = true;
            lastSurah = seg.surahNumber;
        } else if (!blockOpen) {
            html += `<p class="ayah-block">`;
            blockOpen = true;
        }

        const numBadge = seg.numberInSurah !== null ? `<span class="ayah-num">${seg.numberInSurah}</span>` : '';
        html += `<span class="ayah-span" data-idx="${i}" onclick="seekToAyah(${i})">${escapeHtml(seg.text)}${numBadge}</span> `;
    });

    if (blockOpen) html += `</p>`;
    container.innerHTML = html;

    currentAyahIndex = -1;
}

function updateReadingSurahTitle(idx) {
    const data = juzDataCache[readingJuzNum];
    if (!data || !data.segments[idx]) return;
    const seg = data.segments[idx];
    const titleEl = document.getElementById('reading-surah-title');
    if (titleEl && seg.surahName) {
        titleEl.textContent = bareSurahName(seg);
    }
}

function findSegmentIndex(segments, t) {
    let lo = 0, hi = segments.length - 1, ans = 0;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (segments[mid].start <= t) { ans = mid; lo = mid + 1; }
        else hi = mid - 1;
    }
    return ans;
}

function updateHighlight(currentTime, forceImmediate = false) {
    if (readingJuzNum === null || playingSurahId !== readingJuzNum) return;
    const data = juzDataCache[readingJuzNum];
    if (!data || !data.segments.length) return;

    const idx = findSegmentIndex(data.segments, currentTime);
    if (idx === currentAyahIndex) return;

    const allAyahs = document.querySelectorAll('.ayah-span');
    allAyahs.forEach(el => el.classList.remove('active-ayah'));

    const newEl = document.querySelector(`.ayah-span[data-idx="${idx}"]`);
    if (newEl) {
        newEl.classList.add('active-ayah');
        if (readingViewOpen) {
            newEl.scrollIntoView({ 
                behavior: forceImmediate ? 'auto' : 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
        }
    }

    currentAyahIndex = idx;
    updateReadingSurahTitle(idx);
}

async function switchReadingJuz(id, initialTime = null) {
    readingJuzNum = id;
    currentAyahIndex = -1;

    const sData = activeSurahsData.find(s => s.id === id);
    const titleEl = document.getElementById('reading-juz-title');
    if (titleEl && sData) titleEl.textContent = getTrackName(sData);

    const data = await loadJuzReadingData(id);
    renderReadingView(id, data);
    updateHighlight(initialTime !== null ? initialTime : audioInstance.currentTime, true);
}

function showReadingView(juzId, initialTime = null) {
    const wasOpen = readingViewOpen;
    readingViewOpen = true;
    document.getElementById('reading-view')?.classList.add('show');
    
    // تجميد الصفحة الرئيسية لمنعها من التحرك في الخلفية
    document.body.classList.add('reading-active');

    if (!wasOpen) {
        history.pushState({ readingView: true }, '');
    }

    if (readingJuzNum !== juzId || !juzDataCache[juzId]) {
        switchReadingJuz(juzId, initialTime);
    } else {
        currentAyahIndex = -1;
        updateHighlight(initialTime !== null ? initialTime : audioInstance.currentTime, true);
        
        setTimeout(() => {
            if (readingViewOpen && readingJuzNum === juzId) {
                updateHighlight(audioInstance.currentTime, true);
            }
        }, 100);
    }
}

function closeReadingView(fromHistory = false) {
    readingViewOpen = false;
    document.getElementById('reading-view')?.classList.remove('show');
    
    // إعادة تفعيل التمرير للصفحة الرئيسية عند الإغلاق
    document.body.classList.remove('reading-active');

    if (!fromHistory && history.state && history.state.readingView) {
        history.back();
    }
}

function seekToAyah(idx) {
    if (readingJuzNum === null) return;
    const data = juzDataCache[readingJuzNum];
    if (!data || !data.segments[idx]) return;

    const startTime = data.segments[idx].start;
    const sameTrack = (playingSurahId === readingJuzNum && playingEditionId === currentEdition && audioInstance.src);

    if (sameTrack) {
        audioInstance.currentTime = startTime;
        if (audioInstance.paused) {
            audioInstance.play().catch(e => console.warn('Play error:', e));
        }
    } else {
        const sData = activeSurahsData.find(s => s.id === readingJuzNum);
        if (sData) playSurah(sData.id, sData.url, startTime);
    }

    currentAyahIndex = -1;
    updateHighlight(startTime, true);
}

function openReadingJuz(id, url) {
    const alreadyPlayingThis = (playingSurahId === id && playingEditionId === currentEdition);
    if (!alreadyPlayingThis) {
        playSurah(id, url);
    }
    showReadingView(id);
}

// ── أحداث الشبكة ──

window.addEventListener('online', () => {
    if (isBuffering && playingSurahId && !audioInstance.paused) {
        audioInstance.load();
        audioInstance.play().catch(console.warn);
        showToast(translations[currentLang].reconnected);
    }
});

window.addEventListener('offline', () => {
    if (!audioInstance.paused || isBuffering) {
        isBuffering = true;
        syncUIWithAudioState();
        showToast(translations[currentLang].disconnected);
    }
});

// ── تثبيت التطبيق (PWA) ──

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
        document.getElementById('install-banner')?.classList.add('show');
    }, 2500);
});

document.getElementById('install-action-btn')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    document.getElementById('install-banner')?.classList.remove('show');
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
});

window.addEventListener('appinstalled', () => {
    document.getElementById('install-banner')?.classList.remove('show');
    showToast(translations[currentLang].installed);
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showToast(currentLang === 'ar' ? "تم تحميل تحديث جديد، جاري التنشيط..." : "New update loaded, activating...");
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    }
                });
            });
        }).catch(err => console.error('SW registration failed:', err));
    });
}

// ================================================
// الإذاعة المباشرة الوهمية (Pseudo Live Radio)
// ================================================

const radioAudio = new Audio();
radioAudio.preload = 'none';

const radioState = {
    playlist: [],
    cumulative: [],
    totalDuration: 0,
    ready: false,
    loading: false,
    currentIndex: -1,
    isPlaying: false,
    resyncTimer: null
};

function probeAudioDuration(url) {
    return new Promise((resolve) => {
        const probe = new Audio();
        probe.preload = 'metadata';
        let settled = false;
        let retried = false;

        const finish = (dur) => {
            if (settled) return;
            settled = true;
            probe.src = '';
            resolve(dur);
        };

        const tryOnce = () => {
            probe.addEventListener('loadedmetadata', () => {
                finish(isFinite(probe.duration) && probe.duration > 0 ? probe.duration : 0);
            }, { once: true });
            probe.addEventListener('error', () => {
                // إعادة محاولة واحدة فقط قبل الاستسلام، فقد يكون الفشل الأول
                // مؤقتاً (تقييد مؤقت من نطاق r2.dev التجريبي مثلاً)
                if (!retried) {
                    retried = true;
                    setTimeout(() => { probe.src = url; }, 400);
                } else {
                    finish(0);
                }
            }, { once: true });
        };

        tryOnce();
        setTimeout(() => finish(isFinite(probe.duration) && probe.duration > 0 ? probe.duration : 0), 12000);

        probe.src = url;
    });
}

// جلب مدد ملفات الإذاعة على دفعات محدودة بدلاً من إرسال 30 طلباً
// متزامناً دفعة واحدة، لتقليل احتمال تقييد الطلبات من مزود الاستضافة
async function probeAllDurations(list, batchSize = 5) {
    const results = [];
    for (let i = 0; i < list.length; i += batchSize) {
        const batch = list.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(async (item) => ({
                title: item.title,
                url: item.url,
                duration: await probeAudioDuration(item.url)
            }))
        );
        results.push(...batchResults);
    }
    return results;
}

const RADIO_CACHE_KEY = 'cache_radio_playlist_v1';

async function loadRadioPlaylist() {
    if (radioState.ready || radioState.loading) return radioState.ready;
    radioState.loading = true;

    // استخدام النسخة المخزّنة فوراً إن وُجدت، حتى لا نضطر لإعادة قياس
    // مدة 30 ملفاً صوتياً في كل مرة يُفتح فيها التطبيق أو تُضغط الإذاعة
    const cached = safeLocalGet(RADIO_CACHE_KEY);
    if (cached && Array.isArray(cached.playlist) && cached.playlist.length) {
        radioState.playlist      = cached.playlist;
        radioState.cumulative    = cached.cumulative;
        radioState.totalDuration = cached.totalDuration;
        radioState.ready         = true;
        radioState.loading       = false;
        return true;
    }

    try {
        const res = await fetch('radio.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`تعذّر جلب radio.json: HTTP ${res.status}`);
        const list = await res.json();
        if (!Array.isArray(list) || !list.length) throw new Error('radio.json فارغ أو غير صالح');

        const withDurations = await probeAllDurations(list, 5);
        const valid = withDurations.filter(f => f.duration > 0);

        if (!valid.length) throw new Error('تعذّر تحميل أي ملف من ملفات الإذاعة (تحقق من روابط r2.dev أو استخدم نطاقاً مخصصاً بدلاً من نطاق r2.dev التجريبي)');

        let cum = 0;
        const cumulative = [];
        valid.forEach(f => { cumulative.push(cum); cum += f.duration; });

        radioState.playlist       = valid;
        radioState.cumulative     = cumulative;
        radioState.totalDuration  = cum;
        radioState.ready          = true;

        safeLocalSet(RADIO_CACHE_KEY, { playlist: valid, cumulative, totalDuration: cum });
        return true;
    } catch (e) {
        console.warn('Radio playlist load error:', e);
        showToast(translations[currentLang].networkError);
        return false;
    } finally {
        radioState.loading = false;
    }
}

function computeLivePosition() {
    const totalMs = radioState.totalDuration * 1000;
    if (!totalMs) return { index: 0, offset: 0 };

    const elapsedSec = (Date.now() % totalMs) / 1000;

    let idx = radioState.cumulative.length - 1;
    for (let i = 0; i < radioState.cumulative.length; i++) {
        const start = radioState.cumulative[i];
        const end   = start + radioState.playlist[i].duration;
        if (elapsedSec >= start && elapsedSec < end) { idx = i; break; }
    }

    const offset = elapsedSec - radioState.cumulative[idx];
    return { index: idx, offset: Math.max(0, offset) };
}

function setRadioLoadingUI(isLoading) {
    const btn = document.getElementById('radio-play-btn');
    const icon = document.getElementById('radio-play-icon');
    const globalPlayBtn = document.getElementById('player-play-btn');
    
    if (btn && icon) {
        btn.classList.toggle('loading', isLoading);
        icon.innerHTML = isLoading
            ? '<path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>'
            : (radioState.isPlaying ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' : '<path d="M8 5v14l11-7z"/>');
    }

    if (globalPlayBtn) {
        globalPlayBtn.innerHTML = isLoading ? icons.loading : (radioState.isPlaying ? icons.pause : icons.play);
    }
}

function updateRadioTrackTitle() {
    const el = document.getElementById('radio-track-title');
    const globalTitle = document.getElementById('player-track-title');
    const f = radioState.playlist[radioState.currentIndex];
    const title = f ? f.title : (currentLang === 'ar' ? 'إذاعة الشيخ المعصراوي' : 'Sheikh Al-Maasrawi Radio');
    
    if (el) el.textContent = title;
    if (globalTitle) globalTitle.textContent = title;
}

function setOnAirIndicator(on) {
    document.getElementById('radio-toggle-btn')?.classList.toggle('on-air', on);
    document.getElementById('radio-eq')?.classList.toggle('playing', on);
}

function tuneInToLivePosition() {
    const { index, offset } = computeLivePosition();
    const file = radioState.playlist[index];
    if (!file) return;

    radioState.currentIndex = index;
    updateRadioTrackTitle();

    const onReady = () => {
        radioAudio.currentTime = offset;
        radioAudio.play().catch(e => console.warn('Radio play error:', e));
        radioAudio.removeEventListener('loadedmetadata', onReady);
    };

    radioAudio.pause();
    radioAudio.src = file.url;
    radioAudio.addEventListener('loadedmetadata', onReady);
    radioAudio.load();
}

function handleRadioFileEnded() {
    if (!radioState.isPlaying) return;
    tuneInToLivePosition();
}

function startRadioResync() {
    stopRadioResync();
    radioState.resyncTimer = setInterval(() => {
        if (!radioState.isPlaying || radioAudio.paused) return;
        const { index, offset } = computeLivePosition();
        if (index !== radioState.currentIndex) {
            tuneInToLivePosition();
            return;
        }
        if (Math.abs(radioAudio.currentTime - offset) > 4) {
            radioAudio.currentTime = offset;
        }
    }, 15000);
}

function stopRadioResync() {
    if (radioState.resyncTimer) {
        clearInterval(radioState.resyncTimer);
        radioState.resyncTimer = null;
    }
}

async function startRadio() {
    if (!audioInstance.paused) {
        audioInstance.pause();
        playingSurahId = null;
        updateSurahListUI();
    }

    setRadioLoadingUI(true);
    const ok = await loadRadioPlaylist();
    if (!ok) { setRadioLoadingUI(false); return; }

    radioState.isPlaying = true;
    tuneInToLivePosition();
    startRadioResync();
    setOnAirIndicator(true);
    setRadioLoadingUI(false);
}

function pauseRadio() {
    radioState.isPlaying = false;
    radioAudio.pause();
    stopRadioResync();
    setOnAirIndicator(false);
    setRadioLoadingUI(false);
}

function toggleRadioAction() {
    if (radioState.isPlaying) {
        pauseRadio();
    } else {
        startRadio();
    }
}

function toggleRadioPlayback() {
    if (radioState.isPlaying) {
        pauseRadio();
    } else {
        startRadio();
    }
}

function openRadioPanel() {
    document.getElementById('radio-modal')?.classList.add('show');
    if (!radioState.isPlaying) startRadio();
}

function closeRadioPanel() {
    document.getElementById('radio-modal')?.classList.remove('show');
    pauseRadio();
}

radioAudio.addEventListener('ended', handleRadioFileEnded);
radioAudio.addEventListener('waiting', () => setRadioLoadingUI(true));
radioAudio.addEventListener('playing', () => setRadioLoadingUI(false));
radioAudio.addEventListener('error', () => {
    if (radioState.isPlaying) showToast(translations[currentLang].networkError);
});

const _originalPlaySurah = playSurah;
playSurah = function (...args) {
    if (radioState.isPlaying) pauseRadio();
    return _originalPlaySurah.apply(this, args);
};

const _originalTogglePlayPause = togglePlayPause;
togglePlayPause = function (...args) {
    if (radioState.isPlaying) {
        toggleRadioPlayback();
        return;
    }
    if (radioState.isPlaying && audioInstance.paused && audioInstance.src) pauseRadio();
    return _originalTogglePlayPause.apply(this, args);
};

// ── التهيئة الأولى ──

(async () => {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) themeBtn.innerHTML = currentTheme === 'dark' ? icons.moon : icons.sun;

    // ملاحظة: تم إزالة استدعاء loadRadioPlaylist() هنا لأنه كان يجلب
    // radio.json ويحاول قياس مدة كل ملف صوتي فور فتح التطبيق، وأي فشل
    // في ذلك (حتى لو مؤقت) كان يظهر رسالة "خطأ في الاتصال" فوراً
    // للمستخدم رغم أنه لم يطلب تشغيل الإذاعة بعد. الآن يتم تحميل
    // قائمة الإذاعة فقط عند طلب المستخدم تشغيلها (داخل startRadio).

    setPlaybackMode('autonext');

    updateDropdownUI();
    if (currentEdition) {
        await loadEditionData(currentEdition);
        updateFocusHeader();
    } else {
        renderSurahsList(); 
    }

    const savedState = safeLocalGet('lastPlayedQuran');
    if (savedState?.surah) {
        const sData = activeSurahsData.find(s => s.id === savedState.surah);
        if (sData) {
            playingEditionId = savedState.edition;
            const sName = getTrackName(sData);
            const promptText = currentLang === 'ar'
                ? `هل تود إكمال الاستماع إلى ${sName}؟`
                : `Resume listening to ${sName}?`;
                
            const resumeText = document.getElementById('resume-text');
            if (resumeText) resumeText.textContent = promptText;
            
            document.getElementById('resume-banner')?.classList.add('show');
            window.resumeData = { 
                id: sData.id, 
                url: sData.url, 
                edition: savedState.edition,
                time: savedState.time || 0,
                ayahIndex: typeof savedState.ayahIndex === 'number' ? savedState.ayahIndex : -1
            };
            
            setTimeout(closeResumeBanner, 15000);
        }
    }
})();