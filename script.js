'use strict';

// --- Polyfills (Optional but recommended for older browser compatibility) ---
// Example: Element.closest polyfill
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

// --- Global Variables & Constants ---
const DEFAULT_LANG = 'id'; // Default language
const MIN_LOADER_TIME_MS = 1200;
const FALLBACK_LOADER_TIMEOUT_MS = 20000;
const LIGHTBOX_FADE_DURATION_MS = 500; // Match CSS transition
const NOTIFICATION_FADE_DURATION_MS = 400; // Match CSS transition
const TEMP_MESSAGE_DURATION_MS = 4000;
const TEMP_MESSAGE_FADE_DURATION_MS = 400; // Match CSS transition
const SCROLL_ANIMATION_THRESHOLD = 0.15;
const SERVER_IP = "night.ftp.sh";
const SERVER_PORT = 25565;
const SERVER_QUERY_URL = `https://api.mcsrvstat.us/bedrock/3/${SERVER_IP}:${SERVER_PORT}`;
const REFRESH_INTERVAL_MS = 60000; // 60 seconds

let currentVisibleItems = [];
let currentImageIndex = 0;
let serverStatusIntervalId = null;
let intersectionObserver;
let loaderTimeoutId = null;
let loadStartTime = Date.now();
let currentLang = DEFAULT_LANG; // Track current language

// --- DOM Element Cache ---
// Select elements once and store them
const domElements = {
    html: document.documentElement,
    body: document.body,
    loader: document.getElementById('page-loader'),
    loaderText: document.querySelector('#page-loader .loading-text'),
    particleContainer: document.getElementById('particle-background'),
    languageSwitcher: document.querySelector('.language-switcher'),
    header: document.querySelector('.site-header'), // Example, add more as needed
    main: document.querySelector('main'),
    galleryContainer: document.querySelector('.gallery'),
    noItemsMessage: document.getElementById('no-gallery-items'),
    seasonFilterContainer: document.getElementById('season-filter'),
    lightbox: document.getElementById('lightbox'),
    lightboxImg: document.getElementById('lightbox-img'),
    lightboxCaptionTextSpan: document.getElementById('lightbox-caption-text'),
    lightboxCaptionContainer: document.getElementById('lightbox-caption'),
    lightboxCounter: document.getElementById('lightbox-counter'),
    lightboxNav: document.querySelector('.lightbox-nav'),
    lightboxLoader: document.querySelector('.lightbox .lightbox-loader'), // More specific selector
    lightboxCloseBtn: document.querySelector('.lightbox-close'),
    lightboxPrevBtn: document.querySelector('.lightbox-nav-btn.prev'),
    lightboxNextBtn: document.querySelector('.lightbox-nav-btn.next'),
    music: document.getElementById('background-music'),
    musicToggleBtn: document.getElementById('music-toggle'),
    musicIcon: document.querySelector('#music-toggle i'),
    songNotification: document.getElementById('song-notification'),
    songTitleSpan: document.querySelector('#song-notification .song-title'),
    songIcon: document.querySelector('#song-notification .song-status-icon'),
    tempMessageArea: document.getElementById('temp-message-area'),
    statusIndicatorDot: document.getElementById('live-indicator-dot'),
    statusIndicatorText: document.getElementById('live-indicator-text'),
    playerCountSpan: document.getElementById('player-count'),
    serverIpSpan: document.getElementById('server-ip-display'),
    copyIpBtn: document.getElementById('copy-ip-btn'),
    copyIpText: document.querySelector('#copy-ip-btn .copy-text'),
    copiedIpText: document.querySelector('#copy-ip-btn .copied-text'),
    lastUpdatedContainer: document.getElementById('last-updated'),
    lastUpdatedTimeSpan: document.getElementById('last-updated-time'),
    copyrightYearSpan: document.getElementById('copyright-year'),
    // Add more elements as needed
};

