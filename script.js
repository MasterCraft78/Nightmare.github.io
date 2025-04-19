// --- Global Variables ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
// Target the span inside the caption for text updates
const lightboxCaptionSpan = document.querySelector('#lightbox-caption span');
const galleryItemsNodeList = document.querySelectorAll('.gallery-item');
let currentVisibleItems = []; // Array to store currently visible gallery items
let currentImageIndex = 0; // Index within the currentVisibleItems array

// --- Initialization ---
// Use DOMContentLoaded for quicker script execution on document structure readiness
document.addEventListener('DOMContentLoaded', function() {
    initParticles();
    initSeasonFilter();
    initGalleryItemListeners();
    updateCopyrightYear();
    initLightboxKeyboardNav();

    // Update visible items initially to include only S1 if 'All Season' is active
    // (Which it is by default)
    updateVisibleItems();

    // Hide loader after a delay (simulated load time) and content is ready
    window.addEventListener('load', function() {
         // Give a small minimum time for the animation to show
        setTimeout(() => {
            document.getElementById('page-loader').classList.remove('active');
        }, 800); // Reduced delay slightly
    });
});

// --- Core Functions ---

// Initialize Particle Background Effect
function initParticles() {
    const particlesContainer = document.getElementById('particles-js');
    if (!particlesContainer) return;

    // Reduce particle count on smaller screens for performance
    const particleCount = window.innerWidth < 768 ? 25 : 40;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Slightly larger max size
        const size = Math.random() * 2.5 + 0.5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;

        // Set random drift values as CSS variables for the animation
        particle.style.setProperty('--x-drift', `${Math.random() * 100 - 50}px`);
        particle.style.setProperty('--y-drift', `${Math.random() * 100 - 50}px`);

        // Randomize animation duration and delay
        particle.style.animationDuration = `${Math.random() * 15 + 15}s`;
        particle.style.animationDelay = `${Math.random() * 10}s`;

        particlesContainer.appendChild(particle);
    }
}

// Set up season filter buttons
function initSeasonFilter() {
    const filterButtons = document.querySelectorAll('.season-btn');
    const galleryItems = document.querySelectorAll('.gallery-item'); // Use a new query for live list

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const season = button.dataset.season;

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
        });
    });
}

// Add click listeners to gallery items to open lightbox
function initGalleryItemListeners() {
    // Use event delegation on the gallery container for efficiency
    const galleryContainer = document.querySelector('.gallery');
    if (!galleryContainer) return;

    galleryContainer.addEventListener('click', (event) => {
        const galleryItem = event.target.closest('.gallery-item'); // Find the clicked gallery item or a descendant

        // Ensure a gallery item was clicked and it's currently visible
        if (galleryItem && window.getComputedStyle(galleryItem).display !== 'none') {
             // Prevent opening if a link/button inside the item was clicked (like the view button itself)
            if (event.target.tagName === 'BUTTON' || event.target.tagName === 'A' || event.target.parentElement.tagName === 'BUTTON' || event.target.parentElement.tagName === 'A') {
                 // If it's the view button, we still want the default behavior (opening lightbox)
                 if (event.target.closest('.view-btn')) {
                     event.preventDefault(); // Prevent default button action if any
                 } else {
                    return; // Don't open lightbox if another interactive element was clicked
                 }
            }


            const imageSrc = galleryItem.dataset.src;
            const caption = galleryItem.dataset.caption || "Gambar Galeri Nightmare"; // Default caption

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
    // Hide nav buttons if only one or zero visible items
    const navBtns = document.querySelectorAll('.lightbox-nav-btn');
     if (navBtns) {
        navBtns.forEach(btn => {
            btn.style.display = currentVisibleItems.length <= 1 ? 'none' : 'flex'; // Use flex as they are flex items
        });
     }

}

// Open lightbox with a specific image and caption
function openLightbox(imageSrc, caption) {
    if (!lightbox || !lightboxImg || !lightboxCaptionSpan) return;

    // Apply fade-in effect for image/caption change if already open
    if (lightbox.classList.contains('active')) {
        lightboxImg.style.opacity = '0';
         // Check if caption exists before trying to update and fade
        if (lightboxCaptionSpan.parentNode) { // Check if parent (the <p>) exists
             lightboxCaptionSpan.parentNode.style.opacity = '0';
        }

        setTimeout(() => {
            lightboxImg.src = imageSrc;
            lightboxImg.alt = caption || "Gambar Galeri Diperbesar"; // Update alt text

             // Update caption text and visibility
            if (caption) {
                lightboxCaptionSpan.textContent = caption;
                 if (lightboxCaptionSpan.parentNode) lightboxCaptionSpan.parentNode.style.display = 'flex'; // Show parent
                 setTimeout(() => { if (lightboxCaptionSpan.parentNode) lightboxCaptionSpan.parentNode.style.opacity = '1'; }, 50); // Slight delay after display
            } else {
                lightboxCaptionSpan.textContent = ''; // Clear text
                if (lightboxCaptionSpan.parentNode) lightboxCaptionSpan.parentNode.style.display = 'none'; // Hide parent if no caption
            }

            lightboxImg.style.opacity = '1';

        }, 300); // Match CSS transition duration

    } else {
        // First time opening
        lightboxImg.src = imageSrc;
        lightboxImg.alt = caption || "Gambar Galeri Diperbesar"; // Set alt text

         // Set caption text and visibility for first open
        if (caption) {
            lightboxCaptionSpan.textContent = caption;
             if (lightboxCaptionSpan.parentNode) {
                 lightboxCaptionSpan.parentNode.style.display = 'flex'; // Show parent
                 lightboxCaptionSpan.parentNode.style.opacity = '1'; // Ensure opacity is 1
             }
        } else {
            lightboxCaptionSpan.textContent = ''; // Clear text
            if (lightboxCaptionSpan.parentNode) lightboxCaptionSpan.parentNode.style.display = 'none'; // Hide parent if no caption
        }


        lightbox.classList.add('active'); // Trigger CSS transition
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

// Close lightbox
function closeLightbox(event) {
    // Check if the click was directly on the overlay background or the close button
    // Stop propagation was added to navigateLightbox, so check event target is sufficient
    if (!event || event.target === lightbox || event.target.classList.contains('lightbox-close')) {
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
       event.stopPropagation(); // Prevent closing lightbox when clicking nav buttons
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
        const caption = nextItem.dataset.caption || "Gambar Galeri Nightmare";
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
        }
    });
}

// Add smooth scroll behavior for anchor links (if any added later)
// This is optional but good practice if you add #links
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
