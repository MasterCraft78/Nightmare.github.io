// --- Global Variables & Constants ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaptionSpan = document.querySelector('#lightbox-caption span');
const lightboxCaptionContainer = document.getElementById('lightbox-caption'); // Get parent container
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxNav = document.querySelector('.lightbox-nav'); // Get nav container
const lightboxLoader = document.querySelector('.lightbox-loader'); // Get loader
const galleryContainer = document.querySelector('.gallery');
const music = document.getElementById('background-music');
const musicToggleBtn = document.getElementById('music-toggle');
const musicIcon = musicToggleBtn?.querySelector('i');
const songNotification = document.getElementById('song-notification');
const songTitleSpan = songNotification?.querySelector('.song-title'); // Get title span
const songIcon = songNotification?.querySelector('.song-status-icon'); // Get icon span
const loader = document.getElementById('page-loader');
const tempMessageArea = document.getElementById('temp-message-area'); // Added

// Server Status Elements
const statusIndicatorDot = document.getElementById('live-indicator-dot');
const statusIndicatorText = document.getElementById('live-indicator-text');
const playerCountSpan = document.getElementById('player-count');
const serverIpSpan = document.getElementById('server-ip-display');
const copyIpBtn = document.getElementById('copy-ip-btn');
const lastUpdatedSpan = document.getElementById('last-updated');

// Server Details
const SERVER_IP = "night.ftp.sh";
const SERVER_PORT = 25565;
const SERVER_QUERY_URL = `https://api.mcsrvstat.us/bedrock/3/${SERVER_IP}:${SERVER_PORT}`;
const REFRESH_INTERVAL_MS = 60000; // 60 seconds

// Animation & Timing Constants
const LIGHTBOX_IMG_TRANSITION_MS = 400;
const LIGHTBOX_FADE_MS = 500;
const NOTIFICATION_FADE_MS = 400;
const TEMP_MESSAGE_DURATION_MS = 4000;
const MIN_LOADER_TIME_MS = 1200; // Slightly longer min loader time
const SCROLL_ANIMATION_THRESHOLD = 0.15; // 15% visibility needed to trigger fade-in

let currentVisibleItems = [];
let currentImageIndex = 0;
let serverStatusIntervalId = null;
let intersectionObserver; // For scroll animations

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing...");
    const startTime = Date.now(); // Start time for loader calculation

    initParticles();
    initSeasonFilter();
    initGalleryItemListeners();
    updateCopyrightYear();
    initLightboxControls();
    initMusicToggle();
    initCopyIpButton();
    initScrollAnimations(); // Initialize scroll animations

    // Initial fetch, then interval
    fetchServerStatus();
    if (serverStatusIntervalId) clearInterval(serverStatusIntervalId);
    serverStatusIntervalId = setInterval(fetchServerStatus, REFRESH_INTERVAL_MS);

    updateVisibleItems(); // Initial update

    // Handle page load completion (hiding loader)
    window.addEventListener('load', () => {
        console.log("Window Loaded.");
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADER_TIME_MS - elapsedTime);

        setTimeout(() => {
            if (loader) {
                loader.classList.remove('active');
                console.log("Loader hidden.");
                // Trigger scroll check after loader hides in case elements are visible
                checkInitialVisibility();
            }
        }, remainingTime);
    });
});

// --- Core Functions ---

