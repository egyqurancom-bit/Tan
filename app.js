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
        showReadingView(window.resumeData.id, window.resumeData.edition || currentEdition, window.resumeData.time || 0);
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
// كل الروايات تعمل بنظام "سور" (نص السورة كاملة) ما عدا السوسي فيعمل بنظام
// "أجزاء" لأن ملفات توقيته الصوتية مقسّمة لكل جزء وليست لكل سورة.
const SUSI_EDITION_ID   = 6;

let readingJuzNum       = null;   // رقم السورة أو الجزء المعروض حالياً في شاشة القراءة
let readingEditionNum   = null;   // رقم الرواية المرتبطة بالعنصر المعروض حالياً
let readingViewOpen     = false;  // هل شاشة القراءة مفتوحة
let currentAyahIndex    = -1;     // فهرس الآية المظللة حالياً
const juzDataCache      = {};     // تخزين مؤقت، المفتاح: "editionNum_id"

// وضع القراءة الخاص برواية معيّنة: 'juz' للسوسي فقط، و'surah' لكل ما عداه
function getReadingMode(editionNum) {
    return editionNum === SUSI_EDITION_ID ? 'juz' : 'surah';
}

// مجلد ملفات توقيت الصوت الخاص بكل رواية، مبني على اسم ملفها
// (مثال: susi.json → susi_time/، hafs.json → hafs_time/)
function getTimeFolder(editionNum) {
    const config = editionsConfig[editionNum];
    if (!config || !config.file) return null;
    return config.file.replace(/\.json$/i, '_time/');
}

function readingCacheKey(editionNum = readingEditionNum, id = readingJuzNum) {
    if (editionNum === null || id === null) return null;
    return `${editionNum}_${id}`;
}

// ── مصحف حفص (SVG + إحداثيات JSON) في شاشة الاستماع الهادئ ──
// المجلد hafs/svg و hafs/json يحويان صفحات المصحف مرسومة بدقة عالية (طبعة حفص)
// مع إحداثيات كل آية داخل الصفحة، ويُستخدمان لعرض المصحف الحقيقي بدل النص العادي
// مع تظليل الآية أثناء الاستماع. أي صفحة غير موجودة بعد على GitHub يتم تجاوزها
// تلقائياً والرجوع للعرض النصي المعتاد (توافق تدريجي مع اكتمال الصفحات لاحقاً).
const HAFS_SVG_PATH   = 'hafs/svg/';
const HAFS_JSON_PATH  = 'hafs/json/';
const HAFS_MAX_PAGE   = 604; // إجمالي صفحات المصحف عند اكتمال الرفع على GitHub

const mushafPageJsonCache = {};      // pageNum -> بيانات آيات الصفحة
const mushafPageSvgCache  = {};      // pageNum -> نص svg
const mushafMissingPages  = new Set(); // صفحات تأكد عدم توفرها بعد
const mushafAyahPageCache = {};      // "surah_ayah" -> pageNum
let   mushafCurrentPage   = null;    // رقم الصفحة المعروضة حالياً في شاشة القراءة

function pad3(n) { return String(n).padStart(3, '0'); }

async function fetchMushafPageJson(pageNum) {
    if (pageNum < 1 || pageNum > HAFS_MAX_PAGE) return null;
    if (mushafPageJsonCache[pageNum]) return mushafPageJsonCache[pageNum];
    if (mushafMissingPages.has(pageNum)) return null;
    try {
        const res = await fetch(`${HAFS_JSON_PATH}${pad3(pageNum)}.json`);
        if (!res.ok) throw new Error('404');
        const data = await res.json();
        if (!Array.isArray(data) || !data.length) throw new Error('empty');
        mushafPageJsonCache[pageNum] = data;
        data.forEach(a => { mushafAyahPageCache[`${a.surahNumber}_${a.ayahNumber}`] = pageNum; });
        return data;
    } catch (e) {
        mushafMissingPages.add(pageNum);
        return null;
    }
}

async function fetchMushafPageSvg(pageNum) {
    if (mushafPageSvgCache[pageNum]) return mushafPageSvgCache[pageNum];
    try {
        const res = await fetch(`${HAFS_SVG_PATH}${pad3(pageNum)}.svg`);
        if (!res.ok) throw new Error('404');
        const text = await res.text();
        mushafPageSvgCache[pageNum] = text;
        return text;
    } catch (e) {
        return null;
    }
}

