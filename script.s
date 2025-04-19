// Open lightbox when an image is clicked
function openLightbox(imageSrc) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  
  // Set the source of the lightbox image
  lightboxImg.src = imageSrc;
  
  // Show the lightbox
  lightbox.style.display = 'flex';
}

// Close lightbox when clicked outside the image
function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.style.display = 'none'; // Hide the lightbox
}