// Initialize Particle Background
function initParticles() {
    const particlesContainer = document.getElementById('particle-background');
    if (!particlesContainer) return;

    const particleCount = window.innerWidth < 768 ? 25 : 40; // Adjusted count

    // Clear existing particles if any (e.g., on resize/reinit)
    particlesContainer.innerHTML = '';

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        const size = Math.random() * 2.2 + 0.8; // Slightly adjusted size range
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Define random points within viewport percentages
        const startX = `${Math.random() * 100}%`;
        const startY = `${Math.random() * 100}%`;
        const midX = `${Math.random() * 100}%`;
        const midY = `${Math.random() * 100}%`;
        const endX = `${Math.random() * 100}%`;
        const endY = `${Math.random() * 100}%`;

        // Set CSS variables for the animation
        particle.style.setProperty('--x-start', startX);
        particle.style.setProperty('--y-start', startY);
        particle.style.setProperty('--x-mid', midX);
        particle.style.setProperty('--y-mid', midY);
        particle.style.setProperty('--x-end', endX);
        particle.style.setProperty('--y-end', endY);

        // Randomize duration and delay for variety
        particle.style.animationDuration = `${Math.random() * 18 + 15}s`; // 15-33s range
        particle.style.animationDelay = `-${Math.random() * 25}s`; // Start at random points in cycle

        particlesContainer.appendChild(particle);
    }
    console.log(`Initialized ${particleCount} particles.`);
}


// Set up season filter buttons
function initSeasonFilter() {
    const filterButtons = document.querySelectorAll('.season-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const gallerySection = document.querySelector('.gallery'); // Get gallery section for scroll

    if (!filterButtons.length || !galleryItems.length) return;

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Debounce or prevent rapid clicking if needed
            if (button.classList.contains('active')) return; // Do nothing if already active

            const currentActive = document.querySelector('.season-btn.active');
            if (currentActive) currentActive.classList.remove('active');
            button.classList.add('active');

            const season = button.dataset.season;
            let hasVisibleItems = false;

            galleryItems.forEach(item => {
                const itemSeason = item.dataset.season;
                const shouldShow = (season === 'all' || itemSeason === season);

                // Use style.display for immediate hiding/showing
                // CSS transitions on opacity/transform can be added for smoother filtering
                item.style.display = shouldShow ? '' : 'none';
                // item.classList.toggle('hidden', !shouldShow); // Alternative using class

                if (shouldShow) hasVisibleItems = true;
            });

            updateVisibleItems(); // Update the array for lightbox

            if (!hasVisibleItems) {
                console.log(`No items found for season: ${season}`);
                // Optionally display a "No items" message in the gallery
            }

            // Scroll gently to the gallery section only if it's not already in view
            if (gallerySection) {
                const rect = gallerySection.getBoundingClientRect();
                if (rect.top < -100 || rect.bottom > window.innerHeight + 100) { // Check if significantly out of view
                    gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                }
            }
        });
    });
    console.log("Season filter initialized.");
}

// Setup gallery item click listeners using event delegation
function initGalleryItemListeners() {
    if (!galleryContainer) return;

    galleryContainer.addEventListener('click', (event) => {
        // Find the closest gallery item ancestor
        const galleryItem = event.target.closest('.gallery-item');

        // Proceed only if a valid gallery item was clicked and it's currently visible
        if (galleryItem && galleryItem.style.display !== 'none') {
            // Check if the click was specifically on the view button OR anywhere else on the item
            const isViewButtonClick = event.target.closest('.view-btn');

            if (isViewButtonClick || event.target === galleryItem || event.target.tagName === 'IMG') {
                 event.preventDefault();
                 event.stopPropagation();

                 const imageSrc = galleryItem.dataset.src;
                 const caption = galleryItem.dataset.caption || "";

                 updateVisibleItems(); // Ensure the list is current

                 // Find the index within the *currently visible* items
                 currentImageIndex = currentVisibleItems.findIndex(visibleItem => visibleItem === galleryItem);

                 if (imageSrc && currentImageIndex !== -1) {
                     console.log(`Opening lightbox for: ${caption || imageSrc} (index ${currentImageIndex})`);
                     openLightbox(imageSrc, caption);
                 } else {
                     console.error("Could not find clicked item in visible list or missing src/dataset.");
                     showTemporaryMessage("Gagal membuka gambar.", "error");
                 }
            }
        }
    });
    console.log("Gallery item listeners initialized.");
}