// --- Translation Dictionary ---
const translations = {
    en: {
        pageTitle: "Nightmare Minecraft Gallery | Server Status & Season Memories",
        metaDescription: "Explore the official gallery of the Nightmare Minecraft server. Discover real-time server status, stunning builds, epic moments, and unforgettable memories from every season of our adventure.",
        loadingPage: "Loading page content",
        loadingAnimation: "Minecraft block loading animation",
        loadingText: "Loading Nightmare Gallery & Status...",
        languageSwitcher: "Language Selection",
        subtitle: "Minecraft Server Masterpiece Gallery & Status",
        serverStatusTitle: "Server Status",
        statusChecking: "Checking...",
        statusOnline: "Online",
        statusOffline: "Offline",
        statusError: "Error",
        statusLoading: "Loading...",
        copyIpTitle: "Copy IP & Port",
        copyIpAriaLabel: "Copy Server IP Address",
        copyText: "Copy",
        copiedText: "Copied!",
        playersPrefix: "Players", // Used in JS
        playersLoading: "Players: Loading...",
        serverType: "Bedrock Edition",
        lastUpdatedPrefix: "Last updated:",
        galleryIntroTitle: "Memories From Every Season",
        galleryIntroDesc: "Welcome to the official gallery of the Nightmare Minecraft server! Explore a collection of the best moments, creative builds, and exciting adventures from every season we've journeyed through together. Each image tells a unique story from our blocky world.",
        serverStoryTitle: "Our Server Story",
        serverStoryDesc: "The Nightmare server is home to a dynamic and creative community. Each season brings unique themes, new challenges, and unforgettable stories. This gallery is a digital monument to the dedication, hard work, and friendship forged in our blocky world. We hope this gallery revives fond memories of our adventures.",
        seasonFilterNav: "Season filter navigation",
        filterAllSeasons: "All Seasons",
        filterSeason1: "Season 1",
        filterSeason2: "Season 2", // Example
        noItemsFound: "No items found for this filter.",
        viewImageAria: "View larger image",
        lightboxAriaLabel: "Enlarged Image Viewer",
        closeLightboxTitle: "Close (Esc)",
        closeLightboxAriaLabel: "Close Image Viewer",
        loadingImage: "Loading image...",
        lightboxNavAriaLabel: "Image Navigation",
        prevImageTitle: "Previous (Left Arrow)",
        prevImageAriaLabel: "Previous Image",
        nextImageTitle: "Next (Right Arrow)",
        nextImageAriaLabel: "Next Image",
        socialNavAriaLabel: "Social Media Links",
        joinDiscord: "Join Discord",
        joinWhatsapp: "WhatsApp Group",
        voteServer: "Vote Server",
        footerIntro: "Join our community for the latest updates, interact with other players, and participate in exciting events on the Nightmare server!",
        allRightsReserved: "All rights reserved.",
        notAffiliated: "Not affiliated with Mojang Studios or Microsoft.",
        audioNotSupported: "Your browser does not support the audio element.",
        playPauseMusicTitle: "Play/Pause Background Music",
        playPauseMusicAriaLabel: "Play or Pause Background Music",
        playMusicTitle: "Play Music", // Specific state titles
        pauseMusicTitle: "Pause Music", // Specific state titles
        defaultSongTitle: "Background Music",
        messageCopiedSuccess: "IP address copied successfully!",
        messageCopiedError: "Failed to copy IP. Please copy manually.",
        messageFetchError: "Failed to check server status: ", // Append error message
        messageImageLoadError: "Failed to load image.",
        messageGalleryLoadError: "Failed to open image. Data missing.",
        messageAudioError: "Failed to load music file.",
        messageAudioPlayError: "Failed to start music.",
        messageGenericError: "An error occurred while loading. Some features may not work.",
        // Gallery Captions / Alts / Aria Labels (using keys from HTML)
        galleryCaptionS1_1: "Main Community Build Season 1",
        galleryAltS1_1: "Main Community Build - Season 1",
        galleryAriaS1_1: "Open image: Main Community Build Season 1",
        galleryCaptionS1_2: "Epic Scenery in Season 1",
        galleryAltS1_2: "Epic Scenery - Season 1",
        galleryAriaS1_2: "Open image: Epic Scenery in Season 1",
        // Lightbox specifics
        lightboxCounterFormat: "{index} / {total}", // Dynamic format
        lightboxImageAltFormat: "Enlarged Image {index}: {caption}", // Dynamic format
        lightboxImageAltError: "Image could not be loaded.",
        lightboxCaptionError: "Failed to load image.",
    },
    id: {
        pageTitle: "Nightmare Minecraft Gallery | Status & Kenangan Setiap Season",
        metaDescription: "Jelajahi galeri resmi server Minecraft Nightmare. Temukan status server real-time, kumpulan bangunan menakjubkan, momen epik, dan kenangan tak terlupakan dari setiap season petualangan kami.",
        loadingPage: "Memuat konten halaman",
        loadingAnimation: "Animasi loading blok Minecraft",
        loadingText: "Memuat Galeri & Status Nightmare...",
        languageSwitcher: "Pilihan Bahasa",
        subtitle: "Galeri Kenangan & Status Server Minecraft",
        serverStatusTitle: "Status Server",
        statusChecking: "Memeriksa...",
        statusOnline: "Online",
        statusOffline: "Offline",
        statusError: "Error",
        statusLoading: "Memuat...",
        copyIpTitle: "Salin IP & Port",
        copyIpAriaLabel: "Salin Alamat IP Server",
        copyText: "Salin",
        copiedText: "Tersalin!",
        playersPrefix: "Pemain",
        playersLoading: "Pemain: Memuat...",
        serverType: "Bedrock Edition",
        lastUpdatedPrefix: "Terakhir diperbarui:",
        galleryIntroTitle: "Kenangan Setiap Season",
        galleryIntroDesc: "Selamat datang di galeri resmi server Minecraft Nightmare! Jelajahi kumpulan momen terbaik, bangunan kreatif, dan petualangan seru dari setiap season yang telah kami lalui bersama. Setiap gambar menceritakan kisah unik dari server kami.",
        serverStoryTitle: "Cerita Server Kami",
        serverStoryDesc: "Server Nightmare adalah rumah bagi komunitas yang dinamis dan kreatif. Setiap season membawa tema unik, tantangan baru, dan cerita tak terlupakan. Galeri ini adalah monumen digital untuk dedikasi, kerja keras, dan persahabatan yang terjalin di server kami. Kami berharap galeri ini dapat menghidupkan kembali kenangan indah dari petualangan kita.",
        seasonFilterNav: "Navigasi filter season",
        filterAllSeasons: "Semua Season",
        filterSeason1: "Season 1",
        filterSeason2: "Season 2", // Contoh
        noItemsFound: "Tidak ada item ditemukan untuk filter ini.",
        viewImageAria: "Lihat gambar lebih besar",
        lightboxAriaLabel: "Tampilan Gambar Diperbesar",
        closeLightboxTitle: "Tutup (Esc)",
        closeLightboxAriaLabel: "Tutup Tampilan Gambar",
        loadingImage: "Memuat gambar...",
        lightboxNavAriaLabel: "Navigasi Gambar",
        prevImageTitle: "Sebelumnya (Panah Kiri)",
        prevImageAriaLabel: "Gambar Sebelumnya",
        nextImageTitle: "Berikutnya (Panah Kanan)",
        nextImageAriaLabel: "Gambar Berikutnya",
        socialNavAriaLabel: "Tautan Media Sosial",
        joinDiscord: "Gabung Discord",
        joinWhatsapp: "Grup WhatsApp",
        voteServer: "Vote Server",
        footerIntro: "Bergabunglah dengan komunitas kami untuk mendapatkan pembaruan terbaru, berinteraksi dengan pemain lain, dan ikut serta dalam event-event seru di server Nightmare!",
        allRightsReserved: "Semua hak cipta dilindungi.",
        notAffiliated: "Tidak berafiliasi dengan Mojang Studios atau Microsoft.",
        audioNotSupported: "Browser Anda tidak mendukung elemen audio.",
        playPauseMusicTitle: "Putar/Hentikan Musik Latar",
        playPauseMusicAriaLabel: "Putar atau Hentikan Musik Latar",
        playMusicTitle: "Putar Musik",
        pauseMusicTitle: "Hentikan Musik",
        defaultSongTitle: "Musik Latar",
        messageCopiedSuccess: "Alamat IP berhasil disalin!",
        messageCopiedError: "Gagal menyalin IP. Salin manual.",
        messageFetchError: "Gagal memeriksa status server: ",
        messageImageLoadError: "Gagal memuat gambar.",
        messageGalleryLoadError: "Gagal membuka gambar. Data tidak lengkap.",
        messageAudioError: "Gagal memuat file musik.",
        messageAudioPlayError: "Gagal memulai musik.",
        messageGenericError: "Terjadi kesalahan saat memuat. Beberapa fitur mungkin tidak berfungsi.",
        // Gallery Captions / Alts / Aria Labels
        galleryCaptionS1_1: "Bangunan Komunitas Utama Season 1",
        galleryAltS1_1: "Bangunan Komunitas Utama - Season 1",
        galleryAriaS1_1: "Buka gambar: Bangunan Komunitas Utama Season 1",
        galleryCaptionS1_2: "Pemandangan Epik di Season 1",
        galleryAltS1_2: "Pemandangan Epik - Season 1",
        galleryAriaS1_2: "Buka gambar: Pemandangan Epik di Season 1",
        // Lightbox specifics
        lightboxCounterFormat: "{index} / {total}",
        lightboxImageAltFormat: "Gambar Diperbesar {index}: {caption}",
        lightboxImageAltError: "Gambar tidak dapat dimuat.",
        lightboxCaptionError: "Gagal memuat gambar.",
    }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded: Initializing application...");
    loadStartTime = Date.now();

    if (domElements.loader) {
        domElements.loader.classList.add('active');
        console.log("Loader found and activated.");
        loaderTimeoutId = setTimeout(() => {
            console.warn(`Loader fallback timeout (${FALLBACK_LOADER_TIMEOUT_MS}ms) triggered.`);
            hideLoader();
        }, FALLBACK_LOADER_TIMEOUT_MS);
    } else {
        console.error("CRITICAL: Loader element (#page-loader) not found!");
        domElements.body.style.overflow = ''; // Ensure scrolling is enabled
    }

    try {
        initLanguageSwitcher(); // Initialize language first
        initParticles();
        initSeasonFilter();
        initGalleryItemListeners();
        updateCopyrightYear();
        initLightboxControls();
        initMusicToggle();
        initCopyIpButton();
        initScrollAnimations();
        initServerStatus();
        initSmoothScroll(); // Initialize smooth scroll last

        updateVisibleItems(); // Initial update for gallery items

    } catch (error) {
        console.error("Initialization Error:", error);
        hideLoader(); // Ensure loader is hidden on error
        // Use default language for the error message as language init might have failed
        const errorMsg = translations[DEFAULT_LANG]?.messageGenericError || "An error occurred during initialization.";
        showTemporaryMessage(errorMsg, "error", 7000);
    }
});

