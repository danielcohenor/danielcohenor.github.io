const galleryItems = [...document.querySelectorAll('.gallery-item')];
const lightbox = document.querySelector('.gallery-lightbox');
const lightboxImage = document.querySelector('.gallery-lightbox-image');
const lightboxCounter = document.querySelector('.gallery-lightbox-counter');
const lightboxClose = document.querySelector('.gallery-lightbox-close');
const lightboxPrevious = document.querySelector('.gallery-lightbox-prev');
const lightboxNext = document.querySelector('.gallery-lightbox-next');
let activePhotoIndex = 0;

function showGalleryPhoto(index) {
  activePhotoIndex = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[activePhotoIndex];
  const thumbnail = item.querySelector('img');
  lightboxImage.src = item.href;
  lightboxImage.alt = thumbnail.alt;
  lightboxCounter.textContent = `${activePhotoIndex + 1} / ${galleryItems.length}`;

  if (!lightbox.open) lightbox.showModal();
}

galleryItems.forEach((item, index) => {
  item.addEventListener('click', (event) => {
    event.preventDefault();
    showGalleryPhoto(index);
  });
});

lightboxPrevious.addEventListener('click', () => showGalleryPhoto(activePhotoIndex - 1));
lightboxNext.addEventListener('click', () => showGalleryPhoto(activePhotoIndex + 1));
lightboxClose.addEventListener('click', () => lightbox.close());

lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});

document.addEventListener('keydown', (event) => {
  if (!lightbox.open) return;
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    showGalleryPhoto(activePhotoIndex - 1);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    showGalleryPhoto(activePhotoIndex + 1);
  }
});