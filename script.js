// --- Global Variables ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaptionSpan = document.querySelector('#lightbox-caption span');
const lightboxCounter = document.getElementById('lightbox-counter'); // Get the counter element
const galleryContainer = document.querySelector('.gallery'); // Get the gallery container
const music = document.getElementById('background-music');
const musicToggleBtn = document.getElementById('music-toggle');


let currentVisibleItems = []; // Array to store currently visible gallery items
let currentImageIndex = 0; // Index within the currentVisibleItems array

// --- Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    initParticles(); // Initialize custom particles
    initSeasonFilter();
    initGalleryItemListeners(); // Use event delegation on the container
    updateCopyrightYear();
    initLightboxKeyboardNav();
    initMusicToggle(); // Initialize music toggle

    // Update visible items initially (important for correct initial state)
    updateVisibleItems();
});

// Hide loader after a delay (simulated load time) and content is ready
window.addEventListener('load', function() {
    // Give a small minimum time for the animation to show
    const loader = document.getElementById('page-loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.remove('active');
        }, 800); // Reduced delay slightly, minimum 800ms visible
    }
});


// --- Core Functions ---

// Initialize Custom Particle Background Effect (uses CSS animation)
function initParticles() {
    const particlesContainer = document.getElementById('particles-js');
    if (!particlesContainer) return;

    // Reduce particle count on smaller screens for performance
    const particleCount = window.innerWidth < 768 ? 20 : 35; // Adjusted count

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Random size range
        const size = Math.random() * 2 + 0.5; // Smaller size range
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;

        // Set random drift values as CSS variables for the animation
        // Larger drift range for more movement
        particle.style.setProperty('--x-drift', `${Math.random() * 150 - 75}px`);
        particle.style.setProperty('--y-drift', `${Math.random() * 150 - 75}px`);

        // Randomize animation duration and delay
        particle.style.animationDuration = `${Math.random() * 10 + 20}s`; // Slower animation
        particle.style.animationDelay = `${Math.random() * 15}s`; // Longer potential delay

        particlesContainer.appendChild(particle);
    }
}


// Set up season filter buttons
function initSeasonFilter() {
    const filterButtons = document.querySelectorAll('.season-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const season = button.dataset.season;
            const galleryItems = document.querySelectorAll('.gallery-item'); // Get live list

            // Filter gallery items
            galleryItems.forEach(item => {
                const itemSeason = item.dataset.season;
                // Show item if 'all' is selected OR if the item's season matches
                if (season === 'all' || itemSeason === season) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });

            // IMPORTANT: Update the list of visible items *after* filtering
            updateVisibleItems();

            // Optional: Scroll back to the top of the gallery section after filtering
            const gallerySection = document.querySelector('.gallery');
            if (gallerySection) {
                 gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

        });
    });
}

// Add click listeners to gallery items to open lightbox using delegation
function initGalleryItemListeners() {
    if (!galleryContainer) return;

    galleryContainer.addEventListener('click', (event) => {
        // Find the closest ancestor that is a .gallery-item
        const galleryItem = event.target.closest('.gallery-item');

        // Ensure a gallery item was clicked and it's currently visible
        if (galleryItem && window.getComputedStyle(galleryItem).display !== 'none') {
            // Prevent opening if a specific interactive element *inside* the item was clicked
            // Check if the clicked target or its parent is the view button itself
            if (event.target.closest('.view-btn')) {
                 // If the click is on the view button, proceed to open lightbox
            } else {
                 // If click is anywhere else inside the item (but not the view button), also proceed
                 // This makes the whole item clickable except for other potential links/buttons
                 // (though currently, only the view-btn is inside).
            }


            const imageSrc = galleryItem.dataset.src;
            const caption = galleryItem.dataset.caption || ""; // Use empty string if no caption

            // Update the list of currently visible items *before* opening
            updateVisibleItems();

            // Find the index of the clicked item within the *visible* items
            currentImageIndex = currentVisibleItems.findIndex(visibleItem => visibleItem === galleryItem); // Compare the actual element

            // Open the lightbox with the correct image and index
            if (imageSrc && currentImageIndex !== -1) {
                openLightbox(imageSrc, caption);
            }
        }
    });
}


