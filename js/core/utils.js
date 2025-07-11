/**
 * PolyHue Utility Functions
 * 
 * Comprehensive utility library for color processing, file handling,
 * mathematical operations, and other common functions.
 */

const PolyHueUtils = {
    // =========================
    // UUID and ID Generation
    // =========================
    
    /**
     * Generate a UUID v4
     * @returns {string} UUID string
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Generate a short ID for UI elements
     * @returns {string} Short ID
     */
    generateShortId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    // =========================
    // Color Conversion and Processing
    // =========================
    
    /**
     * Convert RGB to LAB color space
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {Object} LAB color {l, a, b}
     */
    rgbToLab(r, g, b) {
        // Convert RGB to XYZ
        let [x, y, z] = this.rgbToXyz(r, g, b);
        
        // Convert XYZ to LAB
        const xn = 95.047;  // Observer = 2°, Illuminant = D65
        const yn = 100.000;
        const zn = 108.883;
        
        x = x / xn;
        y = y / yn;
        z = z / zn;
        
        const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
        const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
        const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
        
        const l = 116 * fy - 16;
        const a = 500 * (fx - fy);
        const b_lab = 200 * (fy - fz);
        
        return { l, a, b: b_lab };
    },

    /**
     * Convert RGB to XYZ color space
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {Array} XYZ color [x, y, z]
     */
    rgbToXyz(r, g, b) {
        // Normalize RGB values
        r = r / 255;
        g = g / 255;
        b = b / 255;
        
        // Apply gamma correction
        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
        
        // Convert to XYZ using sRGB matrix
        const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
        const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
        const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
        
        return [x * 100, y * 100, z * 100];
    },

    /**
     * Convert HSL to RGB
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} l - Lightness (0-100)
     * @returns {Array} RGB color [r, g, b]
     */
    hslToRgb(h, s, l) {
        h = h / 360;
        s = s / 100;
        l = l / 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l - c / 2;
        
        let r, g, b;
        
        if (h < 1/6) {
            [r, g, b] = [c, x, 0];
        } else if (h < 2/6) {
            [r, g, b] = [x, c, 0];
        } else if (h < 3/6) {
            [r, g, b] = [0, c, x];
        } else if (h < 4/6) {
            [r, g, b] = [0, x, c];
        } else if (h < 5/6) {
            [r, g, b] = [x, 0, c];
        } else {
            [r, g, b] = [c, 0, x];
        }
        
        return [
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)
        ];
    },

    /**
     * Convert RGB to HSL
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {Array} HSL color [h, s, l]
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        let h, s;
        const l = (max + min) / 2;
        
        if (diff === 0) {
            h = s = 0; // achromatic
        } else {
            s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
            
            switch (max) {
                case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
                case g: h = (b - r) / diff + 2; break;
                case b: h = (r - g) / diff + 4; break;
            }
            h /= 6;
        }
        
        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    },

    /**
     * Convert hex color to RGB
     * @param {string} hex - Hex color string (#RRGGBB)
     * @returns {Array} RGB color [r, g, b]
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    },

    /**
     * Convert RGB to hex color
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {string} Hex color string
     */
    rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    },

    /**
     * Calculate color difference using Delta E (CIE76)
     * @param {Array} color1 - RGB color [r, g, b]
     * @param {Array} color2 - RGB color [r, g, b]
     * @returns {number} Delta E value
     */
    calculateDeltaE(color1, color2) {
        const lab1 = this.rgbToLab(...color1);
        const lab2 = this.rgbToLab(...color2);
        
        const deltaL = lab1.l - lab2.l;
        const deltaA = lab1.a - lab2.a;
        const deltaB = lab1.b - lab2.b;
        
        return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
    },

    /**
     * Get color brightness (perceived luminance)
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {number} Brightness value (0-255)
     */
    getColorBrightness(r, g, b) {
        return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    },

    /**
     * Check if color is considered "light" or "dark"
     * @param {string} hex - Hex color string
     * @returns {boolean} True if light, false if dark
     */
    isLightColor(hex) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return false;
        
        const brightness = this.getColorBrightness(...rgb);
        return brightness > 128;
    },

    /**
     * Generate a readable color name from hex
     * @param {string} hex - Hex color string
     * @returns {string} Human-readable color name
     */
    getColorName(hex) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return 'Unknown';
        
        const [r, g, b] = rgb;
        const [h, s, l] = this.rgbToHsl(r, g, b);
        
        // Basic color names based on HSL
        const colorNames = {
            red: { h: [0, 15], s: [50, 100] },
            orange: { h: [16, 45], s: [50, 100] },
            yellow: { h: [46, 75], s: [50, 100] },
            green: { h: [76, 165], s: [50, 100] },
            blue: { h: [166, 255], s: [50, 100] },
            purple: { h: [256, 315], s: [50, 100] },
            pink: { h: [316, 359], s: [50, 100] }
        };
        
        // Check for grayscale
        if (s < 10) {
            if (l < 20) return 'Black';
            if (l < 40) return 'Dark Gray';
            if (l < 60) return 'Gray';
            if (l < 80) return 'Light Gray';
            return 'White';
        }
        
        // Find matching color
        for (const [name, range] of Object.entries(colorNames)) {
            if (h >= range.h[0] && h <= range.h[1] && s >= range.s[0] && s <= range.s[1]) {
                if (l < 30) return `Dark ${name.charAt(0).toUpperCase() + name.slice(1)}`;
                if (l > 70) return `Light ${name.charAt(0).toUpperCase() + name.slice(1)}`;
                return name.charAt(0).toUpperCase() + name.slice(1);
            }
        }
        
        return 'Unknown';
    },

    // =========================
    // File and Image Processing
    // =========================
    
    /**
     * Convert File to ImageBitmap
     * @param {File} file - Image file
     * @returns {Promise<ImageBitmap>} ImageBitmap object
     */
    async fileToImageBitmap(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                createImageBitmap(img)
                    .then(resolve)
                    .catch(reject);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    },

    /**
     * Convert ImageBitmap to Canvas
     * @param {ImageBitmap} bitmap - ImageBitmap object
     * @returns {HTMLCanvasElement} Canvas element
     */
    imageBitmapToCanvas(bitmap) {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        
        return canvas;
    },

    /**
     * Resize image while maintaining aspect ratio
     * @param {ImageBitmap} bitmap - Source image
     * @param {number} maxWidth - Maximum width
     * @param {number} maxHeight - Maximum height
     * @returns {Promise<ImageBitmap>} Resized image
     */
    async resizeImage(bitmap, maxWidth, maxHeight) {
        const aspectRatio = bitmap.width / bitmap.height;
        
        let newWidth = bitmap.width;
        let newHeight = bitmap.height;
        
        if (newWidth > maxWidth) {
            newWidth = maxWidth;
            newHeight = newWidth / aspectRatio;
        }
        
        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = newHeight * aspectRatio;
        }
        
        if (newWidth === bitmap.width && newHeight === bitmap.height) {
            return bitmap;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
        
        return createImageBitmap(canvas);
    },

    /**
     * Get image data from canvas
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @returns {ImageData} Image data
     */
    getImageData(canvas) {
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    },

    /**
     * Apply brightness and contrast to image data
     * @param {ImageData} imageData - Image data
     * @param {number} brightness - Brightness adjustment (-100 to 100)
     * @param {number} contrast - Contrast adjustment (-100 to 100)
     * @returns {ImageData} Adjusted image data
     */
    adjustImageBrightnessContrast(imageData, brightness, contrast) {
        const data = imageData.data;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        
        for (let i = 0; i < data.length; i += 4) {
            // Apply brightness
            data[i] = Math.max(0, Math.min(255, data[i] + brightness));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness));
            
            // Apply contrast
            data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
            data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
            data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
        }
        
        return imageData;
    },

    // =========================
    // Mathematical Utilities
    // =========================
    
    /**
     * Clamp value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * Linear interpolation between two values
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * Map value from one range to another
     * @param {number} value - Input value
     * @param {number} inMin - Input minimum
     * @param {number} inMax - Input maximum
     * @param {number} outMin - Output minimum
     * @param {number} outMax - Output maximum
     * @returns {number} Mapped value
     */
    map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },

    /**
     * Calculate distance between two points
     * @param {number} x1 - First point X
     * @param {number} y1 - First point Y
     * @param {number} x2 - Second point X
     * @param {number} y2 - Second point Y
     * @returns {number} Distance
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // =========================
    // File Download Utilities
    // =========================
    
    /**
     * Download data as file
     * @param {Blob|string} data - Data to download
     * @param {string} filename - Filename
     * @param {string} mimeType - MIME type
     */
    downloadFile(data, filename, mimeType = 'application/octet-stream') {
        const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    },

    /**
     * Create ZIP archive from multiple files
     * @param {Object} files - Files object {filename: data}
     * @param {string} zipName - ZIP filename
     * @returns {Promise<void>} Download promise
     */
    async downloadZip(files, zipName) {
        // Simple ZIP creation (for more complex ZIP files, consider using JSZip)
        const zip = new JSZip();
        
        for (const [filename, data] of Object.entries(files)) {
            if (data instanceof Blob) {
                zip.file(filename, data);
            } else {
                zip.file(filename, data);
            }
        }
        
        const blob = await zip.generateAsync({ type: 'blob' });
        this.downloadFile(blob, zipName, 'application/zip');
    },

    // =========================
    // Validation and Error Handling
    // =========================
    
    /**
     * Validate hex color string
     * @param {string} hex - Hex color string
     * @returns {boolean} True if valid
     */
    isValidHex(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    },

    /**
     * Validate email address
     * @param {string} email - Email address
     * @returns {boolean} True if valid
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    /**
     * Sanitize filename for download
     * @param {string} filename - Original filename
     * @returns {string} Sanitized filename
     */
    sanitizeFilename(filename) {
        return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    },

    /**
     * Format file size in human-readable format
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Format number with thousand separators
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        return num.toLocaleString();
    },

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Export for global access
window.PolyHue = window.PolyHue || {};
window.PolyHue.Utils = PolyHueUtils;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PolyHueUtils;
} 