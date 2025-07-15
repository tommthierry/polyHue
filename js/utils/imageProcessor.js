/**
 * PolyHue - Image Processing Utilities
 * 
 * Handles image validation, processing, resizing, and preparation
 * for color quantization and 3D model generation.
 */

/**
 * Image processor class with static methods for image operations
 */
window.ImageProcessor = class ImageProcessor {
    
    /**
     * Validate an image file before processing
     * @param {File} file - The image file to validate
     * @returns {ValidationResult} Validation result with details
     */
    static validateFile(file) {
        const result = {
            valid: true,
            error: null,
            warnings: [],
            metadata: null
        };

        // Check if file exists
        if (!file) {
            result.valid = false;
            result.error = 'No file provided';
            return result;
        }

        // Check file type
        if (!window.APP_CONSTANTS.SUPPORTED_MIME_TYPES.includes(file.type)) {
            result.valid = false;
            result.error = `Unsupported file format: ${file.type}. Supported formats: PNG, JPEG`;
            return result;
        }

        // Check file size
        if (file.size > window.APP_CONSTANTS.MAX_FILE_SIZE) {
            result.valid = false;
            result.error = `File size too large: ${this.formatFileSize(file.size)}. Maximum allowed: ${this.formatFileSize(window.APP_CONSTANTS.MAX_FILE_SIZE)}`;
            return result;
        }

        // Add file size warning if it's quite large
        if (file.size > 10 * 1024 * 1024) { // 10MB
            result.warnings.push('Large file size may affect performance');
        }

        // Set metadata
        result.metadata = {
            format: file.type.split('/')[1],
            size: file.size,
            name: file.name
        };

        return result;
    }

    /**
     * Load and process an image file
     * @param {File} file - The image file to process
     * @param {Object} options - Processing options
     * @returns {Promise<ImageData>} Processed image data
     */
    static async processFile(file, options = {}) {
        const defaultOptions = {
            maxWidth: window.APP_CONSTANTS.MAX_IMAGE_WIDTH,
            maxHeight: window.APP_CONSTANTS.MAX_IMAGE_HEIGHT,
            autoResize: true,
            quality: 0.9,
            preserveAspectRatio: true
        };

        const config = { ...defaultOptions, ...options };

        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    let { width, height } = img;
                    const originalWidth = width;
                    const originalHeight = height;
                    let wasResized = false;

                    // Calculate new dimensions if resizing is needed
                    if (config.autoResize && (width > config.maxWidth || height > config.maxHeight)) {
                        const aspectRatio = width / height;
                        
                        if (width > height) {
                            width = Math.min(width, config.maxWidth);
                            height = width / aspectRatio;
                        } else {
                            height = Math.min(height, config.maxHeight);
                            width = height * aspectRatio;
                        }
                        
                        // Ensure we don't exceed either dimension
                        if (width > config.maxWidth) {
                            width = config.maxWidth;
                            height = width / aspectRatio;
                        }
                        if (height > config.maxHeight) {
                            height = config.maxHeight;
                            width = height * aspectRatio;
                        }
                        
                        wasResized = true;
                    }

                    // Set canvas dimensions (ensure integers)
                    canvas.width = Math.floor(width);
                    canvas.height = Math.floor(height);

                    // Draw image to canvas
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Get image data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                    // Create result object
                    const result = {
                        src: canvas.toDataURL('image/png', config.quality),
                        width: canvas.width,
                        height: canvas.height,
                        aspectRatio: canvas.width / canvas.height,
                        fileSize: file.size,
                        fileName: file.name,
                        format: file.type,
                        canvas: canvas,
                        data: imageData.data,
                        wasResized: wasResized,
                        originalDimensions: {
                            width: originalWidth,
                            height: originalHeight
                        }
                    };

                    resolve(result);
                } catch (error) {
                    reject(new Error(`Failed to process image: ${error.message}`));
                }
            };

            img.onerror = () => {
                reject(new Error('Failed to load image. The file may be corrupted.'));
            };

            // Load the image
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Convert RGB values to HEX
     * @param {number} r - Red value (0-255)
     * @param {number} g - Green value (0-255)
     * @param {number} b - Blue value (0-255)
     * @returns {string} HEX color string
     */
    static rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    /**
     * Convert HEX to RGB values
     * @param {string} hex - HEX color string
     * @returns {Object} RGB color object
     */
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Check browser support for required features
     * @returns {Object} Support status for various features
     */
    static checkBrowserSupport() {
        return {
            canvas: !!document.createElement('canvas').getContext,
            webgl: !!document.createElement('canvas').getContext('webgl'),
            fileApi: window.File && window.FileReader && window.FileList && window.Blob,
            objectUrl: !!window.URL && !!window.URL.createObjectURL,
            webWorkers: typeof Worker !== 'undefined'
        };
    }

    /**
     * Generate thumbnail from image
     * @param {File} file - Image file
     * @param {number} size - Thumbnail size (default: 150)
     * @returns {Promise<string>} Data URL of thumbnail
     */
    static async generateThumbnail(file, size = 150) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate thumbnail dimensions
                const aspectRatio = img.width / img.height;
                let width, height;
                
                if (aspectRatio > 1) {
                    width = size;
                    height = size / aspectRatio;
                } else {
                    height = size;
                    width = size * aspectRatio;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw thumbnail
                ctx.drawImage(img, 0, 0, width, height);
                
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            
            img.onerror = () => reject(new Error('Failed to generate thumbnail'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Extract dominant colors from image
     * @param {ImageData} imageData - Image data from canvas
     * @param {number} colorCount - Number of colors to extract
     * @returns {Array} Array of color objects
     */
    static extractColors(imageData, colorCount = 6) {
        // Simple color extraction algorithm
        const data = imageData.data;
        const colorMap = new Map();
        
        // Sample every nth pixel for performance
        const sampleRate = Math.max(1, Math.floor(data.length / (4 * 10000))); // Sample ~10k pixels max
        
        for (let i = 0; i < data.length; i += 4 * sampleRate) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Skip transparent pixels
            if (a < 128) continue;
            
            // Quantize colors to reduce variations
            const qr = Math.floor(r / 32) * 32;
            const qg = Math.floor(g / 32) * 32;
            const qb = Math.floor(b / 32) * 32;
            
            const key = `${qr},${qg},${qb}`;
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }
        
        // Get most frequent colors
        const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, colorCount)
            .map(([key, count], index) => {
                const [r, g, b] = key.split(',').map(Number);
                return {
                    id: index,
                    hex: this.rgbToHex(r, g, b),
                    rgb: { r, g, b },
                    count: count,
                    percent: 0, // Will be calculated later
                    custom: false,
                    height: window.APP_CONSTANTS.DEFAULT_MODEL_HEIGHT / colorCount,
                    order: index
                };
            });
        
        // Calculate percentages
        const totalCount = sortedColors.reduce((sum, color) => sum + color.count, 0);
        sortedColors.forEach(color => {
            color.percent = Math.round((color.count / totalCount) * 100);
        });
        
        return sortedColors;
    }
};

/**
 * Utility functions available globally
 */
window.imageUtils = {
    validateFile: window.ImageProcessor.validateFile.bind(window.ImageProcessor),
    processFile: window.ImageProcessor.processFile.bind(window.ImageProcessor),
    formatFileSize: window.ImageProcessor.formatFileSize.bind(window.ImageProcessor),
    rgbToHex: window.ImageProcessor.rgbToHex.bind(window.ImageProcessor),
    hexToRgb: window.ImageProcessor.hexToRgb.bind(window.ImageProcessor),
    checkSupport: window.ImageProcessor.checkBrowserSupport.bind(window.ImageProcessor)
}; 