window.addEventListener('load', () => {
    console.log("window.load: All resources loaded.");

    if (loaderTimeoutId) {
        clearTimeout(loaderTimeoutId);
        loaderTimeoutId = null;
        console.log("Loader fallback timeout cancelled.");
    }

    const elapsedTime = Date.now() - loadStartTime;
    const remainingTime = Math.max(0, MIN_LOADER_TIME_MS - elapsedTime);
    console.log(`Load time: ${elapsedTime}ms. Additional loader wait: ${remainingTime}ms.`);

    setTimeout(() => {
        hideLoader();
        checkInitialVisibility(); // Check elements visible after load
    }, remainingTime);
});

// --- Loader Control ---
function hideLoader() {
    if (domElements.loader && domElements.loader.classList.contains('active')) {
        console.log("Hiding loader...");
        domElements.loader.classList.remove('active');
        domElements.loader.setAttribute('aria-busy', 'false');
        domElements.loader.setAttribute('aria-hidden', 'true');

        const handleTransitionEnd = (e) => {
            if (e.propertyName === 'opacity' && domElements.loader && domElements.loader.parentNode) {
                clearTimeout(removeLoaderTimeout);
                domElements.loader.parentNode.removeChild(domElements.loader);
                domElements.loader = null; // Clear reference
                console.log("Loader removed from DOM via transitionend.");
                domElements.body.style.overflow = '';
            }
        };

        const removeLoaderTimeout = setTimeout(() => {
            if (domElements.loader && domElements.loader.parentNode) {
                domElements.loader.parentNode.removeChild(domElements.loader);
                domElements.loader = null; // Clear reference
                console.log("Loader removed from DOM via fallback timeout.");
            }
             domElements.body.style.overflow = '';
        }, LIGHTBOX_FADE_DURATION_MS + 100); // Use a known fade duration constant

        domElements.loader.addEventListener('transitionend', handleTransitionEnd, { once: true });

    } else {
        console.log("hideLoader called, but loader not found or already inactive.");
        domElements.body.style.overflow = ''; // Ensure scroll is enabled
    }
}