// Update the array of currently visible gallery items
function updateVisibleItems() {
    currentVisibleItems = Array.from(document.querySelectorAll('.gallery-item'))
                                    .filter(item => item.style.display !== 'none'); // Filter based on display style
    console.log(`Updated visible items count: ${currentVisibleItems.length}`);

    // Update lightbox navigation visibility based on count
    const shouldShowNav = currentVisibleItems.length > 1;
    if (lightboxNav) {
        lightboxNav.classList.toggle('visible', shouldShowNav); // Use 'visible' class
    }
}

// --- Lightbox Functions ---

// Open lightbox
function openLightbox(imageSrc, caption) {
    if (!lightbox || !lightboxImg || !lightboxCaptionContainer || !lightboxCounter || !lightboxLoader) return;

    const isAlreadyOpen = lightbox.classList.contains('active');

    // Function to set content
    const setLightboxContent = () => {
        lightboxImg.style.opacity = '0'; // Hide image initially
        lightboxImg.src = ''; // Clear src to ensure onload fires correctly
        lightboxImg.classList.add('loading'); // Show spinner via CSS
        lightboxLoader.style.opacity = '1'; // Ensure loader is visible

        // Use a small delay before setting the new src to allow UI to update
        setTimeout(() => {
            lightboxImg.src = imageSrc;
            lightboxImg.alt = caption || `Nightmare Gallery Image ${currentImageIndex + 1}`;

            // Update caption text and parent visibility/class
            lightboxCaptionSpan.textContent = caption;
            lightboxCaptionContainer.classList.toggle('visible', !!caption); // Use class for visibility

            // Update counter text and parent visibility/class
            const showCounter = currentVisibleItems.length > 1;
            lightboxCounter.textContent = showCounter ? `${currentImageIndex + 1} / ${currentVisibleItems.length}` : '';
            lightboxCounter.classList.toggle('visible', showCounter);

            // Handle image load/error
            lightboxImg.onload = () => {
                console.log("Lightbox image loaded:", imageSrc);
                lightboxImg.style.opacity = '1'; // Fade in image
                lightboxImg.classList.remove('loading'); // Hide spinner
                lightboxLoader.style.opacity = '0';
            };
            lightboxImg.onerror = () => {
                console.error(`Failed to load lightbox image: ${imageSrc}`);
                lightboxImg.style.opacity = '1'; // Still show the container
                lightboxImg.classList.remove('loading');
                lightboxLoader.style.opacity = '0';
                lightboxCaptionSpan.textContent = "Gagal memuat gambar.";
                lightboxCaptionContainer.classList.add('visible'); // Show error message
                showTemporaryMessage("Gagal memuat gambar.", "error");
            };
        }, 50); // Short delay
    };

    if (!isAlreadyOpen) {
        lightbox.classList.add('active'); // Show lightbox overlay
        document.body.style.overflow = 'hidden'; // Prevent body scroll
    }

    setLightboxContent(); // Set content (handles fade out/in if already open implicitly)
}


// Close lightbox
function closeLightbox(event) {
    if (!lightbox) return;

    const clickedElement = event?.target;
    const isCloseButton = clickedElement?.closest('.lightbox-close');
    const isOverlayClick = clickedElement === lightbox; // Click directly on the background
    const isEscapeKey = event?.key === 'Escape';

    if (lightbox.classList.contains('active') && (isOverlayClick || isCloseButton || isEscapeKey)) {
        console.log("Closing lightbox...");
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll

        // Optional: Clear src after fade out
         setTimeout(() => {
             if (!lightbox.classList.contains('active')) { // Check if still closed
                 lightboxImg.src = '';
                 lightboxCaptionSpan.textContent = '';
                 lightboxCaptionContainer.classList.remove('visible');
                 lightboxCounter.textContent = '';
                 lightboxCounter.classList.remove('visible');
             }
         }, LIGHTBOX_FADE_MS);
    }
}