// Update the array of currently visible gallery items
function updateVisibleItems() {
    // Re-query all items and filter by computed style
    currentVisibleItems = Array.from(document.querySelectorAll('.gallery-item')).filter(item => {
        // Check if the item is visible (display is not 'none')
        return window.getComputedStyle(item).display !== 'none';
    });

    // Hide/Show nav buttons and counter based on visible items count
    const navBtns = document.querySelectorAll('.lightbox-nav-btn');
    if (navBtns) {
        const displayStyle = currentVisibleItems.length <= 1 ? 'none' : 'flex';
        navBtns.forEach(btn => {
            btn.style.display = displayStyle;
        });
    }
    // Hide counter if only one or zero items
    if (lightboxCounter) {
        lightboxCounter.style.display = currentVisibleItems.length <= 1 ? 'none' : 'block';
    }
}

// Open lightbox with a specific image and caption
function openLightbox(imageSrc, caption) {
    if (!lightbox || !lightboxImg || !lightboxCaptionSpan || !lightboxCounter) return;

    // Apply fade-in effect for image/caption change if already open
    if (lightbox.classList.contains('active')) {
        lightboxImg.style.opacity = '0';
        lightboxCaptionSpan.parentNode.style.opacity = '0'; // Fade out caption parent
        lightboxCounter.style.opacity = '0'; // Fade out counter

        setTimeout(() => {
            lightboxImg.src = imageSrc;
            lightboxImg.alt = caption || "Gambar Galeri Diperbesar"; // Update alt text

            // Update caption text and visibility
            lightboxCaptionSpan.textContent = caption;
            if (caption) {
                lightboxCaptionSpan.parentNode.style.display = 'flex'; // Show parent
                // Use setTimeout for slight delay after display: flex
                setTimeout(() => { lightboxCaptionSpan.parentNode.style.opacity = '1'; }, 50);
            } else {
                lightboxCaptionSpan.parentNode.style.display = 'none'; // Hide parent if no caption
            }

            // Update counter text and visibility
            if (currentVisibleItems.length > 1) {
                lightboxCounter.textContent = `${currentImageIndex + 1} / ${currentVisibleItems.length}`;
                 lightboxCounter.style.display = 'block'; // Show counter
                 setTimeout(() => { lightboxCounter.style.opacity = '1'; }, 50); // Slight delay
            } else {
                 lightboxCounter.style.display = 'none'; // Hide counter
                 lightboxCounter.style.opacity = '0';
            }

            // Fade image back in
            lightboxImg.style.opacity = '1';

        }, 300); // Match CSS transition duration for opacity

    } else {
        // First time opening
        lightboxImg.src = imageSrc;
        lightboxImg.alt = caption || "Gambar Galeri Diperbesar"; // Set alt text

        // Set caption text and visibility for first open
        lightboxCaptionSpan.textContent = caption;
        if (caption) {
            lightboxCaptionSpan.parentNode.style.display = 'flex';
            lightboxCaptionSpan.parentNode.style.opacity = '1'; // Ensure opacity is 1
        } else {
            lightboxCaptionSpan.parentNode.style.display = 'none';
            lightboxCaptionSpan.parentNode.style.opacity = '0';
        }

        // Set counter text and visibility for first open
        if (currentVisibleItems.length > 1) {
             lightboxCounter.textContent = `${currentImageIndex + 1} / ${currentVisibleItems.length}`;
             lightboxCounter.style.display = 'block';
             lightboxCounter.style.opacity = '1';
        } else {
             lightboxCounter.style.display = 'none';
             lightboxCounter.style.opacity = '0';
        }


        lightbox.classList.add('active'); // Trigger CSS transition for lightbox container
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

// Close lightbox
function closeLightbox(event) {
    // Check if the click was directly on the overlay background or the close button
    // Stop propagation was added to navigateLightbox, so check event target is sufficient
    if (!event || event.target === lightbox || event.target.classList.contains('lightbox-close') || event.target.parentElement.classList.contains('lightbox-close')) {
        if (lightbox) {
            lightbox.classList.remove('active');
            // Wait for fade-out transition to complete before restoring scroll
            setTimeout(() => {
                 document.body.style.overflow = ''; // Restore background scrolling
            }, 500); // Match lightbox opacity transition duration
        }
    }
}

// Navigate between images in the lightbox (using the currentVisibleItems array)
function navigateLightbox(direction, event) {
    if (event) {
       event.stopPropagation(); // Prevent closing lightbox when clicking nav buttons or using keyboard arrows
    }

    if (!currentVisibleItems.length || currentVisibleItems.length <= 1) {
        // If no items or only one item, navigation is not possible
        return;
    }

    currentImageIndex += direction;

    // Wrap around the index
    if (currentImageIndex < 0) {
        currentImageIndex = currentVisibleItems.length - 1;
    } else if (currentImageIndex >= currentVisibleItems.length) {
        currentImageIndex = 0;
    }

    // Get the new item based on the updated index
    const nextItem = currentVisibleItems[currentImageIndex];
    if (nextItem) {
        const imageSrc = nextItem.dataset.src;
        const caption = nextItem.dataset.caption || ""; // Use empty string if no caption
        openLightbox(imageSrc, caption); // Reuse openLightbox to display
    }
}

// Update footer copyright year dynamically
function updateCopyrightYear() {
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

// Initialize keyboard navigation for lightbox
function initLightboxKeyboardNav() {
    document.addEventListener('keydown', function(event) {
        // Check if the lightbox is currently active
        if (lightbox && lightbox.classList.contains('active')) {
            switch (event.key) {
                case 'Escape':
                    closeLightbox(); // No need to pass event for Escape
                    break;
                case 'ArrowLeft':
                    navigateLightbox(-1, event); // Pass event to stop propagation
                    break;
                case 'ArrowRight':
                    navigateLightbox(1, event); // Pass event to stop propagation
                    break;
            }
             // Prevent default arrow key scrolling when lightbox is open
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                 event.preventDefault();
            }
        }
    });
}

// Initialize Music Toggle Functionality
function initMusicToggle() {
     if (!music || !musicToggleBtn) return;

     const musicIcon = musicToggleBtn.querySelector('i');
     // Check initial state (if autoplay was enabled and succeeded, or if music starts later)
     // A common pattern is to start muted and let the user toggle on.
     music.volume = 0.5; // Set a default volume


     // REMOVE OR COMMENT OUT THIS LINE to let 'autoplay' attribute try to work
     // music.pause(); // Start paused by default for better compatibility


     // Update button state based on music pause state
     function updateMusicButtonState() {
        if (music.paused) {
            musicToggleBtn.classList.remove('playing');
            musicIcon.classList.remove('fa-volume-up');
            musicIcon.classList.add('fa-volume-mute');
            musicToggleBtn.title = 'Nyalakan Musik';
        } else {
            musicToggleBtn.classList.add('playing');
            musicIcon.classList.remove('fa-volume-mute');
            musicIcon.classList.add('fa-volume-up');
             musicToggleBtn.title = 'Matikan Musik';
        }
     }

     // Add event listener to the button
     musicToggleBtn.addEventListener('click', () => {
        if (music.paused) {
            // Try to play. Play might fail if not initiated by user gesture.
             music.play().then(() => {
                console.log("Music playing");
                updateMusicButtonState();
             }).catch(error => {
                console.error("Music playback failed:", error);
                 // Optionally show a message to the user
             });
        } else {
            music.pause();
            console.log("Music paused");
            updateMusicButtonState();
        }
     });

     // Also update state if music ends or is controlled externally
     music.addEventListener('play', updateMusicButtonState);
     music.addEventListener('pause', updateMusicButtonState);
     music.addEventListener('ended', updateMusicButtonState);

     // Update the button state based on whether the music is playing or not
     // (This will reflect if 'autoplay' actually succeeded)
     updateMusicButtonState();
}


// Add smooth scroll behavior for anchor links (if any added later)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        } else if (targetId === '#') { // Handle href="#"
             window.scrollTo({
                 top: 0,
                 behavior: 'smooth'
             });
        }
    });
});

