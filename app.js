/* ============================================
   İFTAR SAYACI - Main Application Logic
   ============================================ */

(function () {
    'use strict';

    // ============ Configuration ============
    const API_BASE = 'https://api.aladhan.com/v1/timingsByCity';
    const PRAYER_NAMES = {
        Fajr: 'İmsak',
        Sunrise: 'Güneş',
        Dhuhr: 'Öğle',
        Asr: 'İkindi',
        Maghrib: 'Akşam (İftar)',
        Isha: 'Yatsı'
    };
    const PRAYER_ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    // Turkish city display names
    const CITY_DISPLAY = {
        'Ankara': 'Ankara',
        'Istanbul': 'İstanbul',
        'Izmir': 'İzmir',
        'Bursa': 'Bursa',
        'Antalya': 'Antalya',
        'Adana': 'Adana',
        'Konya': 'Konya',
        'Gaziantep': 'Gaziantep',
        'Diyarbakir': 'Diyarbakır',
        'Kayseri': 'Kayseri',
        'Samsun': 'Samsun',
        'Trabzon': 'Trabzon',
        'Erzurum': 'Erzurum',
        'Malatya': 'Malatya',
        'Eskisehir': 'Eskişehir',
        'Sanliurfa': 'Şanlıurfa',
        'Van': 'Van',
        'Mersin': 'Mersin',
        'Denizli': 'Denizli',
        'Sivas': 'Sivas'
    };

    // ============ State ============
    let prayerTimes = null;
    let currentCity = 'Ankara';
    let countdownInterval = null;
    let clockInterval = null;

    // ============ DOM Elements ============
    const el = {
        citySelect: document.getElementById('citySelect'),
        clockCityLabel: document.getElementById('clockCityLabel'),
        hijriDate: document.getElementById('hijriDate'),
        miladiDate: document.getElementById('mildiDate'),
        countdownLabel: document.getElementById('countdownLabel'),
        targetTimeName: document.getElementById('targetTimeName'),
        targetTimeValue: document.getElementById('targetTimeValue'),
        countHours: document.getElementById('countHours'),
        countMinutes: document.getElementById('countMinutes'),
        countSeconds: document.getElementById('countSeconds'),
        progressBar: document.getElementById('progressBar'),
        progressStart: document.getElementById('progressStart'),
        progressEnd: document.getElementById('progressEnd'),
        ramadanDay: document.getElementById('ramadanDay'),
        ramadanMessage: document.getElementById('ramadanMessage'),
        hourHand: document.getElementById('hourHand'),
        minuteHand: document.getElementById('minuteHand'),
        secondHand: document.getElementById('secondHand'),
        iftarArc: document.getElementById('iftarArc'),
        starsContainer: document.getElementById('starsContainer'),
        prayerTimesGrid: document.getElementById('prayerTimesGrid')
    };

    // ============ Initialization ============
    function init() {
        createStars();
        drawClockMarkers();
        updateAnalogClock();
        startClockInterval();
        updateMiladiDate();
        loadCity();

        el.citySelect.addEventListener('change', onCityChange);
    }

    // ============ Stars Background ============
    function createStars() {
        const container = el.starsContainer;
        const count = 80;
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.setProperty('--duration', (2 + Math.random() * 4) + 's');
            star.style.setProperty('--delay', Math.random() * 5 + 's');
            star.style.width = (1 + Math.random() * 2) + 'px';
            star.style.height = star.style.width;
            container.appendChild(star);
        }
    }

    // ============ Clock Drawing ============
    function drawClockMarkers() {
        const svg = document.getElementById('analogClock');
        const cx = 200, cy = 200, r = 175;

        // Minute markers
        const minuteG = document.getElementById('minuteMarkers');
        for (let i = 0; i < 60; i++) {
            if (i % 5 === 0) continue; // skip hour positions
            const angle = (i * 6 - 90) * Math.PI / 180;
            const x1 = cx + (r - 5) * Math.cos(angle);
            const y1 = cy + (r - 5) * Math.sin(angle);
            const x2 = cx + (r - 12) * Math.cos(angle);
            const y2 = cy + (r - 12) * Math.sin(angle);
            const line = createSVGElement('line', {
                x1, y1, x2, y2,
                stroke: 'rgba(255,255,255,0.15)',
                'stroke-width': 1,
                'stroke-linecap': 'round'
            });
            minuteG.appendChild(line);
        }

        // Hour markers
        const hourG = document.getElementById('hourMarkers');
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30 - 90) * Math.PI / 180;
            const x1 = cx + (r - 5) * Math.cos(angle);
            const y1 = cy + (r - 5) * Math.sin(angle);
            const x2 = cx + (r - 20) * Math.cos(angle);
            const y2 = cy + (r - 20) * Math.sin(angle);
            const line = createSVGElement('line', {
                x1, y1, x2, y2,
                stroke: 'rgba(240, 230, 211, 0.6)',
                'stroke-width': 2.5,
                'stroke-linecap': 'round'
            });
            hourG.appendChild(line);
        }

        // Hour numbers
        const numbersG = document.getElementById('hourNumbers');
        for (let i = 1; i <= 12; i++) {
            const angle = (i * 30 - 90) * Math.PI / 180;
            const x = cx + (r - 40) * Math.cos(angle);
            const y = cy + (r - 40) * Math.sin(angle);
            const text = createSVGElement('text', {
                x, y,
                fill: '#f0e6d3',
                'font-family': 'Inter, sans-serif',
                'font-size': '20',
                'font-weight': '600',
                'text-anchor': 'middle',
                'dominant-baseline': 'central'
            });
            text.textContent = i;
            numbersG.appendChild(text);
        }
    }

    function createSVGElement(tag, attrs) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [key, val] of Object.entries(attrs)) {
            el.setAttribute(key, val);
        }
        return el;
    }

    // ============ Analog Clock Update ============
    function updateAnalogClock() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const ms = now.getMilliseconds();

        // Smooth rotation
        const secAngle = (seconds + ms / 1000) * 6;
        const minAngle = (minutes + seconds / 60) * 6;
        const hrAngle = ((hours % 12) + minutes / 60) * 30;

        el.secondHand.setAttribute('transform', `rotate(${secAngle}, 200, 200)`);
        el.minuteHand.setAttribute('transform', `rotate(${minAngle}, 200, 200)`);
        el.hourHand.setAttribute('transform', `rotate(${hrAngle}, 200, 200)`);
    }

    function startClockInterval() {
        if (clockInterval) clearInterval(clockInterval);
        clockInterval = setInterval(updateAnalogClock, 50);
    }

    // ============ Date Display ============
    function updateMiladiDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        el.miladiDate.textContent = now.toLocaleDateString('tr-TR', options);
    }

    // ============ City Management ============
    function loadCity() {
        const saved = localStorage.getItem('iftar-city');
        if (saved && CITY_DISPLAY[saved]) {
            currentCity = saved;
            el.citySelect.value = saved;
        }
        fetchPrayerTimes();
    }

    function onCityChange() {
        currentCity = el.citySelect.value;
        localStorage.setItem('iftar-city', currentCity);
        fetchPrayerTimes();
    }

    // ============ API Integration ============
    async function fetchPrayerTimes() {
        el.clockCityLabel.textContent = CITY_DISPLAY[currentCity] || currentCity;
        document.title = `İftara Ne Kadar Kaldı? - ${CITY_DISPLAY[currentCity] || currentCity}`;

        // Show loading state
        PRAYER_ORDER.forEach(key => {
            const timeEl = document.getElementById('time' + key);
            if (timeEl) timeEl.textContent = '...';
        });

        try {
            const now = new Date();
            const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
            const url = `${API_BASE}?city=${encodeURIComponent(currentCity)}&country=Turkey&method=13&date=${dateStr}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('API error');

            const data = await response.json();
            if (data.code !== 200) throw new Error('Invalid response');

            prayerTimes = {};
            PRAYER_ORDER.forEach(key => {
                // Remove timezone info like "(+03)" from time strings
                prayerTimes[key] = data.data.timings[key].replace(/\s*\(.*\)/, '');
            });

            // Update Hijri date from API
            if (data.data.date && data.data.date.hijri) {
                const hijri = data.data.date.hijri;
                el.hijriDate.textContent = `${hijri.day} ${hijri.month.en} ${hijri.year}`;
            }

            // Calculate Ramadan day based on Diyanet calendar
            // Diyanet: Ramazan 2026 starts Feb 19, lasts 30 days
            const ramadanStart = new Date(2026, 1, 19); // Feb 19, 2026
            const ramadanEnd = new Date(2026, 2, 21);   // Mar 21, 2026 (30 days later)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const diffFromStart = Math.floor((today - ramadanStart) / (1000 * 60 * 60 * 24));

            if (diffFromStart < 0) {
                // Before Ramadan
                const daysUntil = Math.abs(diffFromStart);
                el.ramadanDay.querySelector('.day-number').textContent = daysUntil;
                el.ramadanDay.querySelector('.day-label').textContent = 'gün kaldı';
                el.ramadanMessage.textContent = `Ramazan-ı Şerif'e ${daysUntil} gün kaldı. Hazırlıklarınızı yapın 🌙`;
            } else if (diffFromStart < 30) {
                // During Ramadan
                const dayNum = diffFromStart + 1;
                el.ramadanDay.querySelector('.day-number').textContent = dayNum;
                el.ramadanDay.querySelector('.day-label').textContent = '. Gün';
                el.ramadanMessage.textContent = getRamadanMessage(dayNum);
            } else {
                // After Ramadan
                el.ramadanDay.querySelector('.day-number').textContent = '🎉';
                el.ramadanDay.querySelector('.day-label').textContent = '';
                el.ramadanMessage.textContent = 'Ramazan-ı Şerif sona erdi. Bayramınız mübarek olsun! 🎉';
            }

            updatePrayerTimesDisplay();
            startCountdown();

        } catch (err) {
            console.error('Prayer times fetch error:', err);
            // Show error state
            PRAYER_ORDER.forEach(key => {
                const timeEl = document.getElementById('time' + key);
                if (timeEl) timeEl.textContent = 'Hata';
            });
        }
    }

    function getRamadanMessage(day) {
        const messages = [
            'Ramazan-ı Şerif\'iniz mübarek olsun 🌙',
            'Hayırlı Ramazanlar, dualarınız kabul olsun 🤲',
            'Bu mübarek ayda tüm dualarınız kabul olsun 🤲',
            'Ramazan bereketi üzerinize olsun 🌙',
            'Sabır ve şükürle dolu bir Ramazan geçirin ✨'
        ];
        return messages[day % messages.length];
    }

    // ============ Display Updates ============
    function updatePrayerTimesDisplay() {
        if (!prayerTimes) return;

        PRAYER_ORDER.forEach(key => {
            const timeEl = document.getElementById('time' + key);
            if (timeEl) {
                timeEl.textContent = prayerTimes[key];
            }
        });

        highlightCurrentPrayer();
    }

    function highlightCurrentPrayer() {
        if (!prayerTimes) return;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const cards = el.prayerTimesGrid.querySelectorAll('.prayer-card');

        let activeIndex = -1;

        // Find which prayer time we're currently in
        for (let i = PRAYER_ORDER.length - 1; i >= 0; i--) {
            const time = prayerTimes[PRAYER_ORDER[i]];
            const [h, m] = time.split(':').map(Number);
            const prayerMinutes = h * 60 + m;
            if (currentMinutes >= prayerMinutes) {
                activeIndex = i;
                break;
            }
        }

        cards.forEach((card, idx) => {
            card.classList.remove('active', 'passed');
            if (idx === activeIndex) {
                card.classList.add('active');
            } else if (idx < activeIndex) {
                card.classList.add('passed');
            }
        });
    }

    // ============ Countdown Logic ============
    function startCountdown() {
        if (countdownInterval) clearInterval(countdownInterval);
        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    }

    function updateCountdown() {
        if (!prayerTimes) return;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

        // Parse prayer times to minutes
        const fajrTime = parseTimeToSeconds(prayerTimes.Fajr);
        const maghribTime = parseTimeToSeconds(prayerTimes.Maghrib);

        let targetLabel, targetName, targetTimeStr, targetSeconds;
        let progressStart, progressEnd, progressStartSeconds, progressEndSeconds;

        if (currentSeconds < fajrTime) {
            // Before Fajr: countdown to Sahur (Fajr)
            targetLabel = 'Sahura Kalan Süre';
            targetName = 'İmsak (Sahur)';
            targetTimeStr = prayerTimes.Fajr;
            targetSeconds = fajrTime;

            // Progress: midnight to fajr
            progressStart = 'Gece Yarısı';
            progressEnd = 'İmsak';
            progressStartSeconds = 0;
            progressEndSeconds = fajrTime;
        } else if (currentSeconds < maghribTime) {
            // After Fajr, before Maghrib: countdown to Iftar
            targetLabel = 'İftara Kalan Süre';
            targetName = 'Akşam (İftar)';
            targetTimeStr = prayerTimes.Maghrib;
            targetSeconds = maghribTime;

            progressStart = 'İmsak';
            progressEnd = 'İftar';
            progressStartSeconds = fajrTime;
            progressEndSeconds = maghribTime;
        } else {
            // After Maghrib: countdown to next day's Sahur
            targetLabel = 'Sahura Kalan Süre';
            targetName = 'İmsak (Sahur)';
            targetTimeStr = prayerTimes.Fajr;

            // Next day Fajr
            targetSeconds = fajrTime + 24 * 3600;

            progressStart = 'İftar';
            progressEnd = 'İmsak';
            progressStartSeconds = maghribTime;
            progressEndSeconds = fajrTime + 24 * 3600;
        }

        // Calculate remaining
        let remaining = targetSeconds - currentSeconds;
        if (remaining < 0) remaining += 24 * 3600;

        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;

        el.countdownLabel.textContent = targetLabel;
        el.targetTimeName.textContent = targetName;
        el.targetTimeValue.textContent = targetTimeStr;
        el.countHours.textContent = String(hours).padStart(2, '0');
        el.countMinutes.textContent = String(minutes).padStart(2, '0');
        el.countSeconds.textContent = String(seconds).padStart(2, '0');

        // Update progress bar
        el.progressStart.textContent = progressStart;
        el.progressEnd.textContent = progressEnd;

        const totalSpan = progressEndSeconds - progressStartSeconds;
        const elapsed = currentSeconds - progressStartSeconds;
        const progress = Math.max(0, Math.min(100, (elapsed / totalSpan) * 100));
        el.progressBar.style.width = progress + '%';

        // Update prayer card highlights
        highlightCurrentPrayer();

        // Update iftar arc on clock
        updateIftarArc();
    }

    function parseTimeToSeconds(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 3600 + m * 60;
    }

    // ============ Iftar Arc on Clock ============
    function updateIftarArc() {
        if (!prayerTimes) return;

        const maghribTime = prayerTimes.Maghrib;
        const [mH, mM] = maghribTime.split(':').map(Number);

        // Convert to clock angle (12-hour)
        const h12 = mH % 12;
        const angle = (h12 + mM / 60) * 30 - 90; // -90 because SVG starts from 3 o'clock

        const cx = 200, cy = 200, r = 185;
        const startAngle = angle - 5;
        const endAngle = angle + 5;

        const startRad = startAngle * Math.PI / 180;
        const endRad = endAngle * Math.PI / 180;

        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);

        const d = `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
        el.iftarArc.setAttribute('d', d);
    }

    // ============ Start ============
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
