/**
 * PolyHue Color Quantization Manager
 * 
 * Manages color quantization process and interfaces with Web Worker
 */

class ColorQuantizationManager {
    constructor() {
        this.worker = null;
        this.isWorking = false;
        this.currentRequest = null;
        this.requestQueue = [];
        
        this.init = this.init.bind(this);
        this.quantizeImage = this.quantizeImage.bind(this);
        this.analyzeImage = this.analyzeImage.bind(this);
        this.handleWorkerMessage = this.handleWorkerMessage.bind(this);
        this.handleWorkerError = this.handleWorkerError.bind(this);
    }

    /**
     * Initialize the color quantization manager
     */
    init() {
        try {
            // Create worker
            this.worker = new Worker('js/workers/colorQuantization.js');
            this.worker.onmessage = this.handleWorkerMessage;
            this.worker.onerror = this.handleWorkerError;
            
            // Listen for relevant events
            this.setupEventListeners();
            
            console.log('Color quantization manager initialized with worker');
        } catch (error) {
            // Fallback to main thread implementation if worker fails
            this.useMainThreadFallback = true;
            this.worker = null;
            
            // Listen for relevant events
            this.setupEventListeners();
            
            console.log('Color quantization manager initialized with main thread fallback (worker unavailable in file:// protocol)');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for image changes
        document.addEventListener('image:loaded', (e) => {
            this.onImageLoaded(e.detail);
        });

        // Listen for max colors changes
        document.addEventListener('maxcolors:changed', (e) => {
            this.onMaxColorsChanged(e.detail);
        });

        // Listen for mode changes
        document.addEventListener('mode:changed', (e) => {
            this.onModeChanged(e.detail);
        });
    }

    /**
     * Quantize image colors
     * @param {Object} options - Quantization options
     * @returns {Promise} Quantization result
     */
    async quantizeImage(options = {}) {
        const project = window.PolyHue.stores.project;
        const image = project.get('originalImage');
        
        if (!image) {
            throw new Error('No image loaded');
        }

        // Get image data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        
        // Prepare quantization parameters
        const params = {
            imageData: {
                data: Array.from(imageData.data),
                width: imageData.width,
                height: imageData.height
            },
            maxColors: options.maxColors || project.get('maxColors') || 4,
            algorithm: options.algorithm || project.get('quantizationAlgorithm') || 'kmeans',
            mergeThreshold: options.mergeThreshold || window.PolyHue.stores.regions.get('mergeThreshold') || 8
        };

        // Use worker or fallback
        if (this.worker && !this.useMainThreadFallback) {
            return this.processWithWorker('quantize', params);
        } else {
            return this.processInMainThread(params);
        }
    }

    /**
     * Analyze image colors
     * @returns {Promise} Analysis result
     */
    async analyzeImage() {
        const project = window.PolyHue.stores.project;
        const image = project.get('originalImage');
        
        if (!image) {
            throw new Error('No image loaded');
        }

        // Get image data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        
        const params = {
            imageData: {
                data: Array.from(imageData.data),
                width: imageData.width,
                height: imageData.height
            }
        };

        if (this.worker && !this.useMainThreadFallback) {
            return this.processWithWorker('analyze', params);
        } else {
            return this.analyzeInMainThread(params);
        }
    }

    /**
     * Process request with Web Worker
     * @param {string} type - Request type
     * @param {Object} data - Request data
     * @returns {Promise} Worker result
     */
    processWithWorker(type, data) {
        return new Promise((resolve, reject) => {
            const request = {
                id: this.generateRequestId(),
                type,
                data,
                resolve,
                reject,
                timestamp: Date.now()
            };

            if (this.isWorking) {
                this.requestQueue.push(request);
            } else {
                this.executeRequest(request);
            }
        });
    }

    /**
     * Execute worker request
     * @param {Object} request - Request object
     */
    executeRequest(request) {
        this.isWorking = true;
        this.currentRequest = request;
        
        // Set processing state
        const project = window.PolyHue.stores.project;
        project.set('isProcessing', true);
        project.set('processingStep', `Processing colors (${request.type})...`);
        
        // Send to worker
        this.worker.postMessage({
            type: request.type,
            data: request.data
        });
        
        // Set timeout
        request.timeout = setTimeout(() => {
            this.handleTimeout(request);
        }, 30000); // 30 second timeout
    }

    /**
     * Handle worker message
     * @param {MessageEvent} e - Message event
     */
    handleWorkerMessage(e) {
        const { type, data } = e.data;
        
        if (!this.currentRequest) return;
        
        // Clear timeout
        if (this.currentRequest.timeout) {
            clearTimeout(this.currentRequest.timeout);
        }
        
        // Set processing state
        const project = window.PolyHue.stores.project;
        project.set('isProcessing', false);
        project.set('processingStep', null);
        
        if (type === 'result' || type === 'analysis') {
            // Success
            this.currentRequest.resolve(data);
            
            // Update stores with result
            if (type === 'result') {
                this.updateStoresWithQuantizationResult(data);
            } else if (type === 'analysis') {
                this.updateStoresWithAnalysisResult(data);
            }
            
        } else if (type === 'error') {
            // Error
            this.currentRequest.reject(new Error(data.message));
        }
        
        // Process next request
        this.processNextRequest();
    }

    /**
     * Handle worker error
     * @param {ErrorEvent} error - Error event
     */
    handleWorkerError(error) {
        console.error('Color quantization worker error:', error);
        
        if (this.currentRequest) {
            this.currentRequest.reject(new Error('Worker error: ' + error.message));
        }
        
        // Fallback to main thread
        this.useMainThreadFallback = true;
        this.processNextRequest();
    }

    /**
     * Handle request timeout
     * @param {Object} request - Request object
     */
    handleTimeout(request) {
        console.warn('Color quantization request timed out');
        
        if (this.currentRequest === request) {
            request.reject(new Error('Request timed out'));
            this.processNextRequest();
        }
    }

    /**
     * Process next request in queue
     */
    processNextRequest() {
        this.isWorking = false;
        this.currentRequest = null;
        
        if (this.requestQueue.length > 0) {
            const nextRequest = this.requestQueue.shift();
            this.executeRequest(nextRequest);
        }
    }

    /**
     * Update stores with quantization result
     * @param {Object} result - Quantization result
     */
    updateStoresWithQuantizationResult(result) {
        const regions = window.PolyHue.stores.regions;
        
        // Update regions
        regions.set('regions', result.regions);
        
        // Create region map canvas for overlay
        if (result.regionMap) {
            this.createRegionOverlay(result.regionMap);
        }
        
        // Auto-assign filaments if enabled
        const filaments = window.PolyHue.stores.filaments;
        if (filaments.get('autoAssignFilaments')) {
            this.autoAssignFilaments(result.regions);
        }
        
        // Dispatch event
        this.dispatchEvent('regions:updated', { 
            regions: result.regions,
            palette: result.palette,
            originalColorCount: result.originalColorCount,
            finalColorCount: result.finalColorCount
        });
    }

    /**
     * Update stores with analysis result
     * @param {Object} result - Analysis result
     */
    updateStoresWithAnalysisResult(result) {
        const regions = window.PolyHue.stores.regions;
        regions.set('colorAnalysis', result);
        
        this.dispatchEvent('colors:analyzed', result);
    }

    /**
     * Create region overlay for visualization
     * @param {Object} regionMapData - Region map data
     */
    createRegionOverlay(regionMapData) {
        const overlayCanvas = document.getElementById('region-overlay');
        if (!overlayCanvas) return;
        
        const ctx = overlayCanvas.getContext('2d');
        
        // Create ImageData from region map
        const imageData = new ImageData(
            new Uint8ClampedArray(regionMapData.data),
            regionMapData.width,
            regionMapData.height
        );
        
        // Set canvas size and draw
        overlayCanvas.width = regionMapData.width;
        overlayCanvas.height = regionMapData.height;
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Auto-assign filaments to regions
     * @param {Array} regions - Color regions
     */
    autoAssignFilaments(regions) {
        const filamentsStore = window.PolyHue.stores.filaments;
        const regionsStore = window.PolyHue.stores.regions;
        
        const availableFilaments = filamentsStore.get('filaments');
        const assignmentMethod = filamentsStore.get('assignmentMethod');
        
        const assignments = new Map();
        
        regions.forEach((region, index) => {
            const bestFilament = this.findBestFilamentMatch(
                region.avgColor,
                availableFilaments,
                assignmentMethod
            );
            
            if (bestFilament) {
                assignments.set(region.id, bestFilament.id);
            }
        });
        
        regionsStore.set('assignments', assignments);
        
        // Update selected filaments
        const selectedFilaments = Array.from(new Set(assignments.values()));
        filamentsStore.set('selectedFilaments', selectedFilaments);
    }

    /**
     * Find best filament match for a color
     * @param {string} targetColor - Target color hex
     * @param {Array} filaments - Available filaments
     * @param {string} method - Assignment method
     * @returns {Object} Best matching filament
     */
    findBestFilamentMatch(targetColor, filaments, method = 'lab-delta-e') {
        const targetRgb = window.PolyHue.Utils.hexToRgb(targetColor);
        if (!targetRgb) return null;
        
        let bestFilament = null;
        let bestDistance = Infinity;
        
        for (const filament of filaments) {
            const filamentRgb = window.PolyHue.Utils.hexToRgb(filament.hex);
            if (!filamentRgb) continue;
            
            let distance;
            
            if (method === 'lab-delta-e') {
                distance = window.PolyHue.Utils.calculateDeltaE(targetRgb, filamentRgb);
            } else if (method === 'rgb-distance') {
                const dr = targetRgb[0] - filamentRgb[0];
                const dg = targetRgb[1] - filamentRgb[1];
                const db = targetRgb[2] - filamentRgb[2];
                distance = Math.sqrt(dr * dr + dg * dg + db * db);
            } else if (method === 'hue-match') {
                const targetHsl = window.PolyHue.Utils.rgbToHsl(...targetRgb);
                const filamentHsl = window.PolyHue.Utils.rgbToHsl(...filamentRgb);
                distance = Math.abs(targetHsl[0] - filamentHsl[0]);
            }
            
            if (distance < bestDistance) {
                bestDistance = distance;
                bestFilament = filament;
            }
        }
        
        return bestFilament;
    }

    /**
     * Process quantization in main thread (fallback)
     * @param {Object} params - Quantization parameters
     * @returns {Promise} Result
     */
    async processInMainThread(params) {
        // Simple implementation for fallback
        // This would implement the algorithms directly in the main thread
        // For now, return a simplified result
        
        const { imageData, maxColors } = params;
        
        // Create dummy regions for fallback
        const regions = [];
        for (let i = 0; i < Math.min(maxColors, 4); i++) {
            regions.push({
                id: `region_${i}`,
                avgColor: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
                pixelCount: Math.floor((imageData.width * imageData.height) / maxColors),
                percentage: 100 / maxColors
            });
        }
        
        return {
            regions,
            palette: regions.map(r => ({ 
                r: parseInt(r.avgColor.slice(1, 3), 16),
                g: parseInt(r.avgColor.slice(3, 5), 16),
                b: parseInt(r.avgColor.slice(5, 7), 16)
            })),
            assignments: new Array(imageData.width * imageData.height).fill(0).map((_, i) => 
                Math.floor(i / (imageData.width * imageData.height / regions.length))
            ),
            originalColorCount: 1000,
            finalColorCount: regions.length
        };
    }

    /**
     * Analyze colors in main thread (fallback)
     * @param {Object} params - Analysis parameters
     * @returns {Promise} Result
     */
    async analyzeInMainThread(params) {
        // Simple analysis fallback
        return {
            uniqueColors: 1000,
            totalPixels: params.imageData.width * params.imageData.height,
            dominantColors: [],
            colorDistribution: [],
            averageComplexity: 50
        };
    }

    /**
     * Generate unique request ID
     * @returns {string} Request ID
     */
    generateRequestId() {
        return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Event handlers
     */
    async onImageLoaded(data) {
        // Automatically analyze the image
        try {
            await this.analyzeImage();
        } catch (error) {
            console.error('Failed to analyze image:', error);
        }
    }

    async onMaxColorsChanged(data) {
        const project = window.PolyHue.stores.project;
        if (project.get('originalImage')) {
            // Re-quantize with new max colors
            try {
                await this.quantizeImage({ maxColors: data.maxColors });
            } catch (error) {
                console.error('Failed to quantize with new max colors:', error);
            }
        }
    }

    async onModeChanged(data) {
        const project = window.PolyHue.stores.project;
        if (project.get('originalImage') && data.mode === 'multicolor') {
            // Trigger quantization for multicolor mode
            try {
                await this.quantizeImage();
            } catch (error) {
                console.error('Failed to quantize for multicolor mode:', error);
            }
        }
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
     * Cleanup resources
     */
    destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        
        // Clear any pending requests
        this.requestQueue.forEach(request => {
            request.reject(new Error('Manager destroyed'));
        });
        this.requestQueue = [];
        
        if (this.currentRequest) {
            this.currentRequest.reject(new Error('Manager destroyed'));
            this.currentRequest = null;
        }
    }
}

// Export for global access
window.PolyHue = window.PolyHue || {};
window.PolyHue.ColorQuantization = ColorQuantizationManager;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.PolyHue.ColorQuantization = ColorQuantizationManager;
    });
} else {
    window.PolyHue.ColorQuantization = ColorQuantizationManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorQuantizationManager;
}