function ayahIsWithinPage(pageData, surahNumber, ayahNumber) {
    const first = pageData[0], last = pageData[pageData.length - 1];
    const geFirst = (surahNumber > first.surahNumber) || (surahNumber === first.surahNumber && ayahNumber >= first.ayahNumber);
    const leLast  = (surahNumber < last.surahNumber)  || (surahNumber === last.surahNumber  && ayahNumber <= last.ayahNumber);
    return geFirst && leLast;
}

// يقدّر رقم الصفحة تبعاً لرقم الجزء الحالي (كل جزء ≈ 20 صفحة) كنقطة بداية للبحث،
// ثم يبحث بشكل متوسّع حول التقدير حتى يجد الصفحة الفعلية التي تحوي الآية،
// متجاوزاً أي صفحات غير مرفوعة بعد على GitHub.
async function findMushafPage(surahNumber, ayahNumber) {
    const key = `${surahNumber}_${ayahNumber}`;
    if (mushafAyahPageCache[key] !== undefined) return mushafAyahPageCache[key];

    // أسرع مسار: تحقق من الصفحة المعروضة حالياً ثم التي تليها (حالة الاستماع المتسلسل)
    for (const candidate of [mushafCurrentPage, mushafCurrentPage ? mushafCurrentPage + 1 : null]) {
        if (!candidate) continue;
        const data = await fetchMushafPageJson(candidate);
        if (data && ayahIsWithinPage(data, surahNumber, ayahNumber)) return candidate;
    }

    // تقدير أولي لموقع الصفحة: بحسب الجزء إن كانت الرواية الحالية بنظام الأجزاء (السوسي)،
    // أو بحسب رقم السورة (تقريباً 5.3 صفحة لكل سورة في المتوسط) لبقية الروايات
    const mode = getReadingMode(readingEditionNum);
    let estimate = 1;
    if (mode === 'juz' && readingJuzNum) {
        estimate = Math.max(1, Math.min(HAFS_MAX_PAGE, Math.round((readingJuzNum - 1) * (HAFS_MAX_PAGE / 30)) + 1));
    } else if (surahNumber) {
        estimate = Math.max(1, Math.min(HAFS_MAX_PAGE, Math.round((surahNumber - 1) * (HAFS_MAX_PAGE / 114)) + 1));
    }

    for (let radius = 0; radius <= 40; radius++) {
        for (const mid of (radius === 0 ? [estimate] : [estimate + radius, estimate - radius])) {
            if (mid < 1 || mid > HAFS_MAX_PAGE) continue;
            const data = await fetchMushafPageJson(mid);
            if (data && ayahIsWithinPage(data, surahNumber, ayahNumber)) return mid;
        }
    }
    return null;
}

function hideMushafView() {
    document.getElementById('mushaf-page-view')?.classList.remove('show');
    document.getElementById('ayat-container')?.classList.remove('mushaf-hidden');
}

// بعض ملفات hafs/json تخزّن إحداثيات الآية كقائمة نقاط بسيطة تصلح لعنصر
// <polygon> (شكل واحد متصل)، بينما ملفات أخرى (للآيات الممتدة على أكثر من
// سطر) تخزّنها كصيغة SVG path كاملة (M...Z M...Z) لتمثيل أكثر من مستطيل
// منفصل. هذه الدالة توحّد الصيغتين إلى "d" صالحة لعنصر <path> دائماً.
function mushafPolygonToPathData(raw) {
    if (!raw) return '';
    const str = raw.trim();
    // لو الصيغة فيها بالفعل أوامر path (M/L/Z) نستخدمها كما هي
    if (/[MLZ]/i.test(str)) return str;
    // وإلا فهي قائمة نقاط بسيطة "x1,y1 x2,y2 ..." نحوّلها إلى path مغلق
    const points = str.split(/\s+/).filter(Boolean);
    if (!points.length) return '';
    return `M ${points.join(' L ')} Z`;
}

function injectMushafHitLayer(wrap, pageData) {
    const svgEl = wrap.querySelector('svg');
    if (!svgEl || !pageData) return;
    svgEl.removeAttribute('width');
    svgEl.removeAttribute('height');
    svgEl.style.width  = '100%';
    svgEl.style.height = 'auto';
    svgEl.style.display = 'block';

    const ns = 'http://www.w3.org/2000/svg';
    const layer = document.createElementNS(ns, 'g');
    layer.setAttribute('id', 'mushaf-hit-layer');
    pageData.forEach(a => {
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', mushafPolygonToPathData(a.polygon));
        path.setAttribute('class', 'mushaf-ayah-hit');
        path.dataset.surah = a.surahNumber;
        path.dataset.ayah  = a.ayahNumber;
        layer.appendChild(path);
    });
    svgEl.appendChild(layer);

    if (!wrap.dataset.clickBound) {
        wrap.addEventListener('click', onMushafHitClick);
        wrap.dataset.clickBound = '1';
    }
}