// --- Language & Translation ---
function getTranslation(key, lang = currentLang, replacements = {}) {
    const langDict = translations[lang] || translations[DEFAULT_LANG];
    let text = langDict[key] || translations[DEFAULT_LANG][key] || key; // Fallback chain

    // Replace placeholders like {index}, {total}, {caption}
    for (const placeholder in replacements) {
        text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    return text;
}

function setLanguage(lang) {
    if (!translations[lang]) {
        console.warn(`Language "${lang}" not found, using default "${DEFAULT_LANG}".`);
        lang = DEFAULT_LANG;
    }
    currentLang = lang;
    console.log(`Setting language to: ${currentLang}`);

    // Update html lang attribute
    domElements.html.lang = currentLang;

    // Update elements with data-lang-key
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        // Handle specific elements like title, meta, input placeholders differently if needed
        if (el.tagName === 'TITLE') {
            document.title = getTranslation(key);
        } else if (el.tagName === 'META' && el.name === 'description') {
            el.content = getTranslation(key);
        } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
             if (el.placeholder) el.placeholder = getTranslation(key);
        } else {
            el.textContent = getTranslation(key);
        }
    });

    // Update element attributes (alt, title, aria-label, OpenGraph, Twitter)
    const attributePrefixes = ['alt', 'title', 'aria-label', 'og', 'tw'];
    attributePrefixes.forEach(prefix => {
        document.querySelectorAll(`[data-lang-${prefix}-key]`).forEach(el => {
            const key = el.dataset[`lang${prefix.charAt(0).toUpperCase() + prefix.slice(1)}Key`]; // e.g., langAltKey
            let attributeName = prefix.startsWith('og') || prefix.startsWith('tw') ? prefix : prefix.replace('-', '_'); // Use og:title, not og_title

            // Handle ARIA specially
            if (prefix === 'aria-label') attributeName = 'aria-label';

            // Handle OG/Twitter meta tags
            if(prefix.startsWith('og') || prefix.startsWith('tw')) {
                const metaProp = prefix.includes(':') ? prefix : (prefix.startsWith('og') ? `og:${key}` : `twitter:${key}`);
                el.setAttribute('property', metaProp);
                el.setAttribute('content', getTranslation(key));
            }
             // Handle regular attributes
            else if (el[attributeName] !== undefined) { // Check if property exists
                 el[attributeName] = getTranslation(key);
             } else { // Fallback to setAttribute
                 el.setAttribute(attributeName, getTranslation(key));
             }
        });
    });


    // Update language switcher buttons state
    if (domElements.languageSwitcher) {
        domElements.languageSwitcher.querySelectorAll('.lang-btn').forEach(btn => {
            const isActive = btn.dataset.lang === currentLang;
            btn.classList.toggle('active', isActive); // Assuming 'active' class styles the selected button
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    // Save preference
    try {
        localStorage.setItem('preferredLang', currentLang);
    } catch (e) {
        console.warn("Could not save language preference to localStorage:", e);
    }

    // Refresh dynamic content that needs translation
    updateDynamicTranslations();
}

function updateDynamicTranslations() {
    // Update any elements whose text is set dynamically and needs re-translation
    console.log("Updating dynamic translations...");
    // Example: Server status needs update after language change
    if (domElements.statusIndicatorDot && domElements.statusIndicatorText.dataset.statusKey) {
        const statusKey = domElements.statusIndicatorText.dataset.statusKey; // Assuming we store the key
        const currentStatusText = getTranslation(statusKey);
        domElements.statusIndicatorText.textContent = currentStatusText;
        domElements.statusIndicatorDot.setAttribute('aria-label', `${getTranslation('serverStatusTitle')}: ${currentStatusText}`);
    }
    // Example: Update player count text format (might need restructuring fetchServerStatus)
    // Example: Update "Last Updated" prefix
     if(domElements.lastUpdatedContainer) {
         const prefixElement = domElements.lastUpdatedContainer.querySelector('[data-lang-key="lastUpdatedPrefix"]');
         if(prefixElement) prefixElement.textContent = getTranslation('lastUpdatedPrefix');
     }
    // Update music toggle titles/aria-labels based on current state
    updateMusicUI(false); // Don't show notification on lang change
    // Update lightbox captions/counters if open (more complex, might need reopening or dedicated update function)
    if (domElements.lightbox && domElements.lightbox.classList.contains('active')) {
        updateLightboxUIDynamic(); // Update caption, counter etc. if lightbox is open
    }
}


function initLanguageSwitcher() {
    if (!domElements.languageSwitcher) {
        console.warn("Language switcher element not found.");
        setLanguage(DEFAULT_LANG); // Set default language anyway
        return;
    }

    // Determine initial language
    let preferredLang = DEFAULT_LANG;
    try {
        preferredLang = localStorage.getItem('preferredLang') || navigator.language.split('-')[0] || DEFAULT_LANG;
    } catch (e) {
        console.warn("Could not access localStorage or navigator.language:", e);
    }
    // Ensure the preferred language is supported
    if (!translations[preferredLang]) {
        preferredLang = DEFAULT_LANG;
    }

    setLanguage(preferredLang);

    // Add event listener using delegation
    domElements.languageSwitcher.addEventListener('click', (event) => {
        const button = event.target.closest('.lang-btn');
        if (button && button.dataset.lang !== currentLang) {
            setLanguage(button.dataset.lang);
        }
    });
    console.log("Language switcher initialized.");
}


// --- Server Status ---
function initServerStatus() {
    if (!domElements.statusIndicatorDot || !domElements.statusIndicatorText || !domElements.playerCountSpan || !domElements.lastUpdatedContainer || !domElements.serverIpSpan) {
        console.warn("Server status elements incomplete. Status updates disabled.");
        return;
    }
    fetchServerStatus(); // Initial fetch
    if (serverStatusIntervalId) clearInterval(serverStatusIntervalId); // Clear previous interval
    serverStatusIntervalId = setInterval(fetchServerStatus, REFRESH_INTERVAL_MS);
    console.log("Server status initialized and polling started.");
}

async function fetchServerStatus() {
    console.log("Fetching server status...");
    setStatusVisuals('loading', getTranslation('statusLoading')); // Use translated string
    domElements.playerCountSpan.textContent = getTranslation('playersLoading'); // Use translated string
    domElements.statusIndicatorDot.classList.add('pulsing');
    if(domElements.serverIpSpan) domElements.serverIpSpan.textContent = `${SERVER_IP}:${SERVER_PORT}`; // Ensure IP is visible
    if(domElements.lastUpdatedTimeSpan) domElements.lastUpdatedTimeSpan.textContent = '-'; // Reset time display

    try {
        const response = await fetch(SERVER_QUERY_URL, { cache: "no-store", signal: AbortSignal.timeout(10000) }); // Use AbortSignal for timeout

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Server Status API Response:", data);
        domElements.statusIndicatorDot.classList.remove('pulsing'); // Stop loading pulse

        if (data.online) {
            setStatusVisuals('online', getTranslation('statusOnline'));
            const playersOnline = data.players?.online ?? 'N/A';
            const playersMax = data.players?.max ?? 'N/A';
            domElements.playerCountSpan.textContent = `${getTranslation('playersPrefix')}: ${playersOnline} / ${playersMax}`;
            domElements.statusIndicatorDot.classList.add('pulsing'); // Add online pulse
        } else {
            setStatusVisuals('offline', getTranslation('statusOffline'));
            domElements.playerCountSpan.textContent = `${getTranslation('playersPrefix')}: ${getTranslation('statusOffline')}`;
        }

        if (domElements.lastUpdatedTimeSpan) {
             domElements.lastUpdatedTimeSpan.textContent = new Date().toLocaleTimeString(currentLang === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }

    } catch (error) {
        console.error("Server Status Fetch Error:", error);
        setStatusVisuals('error', getTranslation('statusError'));
        domElements.playerCountSpan.textContent = `${getTranslation('playersPrefix')}: ${getTranslation('statusError')}`;
        domElements.statusIndicatorDot.classList.remove('pulsing');
        if (domElements.lastUpdatedTimeSpan) {
            domElements.lastUpdatedTimeSpan.textContent = new Date().toLocaleTimeString(currentLang === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' });
        }
        // Provide translated error message
        showTemporaryMessage(`${getTranslation('messageFetchError')}${error.message}`, "error", 7000);
    }
}

function setStatusVisuals(statusType, statusText) {
    if (!domElements.statusIndicatorDot || !domElements.statusIndicatorText) return;

    const states = ['online', 'offline', 'error', 'loading'];
    const statusKey = `status${statusType.charAt(0).toUpperCase() + statusType.slice(1)}`; // e.g., statusOnline

    domElements.statusIndicatorDot.classList.remove(...states);
    domElements.statusIndicatorText.classList.remove(...states);
    domElements.statusIndicatorDot.classList.add(statusType);
    domElements.statusIndicatorText.classList.add(statusType);

    domElements.statusIndicatorText.textContent = statusText;
    domElements.statusIndicatorText.dataset.statusKey = statusKey; // Store the key for re-translation

    // Update ARIA status
    const ariaLabelText = `${getTranslation('serverStatusTitle')}: ${statusText}`;
    domElements.statusIndicatorDot.setAttribute('aria-label', ariaLabelText);
}

// --- Copy IP Button ---
function initCopyIpButton() {
    if (!domElements.copyIpBtn || !domElements.serverIpSpan || !domElements.copyIpText || !domElements.copiedIpText) {
        console.warn("Copy IP button elements incomplete. Feature disabled.");
        return;
    }
    console.log("Initializing Copy IP button.");

    // Set initial text based on language
    domElements.copyIpText.textContent = getTranslation('copyText');
    domElements.copiedIpText.textContent = getTranslation('copiedText');

    domElements.copyIpBtn.addEventListener('click', () => {
        const ipAddress = `${SERVER_IP}:${SERVER_PORT}`;
        navigator.clipboard.writeText(ipAddress).then(() => {
            console.log(`IP copied: ${ipAddress}`);
            domElements.copyIpBtn.classList.add('copied');
            domElements.copyIpBtn.setAttribute('aria-label', getTranslation('copiedText')); // Update ARIA label

            if (navigator.vibrate) navigator.vibrate(100);

            setTimeout(() => {
                domElements.copyIpBtn.classList.remove('copied');
                domElements.copyIpBtn.setAttribute('aria-label', getTranslation('copyIpAriaLabel')); // Restore ARIA label
            }, 2000); // Match CSS animation

            showTemporaryMessage(getTranslation('messageCopiedSuccess'), "success", 3000);

        }).catch(err => {
            console.error('Clipboard Error:', err);
            showTemporaryMessage(getTranslation('messageCopiedError'), 'error', 5000);
        });
    });
}


// --- Gallery & Filter ---
function initSeasonFilter() {
    if (!domElements.seasonFilterContainer || !domElements.galleryContainer) {
        console.warn("Season filter or gallery container not found. Filtering disabled.");
        return;
    }
    const allGalleryItems = domElements.galleryContainer.querySelectorAll('.gallery-item');
    if (!allGalleryItems.length) {
        console.warn("No gallery items found for filtering.");
        // return; // Allow initialization even if gallery is empty initially
    }
    console.log("Initializing season filter.");

    domElements.seasonFilterContainer.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('.season-btn');
        if (clickedButton && !clickedButton.classList.contains('active')) {
            console.log(`Filter clicked: ${clickedButton.dataset.season}`);

            domElements.seasonFilterContainer.querySelector('.season-btn.active')?.classList.remove('active');
             clickedButton.classList.add('active');
             domElements.seasonFilterContainer.querySelectorAll('.season-btn').forEach(btn => btn.setAttribute('aria-pressed', 'false'));
             clickedButton.setAttribute('aria-pressed', 'true');


            const season = clickedButton.dataset.season;
            let hasVisibleItems = false;

            allGalleryItems.forEach(item => {
                const itemSeason = item.dataset.season;
                const shouldShow = (season === 'all' || itemSeason === season);
                item.style.display = shouldShow ? '' : 'none';
                item.setAttribute('aria-hidden', !shouldShow); // Hide from screen readers
                if (shouldShow) hasVisibleItems = true;
            });

            // Show/hide "no items" message
            if (domElements.noItemsMessage) {
                domElements.noItemsMessage.style.display = hasVisibleItems ? 'none' : '';
                 domElements.noItemsMessage.setAttribute('aria-hidden', hasVisibleItems);
            }


            updateVisibleItems(); // Update the list of currently visible items

            // Scroll to gallery section if needed
             const galleryRect = domElements.galleryContainer.getBoundingClientRect();
             if (galleryRect.top < -50 || galleryRect.bottom > window.innerHeight + 50) {
                 domElements.galleryContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
}

function initGalleryItemListeners() {
    if (!domElements.galleryContainer) {
        console.warn("Gallery container not found. Listeners disabled.");
        return;
    }
    console.log("Initializing gallery item listeners.");

    domElements.galleryContainer.addEventListener('click', (event) => {
        const galleryItem = event.target.closest('.gallery-item');
        if (galleryItem && getComputedStyle(galleryItem).display !== 'none') {
            const isInteractiveElementClick = event.target.closest('a, button:not(.view-btn)');

            if (!isInteractiveElementClick) {
                 event.preventDefault();
                 const imageSrc = galleryItem.dataset.src;
                 const captionKey = galleryItem.dataset.captionKey; // Get the key

                 updateVisibleItems(); // Ensure list is up-to-date

                 currentImageIndex = currentVisibleItems.findIndex(visibleItem => visibleItem === galleryItem);

                 if (imageSrc && captionKey && currentImageIndex !== -1) {
                     console.log(`Opening lightbox for item index ${currentImageIndex}, caption key: ${captionKey}`);
                     openLightbox(imageSrc, captionKey); // Pass the key
                 } else {
                     console.error("Gallery item data error:", { galleryItem, imageSrc, captionKey, currentImageIndex });
                     showTemporaryMessage(getTranslation('messageGalleryLoadError'), "error");
                 }
            }
        }
    });
}

function updateVisibleItems() {
    currentVisibleItems = Array.from(domElements.galleryContainer?.querySelectorAll('.gallery-item') || [])
        .filter(item => getComputedStyle(item).display !== 'none');
    console.log(`Visible gallery items updated: ${currentVisibleItems.length}`);

    if (domElements.lightboxNav) {
        const shouldShowNav = currentVisibleItems.length > 1;
        domElements.lightboxNav.classList.toggle('visible', shouldShowNav);
        domElements.lightboxNav.setAttribute('aria-hidden', !shouldShowNav);
    }
}

// --- Lightbox ---
function openLightbox(imageSrc, captionKey) {
    // Check required elements exist
    if (!domElements.lightbox || !domElements.lightboxImg || !domElements.lightboxCaptionTextSpan || !domElements.lightboxCaptionContainer || !domElements.lightboxCounter || !domElements.lightboxLoader) {
        console.error("Lightbox elements missing. Cannot open.");
        showTemporaryMessage(getTranslation('messageGenericError'), "error");
        return;
    }
    console.log("Opening lightbox.");

    const isAlreadyOpen = domElements.lightbox.classList.contains('active');
    const captionText = getTranslation(captionKey); // Translate the caption

    domElements.lightbox.setAttribute('aria-hidden', 'false');

    // Set Content Function (Handles loading state and content update)
    const setLightboxContent = () => {
        console.log(`Setting lightbox content: ${imageSrc}, Caption: "${captionText}"`);
        domElements.lightboxImg.style.opacity = '0';
        domElements.lightboxImg.src = ''; // Clear src first
        domElements.lightboxImg.classList.add('loading');
        domElements.lightboxLoader.style.opacity = '1';

        // Delay setting src slightly for UI update
        setTimeout(() => {
            domElements.lightboxImg.src = imageSrc;
            // Use translated alt text format
            domElements.lightboxImg.alt = getTranslation('lightboxImageAltFormat', currentLang, { index: currentImageIndex + 1, caption: captionText });

            // Update caption
            domElements.lightboxCaptionTextSpan.textContent = captionText;
            const hasCaption = !!captionText;
            domElements.lightboxCaptionContainer.classList.toggle('visible', hasCaption);
            domElements.lightboxCaptionContainer.setAttribute('aria-hidden', !hasCaption);

            // Update counter
            updateLightboxCounter();

            // Image load/error handlers
            domElements.lightboxImg.onload = () => {
                console.log("Lightbox image loaded successfully.");
                domElements.lightboxImg.style.opacity = '1';
                domElements.lightboxImg.classList.remove('loading');
                domElements.lightboxLoader.style.opacity = '0';
                domElements.lightboxImg.onerror = null; // Clear error handler
            };
            domElements.lightboxImg.onerror = () => {
                console.error(`Lightbox image load error: ${imageSrc}`);
                domElements.lightboxImg.style.opacity = '1'; // Show container even on error
                domElements.lightboxImg.classList.remove('loading');
                domElements.lightboxLoader.style.opacity = '0';
                domElements.lightboxCaptionTextSpan.textContent = getTranslation('lightboxCaptionError'); // Show error in caption
                domElements.lightboxCaptionContainer.classList.add('visible');
                domElements.lightboxCaptionContainer.setAttribute('aria-hidden', 'false');
                domElements.lightboxImg.alt = getTranslation('lightboxImageAltError'); // Update alt
                showTemporaryMessage(getTranslation('messageImageLoadError'), "error");
                domElements.lightboxImg.onload = null; // Clear load handler
            };
        }, 50); // 50ms delay
    };


    // Show lightbox overlay if not already open
    if (!isAlreadyOpen) {
        domElements.lightbox.classList.add('active');
        domElements.body.style.overflow = 'hidden';
        console.log("Lightbox activated.");
        // Add focus trapping logic here if needed
    }

    // Set/Update content
    setLightboxContent();
}

function updateLightboxCounter() {
     if (!domElements.lightboxCounter) return;
     const showCounter = currentVisibleItems.length > 1;
     domElements.lightboxCounter.textContent = showCounter
        ? getTranslation('lightboxCounterFormat', currentLang, { index: currentImageIndex + 1, total: currentVisibleItems.length })
        : '';
    domElements.lightboxCounter.classList.toggle('visible', showCounter);
    domElements.lightboxCounter.setAttribute('aria-hidden', !showCounter);
}

function updateLightboxUIDynamic() {
    // Called when language changes while lightbox is open
    if (!domElements.lightbox || !domElements.lightbox.classList.contains('active')) return;

    console.log("Updating dynamic Lightbox UI for language change.");
    const currentItem = currentVisibleItems[currentImageIndex];
    if (currentItem) {
        const captionKey = currentItem.dataset.captionKey;
        const captionText = getTranslation(captionKey);

        // Update Caption Text
        if (domElements.lightboxCaptionTextSpan) {
            domElements.lightboxCaptionTextSpan.textContent = captionText;
        }
        // Update Image Alt Text
        if (domElements.lightboxImg) {
             // Check if image loaded correctly or had an error
             if (domElements.lightboxImg.alt === getTranslation('lightboxImageAltError', 'en') || domElements.lightboxImg.alt === getTranslation('lightboxImageAltError', 'id')) {
                 domElements.lightboxImg.alt = getTranslation('lightboxImageAltError'); // Keep error alt text translated
             } else {
                 domElements.lightboxImg.alt = getTranslation('lightboxImageAltFormat', currentLang, { index: currentImageIndex + 1, caption: captionText });
             }
        }
        // Update Counter Text
        updateLightboxCounter();
    }
     // Update static titles/aria-labels (these should already be handled by setLanguage, but double-check)
     if(domElements.lightboxCloseBtn) domElements.lightboxCloseBtn.title = getTranslation('closeLightboxTitle');
     // etc. for nav buttons
}


function closeLightbox(event) {
    if (!domElements.lightbox || !domElements.lightbox.classList.contains('active')) {
        return;
    }

    const clickedElement = event?.target;
    const isCloseButton = clickedElement?.closest('.lightbox-close');
    const isOverlayClick = clickedElement === domElements.lightbox;
    const isEscapeKey = event?.key === 'Escape';

    if (isOverlayClick || isCloseButton || isEscapeKey) {
        console.log("Closing lightbox...");
        domElements.lightbox.classList.remove('active');
        domElements.lightbox.setAttribute('aria-hidden', 'true');

        // Restore scroll using transitionend with fallback
        const restoreScrollTimeout = setTimeout(() => {
            if (!domElements.lightbox?.classList.contains('active')) {
                domElements.body.style.overflow = '';
                console.log("Body scroll restored via fallback timeout.");
            }
        }, LIGHTBOX_FADE_DURATION_MS + 100);

        domElements.lightbox.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'opacity' && !domElements.lightbox?.classList.contains('active')) {
                clearTimeout(restoreScrollTimeout);
                domElements.body.style.overflow = '';
                console.log("Body scroll restored via transitionend.");
            }
        }, { once: true });

        // Optional: Clear content after fade out
        // setTimeout(() => { ... clear src, alt, caption ... }, LIGHTBOX_FADE_DURATION_MS + 50);
    }
}

function navigateLightbox(direction, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation(); // Prevent potential bubbling issues
    }

    if (!currentVisibleItems || currentVisibleItems.length <= 1) return;

    let nextIndex = (currentImageIndex + direction + currentVisibleItems.length) % currentVisibleItems.length; // Simplified wrap-around

    if (nextIndex !== currentImageIndex) {
        currentImageIndex = nextIndex;
        const nextItem = currentVisibleItems[currentImageIndex];
        if (nextItem) {
            const imageSrc = nextItem.dataset.src;
            const captionKey = nextItem.dataset.captionKey;
            console.log(`Navigating lightbox to index ${currentImageIndex}, caption key: ${captionKey}`);
            openLightbox(imageSrc, captionKey); // Reuse openLightbox to load
        } else {
            console.error(`Lightbox navigation error: Item at index ${currentImageIndex} not found.`);
            showTemporaryMessage(getTranslation('messageGenericError'), "error");
            // Optionally close or reset index
        }
    }
}

function initLightboxControls() {
    if (!domElements.lightbox) {
        console.warn("Lightbox element not found. Controls disabled.");
        return;
    }
    console.log("Initializing lightbox controls.");

    // Use stored elements
    domElements.lightbox.addEventListener('click', closeLightbox);
    if (domElements.lightboxPrevBtn) domElements.lightboxPrevBtn.addEventListener('click', (e) => navigateLightbox(-1, e));
    if (domElements.lightboxNextBtn) domElements.lightboxNextBtn.addEventListener('click', (e) => navigateLightbox(1, e));

    document.addEventListener('keydown', (event) => {
        if (domElements.lightbox?.classList.contains('active')) {
            switch (event.key) {
                case 'Escape': closeLightbox(event); break;
                case 'ArrowLeft': navigateLightbox(-1, event); break;
                case 'ArrowRight': navigateLightbox(1, event); break;
            }
        }
    });
}

// --- Music Player ---
function initMusicToggle() {
    if (!domElements.music || !domElements.musicToggleBtn || !domElements.musicIcon || !domElements.songNotification || !domElements.songTitleSpan || !domElements.songIcon) {
        console.warn("Music player elements incomplete. Feature disabled.");
        return;
    }
    console.log("Initializing music player.");

    domElements.music.volume = 0.35;
    let userInteracted = false;

    const playMusicAfterInteraction = () => {
        if (!userInteracted) {
            userInteracted = true;
            document.removeEventListener('click', playMusicAfterInteraction, { capture: true }); // Use capture to catch earlier
            document.removeEventListener('touchstart', playMusicAfterInteraction, { capture: true });
            console.log("User interaction detected. Attempting music playback...");
            domElements.music.play().then(() => {
                console.log("Music playback started successfully after interaction.");
                updateMusicUI(true);
            }).catch(error => {
                console.warn("Music playback blocked or failed post-interaction:", error);
                updateMusicUI(false); // Update UI to reflect paused state
            });
        }
    };
     // Use capture phase for interaction listeners to potentially catch interaction sooner
    document.addEventListener('click', playMusicAfterInteraction, { passive: true, capture: true });
    document.addEventListener('touchstart', playMusicAfterInteraction, { passive: true, capture: true });


    domElements.musicToggleBtn.addEventListener('click', () => {
        if (!userInteracted) { // Ensure interaction flag is set if this is the first interaction
            userInteracted = true;
            document.removeEventListener('click', playMusicAfterInteraction, { capture: true });
            document.removeEventListener('touchstart', playMusicAfterInteraction, { capture: true });
        }

        if (domElements.music.paused || domElements.music.ended) {
            domElements.music.play().catch(error => {
                console.error("Error playing music via toggle:", error);
                 if (error.name !== 'NotAllowedError') { // Don't bother user for autoplay blocks
                     showTemporaryMessage(getTranslation('messageAudioPlayError'), 'error');
                 }
                updateMusicUI(false); // Ensure UI reflects paused state on error
            });
        } else {
            domElements.music.pause();
        }
    });

    // Audio element event listeners
    domElements.music.addEventListener('play', () => updateMusicUI(true));
    domElements.music.addEventListener('pause', () => updateMusicUI(false));
    domElements.music.addEventListener('ended', () => updateMusicUI(false)); // Update UI when loop restarts or ends naturally
    domElements.music.addEventListener('error', (e) => {
        console.error("Audio Element Error:", e);
        showTemporaryMessage(getTranslation('messageAudioError'), 'error');
        updateMusicUI(false);
    });

    // Initial UI setup
    setTimeout(() => updateMusicUI(false), 100); // Initial state check
}

function getSongTitle(src) {
    if (!src) return getTranslation('defaultSongTitle');
    try {
        const filename = decodeURIComponent(src.split('/').pop() || "");
        return filename.replace(/\.(mp3|ogg|wav)$/i, '') // Remove common extensions
                       .replace(/[_\-]/g, ' ')
                       .replace(/\b\w/g, l => l.toUpperCase())
                       .trim() || getTranslation('defaultSongTitle');
    } catch (e) {
        console.error("Error parsing song title:", e);
        return getTranslation('defaultSongTitle');
    }
}

function updateMusicUI(showNotification = true) {
    if (!domElements.music || !domElements.musicToggleBtn || !domElements.musicIcon || !domElements.songNotification || !domElements.songTitleSpan || !domElements.songIcon) {
        return; // Don't proceed if elements are missing
    }
    const isPlaying = !domElements.music.paused && !domElements.music.ended && domElements.music.readyState > 2;
    const isMuted = domElements.music.muted || domElements.music.volume === 0;
    const title = getSongTitle(domElements.music.currentSrc || domElements.music.src);

    // Update Button
    domElements.musicToggleBtn.classList.toggle('playing', isPlaying);
    if (isMuted || !isPlaying) {
        domElements.musicIcon.classList.remove('fa-volume-up');
        domElements.musicIcon.classList.add('fa-volume-mute');
        domElements.musicToggleBtn.title = getTranslation('playMusicTitle');
        domElements.musicToggleBtn.setAttribute('aria-label', getTranslation('playMusicTitle'));
    } else {
        domElements.musicIcon.classList.remove('fa-volume-mute');
        domElements.musicIcon.classList.add('fa-volume-up');
        domElements.musicToggleBtn.title = getTranslation('pauseMusicTitle');
        domElements.musicToggleBtn.setAttribute('aria-label', getTranslation('pauseMusicTitle'));
    }

    // Update Notification
    if (isPlaying && showNotification) {
        domElements.songTitleSpan.textContent = title;
        domElements.songIcon.className = 'fas fa-music song-status-icon';
        domElements.songNotification.classList.add('visible');
    } else {
        domElements.songNotification.classList.remove('visible');
    }
}


// --- Utilities ---
function updateCopyrightYear() {
    if (domElements.copyrightYearSpan) {
        domElements.copyrightYearSpan.textContent = new Date().getFullYear();
    }
}

function showTemporaryMessage(message, type = 'info', duration = TEMP_MESSAGE_DURATION_MS) {
    if (!domElements.tempMessageArea) {
        console.warn("Temporary message area not found. Message not shown:", message);
        return;
    }
    console.log(`Showing temporary message (${type}): "${message}"`);

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const messageElement = document.createElement('div');
    messageElement.id = messageId;
    messageElement.className = `temp-message ${type}`;
    messageElement.textContent = message;
    messageElement.setAttribute('role', type === 'error' ? 'alert' : 'status'); // Use alert for errors, status for info/success

    domElements.tempMessageArea.appendChild(messageElement);
    void messageElement.offsetWidth; // Trigger reflow for transition
    messageElement.classList.add('visible');

    // Removal logic
    const removeElement = () => {
         if (messageElement.parentNode === domElements.tempMessageArea) {
             domElements.tempMessageArea.removeChild(messageElement);
             console.log(`Temp message removed: ${messageId}`);
         }
    };

    const fadeOutTimeout = setTimeout(() => {
        messageElement.classList.remove('visible');
        // Fallback removal after transition duration
        const removeFallback = setTimeout(removeElement, TEMP_MESSAGE_FADE_DURATION_MS + 50);
        // Accurate removal on transitionend
        messageElement.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'opacity' || e.propertyName === 'transform') {
                clearTimeout(removeFallback);
                removeElement();
            }
        }, { once: true });
    }, duration);
}

