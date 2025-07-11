/**
 * PolyHue Image Upload Component
 * 
 * Handles image upload, validation, and processing
 * Supports drag-drop, file dialog, and auto-downscaling
 */

class ImageUploadComponent {
    constructor() {
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.maxImageSize = 4096; // 4096px
        this.supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
        this.dropZones = [];
        this.fileInput = null;
        this.currentFile = null;
        this.processingQueue = [];
        
        this.init = this.init.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDragLeave = this.handleDragLeave.bind(this);
        this.handleFileSelect = this.handleFileSelect.bind(this);
        this.processFile = this.processFile.bind(this);
    }

    /**
     * Initialize the image upload component
     */
    init() {
        this.setupDropZones();
        this.setupFileInput();
        this.setupPreviewCanvas();
        this.bindEvents();
        
        console.log('Image upload component initialized');
    }

    /**
     * Set up drop zones for drag and drop
     */
    setupDropZones() {
        // Main upload area
        const mainDropZone = document.getElementById('image-upload-area');
        if (mainDropZone) {
            this.dropZones.push(mainDropZone);
        }
        
        // Entire preview container can also act as drop zone
        const previewContainer = document.getElementById('preview-container');
        if (previewContainer) {
            this.dropZones.push(previewContainer);
        }
        
        // Set up event listeners for each drop zone
        this.dropZones.forEach(zone => {
            zone.addEventListener('dragover', this.handleDragOver);
            zone.addEventListener('dragleave', this.handleDragLeave);
            zone.addEventListener('drop', this.handleDrop);
        });
    }

    /**
     * Set up file input element
     */
    setupFileInput() {
        this.fileInput = document.getElementById('image-input');
        if (this.fileInput) {
            this.fileInput.addEventListener('change', this.handleFileSelect);
        }
    }

    /**
     * Set up preview canvas
     */
    setupPreviewCanvas() {
        this.previewCanvas = document.getElementById('image-preview');
        if (this.previewCanvas) {
            this.previewContext = this.previewCanvas.getContext('2d');
        }
    }

