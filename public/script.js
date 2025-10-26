class MediaManager {
  constructor() {
    this.apiBase = '/api/v1';
    this.imageBlobUrls = {}; // Store blob URLs for image previews
    this.loadStoredBlobUrls(); // Load blob URLs from localStorage
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadMedia();
  }

  bindEvents() {
    // Upload form
    const uploadForm = document.getElementById('uploadForm');
    uploadForm.addEventListener('submit', (e) => this.handleUpload(e));

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.addEventListener('click', () => this.loadMedia());

    // Type filter
    const typeFilter = document.getElementById('typeFilter');
    typeFilter.addEventListener('change', () => this.loadMedia());
  }

  async handleUpload(e) {
    e.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const titleInput = document.getElementById('titleInput');
    const uploadBtn = document.querySelector('.upload-btn');
    const progressDiv = document.getElementById('uploadProgress');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.getElementById('progressText');

    const file = fileInput.files[0];
    const title = titleInput.value.trim();

    if (!file || !title) {
      this.showNotification('Please select a file and enter a title', 'error');
      return;
    }

    // Disable upload button and show progress
    uploadBtn.disabled = true;
    progressDiv.classList.remove('hidden');
    progressFill.style.width = '0%';

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);

      // Simulate upload progress (since we don't have actual upload endpoint yet)
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 90) progress = 90;
        progressFill.style.width = progress + '%';
        progressText.textContent = `Uploading... ${Math.round(progress)}%`;
      }, 200);

      // For now, we'll create a mock media entry since the upload endpoint requires auth
      // In a real implementation, this would be a POST to /upload/whole-file
      const mediaEntry = await this.createMockMedia(file, title);

      // Store the blob URL for image preview
      if (file.type.startsWith('image/')) {
        this.imageBlobUrls[mediaEntry.id] = URL.createObjectURL(file);
        this.saveBlobUrlToStorage(
          mediaEntry.id,
          this.imageBlobUrls[mediaEntry.id],
        );
      }

      clearInterval(progressInterval);
      progressFill.style.width = '100%';
      progressText.textContent = 'Upload completed!';

      // Reset form and hide progress
      setTimeout(() => {
        uploadForm.reset();
        progressDiv.classList.add('hidden');
        uploadBtn.disabled = false;
        this.loadMedia(); // Refresh media list
        this.showNotification('File uploaded successfully!', 'success');
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      progressText.textContent = 'Upload failed';
      uploadBtn.disabled = false;
      this.showNotification('Upload failed. Please try again.', 'error');
    }
  }

  async createMockMedia(file, title) {
    // Create a mock media entry for demonstration
    const mediaData = {
      filename: `mock-${Date.now()}-${file.name}`,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: `/uploads/mock/${file.name}`,
      type: this.getMediaType(file.type),
      width: file.type.startsWith('image/') ? 1920 : null,
      height: file.type.startsWith('image/') ? 1080 : null,
      userId: 'demo-user',
    };

    try {
      const response = await fetch(`${this.apiBase}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mediaData),
      });

      if (!response.ok) {
        throw new Error('Failed to create media entry');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating media:', error);
      throw error;
    }
  }

  getMediaType(mimeType) {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    return 'DOCUMENT';
  }

  async loadMedia() {
    const mediaGrid = document.getElementById('mediaGrid');
    const loading = document.getElementById('loading');
    const noMedia = document.getElementById('noMedia');
    const typeFilter = document.getElementById('typeFilter');

    // Show loading
    loading.classList.remove('hidden');
    noMedia.classList.add('hidden');
    mediaGrid.innerHTML = '';

    try {
      let url = `${this.apiBase}/media`;
      if (typeFilter.value) {
        url += `?type=${typeFilter.value}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch media');
      }

      const media = await response.json();

      // Hide loading
      loading.classList.add('hidden');

      if (media.length === 0) {
        noMedia.classList.remove('hidden');
        return;
      }

      // Render media items
      media.forEach((item) => {
        const mediaItem = this.createMediaItem(item);
        mediaGrid.appendChild(mediaItem);
      });
    } catch (error) {
      console.error('Error loading media:', error);
      loading.classList.add('hidden');
      this.showNotification('Failed to load media', 'error');
    }
  }

  createMediaItem(media) {
    const mediaItem = document.createElement('div');
    mediaItem.className = 'media-item';
    mediaItem.dataset.id = media.id;

    const preview = this.createMediaPreview(media);
    const info = this.createMediaInfo(media);
    const actions = this.createMediaActions(media);

    mediaItem.appendChild(preview);
    mediaItem.appendChild(info);
    mediaItem.appendChild(actions);

    return mediaItem;
  }

  createMediaPreview(media) {
    const preview = document.createElement('div');
    preview.className = 'media-preview';

    if (media.type === 'IMAGE') {
      const img = document.createElement('img');
      // Use stored blob URL if available, otherwise use placeholder
      img.src =
        this.imageBlobUrls[media.id] ||
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5uZS4iIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg4MFY4MEgyMFYyMFoiIGZpbGw9IiNFMkU4RjAiLz4KPHBhdGggZD0iTTMwIDMwTDUwIDUwTDcwIDMwIiBzdHJva2U9IiM5Q0EzQjAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K';
      img.alt = media.originalName;
      preview.appendChild(img);
    } else if (media.type === 'VIDEO') {
      preview.innerHTML = '🎥';
    } else {
      preview.innerHTML = '📄';
    }

    return preview;
  }

  createMediaInfo(media) {
    const info = document.createElement('div');
    info.className = 'media-info';

    const title = document.createElement('h3');
    title.textContent = media.originalName || 'Untitled';

    const meta = document.createElement('div');
    meta.className = 'media-meta';
    meta.innerHTML = `
            <div>Type: ${media.type}</div>
            <div>Size: ${this.formatFileSize(media.size)}</div>
            <div>Uploaded: ${new Date(media.createdAt).toLocaleDateString()}</div>
        `;

    const status = document.createElement('div');
    status.className = `media-status status-${media.status.toLowerCase()}`;
    status.textContent = media.status;

    info.appendChild(title);
    info.appendChild(meta);
    info.appendChild(status);

    return info;
  }

  createMediaActions(media) {
    const actions = document.createElement('div');
    actions.className = 'media-actions';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => this.deleteMedia(media.id));

    actions.appendChild(deleteBtn);
    return actions;
  }

  async deleteMedia(mediaId) {
    if (!confirm('Are you sure you want to delete this media?')) {
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/media/${mediaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete media');
      }

      // Clean up blob URL
      this.cleanupBlobUrl(mediaId);

      // Remove from DOM
      const mediaItem = document.querySelector(`[data-id="${mediaId}"]`);
      if (mediaItem) {
        mediaItem.remove();
      }

      this.showNotification('Media deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting media:', error);
      this.showNotification('Failed to delete media', 'error');
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 20px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '600',
      zIndex: '1000',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
    });

    // Set background color based on type
    const colors = {
      success: '#48bb78',
      error: '#e53e3e',
      info: '#4299e1',
    };
    notification.style.background = colors[type] || colors.info;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Storage methods for blob URLs
  saveBlobUrlToStorage(mediaId, blobUrl) {
    try {
      const storedUrls = JSON.parse(
        localStorage.getItem('oreoImageBlobUrls') || '{}',
      );
      storedUrls[mediaId] = blobUrl;
      localStorage.setItem('oreoImageBlobUrls', JSON.stringify(storedUrls));
    } catch (error) {
      console.error('Error saving blob URL to storage:', error);
    }
  }

  loadStoredBlobUrls() {
    try {
      const storedUrls = JSON.parse(
        localStorage.getItem('oreoImageBlobUrls') || '{}',
      );
      this.imageBlobUrls = storedUrls;
    } catch (error) {
      console.error('Error loading blob URLs from storage:', error);
      this.imageBlobUrls = {};
    }
  }

  // Clean up blob URLs when media is deleted
  cleanupBlobUrl(mediaId) {
    if (this.imageBlobUrls[mediaId]) {
      URL.revokeObjectURL(this.imageBlobUrls[mediaId]);
      delete this.imageBlobUrls[mediaId];

      // Also remove from localStorage
      try {
        const storedUrls = JSON.parse(
          localStorage.getItem('oreoImageBlobUrls') || '{}',
        );
        delete storedUrls[mediaId];
        localStorage.setItem('oreoImageBlobUrls', JSON.stringify(storedUrls));
      } catch (error) {
        console.error('Error cleaning up blob URL from storage:', error);
      }
    }
  }
}

// Initialize the media manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new MediaManager();
});
