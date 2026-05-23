/**
 * NUR ISLAM - SYSTEM SCRIPT
 * Comprehensive, pure JavaScript engine for responsiveness,
 * calculations, state preservation, and advanced UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Force scroll to top on load to ensure hero section is the starting point
    window.scrollTo(0, 0);
    window.location.hash = '#hero';

    // Current local time anchor for the system
    const systemStartTime = new Date("2026-05-23T13:46:16Z");
    let localTimeOffset = systemStartTime.getTime() - Date.now();
    
    function getCairoTime() {
        return new Date(new Date().toLocaleString("en-US", {timeZone: "Africa/Cairo"}));
    }

    // 1. LOADER CONTROLLER
    const loader = document.getElementById('loader');
    const loaderBar = document.getElementById('loader-bar');
    if (loader && loaderBar) {
        let loadProgress = 0;
        const loaderInterval = setInterval(() => {
            loadProgress += Math.floor(Math.random() * 15) + 5;
            if (loadProgress >= 100) {
                loadProgress = 100;
                clearInterval(loaderInterval);
                setTimeout(() => {
                    loader.classList.add('fade-out');
                }, 300);
            }
            loaderBar.style.width = `${loadProgress}%`;
        }, 45);
    }

    // 2. STICKY HEADER & ACTIVE SCROLL MAPPER
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navbar) {
        window.addEventListener('scroll', () => {
            // Sticky transition
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            // Active link highlighting based on viewport scroll
            let currentActiveSectionId = 'hero';
            sections.forEach(sec => {
                const secTop = sec.offsetTop - 120;
                const secHeight = sec.offsetHeight;
                if (window.scrollY >= secTop && window.scrollY < secTop + secHeight) {
                    currentActiveSectionId = sec.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentActiveSectionId}`) {
                    link.classList.add('active');
                }
            });
        });
    }

    // 3. MOBILE TOGGLE MENU
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            document.body.classList.toggle('mobile-nav-active');
        });
    }

    // Close menu when clicking links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSec = targetId ? document.querySelector(targetId) : null;
            
            if (targetSec) {
                const offset = 85; 
                const targetPos = targetSec.offsetTop - offset;
                
                window.scrollTo({
                    top: targetPos,
                    behavior: 'smooth'
                });
            }

            if (navMenu) navMenu.classList.remove('active');
            document.body.classList.remove('mobile-nav-active');
        });
    });

    // 4. DARK / LIGHT THEME TOGGLE
    const themeBtn = document.getElementById('theme-btn');
    let savedTheme = localStorage.getItem('nur-islam-theme') || 'theme-dark';
    
    // Set initial
    document.body.className = savedTheme;

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            if (document.body.classList.contains('theme-dark')) {
                document.body.className = 'theme-light';
                localStorage.setItem('nur-islam-theme', 'theme-light');
            } else {
                document.body.className = 'theme-dark';
                localStorage.setItem('nur-islam-theme', 'theme-dark');
            }
        });
    }


    // 5. LIVE DUAL DATE & PRAYER SCHEDULER
    const liveTimeDisplay = document.getElementById('live-time');
    const liveGregorianDisplay = document.getElementById('live-gregorian-date');
    const liveHijriDisplay = document.getElementById('live-hijri-date');

    const countdownDisplay = document.getElementById('prayer-countdown');
    const nextPrayerDisplay = document.getElementById('next-prayer-title');

    // Updated prayer schedule for Cairo, Egypt
    let currentPrayers = [];
    let fetchedHijriDate = '';

    async function fetchPrayerTimes() {
        try {
            const response = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=5');
            const data = await response.json();
            const timings = data.data.timings;
            const hijri = data.data.date.hijri;
            
            fetchedHijriDate = `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`;
            
            // Map to existing UI structures
            currentPrayers = [
                { name: 'الفجر', time: timings.Fajr, id: 'card-fajr', elementId: 'time-fajr' },
                { name: 'الشروق', time: timings.Sunrise, id: 'card-sunrise', elementId: 'time-sunrise' },
                { name: 'الظهر', time: timings.Dhuhr, id: 'card-dhuhr', elementId: 'time-dhuhr' },
                { name: 'العصر', time: timings.Asr, id: 'card-asr', elementId: 'time-asr' },
                { name: 'المغرب', time: timings.Maghrib, id: 'card-maghrib', elementId: 'time-maghrib' },
                { name: 'العشاء', time: timings.Isha, id: 'card-isha', elementId: 'time-isha' }
            ];
            
            // Set times once on cards
            currentPrayers.forEach(p => {
                const item = document.getElementById(p.elementId);
                if (item) {
                    // Conversion to 12Hr format for layout beautifulness
                    const hrParts = p.time.split(':');
                    let hr = parseInt(hrParts[0]);
                    const minutes = hrParts[1];
                    const pm = hr >= 12;
                    hr = hr % 12;
                    hr = hr ? hr : 12;
                    item.textContent = `${String(hr).padStart(2, '0')}:${minutes} ${pm ? 'م' : 'ص'}`;
                }
            });
        } catch (error) {
            console.error('Error fetching prayer times:', error);
        }
    }

    // Simple robust Gregorian to Hijri estimation (For May 2026)
    // May 23, 2026 matches Dhu al-Qi'dah 6, 1447 AH
    function getHijriDateString(dateObj) {
        // May 23, 2026 base offset anchor
        const baseGregorian = new Date("2026-05-23");
        const diffDays = Math.round((dateObj - baseGregorian) / (86400000));
        
        // Base hijri Dhu al-Qi'dah 6, 1447
        let baseDay = 6 + diffDays;
        let baseMonth = 11; // 11th Islamic Month: Dhu al-Qi'dah
        let baseYear = 1447;

        while (baseDay > 29) {
            // Months alternate 29/30 approx
            const monthLength = baseMonth % 2 === 0 ? 29 : 30;
            if (baseDay > monthLength) {
                baseDay -= monthLength;
                baseMonth++;
                if (baseMonth > 12) {
                    baseMonth = 1;
                    baseYear++;
                }
            } else {
                break;
            }
        }

        while (baseDay < 1) {
            baseMonth--;
            if (baseMonth < 1) {
                baseMonth = 12;
                baseYear--;
            }
            const monthLength = baseMonth % 2 === 0 ? 29 : 30;
            baseDay += monthLength;
        }

        const hijriMonthsAr = [
            "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
            "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
            "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
        ];

        return `${baseDay} ${hijriMonthsAr[baseMonth - 1]} ${baseYear} هـ`;
    }

    function formatTime12Hr(dateObj) {
        let hours = dateObj.getHours();
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        return `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    }

    function formatGregorianAr(dateObj) {
        const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        const months = [
            "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
            "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
        ];
        return `${days[dateObj.getDay()]}، ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    }

    function formatTime12HrAr(dateObj) {
        let hours = dateObj.getHours();
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');
        const amamp = hours >= 12 ? 'م' : 'ص';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${amamp}`;
    }

    function updateDualClocks() {
        const now = getCairoTime();

        // 1. Live Clocks updates
        liveTimeDisplay.textContent = formatTime12HrAr(now);
        liveGregorianDisplay.textContent = formatGregorianAr(now);
        liveHijriDisplay.textContent = fetchedHijriDate || getHijriDateString(now);

        // Update calendar layout full descriptors if elements exist
        const calHijriFull = document.getElementById('cal-hijri-full');
        const calGregFull = document.getElementById('cal-gregorian-full');
        if (calHijriFull) calHijriFull.textContent = getHijriDateString(now);
        if (calGregFull) calGregFull.textContent = formatGregorianAr(now);
        
        // --- Added check ---
        if (currentPrayers.length === 0) return;
        // -------------------

        // 2. Prayer Countdown logic
        const currentHr = now.getHours();
        const currentMin = now.getMinutes();
        const currentSec = now.getSeconds();
        const nowInSeconds = (currentHr * 3600) + (currentMin * 60) + currentSec;

        let nextPrayer = null;
        let activePrayer = null;

        // Convert times to seconds and compare
        const prayersWithSeconds = currentPrayers.map(p => {
            const parts = p.time.split(':');
            const sec = (parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60);
            return { ...p, seconds: sec };
        });

        // Find next prayer and current active running prayer
        for (let i = 0; i < prayersWithSeconds.length; i++) {
            if (nowInSeconds < prayersWithSeconds[i].seconds) {
                nextPrayer = prayersWithSeconds[i];
                activePrayer = prayersWithSeconds[i - 1] || prayersWithSeconds[prayersWithSeconds.length - 1];
                break;
            }
        }

        // If after Isha, next is tomorrow's Fajr
        if (!nextPrayer) {
            nextPrayer = prayersWithSeconds[0];
            activePrayer = prayersWithSeconds[prayersWithSeconds.length - 1];
        }

        // Highlight Active in UI
        currentPrayers.forEach(p => {
            const el = document.getElementById(p.id);
            if (el) {
                if (activePrayer && p.id === activePrayer.id) {
                    el.classList.add('current-prayer');
                } else {
                    el.classList.remove('current-prayer');
                }
            }
        });

        // Compute difference
        let diffSec = nextPrayer.seconds - nowInSeconds;
        if (diffSec < 0) {
            // Tomorrow's target
            diffSec += 24 * 3600;
        }

        const h = Math.floor(diffSec / 3600);
        const m = Math.floor((diffSec % 3600) / 60);
        const s = diffSec % 60;

        countdownDisplay.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        nextPrayerDisplay.textContent = `الأذان القادم: صلاة ${nextPrayer.name} في تمام الساعة ${nextPrayer.time}`;
    }

    // Set times once on cards
    fetchPrayerTimes();

    setInterval(updateDualClocks, 1000);
    updateDualClocks();



    // 6. QURAN ENGINE
    const quranSearch = document.getElementById('quran-search');
    const quranClear = document.getElementById('quran-search-clear');
    const surahListContainer = document.getElementById('surah-list-container');
    const versesBox = document.getElementById('verses-box');

    const activeSurahTitle = document.getElementById('active-surah-title');
    const activeSurahDetails = document.getElementById('active-surah-details');
    const activeSurahArabic = document.getElementById('active-surah-arabic');

    const audioPlayBtn = document.getElementById('audio-play-btn');
    const playSvg = document.getElementById('play-svg');
    const pauseSvg = document.getElementById('pause-svg');

    let searchFilter = "";
    let isReciting = false;

    // Premium Quranic Database Selection
    const surahDatabase = [
        {
            id: 1,
            en: "Al-Fatiha",
            translation: "The Opening",
            type: "Meccan",
            versesCount: 7,
            ar: "الفاتحة",
            verses: [
                { num: 1, ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", en: "In the name of Allah, the Entirely Merciful, the Especially Merciful." },
                { num: 2, ar: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", en: "[All] praise is [due] to Allah, Lord of the worlds -" },
                { num: 3, ar: "الرَّحْمَٰنِ الرَّحِيمِ", en: "The Entirely Merciful, the Especially Merciful," },
                { num: 4, ar: "مَالِكِ يَوْمِ الدِّينِ", en: "Sovereign of the Day of Recompense." },
                { num: 5, ar: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", en: "It is You we worship and You we ask for help." },
                { num: 6, ar: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", en: "Guide us to the straight path -" },
                { num: 7, ar: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", en: "The path of those upon whom You have bestowed favor, not of those who have earned [Your] anger or of those who are astray." }
            ]
        },
        {
            id: 2,
            en: "Al-Mulk",
            translation: "The Sovereignty",
            type: "Meccan",
            versesCount: 5, // Truncated selections for fast preview performance
            ar: "الملك",
            verses: [
                { num: 1, ar: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ", en: "Blessed is He in whose hand is dominion, and He is over all things competent -" },
                { num: 2, ar: "الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ", en: "[He] who created death and life to test you [as to] which of you is best in deed - and He is the Exalted in Might, the Forgiving -" },
                { num: 3, ar: "الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِي خَلَقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ", en: "[And] who created seven heavens in layers. You do not see in the creation of the Most Merciful any inconsistency." },
                { num: 4, ar: "ثُمَّ ارْجِعِ الْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ الْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ", en: "Then return [your] vision twice again. [Your] vision will return to you humbled while it is fatigued." },
                { num: 5, ar: "وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ وَجَعَلْنَاهَا رُجُومًا لِّلشَّيَاطِينِ", en: "And We have certainly beautified the nearest heaven with lamps and have made from them particles to throw at the devils." }
            ]
        },
        {
            id: 3,
            en: "Al-Kahf",
            translation: "The Cave",
            type: "Meccan",
            versesCount: 5,
            ar: "الكهف",
            verses: [
                { num: 1, ar: "الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا", en: "[All] praise is [due] to Allah, who has sent down upon His Servant the Book and has not made therein any deviance." },
                { num: 2, ar: "قَيِّمًا لِّيُنذِرَ بَأْسًا شَدِيدًا مِّن لَّدُنْهُ وَيُبَشِّرَ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ", en: "[He has made it] straight, to warn of severe punishment from Him and to give good tidings to the believers who do righteous deeds." },
                { num: 3, ar: "مَّاكِثِينَ فِيهِ أَبَدًا", en: "In which they will remain forever" },
                { num: 4, ar: "وَيُنذِرَ الَّذِينَ قَالُوا اتَّخَذَ اللَّهُ وَلَدًا", en: "And to warn those who say, 'Allah has taken a son.'" },
                { num: 5, ar: "مَّا لَهُم بِهِ مِنْ عِلْمٍ وَلَا لِآبَائِهِمْ ۚ كَبُرَتْ كَلِمَةً تَخْرُجُ مِنْ أَفْوَاهِهِمْ", en: "They have no knowledge of it, nor had their fathers. Grave is the word that comes out of their mouths; they speak not except a lie." }
            ]
        },
        {
            id: 4,
            en: "Yaseen",
            translation: "Ya-sin",
            type: "Meccan",
            versesCount: 5,
            ar: "يس",
            verses: [
                { num: 1, ar: "يس", en: "Ya, Seen." },
                { num: 2, ar: "وَالْقُرْآنِ الْحَكِيمِ", en: "By the wise Qur'an," },
                { num: 3, ar: "إِنَّكَ لَمِنَ الْمُرْسَلِينَ", en: "Indeed, you, [O Muhammad], are from among the messengers," },
                { num: 4, ar: "عَلَىٰ صِرَاطٍ مُّسْتَقِيمٍ", en: "On a straight path." },
                { num: 5, ar: "تَنزِيلَ الْعَزِيزِ الرَّحِيمِ", en: "[This is] a revelation of the Exalted in Might, the Merciful." }
            ]
        },
        {
            id: 5,
            en: "Al-Ikhlas",
            translation: "The Sincerity",
            type: "Meccan",
            versesCount: 4,
            ar: "الإخلاص",
            verses: [
                { num: 1, ar: "قُلْ هُوَ اللَّهُ أَحَدٌ", en: "Say, 'He is Allah, [who is] One," },
                { num: 2, ar: "اللَّهُ الصَّمَدُ", en: "Allah, the Eternal Refuge." },
                { num: 3, ar: "لَمْ يَلِدْ وَلَمْ يُولَدْ", en: "He neither begets nor is born," },
                { num: 4, ar: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", en: "Nor is there to Him any equivalent.'" }
            ]
        }
    ];

    let selectedSurah = surahDatabase[0];

    function drawSurahSidebar() {
        surahListContainer.innerHTML = "";
        
        const filtered = surahDatabase.filter(s => {
            const query = searchFilter.toLowerCase();
            return s.en.toLowerCase().includes(query) || 
                   s.translation.toLowerCase().includes(query) || 
                   s.ar.includes(query);
        });

        if (filtered.length === 0) {
            surahListContainer.innerHTML = `<div class="text-center text-gold" style="padding: 2rem 0;">No matching Surah found</div>`;
            return;
        }

        filtered.forEach(s => {
            const isActive = selectedSurah.id === s.id;
            const sideItem = document.createElement('button');
            sideItem.className = `surah-side-item w-full ${isActive ? 'active' : ''}`;
            
            sideItem.innerHTML = `
                <div class="side-item-left">
                    <span class="index-badge">${s.id}</span>
                    <div class="surah-mid-info">
                        <span class="surah-side-title-en">${s.ar}</span>
                        <span class="surah-side-verses-label">${s.type === 'Meccan' ? 'مكية' : 'مدنية'} • ${s.versesCount} آيات</span>
                    </div>
                </div>
                <div class="side-item-right">
                    <span class="surah-side-arabic font-serif">سورة ${s.ar}</span>
                </div>
            `;

            sideItem.addEventListener('click', () => {
                selectSurah(s);
            });

            surahListContainer.appendChild(sideItem);
        });
    }

    function selectSurah(surah) {
        selectedSurah = surah;
        
        // Update header details
        activeSurahTitle.textContent = `سورة ${surah.ar}`;
        activeSurahDetails.textContent = `${surah.type === 'Meccan' ? 'مكية' : 'مدنية'} • ${surah.versesCount} آيات • التلاوة برواية حفص`;
        activeSurahArabic.textContent = surah.ar;

        // Reset audio state
        stopFakeAudio();

        // Render verses
        versesBox.innerHTML = "";
        surah.verses.forEach(v => {
            const row = document.createElement('div');
            row.className = "verse-item-card";
            row.innerHTML = `
                <div class="verse-meta-row">
                    <span class="verse-number-badge font-mono">الآية ${v.num}</span>
                </div>
                <p class="verse-arabic-text font-serif" style="margin-bottom:0.5rem;">${v.ar}</p>
            `;
            versesBox.appendChild(row);
        });

        // Highlight in list
        drawSurahSidebar();

        // Scroll reader box back to top
        versesBox.scrollTop = 0;
    }

    // Connect search inputs
    if (quranSearch) {
        quranSearch.addEventListener('input', (e) => {
            searchFilter = e.target.value;
            if (searchFilter.trim() !== "") {
                quranClear.style.display = "flex";
            } else {
                quranClear.style.display = "none";
            }
            drawSurahSidebar();
        });
    }

    if (quranClear) {
        quranClear.addEventListener('click', () => {
            quranSearch.value = "";
            searchFilter = "";
            quranClear.style.display = "none";
            drawSurahSidebar();
        });
    }

    // Simulated Audio trigger
    if (audioPlayBtn) {
        audioPlayBtn.addEventListener('click', () => {
            if (isReciting) {
                stopFakeAudio();
            } else {
                startFakeAudio();
            }
        });
    }

    function startFakeAudio() {
        isReciting = true;
        audioPlayBtn.classList.add('playing');
        audioPlayBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
            </svg>
            جاري تشغيل تلاوة سورة ${selectedSurah.ar}...
        `;
    }

    function stopFakeAudio() {
        isReciting = false;
        audioPlayBtn.classList.remove('playing');
        audioPlayBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            تشغيل التلاوة الصوتية
        `;
    }

    // Initial setup
    selectSurah(surahDatabase[0]);


    // 7. HADITH OF THE DAY & WISDOMS ENGINE
    let allWisdoms = [];
    const wisdomsList = document.getElementById('wisdoms-list');
    const hadithContainer = document.getElementById('hadith-content');
    const hadithBtn = document.getElementById('generate-hadith');

    async function loadResources() {
        try {
            const response = await fetch('wisdom.json');
            const data = await response.json();
            allWisdoms = data.wisdoms;
            
            renderWisdoms();
            renderHadith();
        } catch (e) {
            console.error("Could not load resources", e);
        }
    }

    function renderWisdoms() {
        const shuffled = [...allWisdoms].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 9);

        if (wisdomsList) {
            wisdomsList.innerHTML = selected.map(w => `
                <div class="wisdom-card">
                    <p class="wisdom-text">${w.ar}</p>
                    <span class="wisdom-source">${w.source}</span>
                </div>
            `).join('');
        }
    }

    function renderHadith() {
        if (!allWisdoms.length) return;
        const randomHadith = allWisdoms[Math.floor(Math.random() * allWisdoms.length)];
        
        if (hadithContainer) {
            hadithContainer.innerHTML = `
                <span class="hadith-arabic font-serif" id="hadith-txt-ar">${randomHadith.ar}</span>
                <p class="hadith-english" id="hadith-txt-en">"${randomHadith.en}"</p>
                <cite class="hadith-narrator" id="hadith-author">${randomHadith.source}</cite>
            `;
        }
    }

    if (hadithBtn) {
        hadithBtn.addEventListener('click', renderHadith);
    }
    
    loadResources();


    // 8. INTERACTIVE TASBEEH COUNTER & WEB AUDIO FX
    const counterScore = document.getElementById('tasbeeh-score');
    const counterMax = document.getElementById('tasbeeh-max');
    const incrementBtn = document.getElementById('tasbeeh-increment');
    const resetBtn = document.getElementById('tasbeeh-reset');
    const presetGroup = document.getElementById('dhikr-presets');
    const activeDhikrEn = document.getElementById('tasbeeh-active-dhikr-en');
    const activeDhikrAr = document.getElementById('tasbeeh-active-dhikr-ar');
    const ringBar = document.getElementById('ring-bar');
    const soundToggle = document.getElementById('tasbeeh-sound-toggle');

    const soundOnSvg = document.getElementById('sound-on-svg');
    const soundOffSvg = document.getElementById('sound-off-svg');

    let currentCount = parseInt(localStorage.getItem('nur-islam-tasbeeh-count')) || 0;
    let targetCountGoal = parseInt(localStorage.getItem('nur-islam-tasbeeh-goal')) || 33;
    let activeDhikrLabelEn = localStorage.getItem('nur-islam-tasbeeh-label-en') || "Subhan'Allah";
    let activeDhikrLabelAr = localStorage.getItem('nur-islam-tasbeeh-label-ar') || "سُبْحَانَ ٱللَّٰهِ";
    let isSoundMuted = localStorage.getItem('nur-islam-tasbeeh-muted') === 'true';

    // Circle circumference radius (r = 95). 2 * Math.PI * 95 = 596.90
    const ringMaxCircumference = 596.90;

    function saveTasbeehState() {
        localStorage.setItem('nur-islam-tasbeeh-count', currentCount);
        localStorage.setItem('nur-islam-tasbeeh-goal', targetCountGoal);
        localStorage.setItem('nur-islam-tasbeeh-label-en', activeDhikrLabelEn);
        localStorage.setItem('nur-islam-tasbeeh-label-ar', activeDhikrLabelAr);
        localStorage.setItem('nur-islam-tasbeeh-muted', isSoundMuted);
    }

    function updateDigitalCounterLayout() {
        counterScore.textContent = currentCount;
        counterMax.textContent = `الهدف: ${targetCountGoal}`;
        if (activeDhikrEn) {
            activeDhikrEn.textContent = activeDhikrLabelEn;
        }
        activeDhikrAr.textContent = activeDhikrLabelAr;

        // Progress ring tracking - dynamic radius support
        const ringRadius = parseFloat(getComputedStyle(ringBar).r) || 95;
        const circ = 2 * Math.PI * ringRadius;
        const percentageFilled = Math.min(currentCount / targetCountGoal, 1);
        const offset = circ - (percentageFilled * circ);
        
        ringBar.style.strokeDasharray = circ;
        ringBar.style.strokeDashoffset = offset;

        // Toggle sound SVG indicator
        if (isSoundMuted) {
            soundOnSvg.classList.add('hidden');
            soundOffSvg.classList.remove('hidden');
            soundToggle.innerHTML = `${soundOffSvg.outerHTML} الصوت: مغلق`;
        } else {
            soundOffSvg.classList.add('hidden');
            soundOnSvg.classList.remove('hidden');
            soundToggle.innerHTML = `${soundOnSvg.outerHTML} الصوت: مفعّل`;
        }
    }

    // Synthesize beautiful sweet click sound purely using Web Audio API
    function playTactileSynthesizer() {
        if (isSoundMuted) return;
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();

            osc.type = "sine";
            // Normal click or elegant high chime if goal completed!
            const finishedGoal = currentCount % targetCountGoal === 0 && currentCount > 0;
            const pitch = finishedGoal ? 1600 : 980;
            const duration = finishedGoal ? 0.25 : 0.05;

            osc.frequency.setValueAtTime(pitch, context.currentTime);
            gain.gain.setValueAtTime(finishedGoal ? 0.08 : 0.04, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

            osc.connect(gain);
            gain.connect(context.destination);

            osc.start();
            osc.stop(context.currentTime + duration);
        } catch (e) {
            console.log("Audio contexts pending verification.", e);
        }
    }

    if (incrementBtn) {
        incrementBtn.addEventListener('click', (e) => {
            currentCount++;
            playTactileSynthesizer();

            // Active ripple layout animation
            const ripple = document.getElementById('ripple');
            if (ripple) {
                ripple.classList.add('active');
                setTimeout(() => { ripple.classList.remove('active'); }, 100);
            }
            
            saveTasbeehState();
            updateDigitalCounterLayout();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentCount = 0;
            playTactileSynthesizer();
            saveTasbeehState();
            updateDigitalCounterLayout();
        });
    }

    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            isSoundMuted = !isSoundMuted;
            saveTasbeehState();
            updateDigitalCounterLayout();
        });
    }

    // Preset options choosing
    if (presetGroup) {
        const presetButtons = presetGroup.querySelectorAll('.dhikr-btn-preset');
        presetButtons.forEach(btn => {
            // Sync active highlight initial
            const btnEn = btn.getAttribute('data-dhikr-en');
            if (btnEn === activeDhikrLabelEn) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }

            btn.addEventListener('click', () => {
                presetButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                activeDhikrLabelAr = btn.getAttribute('data-dhikr-ar');
                activeDhikrLabelEn = btnEn;
                targetCountGoal = parseInt(btn.getAttribute('data-target-count'));
                currentCount = 0; // Reset count upon shifting theme

                playTactileSynthesizer();
                saveTasbeehState();
                updateDigitalCounterLayout();
            });
        });
    }

    // Setup initial layout
    updateDigitalCounterLayout();


    // 9. DYNAMIC ISLAMIC DUAL CALENDAR TRACKER
    const calendarCellsObj = document.getElementById('calendar-cells');
    const monthTitleDisplay = document.getElementById('month-title-display');
    const prevMonthBtn = document.getElementById('calendar-prev');
    const nextMonthBtn = document.getElementById('calendar-next');

    // Anchor time: 2026-05 (May 2026)
    let calendarYear = 2026;
    let calendarMonth = 4; // 4 matches May 

    // Spiritual highlights data for Gregorian dates
    const IslamicHighlights = {
        "2026-03-20": "Beginning of Ramadan Fasting",
        "2026-04-03": "Eid al-Fitr Festival",
        "2026-05-18": "Hajj Ritual Outsets",
        "2026-05-27": "Eid al-Adha Holy Feast",
        "2026-06-16": "Islamic Islamic New Year (1448 AH)"
    };

    function drawMonthlyCalendarGrid() {
        calendarCellsObj.innerHTML = "";
        
        // Month names representation
        const monthNames = [
            "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
            "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
        ];
        monthTitleDisplay.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;

        // Get first day of month (where inside days bar it starts)
        const firstDayValue = new Date(calendarYear, calendarMonth, 1).getDay();
        const daysInMonthLength = new Date(calendarYear, calendarMonth + 1, 0).getDate();

        // 1. Fill empty preceding slots
        for (let i = 0; i < firstDayValue; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = "cal-cell-item empty-cell";
            calendarCellsObj.appendChild(emptyCell);
        }

        // 2. Generate actual day cells
        const todayDateObj = getCairoTime();
        
        for (let d = 1; d <= daysInMonthLength; d++) {
            const cell = document.createElement('div');
            cell.className = "cal-cell-item";
            
            // Build absolute Gregorian date key
            const tempMStr = String(calendarMonth + 1).padStart(2, '0');
            const tempDStr = String(d).padStart(2, '0');
            const fullDateKey = `${calendarYear}-${tempMStr}-${tempDStr}`;

            // Check if current day represents today
            const isToday = todayDateObj.getFullYear() === calendarYear && 
                            todayDateObj.getMonth() === calendarMonth && 
                            todayDateObj.getDate() === d;
            
            if (isToday) {
                cell.classList.add('today');
            }

            // Check high priority Islamic event and append highlight class
            if (IslamicHighlights[fullDateKey]) {
                cell.classList.add('spiritual-highlight');
                const eventMapAr = {
                    "Beginning of Ramadan Fasting": "بداية صيام شهر رمضان المبارك",
                    "Eid al-Fitr Festival": "عيد الفطر السعيد",
                    "Hajj Ritual Outsets": "بداية مناسك الحج",
                    "Eid al-Adha Holy Feast": "عيد الأضحى المبارك",
                    "Islamic Islamic New Year (1448 AH)": "رأس السنة الهجرية ١٤٤٨ هـ"
                };
                cell.setAttribute('title', `${eventMapAr[IslamicHighlights[fullDateKey]] || IslamicHighlights[fullDateKey]} (تاريخ تقريبي هجري)`);
            }

            // Convert Gregorian cell date to approx Hijri index
            const lookupDate = new Date(calendarYear, calendarMonth, d);
            const hijriStr = getHijriDateString(lookupDate);
            // Extract the Arabic numeric representation of day (or standard numerical day)
            const hijriDayNumber = hijriStr.match(/\d+/)[0]; 

            cell.innerHTML = `
                <span class="gregorian-span">${d}</span>
                <span class="hijri-span">${hijriDayNumber}</span>
            `;

            calendarCellsObj.appendChild(cell);
        }
    }

    prevMonthBtn.addEventListener('click', () => {
        calendarMonth--;
        if (calendarMonth < 0) {
            calendarMonth = 11;
            calendarYear--;
        }
        drawMonthlyCalendarGrid();
    });

    nextMonthBtn.addEventListener('click', () => {
        calendarMonth++;
        if (calendarMonth > 11) {
            calendarMonth = 0;
            calendarYear++;
        }
        drawMonthlyCalendarGrid();
    });

    drawMonthlyCalendarGrid();


    // 10. QUOTES SLIDER ENGINE
    const sliderWrapper = document.getElementById('slider-wrapper');
    const sliderDotsGroup = document.getElementById('slider-dots-group');
    const sliderPrevBtn = document.getElementById('slider-prev-btn');
    const sliderNextBtn = document.getElementById('slider-next-btn');

    const slides = sliderWrapper ? Array.from(sliderWrapper.querySelectorAll('.quote-slide')) : [];
    const dots = sliderDotsGroup ? Array.from(sliderDotsGroup.querySelectorAll('.dot')) : [];
    let activeSlideIndex = 0;
    let autoSlideInterval = null;

    function renderSlideAtActiveIndex() {
        slides.forEach((slide, idx) => {
            if (idx === activeSlideIndex) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        dots.forEach((dot, idx) => {
            if (idx === activeSlideIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function shiftToNextQuote() {
        activeSlideIndex++;
        if (activeSlideIndex >= slides.length) {
            activeSlideIndex = 0;
        }
        renderSlideAtActiveIndex();
    }

    function shiftToPrevQuote() {
        activeSlideIndex--;
        if (activeSlideIndex < 0) {
            activeSlideIndex = slides.length - 1;
        }
        renderSlideAtActiveIndex();
    }

    // Auto-rotation timer setup
    function startQuoteAutoRotation() {
        stopQuoteAutoRotation();
        autoSlideInterval = setInterval(shiftToNextQuote, 6000);
    }

    function stopQuoteAutoRotation() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
        }
    }

    if (sliderNextBtn) {
        sliderNextBtn.addEventListener('click', () => {
            shiftToNextQuote();
            startQuoteAutoRotation(); // Reset timer upon manual clicking
        });
    }

    if (sliderPrevBtn) {
        sliderPrevBtn.addEventListener('click', () => {
            shiftToPrevQuote();
            startQuoteAutoRotation();
        });
    }

    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
            activeSlideIndex = idx;
            renderSlideAtActiveIndex();
            startQuoteAutoRotation();
        });
    });

    startQuoteAutoRotation();

    // View Switcher logic (Simulating "Separate Page")
    const homeView = document.getElementById('home-view');
    const adhkarView = document.getElementById('adhkar-view');
    const navbarFull = document.getElementById('navbar');

    window.switchToAdhkarView = () => {
        if (homeView && adhkarView) {
            homeView.classList.add('view-hidden');
            adhkarView.classList.remove('view-hidden');
            if (navbarFull) navbarFull.style.display = 'none';
            window.scrollTo(0, 0);
            renderCurrentAdhkar();
        }
    };

    window.switchToHomeView = () => {
        if (homeView && adhkarView) {
            adhkarView.classList.add('view-hidden');
            homeView.classList.remove('view-hidden');
            if (navbarFull) navbarFull.style.display = 'flex';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };


    // 11. ADHKAR MORNING & EVENING INTERACTIVE ENGINE
    const adhkarListPage = document.getElementById('adhkar-page-list');
    let currentAdhkarData = { morning: [], evening: [] };

    async function loadAdhkarData() {
        try {
            const response = await fetch('adhkar.json');
            currentAdhkarData = await response.json();
            showAdhkar('morning');
        } catch (e) {
            console.error("Adhkar data fetch failed", e);
        }
    }

    let currentAdhkarIndex = 0;
    let currentAdhkarType = 'morning';

    window.showAdhkar = (type, event, index = 0) => {
        currentAdhkarType = type;
        currentAdhkarIndex = index;
        
        // Update tab buttons in Adhkar View
        document.querySelectorAll('.tab-btn-page').forEach(btn => btn.classList.remove('active'));
        const targetBtnId = type === 'morning' ? 'btn-morning' : 'btn-evening';
        const targetBtn = document.getElementById(targetBtnId);
        if (targetBtn) targetBtn.classList.add('active');
        
        renderCurrentAdhkar();
    };

    function renderCurrentAdhkar() {
        if (!currentAdhkarData[currentAdhkarType] || currentAdhkarData[currentAdhkarType].length === 0) return;
        if (!adhkarListPage) return;

        const list = currentAdhkarData[currentAdhkarType];
        const item = list[currentAdhkarIndex];
        const currentCount = parseInt(localStorage.getItem(`adhkar-${currentAdhkarType}-${currentAdhkarIndex}`) || 0);
        
        // Calculate smooth progress: completed items + fraction of current item
        const itemProgress = Math.min(currentCount / item.total, 1);
        const totalProgress = ((currentAdhkarIndex + itemProgress) / list.length) * 100;
        
        const isCompleted = currentCount >= item.total;

        adhkarListPage.innerHTML = `
            <div class="adhkar-focus-card" id="adhkar-card-focus">
                <div class="adhkar-progress-bar-container">
                    <div class="adhkar-progress-fill" id="adhkar-progress-bar" style="width: ${totalProgress}%"></div>
                </div>
                
                <div class="adhkar-counter-badge">${currentAdhkarIndex + 1} / ${list.length}</div>
                
                <p class="adhkar-text-large" id="adhkar-main-text">${item.text}</p>
                
                <div class="adhkar-controls">
                    <button class="control-btn" onclick="prevAdhkar()" ${currentAdhkarIndex === 0 ? 'disabled' : ''} aria-label="الذكر السابق">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span class="hidden-mobile">السابق</span>
                    </button>
                    
                    <button class="increment-main-btn ${isCompleted ? 'completed' : ''}" 
                            id="adhkar-increment-btn"
                            onclick="incrementAdhkar('${currentAdhkarType}', ${currentAdhkarIndex}, ${item.total})">
                        <span class="curr-val" id="adhkar-focus-count">${currentCount}</span>
                        <span class="total-val">/ ${item.total}</span>
                    </button>

                    <button class="control-btn" onclick="nextAdhkar()" ${currentAdhkarIndex === list.length - 1 ? 'disabled' : ''} aria-label="الذكر التالي">
                        <span class="hidden-mobile">التالي</span>
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                </div>
                
                ${isCompleted ? '<div class="completion-stamp animate-bounce">تم الذكر ✓</div>' : ''}
                <p class="adhkar-source text-muted mt-4" style="font-size: 0.8rem; opacity: 0.7;">${item.source || ''}</p>
            </div>
        `;
    }

    window.nextAdhkar = () => {
        if (currentAdhkarIndex < currentAdhkarData[currentAdhkarType].length - 1) {
            const card = document.getElementById('adhkar-card-focus');
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'translateX(-20px)';
            }
            
            setTimeout(() => {
                currentAdhkarIndex++;
                renderCurrentAdhkar();
                const newCard = document.getElementById('adhkar-card-focus');
                if (newCard) {
                    newCard.style.opacity = '0';
                    newCard.style.transform = 'translateX(20px)';
                    setTimeout(() => {
                        newCard.style.opacity = '1';
                        newCard.style.transform = 'translateX(0)';
                    }, 50);
                }
            }, 300);
        }
    };
    
    window.prevAdhkar = () => {
        if (currentAdhkarIndex > 0) {
            const card = document.getElementById('adhkar-card-focus');
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'translateX(20px)';
            }
            
            setTimeout(() => {
                currentAdhkarIndex--;
                renderCurrentAdhkar();
                const newCard = document.getElementById('adhkar-card-focus');
                if (newCard) {
                    newCard.style.opacity = '0';
                    newCard.style.transform = 'translateX(-20px)';
                    setTimeout(() => {
                        newCard.style.opacity = '1';
                        newCard.style.transform = 'translateX(0)';
                    }, 50);
                }
            }, 300);
        }
    };

    window.incrementAdhkar = (type, index, total) => {
        let count = parseInt(localStorage.getItem(`adhkar-${type}-${index}`) || 0);
        const btn = document.getElementById('adhkar-increment-btn');
        const list = currentAdhkarData[currentAdhkarType];
        
        if (count < total) {
            count++;
            localStorage.setItem(`adhkar-${type}-${index}`, count);
            const countEl = document.getElementById(`adhkar-focus-count`);
            
            // Real-time progress bar update
            const progressBar = document.getElementById('adhkar-progress-bar');
            if (progressBar && list) {
                const itemProgress = Math.min(count / total, 1);
                const totalProgress = ((index + itemProgress) / list.length) * 100;
                progressBar.style.width = `${totalProgress}%`;
                
                // Visual feedback for progress bar
                if (count >= total) {
                    progressBar.style.background = 'var(--color-accent-emerald)';
                }
            }

            if (countEl) {
                countEl.textContent = count;
                // Simple pop animation
                countEl.style.transform = 'scale(1.2)';
                setTimeout(() => countEl.style.transform = 'scale(1)', 100);
            }
            
            if (count >= total) {
                if (btn) btn.classList.add('completed');
                setTimeout(() => {
                    renderCurrentAdhkar(); // Re-render after a tiny delay to show completion stamp
                }, 200);
                
                // Vibrate if supported
                if ("vibrate" in navigator) {
                    navigator.vibrate(100);
                }
            }
        } else {
            // Shake if already completed
            if (btn) {
                btn.classList.add('animate-shake');
                setTimeout(() => btn.classList.remove('animate-shake'), 400);
            }
        }
    };

    loadAdhkarData();

    // 12. CONTACT FORM
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            // alert('تم إرسال الرسالة بنجاح.');
            const btn = contactForm.querySelector('button');
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = 'تم الإرسال ✓';
                btn.classList.add('btn-success');
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.classList.remove('btn-success');
                }, 3000);
            }
            contactForm.reset();
        });
    }

    startQuoteAutoRotation();

    // 13. BACK TO TOP BUTTON
    const backToTopBtn = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Ensure the page starts at the top when fully loaded
    window.addEventListener('load', () => {
        window.scrollTo(0, 0);
    });

});
