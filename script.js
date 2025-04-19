// --- Global Variables ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaptionSpan = document.querySelector('#lightbox-caption span');
const galleryItemsNodeList = document.querySelectorAll('.gallery-item');
let currentVisibleItems = [];
let currentImageIndex = 0;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    initParticles();
    initSeasonFilter();
    initGalleryItemListeners();
    updateCopyrightYear();
    initLightboxKeyboardNav();
    initBackToTop();
    initMusicControl();

    updateVisibleItems();

    window.addEventListener('load', function() {
        setTimeout(() => {
            document.getElementById('page-loader').classList.remove('active');
        }, 800);
    });
});

// --- Core Functions ---

function initParticles() {
    const particlesContainer = document.getElementById('particles-js');
    if (!particlesContainer) return;

    const particleCount = window.innerWidth < 768 ? 25 : 40;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        const size = Math.random() * 2.5 + 0.5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;

        particle.style.setProperty('--x-drift', `${Math.random() * 100 - 50}px`);
        particle.style.setProperty('--y-drift', `${Math.random() * 100 - 50}px`);

        particle.style.animationDuration = `${Math.random() * 15 + 15}s`;
        particle.style.animationDelay = `${Math.random() * 10}s`;

        particlesContainer.appendChild(particle);
    }
}

function initSeasonFilter() {
    const filterButtons = document.querySelectorAll('.season-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const season = button.dataset.season;

            galleryItems.forEach(item => {
                const itemSeason = item.dataset.season;
                if (season === 'all' || itemSeason === season) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });

            updateVisibleItems();
        });
    });
}

function initGalleryItemListeners() {
    const galleryContainer = document.querySelector('.gallery');
    if (!galleryContainer) return;

    galleryContainer.addEventListener('click', (event) => {
        const galleryItem = event.target.closest('.gallery-item');
        if (galleryItem && window.getComputedStyle(galleryItem).display !== 'none') {
            if (event.target.tagName === 'BUTTON' || event.target.tagName === 'A' || event.target.parentElement.tagName === 'BUTTON' || event.target.parentElement.tagName === 'A') {
                if (event.target.closest('.view-btn')) {
                    event.preventDefault();
                } else {
                    return;
                }
            }

            const imageSrc = galleryItem.dataset.src;
            const caption = galleryItem.dataset.caption || "Gambar Galeri Nightmare";

            updateVisibleItems();

            currentImageIndex = currentVisibleItems.findIndex(visibleItem => visibleItem === galleryItem);

            if (imageSrc && currentImageIndex !== -1) {
                openLightbox(imageSrc, caption);
            }
        }
    });
}

function updateVisibleItems() {
    currentVisibleItems = Array.from(document.querySelectorAll('.gallery-item')).filter(item => {
        return window.getComputedStyle(item).display !== 'none';
    });

    const navBtns = document.querySelectorAll('.lightbox-nav-btn');
    if (navBtns) {
        navBtns.forEach(btn => {
            btn.style.display = currentVisibleItems.length <= 1 ? 'none' : 'flex';
        });
    }
}

function openLightbox(imageSrc, caption) {
    if (!lightbox || !lightboxImg || !lightboxCaptionSpan) return;

    if (lightbox.classList.contains('active')) {
        lightboxImg.style.opacity = '0';
        if (lightboxCaptionSpan.parentNode) {
            lightboxCaptionSpan.parentNode.style.opacity = '0';
        }

        setTimeout(() => {
            lightboxImg.src = imageSrc;
            lightboxImg.alt = caption || "Gambar Galeri Diperbesar";

            if (caption) {
                lightboxCaptionSpan.textContent = caption;
                if (lightboxCaptionSpan.parentNode) lightboxCaptionSpan.parentNode.style.display = 'flex';
                setTimeout(() => { if (lightboxCaptionSpan.parentNode) lightboxCaptionSpan.parentNode.style.opacity = '1'; }, 50);
            } else {
                lightboxCaptionSpan.textContent = '';
                if (lightboxCaptionSpan.parentNode) lightboxCaptionSpan.parentNode.style.display = 'none';
            }

            lightboxImg.style.opacity = '1';
        }, 300);
    } else {
        lightboxImg.src = imageSrc;
        lightboxImg.alt = caption || "Gambar Galeri Diperbesar";

        if (caption) {
            lightboxCaptionSpan.textContent = caption;
            if (lightboxCaptionSpan.parentNode) {
                lightboxCaptionSpan.parentNode.style.display = 'flex';
                lightboxCaptionSpan.parentNode.style.opacity = '1';
            }
        } else {
            lightboxCaptionSpan.textContent = '';
            if (lightboxCaptionSpan.parentNode) lightboxCaptionSpan.parentNode.style.display = 'none';
        }

        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox(event) {
    if (!event || event.target === lightbox || event.target.classList.contains('lightbox-close')) {
        if (lightbox) {
            lightbox.classList.remove('active');
            setTimeout(() => {
                document.body.style.overflow = '';
            }, 500);
        }
    }
}

function navigateLightbox(direction, event) {
    if (event) {
        event.stopPropagation();
    }

    if (!currentVisibleItems.length || currentVisibleItems.length <= 1) {
        return;
    }

    currentImageIndex += direction;

    if (currentImageIndex < 0) {
        currentImageIndex = currentVisibleItems.length - 1;
    } else if (currentImageIndex >= currentVisibleItems.length) {
        currentImageIndex = 0;
    }

    const nextItem = currentVisibleItems[currentImageIndex];
    if (nextItem) {
        const imageSrc = nextItem.dataset.src;
        const caption = nextItem.dataset.caption || "Gambar Galeri Nightmare";
        openLightbox(imageSrc, caption);
    }
}

function updateCopyrightYear() {
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

function initLightboxKeyboardNav() {
    document.addEventListener('keydown', function(event) {
        if (lightbox && lightbox.classList.contains('active')) {
            switch (event.key) {
                case 'Escape':
                    closeLightbox();
                    break;
                case 'ArrowLeft':
                    navigateLightbox(-1, event);
                    break;
                case 'ArrowRight':
                    navigateLightbox(1, event);
                    break;
            }
        }
    });
}

function initBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initMusicControl() {
    const music = document.getElementById('background-music');
    const toggleButton = document.getElementById('music-toggle');

    toggleButton.addEventListener('click', () => {
        if (music.paused) {
            music.play();
            toggleButton.innerHTML = '<i class="fas fa-pause"></i> Jeda Musik';
        } else {
            music.pause();
            toggleButton.innerHTML = '<i class="fas fa-music"></i> Putar Musik';
        }
    });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetElement = document.querySelector(this.getAttribute('href'));
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});