    /**
     * Bind additional events
     */
    bindEvents() {
        // Click to upload - Remove this here since it's handled in app.js
        // const uploadArea = document.getElementById('image-upload-area');
        // if (uploadArea) {
        //     uploadArea.addEventListener('click', () => {
        //         if (this.fileInput) {
        //             this.fileInput.click();
        //         }
        //     });
        // }
        
        // Paste from clipboard
        document.addEventListener('paste', (e) => {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.indexOf('image') === 0) {
                    const file = item.getAsFile();
                    if (file) {
                        this.processFile(file);
                    }
                }
            }
        });
        
        // URL input (for future enhancement)
        document.addEventListener('polyhue:load-url', (e) => {
            if (e.detail.url) {
                this.loadImageFromURL(e.detail.url);
            }
        });
    }

    /**
     * Handle drag over event
     * @param {DragEvent} e - Drag event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if dragged files contain images
        const hasImages = Array.from(e.dataTransfer.items).some(item => 
            item.kind === 'file' && item.type.startsWith('image/')
        );
        
        if (hasImages) {
            e.dataTransfer.dropEffect = 'copy';
            e.currentTarget.classList.add('drag-over');
        } else {
            e.dataTransfer.dropEffect = 'none';
        }
    }

    /**
     * Handle drag leave event
     * @param {DragEvent} e - Drag event
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
    }

    /**
     * Handle drop event
     * @param {DragEvent} e - Drop event
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => this.isValidImageFile(file));
        
        if (imageFiles.length > 0) {
            // Process the first image file
            this.processFile(imageFiles[0]);
            
            // Warn if multiple files were dropped
            if (imageFiles.length > 1) {
                this.showWarning(`Multiple images detected. Processing the first one: ${imageFiles[0].name}`);
            }
        } else {
            this.showError('No valid image files found. Please upload PNG, JPG, SVG, or WebP files.');
        }
    }

    /**
     * Handle file selection from input
     * @param {Event} e - File input change event
     */
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    /**
     * Process uploaded file
     * @param {File} file - Image file to process
     */
    async processFile(file) {
        try {
            // Validate file
            if (!this.isValidImageFile(file)) {
                throw new Error('Invalid file type. Please upload PNG, JPG, SVG, or WebP files.');
            }
            
            if (file.size > this.maxFileSize) {
                throw new Error(`File too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}.`);
            }
            
            // Set processing state
            this.setProcessingState(true, 'Loading image...');
            
            // Store current file
            this.currentFile = file;
            
            // Process based on file type
            let bitmap;
            if (file.type === 'image/svg+xml') {
                bitmap = await this.processSVGFile(file);
            } else {
                bitmap = await this.processRasterFile(file);
            }
            
            // Check and resize if needed
            if (bitmap.width > this.maxImageSize || bitmap.height > this.maxImageSize) {
                this.showWarning(`Image resized from ${bitmap.width}x${bitmap.height} to fit ${this.maxImageSize}px limit.`);
                bitmap = await this.resizeImage(bitmap);
            }
            
            // Update state
            this.updateImageState(bitmap);
            
            // Update preview
            this.updatePreview(bitmap);
            
            // Enable edit controls
            this.enableEditControls();
            
            // Dispatch success event
            this.dispatchEvent('image:loaded', { 
                bitmap, 
                file: this.currentFile 
            });
            
            this.setProcessingState(false);
            
        } catch (error) {
            this.handleError('Failed to process image', error);
            this.setProcessingState(false);
        }
    }

    /**
     * Process SVG file
     * @param {File} file - SVG file
     * @returns {Promise<ImageBitmap>} Processed image bitmap
     */
    async processSVGFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const svgText = e.target.result;
                const img = new Image();
                
                img.onload = () => {
                    createImageBitmap(img)
                        .then(resolve)
                        .catch(reject);
                };
                
                img.onerror = () => {
                    reject(new Error('Failed to load SVG image'));
                };
                
                // Create blob URL from SVG text
                const blob = new Blob([svgText], { type: 'image/svg+xml' });
                img.src = URL.createObjectURL(blob);
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read SVG file'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Process raster image file
     * @param {File} file - Raster image file
     * @returns {Promise<ImageBitmap>} Processed image bitmap
     */
    async processRasterFile(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                createImageBitmap(img)
                    .then(resolve)
                    .catch(reject);
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Resize image to fit within maximum dimensions
     * @param {ImageBitmap} bitmap - Original image bitmap
     * @returns {Promise<ImageBitmap>} Resized image bitmap
     */
    async resizeImage(bitmap) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        const aspectRatio = bitmap.width / bitmap.height;
        let newWidth, newHeight;
        
        if (bitmap.width > bitmap.height) {
            newWidth = this.maxImageSize;
            newHeight = newWidth / aspectRatio;
        } else {
            newHeight = this.maxImageSize;
            newWidth = newHeight * aspectRatio;
        }
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Use high-quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
        
        return createImageBitmap(canvas);
    }

    /**
     * Load image from URL
     * @param {string} url - Image URL
     */
    async loadImageFromURL(url) {
        try {
            this.setProcessingState(true, 'Loading image from URL...');
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            
            // Create a file-like object
            const file = new File([blob], 'image-from-url', { type: blob.type });
            
            await this.processFile(file);
            
        } catch (error) {
            this.handleError('Failed to load image from URL', error);
            this.setProcessingState(false);
        }
    }

    /**
     * Update image state in store
     * @param {ImageBitmap} bitmap - Image bitmap
     */
    updateImageState(bitmap) {
        const project = window.PolyHue.stores.project;
        project.set('originalImage', bitmap);
        project.set('modified', new Date().toISOString());
        
        // Reset image settings
        project.set('imageSettings', {
            brightness: 0,
            contrast: 0,
            backgroundRemoval: false,
            rotation: 0,
            cropArea: null
        });
    }

    /**
     * Update preview canvas
     * @param {ImageBitmap} bitmap - Image bitmap
     */
    updatePreview(bitmap) {
        if (!this.previewCanvas || !this.previewContext) return;
        
        // Calculate canvas size to fit the preview area
        const container = this.previewCanvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const aspectRatio = bitmap.width / bitmap.height;
        let canvasWidth, canvasHeight;
        
        if (containerWidth / containerHeight > aspectRatio) {
            canvasHeight = containerHeight;
            canvasWidth = canvasHeight * aspectRatio;
        } else {
            canvasWidth = containerWidth;
            canvasHeight = canvasWidth / aspectRatio;
        }
        
        this.previewCanvas.width = canvasWidth;
        this.previewCanvas.height = canvasHeight;
        
        // Clear and draw image
        this.previewContext.clearRect(0, 0, canvasWidth, canvasHeight);
        this.previewContext.drawImage(bitmap, 0, 0, canvasWidth, canvasHeight);
        
        // Show preview canvas
        this.previewCanvas.classList.remove('hidden');
        
        // Hide loading state
        const loadingElement = document.getElementById('preview-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    /**
     * Enable edit controls
     */
    enableEditControls() {
        const editControls = document.getElementById('image-edit-controls');
        if (editControls) {
            editControls.classList.remove('hidden');
        }
        
        // Enable preview controls
        const previewControls = document.querySelectorAll('#toggle-overlay, #toggle-3d');
        previewControls.forEach(control => {
            control.classList.remove('hidden');
        });
    }

    /**
     * Validate image file
     * @param {File} file - File to validate
     * @returns {boolean} Whether file is valid
     */
    isValidImageFile(file) {
        return this.supportedTypes.includes(file.type);
    }

    /**
     * Set processing state
     * @param {boolean} isProcessing - Whether processing is active
     * @param {string} message - Processing message
     */
    setProcessingState(isProcessing, message = '') {
        const project = window.PolyHue.stores.project;
        project.set('isProcessing', isProcessing);
        project.set('processingStep', message);
        
        // Update UI
        const uploadArea = document.getElementById('image-upload-area');
        if (uploadArea) {
            uploadArea.classList.toggle('processing', isProcessing);
        }
        
        // Update loading text and visibility
        const loadingElement = document.getElementById('preview-loading');
        const loadingText = loadingElement?.querySelector('p');
        
        if (isProcessing && message) {
            if (loadingText) {
                loadingText.innerHTML = `<div class="loading-spinner inline-block mr-2"></div>${message}`;
            }
            if (loadingElement) {
                loadingElement.style.display = 'flex';
            }
        }
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size string
     */
    formatFileSize(bytes) {
        return window.PolyHue.Utils.formatFileSize(bytes);
    }

    /**
     * Show warning message
     * @param {string} message - Warning message
     */
    showWarning(message) {
        console.warn(message);
        // For now, just log. Can be enhanced with proper notification system
        // Could create a toast notification or update a status area
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        console.error(message);
        alert(message); // Simple for now, can be enhanced
    }

    /**
     * Handle errors
     * @param {string} message - Error message
     * @param {Error} error - Error object
     */
    handleError(message, error) {
        console.error(message, error);
        this.showError(`${message}: ${error.message}`);
        
        const project = window.PolyHue.stores.project;
        project.set('error', message);
    }

    /**
     * Dispatch custom event
     * @param {string} eventName - Event name
     * @param {Object} data - Event data
     */
    dispatchEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    /**
     * Get current image information
     * @returns {Object} Image information
     */
    getImageInfo() {
        if (!this.currentFile) return null;
        
        const project = window.PolyHue.stores.project;
        const bitmap = project.get('originalImage');
        
        return {
            file: this.currentFile,
            name: this.currentFile.name,
            type: this.currentFile.type,
            size: this.currentFile.size,
            width: bitmap?.width || 0,
            height: bitmap?.height || 0,
            lastModified: new Date(this.currentFile.lastModified).toISOString()
        };
    }

    /**
     * Clear current image
     */
    clearImage() {
        // Reset state
        this.currentFile = null;
        
        const project = window.PolyHue.stores.project;
        project.set('originalImage', null);
        project.set('processedImage', null);
        project.set('imageSettings', {
            brightness: 0,
            contrast: 0,
            backgroundRemoval: false,
            rotation: 0,
            cropArea: null
        });
        
        // Reset UI
        if (this.previewCanvas) {
            this.previewCanvas.classList.add('hidden');
            this.previewContext.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        }
        
        const editControls = document.getElementById('image-edit-controls');
        if (editControls) {
            editControls.classList.add('hidden');
        }
        
        const loadingElement = document.getElementById('preview-loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
            const loadingText = loadingElement.querySelector('p');
            if (loadingText) {
                loadingText.textContent = 'Upload an image to begin';
            }
        }
        
        // Reset file input
        if (this.fileInput) {
            this.fileInput.value = '';
        }
        
        this.dispatchEvent('image:cleared');
    }
}

// Export for global access
window.PolyHue = window.PolyHue || {};
window.PolyHue.ImageUpload = ImageUploadComponent;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageUploadComponent;
} 