function onMushafHitClick(e) {
    const target = e.target.closest('.mushaf-ayah-hit');
    if (!target) return;
    const surah = parseInt(target.dataset.surah, 10);
    const ayah  = parseInt(target.dataset.ayah, 10);
    const data  = juzDataCache[readingCacheKey()];
    if (!data) return;
    const idx = data.segments.findIndex(s => s.surahNumber === surah && s.numberInSurah === ayah);
    if (idx >= 0) seekToAyah(idx);
}

function highlightMushafAyah(wrap, surahNumber, ayahNumber) {
    const layer = wrap.querySelector('#mushaf-hit-layer');
    if (!layer) return;
    layer.querySelectorAll('.mushaf-ayah-hit.active-mushaf-ayah').forEach(el => el.classList.remove('active-mushaf-ayah'));
    const target = layer.querySelector(`.mushaf-ayah-hit[data-surah="${surahNumber}"][data-ayah="${ayahNumber}"]`);
    if (target) {
        target.classList.add('active-mushaf-ayah');
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
}

// يحاول عرض صفحة المصحف الحقيقية للآية الحالية؛ إن لم تتوفر بياناتها بعد
// على GitHub يعود العرض تلقائياً إلى قائمة النص العادية.
async function updateMushafHighlight(seg) {
    const view = document.getElementById('mushaf-page-view');
    const wrap = document.getElementById('mushaf-page-wrap');
    if (!view || !wrap || !seg || seg.surahNumber === null || seg.numberInSurah === null) {
        hideMushafView();
        return;
    }

    const pageNum = await findMushafPage(seg.surahNumber, seg.numberInSurah);
    if (!pageNum) {
        hideMushafView();
        return;
    }

    // تجاهل أي استجابة متأخرة إن كان المستخدم قد انتقل لجزء آخر أو أغلق الشاشة
    if (!readingViewOpen) return;

    if (mushafCurrentPage !== pageNum) {
        const svgText = await fetchMushafPageSvg(pageNum);
        if (!svgText || !readingViewOpen) { hideMushafView(); return; }
        wrap.innerHTML = svgText;
        mushafCurrentPage = pageNum;
        injectMushafHitLayer(wrap, mushafPageJsonCache[pageNum]);
    }

    highlightMushafAyah(wrap, seg.surahNumber, seg.numberInSurah);
    view.classList.add('show');
    document.getElementById('ayat-container')?.classList.add('mushaf-hidden');
}

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

    // إذا كانت شاشة القراءة مفتوحة على عنصر آخر، حدّثها لتتابع العنصر الجديد تلقائياً
    if (readingJuzNum !== null && (readingJuzNum !== id || readingEditionNum !== currentEdition)) {
        switchReadingJuz(id, currentEdition, startTime || 0);
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
// شاشة القراءة والمزامنة (صفحات المصحف الحقيقية + التوقيتات)
// كل شيء هنا مربوط بالمجلدات المحلية الموجودة فعلياً (hafs/json و hafs/svg
// ومجلد توقيت كل رواية إن وُجد) — لا يوجد أي استيراد لأي API خارجي لنص المصحف.
// ================================================

// عدد آيات كل سورة (1 إلى 114) وفق ترقيم مصحف حفص عن عاصم القياسي.
// بيانات ثابتة معروفة، لا تعتمد على أي مصدر خارجي.
const SURAH_AYAH_COUNTS = [
    7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
    112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,
    54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,
    14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,
    29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,
    11,8,3,9,5,4,7,3,6,3,5,4,5,6
];

// نقطة بداية كل جزء (رقم السورة/الآية) وفق التقسيم القياسي الثابت لـ30 جزءاً.
const JUZ_START = [
    {surah:1,ayah:1},   {surah:2,ayah:142}, {surah:2,ayah:253}, {surah:3,ayah:93},
    {surah:4,ayah:24},  {surah:4,ayah:148}, {surah:5,ayah:82},  {surah:6,ayah:111},
    {surah:7,ayah:88},  {surah:8,ayah:41},  {surah:9,ayah:93},  {surah:11,ayah:6},
    {surah:12,ayah:53}, {surah:15,ayah:1},  {surah:17,ayah:1},  {surah:18,ayah:75},
    {surah:21,ayah:1},  {surah:23,ayah:1},  {surah:25,ayah:21}, {surah:27,ayah:56},
    {surah:29,ayah:46}, {surah:33,ayah:31}, {surah:36,ayah:28}, {surah:39,ayah:32},
    {surah:41,ayah:47}, {surah:46,ayah:1},  {surah:51,ayah:31}, {surah:58,ayah:1},
    {surah:67,ayah:1},  {surah:78,ayah:1}
];

// يبني قائمة (سورة، آية) بدءاً من نقطة معيّنة وحتى نقطة نهاية (غير شاملة)،
// أو حتى نهاية القرآن إن لم تُحدَّد نهاية.
function buildAyahRange(startSurah, startAyah, endSurah, endAyah) {
    const list = [];
    let s = startSurah, a = startAyah;
    while (s <= 114) {
        if (endSurah !== null && s === endSurah && a === endAyah) break;
        list.push({ surah: s, ayah: a });
        a++;
        if (a > SURAH_AYAH_COUNTS[s - 1]) { s++; a = 1; }
    }
    return list;
}

function getSurahAyahList(surahNum) {
    const count = SURAH_AYAH_COUNTS[surahNum - 1] || 0;
    const list = [];
    for (let a = 1; a <= count; a++) list.push({ surah: surahNum, ayah: a });
    return list;
}

function getJuzAyahList(juzNum) {
    const start = JUZ_START[juzNum - 1];
    if (!start) return [];
    const next = JUZ_START[juzNum] || null;
    return next
        ? buildAyahRange(start.surah, start.ayah, next.surah, next.ayah)
        : buildAyahRange(start.surah, start.ayah, null, null);
}

// يحاول تحميل ملف توقيت الصوت الخاص برواية معيّنة من مجلدها المحلي. إن لم يوجد
// الملف بعد لهذه الرواية (لم تُرفع توقيتاتها بعد) يعيد null دون رمي خطأ، لتظل
// شاشة القراءة تعرض صفحة المصحف بلا تظليل متزامن بدل أن تظهر فارغة.
async function fetchReadingTimings(id, editionNum) {
    const folder = getTimeFolder(editionNum);
    if (!folder) return null;
    const fileName = `${folder}${pad3(id)}_timings.json`;
    try {
        const res = await fetch(fileName);
        if (!res.ok) return null;
        const data = await res.json();
        return (Array.isArray(data) && data.length) ? data : null;
    } catch (e) {
        console.warn(`لا يوجد ملف توقيت صوتي متاح بعد: ${fileName}`, e);
        return null;
    }
}

async function loadReadingData(id, editionNum) {
    const cacheKey = readingCacheKey(editionNum, id);
    if (juzDataCache[cacheKey]) return juzDataCache[cacheKey];

    const mode     = getReadingMode(editionNum);
    const ayahList = mode === 'juz' ? getJuzAyahList(id) : getSurahAyahList(id);
    const timings  = await fetchReadingTimings(id, editionNum);

    let segments;
    let hasTiming = false;

    if (timings && timings.length) {
        hasTiming = true;
        if (timings.length !== ayahList.length) {
            console.warn(`عدم تطابق بين عدد آيات العنصر ${id} (${ayahList.length}) وعدد مقاطع التوقيت (${timings.length}).`);
        }
        // يقبل ملف التوقيت رقم السورة/الآية إن كان يوفّرهما بنفسه (ضروري لوضع
        // الأجزاء)، وإلا يُستنتجان تلقائياً من ترتيب السورة (وضع السور).
        segments = timings.map((t, i) => {
            const ref = ayahList[i] || null;
            return {
                start: t.start,
                end: t.end,
                surahNumber: (t.surahNumber ?? t.surah ?? (ref ? ref.surah : null)),
                numberInSurah: (t.numberInSurah ?? t.ayahNumber ?? (ref ? ref.ayah : null))
            };
        });
    } else {
        segments = ayahList.map(ref => ({
            start: null, end: null, surahNumber: ref.surah, numberInSurah: ref.ayah
        }));
    }

    const data = { segments, hasTiming };
    juzDataCache[cacheKey] = data;
    return data;
}

// يعرض رسالة بديلة بسيطة في حال لم تُتوفَّر بعد صفحة المصحف الحقيقية لهذا
// العنصر (سيتم استبدالها تلقائياً بصفحة المصحف الفعلية حال توفّرها محلياً).
function renderReadingFallback(data) {
    const container = document.getElementById('ayat-container');
    if (!container) return;
    const msg = data.segments.length
        ? (currentLang === 'ar' ? 'صفحة المصحف لهذا الموضع لم تُرفع بعد' : 'This mushaf page has not been uploaded yet')
        : (currentLang === 'ar' ? 'تعذر تحميل بيانات هذا الموضع' : 'Unable to load this section');
    container.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:40px 10px;">${msg}</p>`;
    currentAyahIndex = -1;
}

function updateReadingSurahTitle(idx) {
    const data = juzDataCache[readingCacheKey()];
    if (!data || !data.segments[idx]) return;
    const seg = data.segments[idx];
    const titleEl = document.getElementById('reading-surah-title');
    if (titleEl && seg.surahNumber !== null) {
        titleEl.textContent = surahNamesEn[seg.surahNumber]
            ? (currentLang === 'ar' ? `سورة ${surahNamesEn[seg.surahNumber]}` : surahNamesEn[seg.surahNumber])
            : '';
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
    if (readingJuzNum === null || playingSurahId !== readingJuzNum || playingEditionId !== readingEditionNum) return;
    const data = juzDataCache[readingCacheKey()];
    if (!data || !data.segments.length) return;

    if (!data.hasTiming) {
        // لا يوجد توقيت صوتي لهذه الرواية بعد: نعرض بداية السورة فقط دون
        // تتبع مستمر لموضع الصوت (سيُفعَّل تلقائياً حالما تُرفع ملفات التوقيت)
        if (forceImmediate && currentAyahIndex !== 0) {
            currentAyahIndex = 0;
            updateReadingSurahTitle(0);
            updateMushafHighlight(data.segments[0]);
        }
        return;
    }

    const idx = findSegmentIndex(data.segments, currentTime);
    if (idx === currentAyahIndex) return;

    currentAyahIndex = idx;
    updateReadingSurahTitle(idx);
    updateMushafHighlight(data.segments[idx]);
}

async function switchReadingJuz(id, editionNum, initialTime = null) {
    readingJuzNum = id;
    readingEditionNum = editionNum;
    currentAyahIndex = -1;
    mushafCurrentPage = null;
    hideMushafView();

    const sData = activeSurahsData.find(s => s.id === id);
    const titleEl = document.getElementById('reading-juz-title');
    if (titleEl && sData) titleEl.textContent = getTrackName(sData);

    const data = await loadReadingData(id, editionNum);
    renderReadingFallback(data);
    updateHighlight(initialTime !== null ? initialTime : audioInstance.currentTime, true);
}

function showReadingView(juzId, editionNum, initialTime = null) {
    const wasOpen = readingViewOpen;
    readingViewOpen = true;
    document.getElementById('reading-view')?.classList.add('show');
    
    // تجميد الصفحة الرئيسية لمنعها من التحرك في الخلفية
    document.body.classList.add('reading-active');

    if (!wasOpen) {
        history.pushState({ readingView: true }, '');
    }

    const cacheKey = readingCacheKey(editionNum, juzId);
    if (readingJuzNum !== juzId || readingEditionNum !== editionNum || !juzDataCache[cacheKey]) {
        switchReadingJuz(juzId, editionNum, initialTime);
    } else {
        currentAyahIndex = -1;
        updateHighlight(initialTime !== null ? initialTime : audioInstance.currentTime, true);
        
        setTimeout(() => {
            if (readingViewOpen && readingJuzNum === juzId && readingEditionNum === editionNum) {
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
    mushafCurrentPage = null;

    if (!fromHistory && history.state && history.state.readingView) {
        history.back();
    }
}

function seekToAyah(idx) {
    if (readingJuzNum === null) return;
    const data = juzDataCache[readingCacheKey()];
    if (!data || !data.segments[idx]) return;

    const seg = data.segments[idx];

    // لا يوجد توقيت صوتي لهذه الرواية بعد: نكتفي بتظليل الآية على النص/المصحف
    // دون القدرة على الانتقال الدقيق داخل الصوت
    if (seg.start === null) {
        currentAyahIndex = idx;
        updateReadingSurahTitle(idx);
        updateMushafHighlight(seg);
        const sameTrack = (playingSurahId === readingJuzNum && playingEditionId === readingEditionNum && audioInstance.src);
        if (!sameTrack) {
            const sData = activeSurahsData.find(s => s.id === readingJuzNum);
            if (sData) playSurah(sData.id, sData.url);
        }
        return;
    }

    const startTime = seg.start;
    const sameTrack = (playingSurahId === readingJuzNum && playingEditionId === readingEditionNum && audioInstance.src);

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
    const editionNum = currentEdition;
    const alreadyPlayingThis = (playingSurahId === id && playingEditionId === editionNum);
    if (!alreadyPlayingThis) {
        playSurah(id, url);
    }
    showReadingView(id, editionNum);
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