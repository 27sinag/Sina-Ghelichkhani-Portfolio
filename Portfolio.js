// Portfolio.js - Gallery functionality

document.addEventListener('DOMContentLoaded', function() {
  const projectCards = document.querySelectorAll('.project-card');
  const galleryModal = document.getElementById('gallery-modal');
  const galleryClose = document.querySelector('.gallery-close');
  const galleryImage = document.getElementById('gallery-image');
  const galleryVideo = document.getElementById('gallery-video');
  const galleryPrev = document.querySelector('.gallery-prev');
  const galleryNext = document.querySelector('.gallery-next');
  const galleryCurrent = document.getElementById('gallery-current');
  const galleryTotal = document.getElementById('gallery-total');
  const dropdown = document.querySelector('.dropdown');
  const dropdownBtn = document.querySelector('.dropbtn');
  const dropdownContent = document.querySelector('.dropdown-content');
  let dropdownTimeout;

  let currentMedia = [];
  let currentIndex = 0;
  let hasSplitView = false;

  // Open gallery when project card is clicked and setup hover overlay
  projectCards.forEach(card => {
    const mediaData = card.getAttribute('data-media');
    if (mediaData) {
      try {
        const media = JSON.parse(mediaData);
        
        // Show hover overlay if there are multiple media items (even if some are placeholders)
        if (media.length > 1) {
          const hoverOverlay = card.querySelector('.hover-overlay');
          if (hoverOverlay) {
            hoverOverlay.style.display = 'flex';
          }
        }
        
        if (media.length > 0) {
          const hasSplit = card.getAttribute('data-split-view') === 'true';
          card.addEventListener('click', () => {
            // Include all media items - missing files will show placeholder in gallery
            openGallery(media, hasSplit);
          });
        }
      } catch (e) {
        console.error('Error parsing media data:', e);
      }
    }
  });

  // Dropdown behavior (keep open while moving cursor)
  if (dropdown && dropdownBtn && dropdownContent) {
    const openDropdown = () => {
      clearTimeout(dropdownTimeout);
      dropdownContent.classList.add('show');
    };

    const closeDropdown = () => {
      dropdownTimeout = setTimeout(() => {
        dropdownContent.classList.remove('show');
      }, 400);
    };

    dropdownBtn.addEventListener('mouseenter', openDropdown);
    dropdownBtn.addEventListener('mouseleave', closeDropdown);
    dropdownContent.addEventListener('mouseenter', openDropdown);
    dropdownContent.addEventListener('mouseleave', closeDropdown);

    dropdownBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (dropdownContent.classList.contains('show')) {
        dropdownContent.classList.remove('show');
      } else {
        openDropdown();
      }
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        dropdownContent.classList.remove('show');
      }
    });
  }

  function openGallery(media, splitView = false) {
    currentMedia = media;
    hasSplitView = splitView;
    if (currentMedia.length === 0) return;

    currentIndex = 0;
    galleryModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    updateGallery();
  }

  function closeGallery() {
    galleryModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    if (galleryVideo.src) {
      galleryVideo.pause();
      galleryVideo.src = '';
    }
  }

  function updateGallery() {
    if (currentMedia.length === 0) return;

    const container = document.querySelector('.gallery-media-container');
    
    // Remove any existing placeholder or split view
    const existingPlaceholder = container.querySelector('.gallery-placeholder');
    if (existingPlaceholder) {
      existingPlaceholder.remove();
    }
    const existingSplit = container.querySelector('.gallery-split-container');
    if (existingSplit) {
      existingSplit.remove();
    }

    // Safeguard: if we're at index 1 in split view mode, skip to index 2
    if (hasSplitView && currentIndex === 1 && currentMedia.length > 2) {
      currentIndex = 2;
    }

    // Handle split view (for CNC projects at index 0)
    if (hasSplitView && currentIndex === 0 && currentMedia.length >= 2) {
      // Show split view with first two images
      galleryImage.style.display = 'none';
      galleryVideo.style.display = 'none';
      
      const splitContainer = document.createElement('div');
      splitContainer.className = 'gallery-split-container';
      
      const leftImg = document.createElement('img');
      leftImg.className = 'gallery-split-left';
      leftImg.src = currentMedia[0];
      leftImg.alt = 'CNC 0.5';
      leftImg.onerror = function() {
        this.style.display = 'none';
      };
      
      const rightImg = document.createElement('img');
      rightImg.className = 'gallery-split-right';
      rightImg.src = currentMedia[1];
      rightImg.alt = 'CNC 1.0';
      rightImg.onerror = function() {
        this.style.display = 'none';
      };
      
      splitContainer.appendChild(leftImg);
      splitContainer.appendChild(rightImg);
      container.appendChild(splitContainer);
      
      // Update counter - split view counts as 1 position, then remaining images
      // Total is split view (1) + remaining images (length - 2)
      const totalPositions = 1 + (currentMedia.length - 2);
      galleryTotal.textContent = totalPositions;
      galleryCurrent.textContent = 1;
      
      // Update arrow visibility - next should go to index 2 (skip index 1)
      galleryPrev.style.display = 'none';
      galleryNext.style.display = currentMedia.length > 2 ? 'flex' : 'none';
      return;
    }

    // Normal single image/video view
    const currentItem = currentMedia[currentIndex];
    const isVideo = currentItem.toLowerCase().endsWith('.mp4') || 
                    currentItem.toLowerCase().endsWith('.mov') ||
                    currentItem.toLowerCase().endsWith('.MOV');

    // For split view projects, adjust the displayed position
    // Split view is position 1, then index 2 is position 2, index 3 is position 3, etc.
    let displayPosition;
    if (hasSplitView) {
      // Split view (index 0) = position 1
      // Index 2 = position 2, index 3 = position 3, etc.
      displayPosition = currentIndex === 0 ? 1 : currentIndex;
      const totalPositions = 1 + (currentMedia.length - 2);
      galleryTotal.textContent = totalPositions;
    } else {
      displayPosition = currentIndex + 1;
      galleryTotal.textContent = currentMedia.length;
    }
    galleryCurrent.textContent = displayPosition;

    if (isVideo) {
      galleryImage.style.display = 'none';
      galleryVideo.style.display = 'block';
      galleryVideo.src = currentItem;
      galleryVideo.onerror = function() {
        showGalleryPlaceholder('Video not found');
      };
    } else {
      galleryVideo.style.display = 'none';
      galleryImage.style.display = 'block';
      galleryImage.src = currentItem;
      galleryImage.onerror = function() {
        showGalleryPlaceholder('Image not found');
      };
    }

    // Update arrow visibility
    if (hasSplitView) {
      // At split view (index 0), no prev, next if more than 2 items
      if (currentIndex === 0) {
        galleryPrev.style.display = 'none';
        galleryNext.style.display = currentMedia.length > 2 ? 'flex' : 'none';
      } else {
        // At other positions, normal navigation
        galleryPrev.style.display = 'flex';
        galleryNext.style.display = currentIndex < currentMedia.length - 1 ? 'flex' : 'none';
      }
    } else {
      // Normal projects
      galleryPrev.style.display = currentIndex > 0 ? 'flex' : 'none';
      galleryNext.style.display = currentIndex < currentMedia.length - 1 ? 'flex' : 'none';
    }
  }

  function showGalleryPlaceholder(message) {
    galleryImage.style.display = 'none';
    galleryVideo.style.display = 'none';
    const container = document.querySelector('.gallery-media-container');
    const placeholder = document.createElement('div');
    placeholder.className = 'gallery-placeholder';
    placeholder.innerHTML = `<span>${message}</span>`;
    container.appendChild(placeholder);
  }

  function nextMedia() {
    if (hasSplitView && currentIndex === 0) {
      // Skip index 1 (it's part of the split view), go to index 2
      currentIndex = 2;
    } else if (currentIndex < currentMedia.length - 1) {
      currentIndex++;
    }
    updateGallery();
  }

  function prevMedia() {
    if (hasSplitView) {
      if (currentIndex === 2) {
        // Go back to split view (index 0), skip index 1
        currentIndex = 0;
      } else if (currentIndex > 2) {
        // Normal decrement for indices > 2
        currentIndex--;
      } else if (currentIndex === 1) {
        // Shouldn't happen, but if we're at index 1, go to split view
        currentIndex = 0;
      }
    } else {
      if (currentIndex > 0) {
        currentIndex--;
      }
    }
    updateGallery();
  }

  // Event listeners
  galleryClose.addEventListener('click', closeGallery);
  galleryPrev.addEventListener('click', prevMedia);
  galleryNext.addEventListener('click', nextMedia);

  // Close on background click
  galleryModal.addEventListener('click', function(e) {
    if (e.target === galleryModal) {
      closeGallery();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (galleryModal.style.display === 'flex') {
      if (e.key === 'Escape') {
        closeGallery();
      } else if (e.key === 'ArrowLeft') {
        prevMedia();
      } else if (e.key === 'ArrowRight') {
        nextMedia();
      }
    }
  });

  // Handle dropdown menu links - open gallery instead of scrolling
  const dropdownLinks = document.querySelectorAll('.dropdown-content a');
  dropdownLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault(); // Prevent default anchor behavior
      
      // Get the project ID from the href (e.g., "#electric-scooter")
      const projectId = this.getAttribute('href').substring(1);
      
      // Find the corresponding project card
      const projectCard = document.getElementById(projectId);
      if (projectCard) {
        const mediaData = projectCard.getAttribute('data-media');
        const hasSplit = projectCard.getAttribute('data-split-view') === 'true';
        if (mediaData) {
          try {
            const media = JSON.parse(mediaData);
            if (media.length > 0) {
              openGallery(media, hasSplit);
            }
          } catch (e) {
            console.error('Error parsing media data:', e);
          }
        }
      }
    });
  });
});