// Navigate lightbox images
function navigateLightbox(direction, event) {
    if (event) {
       event.stopPropagation(); // Prevent closing lightbox from nav click
    }
    if (currentVisibleItems.length <= 1) return; // No navigation needed

    currentImageIndex = (currentImageIndex + direction + currentVisibleItems.length) % currentVisibleItems.length;

    const nextItem = currentVisibleItems[currentImageIndex];
    if (nextItem) {
        const imageSrc = nextItem.dataset.src;
        const caption = nextItem.dataset.caption || "";
        console.log(`Navigating lightbox to index ${currentImageIndex}: ${caption || imageSrc}`);
        // Re-call openLightbox to handle the update and transitions
        openLightbox(imageSrc, caption);
    }
}

// Setup lightbox event listeners
function initLightboxControls() {
    if (!lightbox) return;

    // Use event delegation on the lightbox itself for close/overlay clicks
    lightbox.addEventListener('click', closeLightbox);

    // Navigation buttons
    const prevBtn = document.querySelector('.lightbox-nav-btn.prev');
    const nextBtn = document.querySelector('.lightbox-nav-btn.next');
    if (prevBtn) prevBtn.addEventListener('click', (e) => navigateLightbox(-1, e));
    if (nextBtn) nextBtn.addEventListener('click', (e) => navigateLightbox(1, e));

    // Keyboard navigation
    document.addEventListener('keydown', (event) => {
        if (lightbox.classList.contains('active')) {
            switch (event.key) {
                case 'Escape':
                    closeLightbox(event);
                    break;
                case 'ArrowLeft':
                    navigateLightbox(-1, event);
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                    navigateLightbox(1, event);
                    event.preventDefault();
                    break;
            }
        }
    });
    console.log("Lightbox controls initialized.");
}


// --- Server Status Functions ---

// Fetch and update server status
async function fetchServerStatus() {
    if (!statusIndicatorDot || !statusIndicatorText || !playerCountSpan || !lastUpdatedSpan) {
        console.warn("Server status elements missing.");
        return;
    }

    // Initial state: Loading
    setStatusVisuals('loading', 'Memeriksa...');
    playerCountSpan.textContent = 'Pemain: Memuat...';
    statusIndicatorDot.classList.add('pulsing');

    try {
        console.log(`Workspaceing server status from: ${SERVER_QUERY_URL}`);
        const response = await fetch(SERVER_QUERY_URL, { cache: "no-store" }); // Prevent caching

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Server Status API Response:", data);

        statusIndicatorDot.classList.remove('pulsing'); // Stop pulsing animation

        if (data.online) {
            setStatusVisuals('online', 'Online');
            const playersOnline = data.players?.online ?? 'N/A';
            const playersMax = data.players?.max ?? 'N/A';
            playerCountSpan.textContent = `Pemain: ${playersOnline} / ${playersMax}`;
            statusIndicatorDot.classList.add('pulsing'); // Add pulse back for online state
        } else {
            setStatusVisuals('offline', 'Offline');
            playerCountSpan.textContent = 'Pemain: N/A';
        }

        lastUpdatedSpan.textContent = `Terakhir diperbarui: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    } catch (error) {
        console.error("Error fetching server status:", error);
        setStatusVisuals('error', 'Error');
        playerCountSpan.textContent = 'Pemain: Error';
        statusIndicatorDot.classList.remove('pulsing');
        lastUpdatedSpan.textContent = `Gagal memperbarui: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
        // Optionally show a temporary message to the user
        // showTemporaryMessage("Gagal memeriksa status server.", "error");
    }
}

// Helper to update status indicator visuals and text
function setStatusVisuals(statusType, statusText) {
    if (!statusIndicatorDot || !statusIndicatorText) return;

    // Define possible states
    const states = ['online', 'offline', 'error', 'loading'];

    // Remove all state classes first
    statusIndicatorDot.classList.remove(...states);
    statusIndicatorText.classList.remove(...states);

    // Add the current state class
    statusIndicatorDot.classList.add(statusType);
    statusIndicatorText.classList.add(statusType);

    // Update text content
    statusIndicatorText.textContent = statusText;
}