// --- Scroll Animations ---
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.fade-in');
    if (!animatedElements.length) return;
    console.log(`Initializing scroll animations for ${animatedElements.length} elements.`);

    if ('IntersectionObserver' in window) {
        intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // observer.unobserve(entry.target); // Uncomment to animate only once
                }
                 // else { entry.target.classList.remove('is-visible'); } // Uncomment for re-animation on scroll out
            });
        }, { threshold: SCROLL_ANIMATION_THRESHOLD });

        animatedElements.forEach(el => intersectionObserver.observe(el));
    } else {
        console.warn("IntersectionObserver not supported. Fallback: showing all animated elements.");
        animatedElements.forEach(el => el.classList.add('is-visible'));
    }
}

function checkInitialVisibility() {
    // If using IntersectionObserver, this might not be strictly necessary
    // as the observer triggers automatically. But useful for logging or fallback.
    console.log("Checking initial element visibility (IntersectionObserver handles this if supported).");
    // Force re-check (rarely needed)
    // document.querySelectorAll('.fade-in').forEach(el => {
    //     if(intersectionObserver) { intersectionObserver.unobserve(el); intersectionObserver.observe(el); }
    // });
}

// --- Smooth Scroll ---
function initSmoothScroll() {
    console.log("Initializing smooth scroll for anchor links.");
    domElements.body.addEventListener('click', function(event) {
        const anchor = event.target.closest('a[href^="#"]');
        if (anchor) {
            const targetId = anchor.getAttribute('href');
            if (targetId.length > 1) { // Ensure it's not just "#"
                try {
                     const targetElement = document.querySelector(targetId);
                     if (targetElement) {
                         event.preventDefault();
                         targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                         console.log(`Smooth scrolling to: ${targetId}`);
                     } else {
                          console.warn(`Smooth scroll target not found: ${targetId}`);
                     }
                 } catch (e) {
                     console.error(`Invalid selector for smooth scroll: ${targetId}`, e);
                 }
            }
        }
    });
}


