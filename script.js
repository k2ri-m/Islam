/**
 * NUR ISLAM - SYSTEM SCRIPT
 * Comprehensive, pure JavaScript engine for responsiveness,
 * calculations, state preservation, and advanced UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Current local time anchor for the system
    const systemStartTime = new Date("2026-05-23T13:46:16Z");
    let localTimeOffset = systemStartTime.getTime() - Date.now();

    function getCurrentTime() {
        return new Date(Date.now() + localTimeOffset);
    }

    // 1. LOADER CONTROLLER
    const loader = document.getElementById('loader');
    const loaderBar = document.getElementById('loader-bar');
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


    // 2. STICKY HEADER & ACTIVE SCROLL MAPPER
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

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


    // 3. MOBILE TOGGLE MENU
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');

    mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        document.body.classList.toggle('mobile-nav-active');
    });

    // Close menu when clicking links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            document.body.classList.remove('mobile-nav-active');
        });
    });


    // 4. DARK / LIGHT THEME TOGGLE
    const themeBtn = document.getElementById('theme-btn');
    let savedTheme = localStorage.getItem('nur-islam-theme') || 'theme-dark';
    
    // Set initial
    document.body.className = savedTheme;

    themeBtn.addEventListener('click', () => {
        if (document.body.classList.contains('theme-dark')) {
            document.body.className = 'theme-light';
            localStorage.setItem('nur-islam-theme', 'theme-light');
        } else {
            document.body.className = 'theme-dark';
            localStorage.setItem('nur-islam-theme', 'theme-dark');
        }
    });


    // 5. LIVE DUAL DATE & PRAYER SCHEDULER
    const liveTimeDisplay = document.getElementById('live-time');
    const liveGregorianDisplay = document.getElementById('live-gregorian-date');
    const liveHijriDisplay = document.getElementById('live-hijri-date');

    const countdownDisplay = document.getElementById('prayer-countdown');
    const nextPrayerDisplay = document.getElementById('next-prayer-title');

    // Simulated standard accurate prayer schedule for today
    const mockPrayers = [
        { name: 'الفجر', time: '04:32', id: 'card-fajr', elementId: 'time-fajr' },
        { name: 'الشروق', time: '05:58', id: 'card-sunrise', elementId: 'time-sunrise' },
        { name: 'الظهر', time: '12:30', id: 'card-dhuhr', elementId: 'time-dhuhr' },
        { name: 'العصر', time: '16:05', id: 'card-asr', elementId: 'time-asr' },
        { name: 'المغرب', time: '19:02', id: 'card-maghrib', elementId: 'time-maghrib' },
        { name: 'العشاء', time: '20:28', id: 'card-isha', elementId: 'time-isha' }
    ];

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
        const now = getCurrentTime();

        // 1. Live Clocks updates
        liveTimeDisplay.textContent = formatTime12HrAr(now);
        liveGregorianDisplay.textContent = formatGregorianAr(now);
        liveHijriDisplay.textContent = getHijriDateString(now);

        // Update calendar layout full descriptors if elements exist
        const calHijriFull = document.getElementById('cal-hijri-full');
        const calGregFull = document.getElementById('cal-gregorian-full');
        if (calHijriFull) calHijriFull.textContent = getHijriDateString(now);
        if (calGregFull) calGregFull.textContent = formatGregorianAr(now);

        // 2. Prayer Countdown logic
        const currentHr = now.getHours();
        const currentMin = now.getMinutes();
        const currentSec = now.getSeconds();
        const nowInSeconds = (currentHr * 3600) + (currentMin * 60) + currentSec;

        let nextPrayer = null;
        let activePrayer = null;

        // Convert times to seconds and compare
        const prayersWithSeconds = mockPrayers.map(p => {
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
        mockPrayers.forEach(p => {
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
    mockPrayers.forEach(p => {
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
    quranSearch.addEventListener('input', (e) => {
        searchFilter = e.target.value;
        if (searchFilter.trim() !== "") {
            quranClear.style.display = "flex";
        } else {
            quranClear.style.display = "none";
        }
        drawSurahSidebar();
    });

    quranClear.addEventListener('click', () => {
        quranSearch.value = "";
        searchFilter = "";
        quranClear.style.display = "none";
        drawSurahSidebar();
    });

    // Simulated Audio trigger
    audioPlayBtn.addEventListener('click', () => {
        if (isReciting) {
            stopFakeAudio();
        } else {
            startFakeAudio();
        }
    });

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


    // 7. HADITH OF THE DAY ENGINE
    const hadithAr = document.getElementById('hadith-txt-ar');
    const hadithEn = document.getElementById('hadith-txt-en');
    const hadithAuthor = document.getElementById('hadith-author');
    const generateHadithBtn = document.getElementById('generate-hadith');

    // Authentically sourced short Hadiths
    const hadithDatabase = [
        {
            ar: "«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى»",
            en: "\"Actions are judged by motives, and each person will receive rewards according to his intentions.\"",
            source: "رواه البخاري (حديث ١)"
        },
        {
            ar: "«الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ»",
            en: "\"A true Muslim is the one from whose tongue and hands other Muslims are safe.\"",
            source: "رواه البخاري (حديث ١٠)"
        },
        {
            ar: "«لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ»",
            en: "\"None of you truly believes until he loves for his brother what he loves for himself.\"",
            source: "رواه البخاري (حديث ١٣)"
        },
        {
            ar: "«مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ»",
            en: "\"He who believes in Allah and the Last Day must either speak good or remain silent.\"",
            source: "رواه مسلم (حديث ٤٧)"
        },
        {
            ar: "«اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا»",
            en: "\"Fear Allah wherever you are, and follow up an evil deed with a good one to wipe it out.\"",
            source: "رواه الترمذي (حديث ١٩٨٧)"
        }
    ];

    generateHadithBtn.addEventListener('click', () => {
        // Simple rotation animation visual anchor
        const container = document.getElementById('hadith-container');
        container.style.opacity = '0';
        container.style.transform = 'scale(0.98)';
        
        setTimeout(() => {
            let randIndex;
            do {
                randIndex = Math.floor(Math.random() * hadithDatabase.length);
            } while (hadithEn.textContent === hadithDatabase[randIndex].en && hadithDatabase.length > 1);

            const chosen = hadithDatabase[randIndex];
            hadithAr.textContent = chosen.ar;
            hadithEn.textContent = chosen.en;
            hadithAuthor.textContent = chosen.source;

            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
        }, 300);
    });


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

        // Progress ring tracking
        const percentageFilled = Math.min(currentCount / targetCountGoal, 1);
        const offset = ringMaxCircumference - (percentageFilled * ringMaxCircumference);
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

    incrementBtn.addEventListener('click', (e) => {
        currentCount++;
        playTactileSynthesizer();

        // Active ripple layout animation
        const ripple = document.getElementById('ripple');
        ripple.classList.add('active');
        setTimeout(() => { ripple.classList.remove('active'); }, 100);

        saveTasbeehState();
        updateDigitalCounterLayout();
    });

    resetBtn.addEventListener('click', () => {
        currentCount = 0;
        playTactileSynthesizer();
        saveTasbeehState();
        updateDigitalCounterLayout();
    });

    soundToggle.addEventListener('click', () => {
        isSoundMuted = !isSoundMuted;
        saveTasbeehState();
        updateDigitalCounterLayout();
    });

    // Preset options choosing
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
        const todayDateObj = getCurrentTime();
        
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

    const slides = Array.from(sliderWrapper.querySelectorAll('.quote-slide'));
    const dots = Array.from(sliderDotsGroup.querySelectorAll('.dot'));
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

    sliderNextBtn.addEventListener('click', () => {
        shiftToNextQuote();
        startQuoteAutoRotation(); // Reset timer upon manual clicking
    });

    sliderPrevBtn.addEventListener('click', () => {
        shiftToPrevQuote();
        startQuoteAutoRotation();
    });

    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
            activeSlideIndex = idx;
            renderSlideAtActiveIndex();
            startQuoteAutoRotation();
        });
    });

    startQuoteAutoRotation();


    // 11. ADHKAR MORNING & EVENING INTERACTIVE ENGINE
    const adhkarDatabase = {
        morning: [
            {
                id: "m1",
                title: "آية الكرسي",
                text: "أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ: {اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ}",
                reward: "من قالها حين يصبح أجير من الجن حتى يمسي.",
                count: 1
            },
            {
                id: "m2",
                title: "الإخلاص والمعوذتين",
                text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ {قُلْ هُوَ اللَّهُ أَحَدٌ...}، {قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ...}، {قُلْ أَعُوذُ بِرَبِّ النَّاسِ...}",
                reward: "تكفيك من كل شيء (تُقرأ ثلاث مرات).",
                count: 3
            },
            {
                id: "m3",
                title: "سيد الاستغفار",
                text: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.",
                reward: "من قالها موقنا بها حين يصبح فمات من يومه دخل الجنة.",
                count: 1
            },
            {
                id: "m4",
                title: "دعاء العافية والستر",
                text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنَ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي.",
                reward: "حفظ شامل وعافية من كُلِّ سوء وبلاء.",
                count: 1
            },
            {
                id: "m5",
                title: "اسم الله لدفع الضر",
                text: "بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.",
                reward: "لم يضره شيء في ذلك اليوم (تُقرأ ثلاث مرات).",
                count: 3
            },
            {
                id: "m6",
                title: "الرضا بالله والرسول والديّن",
                text: "رَضِيتُ بِاللهِ رَبّاً، وَبِالْإِسْلَامِ دِيناً، وَبِمُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ نَبِيّاً.",
                reward: "كان حقاً على الله أن يرضيه يوم القيامة (تُقرأ ثلاث مرات).",
                count: 3
            }
        ],
        evening: [
            {
                id: "e1",
                title: "آية الكرسي",
                text: "أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ: {اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ}",
                reward: "من قالها حين يمسي أجير من الجن حتى يصبح.",
                count: 1
            },
            {
                id: "e2",
                title: "الإخلاص والمعوذتين",
                text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ {قُلْ هُوَ اللَّهُ أَحَدٌ...}، {قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ...}، {قُلْ أَعُوذُ بِرَبِّ النَّاسِ...}",
                reward: "تكفيك من كل شيء (تُقرأ ثلاث مرات).",
                count: 3
            },
            {
                id: "e3",
                title: "سيد الاستغفار",
                text: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.",
                reward: "من قالها موقنا بها حين يمسي فمات من ليلته دخل الجنة.",
                count: 1
            },
            {
                id: "e4",
                title: "الاستعاذة بكلمات الله التامات من شر ما خلق",
                text: "أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.",
                reward: "لم تضره حمة لو لدغته في تلك الليلة (تُقرأ ثلاث مرات).",
                count: 3
            },
            {
                id: "e5",
                title: "اسم الله كفاية فجأة البلاء",
                text: "بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.",
                reward: "لا يصيبه فجأة بلاء حتى يصبح (تُقرأ ثلاث مرات).",
                count: 3
            },
            {
                id: "e6",
                title: "الصلاة على النبي ﷺ",
                text: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ.",
                reward: "أدركته شفاعة النبي ﷺ يوم القيامة (تُقرأ عشر مرات).",
                count: 10
            }
        ]
    };

    let activeAdhkarTab = 'morning';

    const tabMorningBtn = document.getElementById('tab-morning');
    const tabEveningBtn = document.getElementById('tab-evening');
    const adhkarCardsList = document.getElementById('adhkar-cards-list');
    const adhkarProgressText = document.getElementById('adhkar-progress-text');
    const adhkarProgressBar = document.getElementById('adhkar-progress-bar');
    const adhkarGlobalReset = document.getElementById('adhkar-global-reset');

    function getAdhkarProgress(id) {
        return parseInt(localStorage.getItem(`nur_islam_adh_prog_${id}`)) || 0;
    }

    function setAdhkarProgress(id, val) {
        localStorage.setItem(`nur_islam_adh_prog_${id}`, val);
    }

    function renderAdhkarList() {
        if (!adhkarCardsList) return;
        adhkarCardsList.innerHTML = "";
        const list = adhkarDatabase[activeAdhkarTab];
        let completedCount = 0;

        list.forEach(adh => {
            const currentProgress = getAdhkarProgress(adh.id);
            const isCompleted = currentProgress >= adh.count;
            if (isCompleted) completedCount++;

            const card = document.createElement('div');
            card.className = `donation-glass-card adhkar-card ${isCompleted ? 'completed-card' : ''}`;
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.justifyContent = "space-between";
            card.style.gap = "1.5rem";
            card.style.padding = "2rem";
            card.style.borderRadius = "var(--border-radius-card)";
            card.style.background = "var(--glass-bg)";
            card.style.border = isCompleted ? "1.5px solid var(--color-success)" : "1px solid var(--glass-border)";
            card.style.transition = "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)";

            card.innerHTML = `
                <div class="adhkar-card-top" style="display:flex; flex-direction:column; gap:0.75rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h4 class="font-title text-gold" style="font-size:1.15rem; font-weight:600;">${adh.title}</h4>
                        <span class="badge" style="font-size:0.75rem; padding:0.25rem 0.65rem; border-radius:100px; background:rgba(212,163,89,0.12); color:var(--color-accent-gold); font-weight:500;">
                            تكرار: ${adh.count} ${adh.count === 1 ? 'مرة' : (adh.count <= 10 ? 'مرات' : 'مرة')}
                        </span>
                    </div>
                    <p class="font-serif" style="font-size:1.2rem; line-height:2.2; color:var(--color-text-white); margin-top:0.75rem; text-align:justify; direction:rtl;">
                        ${adh.text}
                    </p>
                    <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:0.75rem; margin-top:0.5rem;">
                        <span style="font-size:0.8rem; color:rgba(255,255,255,0.45); line-height:1.6; display:block;">
                            <strong>الفضل:</strong> ${adh.reward}
                        </span>
                    </div>
                </div>

                <div class="adhkar-card-bottom" style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; margin-top:auto;">
                    <span style="font-size:0.85rem; color:rgba(255,255,255,0.6);">
                        التقدم: <strong class="text-gold" style="font-size:1.15rem;">${currentProgress}</strong> / ${adh.count}
                    </span>
                    <button class="btn ${isCompleted ? 'btn-secondary' : 'btn-primary'} adh-counter-btn" data-id="${adh.id}" data-max="${adh.count}" style="padding:0.6rem 1.2rem; font-size:0.9rem; border-radius:100px; display:inline-flex; align-items:center; gap:0.5rem; cursor:pointer; min-width:105px; justify-content:center; transition:all 0.25s ease;">
                        ${isCompleted ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" style="display:inline-block; vertical-align:middle;"><polyline points="20 6 9 17 4 12" /></svg> مكتمل` : `اضغط للتكرار`}
                    </button>
                </div>
            `;

            // Setup counter click listener
            const clickBtn = card.querySelector('.adh-counter-btn');
            clickBtn.addEventListener('click', () => {
                let prog = getAdhkarProgress(adh.id);
                if (prog < adh.count) {
                    prog++;
                    setAdhkarProgress(adh.id, prog);
                    playTactileSynthesizer(); // Beautiful sound feedback!

                    if (prog === adh.count) {
                        card.style.transform = "scale(1.02)";
                        setTimeout(() => { card.style.transform = "scale(1)"; }, 200);
                    }

                    renderAdhkarList();
                }
            });

            adhkarCardsList.appendChild(card);
        });

        // Update overall progress bar
        const perc = list.length > 0 ? (completedCount / list.length) * 100 : 0;
        if (adhkarProgressBar) adhkarProgressBar.style.width = `${perc}%`;
        if (adhkarProgressText) {
            adhkarProgressText.innerHTML = `أتممت <span class="text-gold font-bold" style="font-size:1.05rem;">${completedCount}</span> من <span class="text-gold font-bold" style="font-size:1.05rem;">${list.length}</span> أذكار ${activeAdhkarTab === 'morning' ? 'الصباح' : 'المساء'}`;
        }
    }

    function switchAdhkarTab(tabName) {
        activeAdhkarTab = tabName;
        if (activeAdhkarTab === 'morning') {
            tabMorningBtn && tabMorningBtn.classList.add('active');
            tabEveningBtn && tabEveningBtn.classList.remove('active');
        } else {
            tabEveningBtn && tabEveningBtn.classList.add('active');
            tabMorningBtn && tabMorningBtn.classList.remove('active');
        }
        renderAdhkarList();
    }

    if (tabMorningBtn) tabMorningBtn.addEventListener('click', () => switchAdhkarTab('morning'));
    if (tabEveningBtn) tabEveningBtn.addEventListener('click', () => switchAdhkarTab('evening'));

    if (adhkarGlobalReset) {
        adhkarGlobalReset.addEventListener('click', () => {
            const list = adhkarDatabase[activeAdhkarTab];
            list.forEach(adh => setAdhkarProgress(adh.id, 0));
            playTactileSynthesizer();
            renderAdhkarList();
        });
    }

    renderAdhkarList();

    // 12. CONTACT FORM VALIDATOR
    const contactForm = document.getElementById('islamic-contact-form');
    const alertSuccessBox = document.getElementById('contact-success-box');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Fetch values
        const fName = document.getElementById('usr-name');
        const fEmail = document.getElementById('usr-email');
        const fSubject = document.getElementById('usr-subject');
        const fMessage = document.getElementById('usr-message');

        // Reset errors
        const errorMsgs = document.querySelectorAll('.field-error-msg');
        errorMsgs.forEach(msg => msg.style.display = "none");

        let hasError = false;

        if (fName.value.trim() === "") {
            document.getElementById('err-name').style.display = "block";
            hasError = true;
        }

        const emailFilter = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailFilter.test(fEmail.value.trim())) {
            document.getElementById('err-email').style.display = "block";
            hasError = true;
        }

        if (fSubject.value.trim() === "") {
            document.getElementById('err-subject').style.display = "block";
            hasError = true;
        }

        if (fMessage.value.trim() === "") {
            document.getElementById('err-message').style.display = "block";
            hasError = true;
        }

        if (!hasError) {
            // Success alert triggered
            alertSuccessBox.classList.remove('hidden');
            
            // Log local mock DB details
            console.log("Portal Message Logged:", {
                sender: fName.value.trim(),
                email: fEmail.value.trim(),
                subject: fSubject.value.trim(),
                body: fMessage.value.trim(),
                loggedAt: getCurrentTime().toISOString()
            });

            // Wipe fields clean
            contactForm.reset();

            // Auto fadeout positive alert box after some seconds
            setTimeout(() => {
                alertSuccessBox.classList.add('hidden');
            }, 8000);
        }
    });


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

});