// Initialize Improved Copy IP Button
function initCopyIpButton() {
    if (!copyIpBtn || !serverIpSpan) return;

    copyIpBtn.addEventListener('click', () => {
        const ipAddress = `${SERVER_IP}:${SERVER_PORT}`;
        navigator.clipboard.writeText(ipAddress).then(() => {
            console.log(`Copied IP: ${ipAddress}`);

            // Add 'copied' class to trigger CSS animations/styles
            copyIpBtn.classList.add('copied');

            // Optional: Provide haptic feedback if supported
            if (navigator.vibrate) {
                navigator.vibrate(100); // Vibrate for 100ms
            }

            // Remove the 'copied' class after a delay
            setTimeout(() => {
                copyIpBtn.classList.remove('copied');
            }, 2000); // Reset after 2 seconds

        }).catch(err => {
            console.error('Failed to copy IP: ', err);
            showTemporaryMessage("Gagal menyalin IP. Salin manual.", 'error', 5000); // Longer message
        });
    });
    console.log("Copy IP button initialized.");
}


// --- Music Player Functions ---

function initMusicToggle() {
    if (!music || !musicToggleBtn || !musicIcon || !songNotification || !songTitleSpan || !songIcon) {
         console.warn("Music player elements missing.");
         return;
    }

    music.volume = 0.35; // Slightly lower default volume

    const getSongTitle = (src) => {
        if (!src) return "Musik Latar";
        try {
            const filename = decodeURIComponent(src.split('/').pop() || "Musik Latar");
            return filename.split('.').slice(0, -1).join('.')
                           .replace(/[_-]/g, ' ')
                           .replace(/\b\w/g, l => l.toUpperCase())
                           .trim();
        } catch { return "Musik Latar"; }
    };

    const updateMusicUI = (showNotification = true) => {
        const isPlaying = !music.paused && !music.ended && music.readyState > 2;
        const title = getSongTitle(music.currentSrc || music.src);

        musicToggleBtn.classList.toggle('playing', isPlaying);
        musicIcon.classList.toggle('fa-volume-mute', !isPlaying);
        musicIcon.classList.toggle('fa-volume-up', isPlaying);
        musicToggleBtn.title = isPlaying ? 'Hentikan Musik' : 'Putar Musik';

        // Update and show/hide notification
        if (isPlaying && showNotification) {
            songTitleSpan.textContent = title;
            songIcon.className = 'fas fa-music song-status-icon'; // Ensure correct icon
            songNotification.classList.add('visible');
        } else {
            songNotification.classList.remove('visible');
            // Optional: Clear title after fade out if needed
             // setTimeout(() => { if (!musicToggleBtn.classList.contains('playing')) songTitleSpan.textContent = ''; }, NOTIFICATION_FADE_MS);
        }
    };

    // Autoplay handling - requires user interaction first
    let userInteracted = false;
    const playMusicOnClick = () => {
        if (!userInteracted) {
            userInteracted = true;
            document.removeEventListener('click', playMusicOnClick); // Remove listener after first click
            document.removeEventListener('touchstart', playMusicOnClick);
            console.log("User interaction detected, attempting to play music.");
            music.play().then(() => {
                 console.log("Music playing after interaction.");
                 updateMusicUI();
            }).catch(error => {
                 console.error("Music playback failed even after interaction:", error);
                 showTemporaryMessage("Gagal memulai musik.", 'error');
            });
        }
    };
    document.addEventListener('click', playMusicOnClick);
    document.addEventListener('touchstart', playMusicOnClick, {passive: true});


    musicToggleBtn.addEventListener('click', () => {
        if (!userInteracted) {
             // If user clicks the button before interacting elsewhere
             userInteracted = true;
             document.removeEventListener('click', playMusicOnClick);
             document.removeEventListener('touchstart', playMusicOnClick);
        }

        if (music.paused || music.ended) {
            music.play().catch(error => {
                console.error("Music playback failed on button click:", error);
                showTemporaryMessage("Gagal memulai musik. Coba klik halaman.", 'info');
            });
        } else {
            music.pause();
        }
    });

    // Update UI on events
    music.addEventListener('play', () => updateMusicUI(true));
    music.addEventListener('pause', () => updateMusicUI(false)); // Hide notification on pause
    music.addEventListener('ended', () => updateMusicUI(false)); // Hide notification on end
    music.addEventListener('error', (e) => {
        console.error("Audio Error:", e);
        showTemporaryMessage("Gagal memuat file musik.", 'error');
        updateMusicUI(false); // Ensure UI is correct on error
    });

    // Initial check in case browser restores state
    setTimeout(() => updateMusicUI(false), 100); // Check state initially, don't show notification yet
    console.log("Music toggle initialized.");
}