// --- Particle Background ---
function initParticles() {
    if (!domElements.particleContainer) {
        console.warn("Particle container not found.");
        return;
    }
    console.log("Initializing particles...");
    const particlesContainer = domElements.particleContainer;
    particlesContainer.innerHTML = ''; // Clear existing

    const particleCount = window.innerWidth < 768 ? 30 : 50; // Increased count slightly
    const colors = ['primary', 'secondary', 'accent']; // Match CSS vars for potential class assignment

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Assign random color class (optional, CSS already handles base color)
        // const colorClass = `p-${colors[Math.floor(Math.random() * colors.length)]}`;
        // particle.classList.add(colorClass);

        const size = Math.random() * 2.5 + 1; // Slightly larger max size
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        const containerWidth = particlesContainer.clientWidth;
        const containerHeight = particlesContainer.clientHeight;

        const startX = Math.random() * containerWidth;
        const startY = Math.random() * containerHeight;
        const midX = startX + (Math.random() - 0.5) * containerWidth * 0.6; // Constrain mid-point deviation
        const midY = startY + (Math.random() - 0.5) * containerHeight * 0.6;
        const endX = startX + (Math.random() - 0.5) * containerWidth * 1.2; // Allow wider end deviation
        const endY = startY + (Math.random() - 0.5) * containerHeight * 1.2;

        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;

        // Calculate translation for CSS vars
        const translateX_mid = midX - startX;
        const translateY_mid = midY - startY;
        const translateX_end = endX - startX;
        const translateY_end = endY - startY;

        particle.style.setProperty('--x-mid', `${translateX_mid}px`);
        particle.style.setProperty('--y-mid', `${translateY_mid}px`);
        particle.style.setProperty('--x-end', `${translateX_end}px`);
        particle.style.setProperty('--y-end', `${translateY_end}px`);
         // Add random scale variation for mid-point
        particle.style.setProperty('--scale-mid', (Math.random() * 0.4 + 0.5).toFixed(2)); // Scale between 0.5 and 0.9


        const duration = Math.random() * 20 + 18; // 18-38s duration range
        const delay = -Math.random() * duration; // Start at random point in cycle

        particle.style.animation = `float ${duration}s linear ${delay}s infinite`;

        particlesContainer.appendChild(particle);
    }
    console.log(`${particleCount} particles initialized.`);

    // Debounced resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(initParticles, 500); // Re-init particles 500ms after resize stops
    });
}

console.log("--- Main script execution finished ---");