// --- Utility Functions ---

function updateCopyrightYear() {
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
}

// Show temporary messages
function showTemporaryMessage(message, type = 'info', duration = TEMP_MESSAGE_DURATION_MS) {
    if (!tempMessageArea) {
        console.warn("Temporary message area not found.");
        return;
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const messageElement = document.createElement('div');
    messageElement.id = messageId;
    messageElement.className = `temp-message ${type}`; // 'info', 'success', 'error'
    messageElement.textContent = message;
    messageElement.setAttribute('role', 'alert'); // Accessibility

    tempMessageArea.appendChild(messageElement);

    // Force reflow before adding 'visible' class for transition
    void messageElement.offsetWidth;

    messageElement.classList.add('visible');

    // Automatically remove after duration
    setTimeout(() => {
        messageElement.classList.remove('visible');
        // Remove from DOM after fade-out transition completes
        messageElement.addEventListener('transitionend', () => {
            // Check if the element still exists before removing
             if (messageElement.parentNode === tempMessageArea) {
                 tempMessageArea.removeChild(messageElement);
             }
        }, { once: true });
    }, duration);
}

// --- Scroll Animation Functions ---

function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.fade-in');
    if (!animatedElements.length) return;

    if ('IntersectionObserver' in window) {
        intersectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Optional: stop observing once visible
                    // observer.unobserve(entry.target);
                }
                // Optional: remove class if scrolled out of view (for repeated animations)
                // else {
                //     entry.target.classList.remove('is-visible');
                // }
            });
        }, {
            threshold: SCROLL_ANIMATION_THRESHOLD, // Trigger when 15% visible
            // rootMargin: '0px 0px -50px 0px' // Optional: trigger slightly before it's fully in view
        });

        animatedElements.forEach(el => intersectionObserver.observe(el));
        console.log("Scroll animations initialized with IntersectionObserver.");
    } else {
        // Fallback for older browsers (less performant)
        console.warn("IntersectionObserver not supported, scroll animations might be limited.");
        // Basic fallback: make all visible immediately or use scroll event listener (not recommended for performance)
        // animatedElements.forEach(el => el.classList.add('is-visible'));
    }
}
// Function to check elements initially in view (e.g., after loader)
function checkInitialVisibility() {
     const animatedElements = document.querySelectorAll('.fade-in');
     animatedElements.forEach(el => {
         const rect = el.getBoundingClientRect();
         if (rect.top <= window.innerHeight && rect.bottom >= 0 && getComputedStyle(el).opacity === '0') {
              // Check if element is within viewport and currently faded out
              if (intersectionObserver) {
                 // If using IO, trigger its check manually if needed, though it should handle this
                 // intersectionObserver.unobserve(el); // Force a re-check if needed
                 // intersectionObserver.observe(el);
              } else {
                 el.classList.add('is-visible'); // Fallback: just make it visible
              }
         }
     });
 }

// --- Add smooth scroll for internal anchor links (optional) ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = targetId === '#' ? document.body : document.querySelector(targetId);

        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

console.log("Main script execution finished.");
