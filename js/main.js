/**
 * PolyHue - Main Application Entry Point
 * 
 * This file bootstraps the PolyHue application, initializes all components,
 * manages global state, and coordinates the workflow between steps.
 */

// Dependencies loaded via script tags:
// - types.js provides window.APP_CONSTANTS, window.EXPORT_EXTENSIONS
// - js/utils/imageProcessor.js provides window.ImageProcessor

/**
 * Main PolyHue Application Class
 */
class PolyHueApp {
    constructor() {
        // Application state
        this.state = {
            image: null,
            colors: [],
            totalHeight: window.APP_CONSTANTS.DEFAULT_MODEL_HEIGHT,
            currentStep: 1,
            exportSettings: {
                format: 'stl',
                quality: 'medium',
                includeColors: true,
                optimize: true,
                scale: 1.0
            },
            isDirty: false,
            lastModified: new Date()
        };

        // Component references
        this.components = {
            imageUpload: null,
            colorEditor: null,
            modelViewer: null,
            stepNavigation: null
        };

        // UI element references
        this.elements = {};

        // Bind methods
        this.handleImageUpload = this.handleImageUpload.bind(this);
        this.handleColorChange = this.handleColorChange.bind(this);
        this.handleStepChange = this.handleStepChange.bind(this);
        this.handleExport = this.handleExport.bind(this);
        this.showError = this.showError.bind(this);
        this.showLoading = this.showLoading.bind(this);
        this.hideLoading = this.hideLoading.bind(this);

        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🎨 Initializing PolyHue...');
            
            // Cache DOM elements
            this.cacheElements();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize step navigation
            this.initializeStepNavigation();
            
            // Initialize image upload functionality
            this.initializeImageUpload();
            
            // Set initial state
            this.updateUI();
            
            // Hide the loading overlay now that initialization is complete
            this.hideLoading();
            
            console.log('✅ PolyHue initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize PolyHue:', error);
            this.hideLoading();
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
        this.elements = {
            // Progress navigation
            progressSteps: document.querySelectorAll('.progress-steps .step'),
            
            // Step content sections
            stepContents: document.querySelectorAll('.step-content'),
            step1: document.getElementById('step-1'),
            step2: document.getElementById('step-2'),
            step3: document.getElementById('step-3'),
            
            // Image upload elements
            uploadArea: document.getElementById('upload-area'),
            uploadButton: document.getElementById('upload-button'),
            imageInput: document.getElementById('image-input'),
            uploadPreview: document.getElementById('upload-preview'),
            previewImage: document.getElementById('preview-image'),
            imageFilename: document.getElementById('image-filename'),
            imageDimensions: document.getElementById('image-dimensions'),
            changeImageBtn: document.getElementById('change-image'),
            proceedToColorsBtn: document.getElementById('proceed-to-colors'),
            
            // Color management elements
            colorCount: document.getElementById('color-count'),
            colorCountValue: document.querySelector('.color-count-value'),
            decreaseColorsBtn: document.getElementById('decrease-colors'),
            increaseColorsBtn: document.getElementById('increase-colors'),
            reanalyzeImageBtn: document.getElementById('reanalyze-image'),
            colorPreviewCanvas: document.getElementById('color-preview-canvas'),
            colorList: document.getElementById('color-list'),
            backToUploadBtn: document.getElementById('back-to-upload'),
            proceedTo3dBtn: document.getElementById('proceed-to-3d'),
            
            // 3D model elements
            threeViewport: document.getElementById('three-viewport'),
            totalHeight: document.getElementById('total-height'),
            layerList: document.getElementById('layer-list'),
            resetCameraBtn: document.getElementById('reset-camera'),
            toggleWireframeBtn: document.getElementById('toggle-wireframe'),
            backToColorsBtn: document.getElementById('back-to-colors'),
            startOverBtn: document.getElementById('start-over'),
            
            // Export elements
            exportStlBtn: document.getElementById('export-stl'),
            exportGlbBtn: document.getElementById('export-glb'),
            exportObjBtn: document.getElementById('export-obj'),
            exportPngBtn: document.getElementById('export-png'),
            exportZipBtn: document.getElementById('export-zip'),
            
            // UI feedback elements
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingMessage: document.getElementById('loading-message'),
            errorToast: document.getElementById('error-toast'),
            errorMessage: document.getElementById('error-message'),
            errorClose: document.getElementById('error-close')
        };
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Image upload events
        if (this.elements.uploadArea) {
            this.elements.uploadArea.addEventListener('click', () => {
                this.elements.imageInput?.click();
            });
            
            this.elements.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            this.elements.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
            this.elements.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        }

        if (this.elements.uploadButton) {
            this.elements.uploadButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.elements.imageInput?.click();
            });
        }

        if (this.elements.imageInput) {
            this.elements.imageInput.addEventListener('change', this.handleImageUpload);
        }

        // Step navigation events
        if (this.elements.proceedToColorsBtn) {
            this.elements.proceedToColorsBtn.addEventListener('click', () => {
                this.changeStep(2);
            });
        }

        if (this.elements.proceedTo3dBtn) {
            this.elements.proceedTo3dBtn.addEventListener('click', () => {
                this.changeStep(3);
            });
        }

        if (this.elements.backToUploadBtn) {
            this.elements.backToUploadBtn.addEventListener('click', () => {
                this.changeStep(1);
            });
        }

        if (this.elements.backToColorsBtn) {
            this.elements.backToColorsBtn.addEventListener('click', () => {
                this.changeStep(2);
            });
        }

        if (this.elements.startOverBtn) {
            this.elements.startOverBtn.addEventListener('click', this.startOver.bind(this));
        }

        // Color management events
        if (this.elements.colorCount) {
            this.elements.colorCount.addEventListener('input', this.handleColorCountChange.bind(this));
        }

        if (this.elements.decreaseColorsBtn) {
            this.elements.decreaseColorsBtn.addEventListener('click', () => {
                this.adjustColorCount(-1);
            });
        }

        if (this.elements.increaseColorsBtn) {
            this.elements.increaseColorsBtn.addEventListener('click', () => {
                this.adjustColorCount(1);
            });
        }

        if (this.elements.reanalyzeImageBtn) {
            this.elements.reanalyzeImageBtn.addEventListener('click', this.reanalyzeImage.bind(this));
        }

        // Export events
        if (this.elements.exportStlBtn) {
            this.elements.exportStlBtn.addEventListener('click', () => this.handleExport('stl'));
        }
        if (this.elements.exportGlbBtn) {
            this.elements.exportGlbBtn.addEventListener('click', () => this.handleExport('glb'));
        }
        if (this.elements.exportObjBtn) {
            this.elements.exportObjBtn.addEventListener('click', () => this.handleExport('obj'));
        }
        if (this.elements.exportPngBtn) {
            this.elements.exportPngBtn.addEventListener('click', () => this.handleExport('png'));
        }
        if (this.elements.exportZipBtn) {
            this.elements.exportZipBtn.addEventListener('click', () => this.handleExport('zip'));
        }

        // Error handling
        if (this.elements.errorClose) {
            this.elements.errorClose.addEventListener('click', this.hideError.bind(this));
        }

        // Global keyboard shortcuts
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    /**
     * Handle image upload
     */
    async handleImageUpload(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            this.showLoading('Processing image...');
            
            // Validate file using ImageProcessor
            const validation = window.ImageProcessor.validateFile(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Show warnings if any
            if (validation.warnings && validation.warnings.length > 0) {
                console.warn('Image warnings:', validation.warnings);
            }

            // Process image using ImageProcessor
            const imageData = await window.ImageProcessor.processFile(file, {
                maxWidth: window.APP_CONSTANTS.MAX_IMAGE_WIDTH,
                maxHeight: window.APP_CONSTANTS.MAX_IMAGE_HEIGHT,
                autoResize: true,
                quality: 0.9
            });
            
            // Update state
            this.state.image = imageData;
            this.state.isDirty = true;
            this.state.lastModified = new Date();

            // Extract colors using ColorThief if available
            try {
                if (window.ColorThief && imageData.canvas && imageData.canvas.width > 0 && imageData.canvas.height > 0) {
                    this.showLoading('Extracting colors...');
                    
                    // Ensure the canvas is ready by creating a small test image
                    const tempImg = new Image();
                    tempImg.crossOrigin = 'anonymous';
                    
                    tempImg.onload = () => {
                        try {
                            const colorThief = new window.ColorThief();
                            const paletteRgb = colorThief.getPalette(tempImg, window.APP_CONSTANTS.DEFAULT_COLOR_COUNT);
                            
                            // Convert to our color format
                            this.state.colors = paletteRgb.map((rgb, index) => ({
                                id: index,
                                hex: window.ImageProcessor.rgbToHex(rgb[0], rgb[1], rgb[2]),
                                rgb: { r: rgb[0], g: rgb[1], b: rgb[2] },
                                percent: Math.round(100 / paletteRgb.length), // Evenly distributed initially
                                custom: false,
                                height: window.APP_CONSTANTS.DEFAULT_MODEL_HEIGHT / paletteRgb.length,
                                order: index
                            }));
                            
                            console.log(`Extracted ${this.state.colors.length} colors from image`);
                            this.hideLoading();
                        } catch (colorError) {
                            console.error('ColorThief extraction failed:', colorError);
                            this.fallbackColorExtraction(imageData);
                        }
                    };
                    
                    tempImg.onerror = () => {
                        console.warn('Failed to load image for ColorThief, using fallback');
                        this.fallbackColorExtraction(imageData);
                    };
                    
                    tempImg.src = imageData.src;
                } else {
                    this.fallbackColorExtraction(imageData);
                }
            } catch (colorError) {
                console.error('Color extraction failed:', colorError);
                this.fallbackColorExtraction(imageData);
            }

            // Update UI
            this.updateImagePreview();
            
            // Show resize message if image was resized
            if (imageData.wasResized) {
                console.info(`Image resized from ${imageData.originalDimensions.width}×${imageData.originalDimensions.height} to ${imageData.width}×${imageData.height}`);
            }

            this.hideLoading();

        } catch (error) {
            this.hideLoading();
            this.showError(`Failed to process image: ${error.message}`);
        }
    }

    /**
     * Fallback color extraction method
     */
    fallbackColorExtraction(imageData) {
        try {
            console.warn('Using fallback color extraction');
            
            if (imageData.canvas && imageData.canvas.width > 0 && imageData.canvas.height > 0) {
                const canvasContext = imageData.canvas.getContext('2d');
                const pixelData = canvasContext.getImageData(0, 0, imageData.width, imageData.height);
                this.state.colors = window.ImageProcessor.extractColors(pixelData, window.APP_CONSTANTS.DEFAULT_COLOR_COUNT);
            } else {
                // Generate default colors as last resort
                this.state.colors = this.generateDefaultColors(window.APP_CONSTANTS.DEFAULT_COLOR_COUNT);
            }
            
            console.log(`Fallback: Generated ${this.state.colors.length} colors`);
            this.hideLoading();
            
        } catch (fallbackError) {
            console.error('Fallback color extraction failed:', fallbackError);
            this.state.colors = this.generateDefaultColors(window.APP_CONSTANTS.DEFAULT_COLOR_COUNT);
            this.hideLoading();
        }
    }

    /**
     * Generate default colors as final fallback
     */
    generateDefaultColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = (i * 360) / count;
            const rgb = this.hslToRgb(hue / 360, 0.7, 0.5);
            colors.push({
                id: i,
                hex: window.ImageProcessor.rgbToHex(rgb.r, rgb.g, rgb.b),
                rgb: rgb,
                percent: Math.round(100 / count),
                custom: false,
                height: window.APP_CONSTANTS.DEFAULT_MODEL_HEIGHT / count,
                order: i
            });
        }
        return colors;
    }

    /**
     * Convert HSL to RGB
     */
    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }



    /**
     * Update image preview UI
     */
    updateImagePreview() {
        if (!this.state.image) return;

        if (this.elements.previewImage) {
            this.elements.previewImage.src = this.state.image.src;
        }

        if (this.elements.imageFilename) {
            this.elements.imageFilename.textContent = this.state.image.fileName || 'Uploaded Image';
        }

        if (this.elements.imageDimensions) {
            this.elements.imageDimensions.textContent = 
                `${this.state.image.width} × ${this.state.image.height} pixels • ${window.ImageProcessor.formatFileSize(this.state.image.fileSize)}`;
        }

        if (this.elements.uploadPreview) {
            this.elements.uploadPreview.hidden = false;
        }

        if (this.elements.uploadArea) {
            this.elements.uploadArea.style.display = 'none';
        }
    }



    /**
     * Handle step changes
     */
    changeStep(newStep) {
        if (newStep === this.state.currentStep) return;

        // Validate step change
        if (newStep === 2 && !this.state.image) {
            this.showError('Please upload an image first.');
            return;
        }

        if (newStep === 3 && (!this.state.colors || this.state.colors.length === 0)) {
            this.showError('Please configure colors first.');
            return;
        }

        this.state.currentStep = newStep;
        this.updateUI();
    }

    /**
     * Update the UI based on current state
     */
    updateUI() {
        // Update progress steps
        this.elements.progressSteps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.toggle('active', stepNumber === this.state.currentStep);
            step.classList.toggle('completed', stepNumber < this.state.currentStep);
        });

        // Update step content visibility
        this.elements.stepContents.forEach((content, index) => {
            const stepNumber = index + 1;
            content.classList.toggle('active', stepNumber === this.state.currentStep);
        });

        // Update color count display
        if (this.elements.colorCountValue) {
            this.elements.colorCountValue.textContent = this.state.colors.length || window.APP_CONSTANTS.DEFAULT_COLOR_COUNT;
        }

        // Update color count slider
        if (this.elements.colorCount) {
            this.elements.colorCount.value = this.state.colors.length || window.APP_CONSTANTS.DEFAULT_COLOR_COUNT;
        }

        // Update color editor if on step 2
        if (this.state.currentStep === 2) {
            this.updateColorEditor();
            this.updateColorPreview();
        }

        // Initialize 3D model if on step 3
        if (this.state.currentStep === 3) {
            this.initialize3D();
        }
    }

    /**
     * Update the color editor display
     */
    updateColorEditor() {
        if (!this.elements.colorList || !this.state.colors) return;

        // Clear existing color items
        this.elements.colorList.innerHTML = '';

        // Create color items
        this.state.colors.forEach((color, index) => {
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item';
            colorItem.dataset.colorId = color.id;
            colorItem.dataset.colorIndex = index;
            colorItem.innerHTML = `
                <div class="color-swatch" style="background-color: ${color.hex}"></div>
                <div class="color-info">
                    <label>Color ${index + 1}</label>
                    <input type="color" value="${color.hex}" data-color-id="${color.id}" class="color-picker">
                    <div class="color-details">
                        <span class="color-hex">${color.hex}</span>
                    </div>
                    <div class="color-percentage">
                        <label class="percentage-label">Coverage</label>
                        <div class="percentage-control">
                            <input type="range" class="color-percent-slider" 
                                   min="5" max="60" value="${color.percent}" 
                                   data-color-id="${color.id}" 
                                   title="Adjust color coverage percentage">
                            <span class="color-percent-value">${color.percent}%</span>
                        </div>
                    </div>
                </div>
                <div class="color-controls">
                    <button type="button" class="btn btn-small color-delete" data-color-id="${color.id}">×</button>
                    <div class="drag-handle">⋮⋮</div>
                </div>
            `;
            
            // Add drag and drop event listeners only to the drag handle
            const dragHandle = colorItem.querySelector('.drag-handle');
            if (dragHandle) {
                dragHandle.addEventListener('mousedown', (e) => {
                    colorItem.draggable = true;
                });
                
                colorItem.addEventListener('dragstart', this.handleColorDragStart.bind(this));
                colorItem.addEventListener('dragover', this.handleColorDragOver.bind(this));
                colorItem.addEventListener('drop', this.handleColorDrop.bind(this));
                colorItem.addEventListener('dragend', this.handleColorDragEnd.bind(this));
            }
            
            // Disable dragging by default, only enable when drag handle is used
            colorItem.draggable = false;
            
            this.elements.colorList.appendChild(colorItem);
        });

        // Add event listeners to color pickers
        this.elements.colorList.querySelectorAll('.color-picker').forEach(picker => {
            picker.addEventListener('change', this.handleColorPickerChange.bind(this));
            
            // Prevent drag and drop conflicts with color picker
            picker.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
        });

        // Add event listeners to percentage sliders
        this.elements.colorList.querySelectorAll('.color-percent-slider').forEach(slider => {
            slider.addEventListener('input', this.handlePercentageChange.bind(this));
            
            // Prevent drag and drop conflicts with sliders
            slider.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
            
            slider.addEventListener('dragstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            
            slider.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            
            slider.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Add event listeners to delete buttons
        this.elements.colorList.querySelectorAll('.color-delete').forEach(button => {
            button.addEventListener('click', this.handleColorDelete.bind(this));
            
            // Prevent drag and drop conflicts with delete button
            button.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
        });

        // Prevent drag conflicts for percentage control areas
        this.elements.colorList.querySelectorAll('.color-percentage').forEach(percentageArea => {
            percentageArea.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
        });

        // Update color preview canvas
        this.updateColorPreview();
    }

    /**
     * Handle color picker changes
     */
    handleColorPickerChange(event) {
        const colorId = parseInt(event.target.dataset.colorId);
        const newHex = event.target.value;
        
        const color = this.state.colors.find(c => c.id === colorId);
        if (color) {
            color.hex = newHex;
            color.custom = true;
            const rgb = window.ImageProcessor.hexToRgb(newHex);
            if (rgb) {
                color.rgb = rgb;
            }
            
            // Update the display
            this.updateColorEditor();
        }
    }

    /**
     * Handle percentage slider changes
     */
    handlePercentageChange(event) {
        const colorId = parseInt(event.target.dataset.colorId);
        const newPercent = parseInt(event.target.value);
        
        const color = this.state.colors.find(c => c.id === colorId);
        if (!color) return;

        const oldPercent = color.percent;
        const percentDiff = newPercent - oldPercent;

        // Update the changed color
        color.percent = newPercent;
        color.custom = true; // Mark as customized

        // Redistribute the difference among other colors
        this.redistributePercentages(colorId, percentDiff);

        // Update the display
        this.updatePercentageDisplays();
        this.updateColorPreview();
    }

    /**
     * Redistribute percentage changes among other colors
     */
    redistributePercentages(changedColorId, percentDiff) {
        const otherColors = this.state.colors.filter(c => c.id !== changedColorId);
        if (otherColors.length === 0) return;

        // Calculate total percentage of other colors
        let totalOtherPercent = otherColors.reduce((sum, color) => sum + color.percent, 0);
        
        // Target total for other colors (100 - changed color percentage)
        const changedColor = this.state.colors.find(c => c.id === changedColorId);
        const targetOtherTotal = 100 - changedColor.percent;

        // If we need to adjust other colors
        if (totalOtherPercent !== targetOtherTotal && targetOtherTotal > 0) {
            // Calculate scaling factor
            const scaleFactor = targetOtherTotal / totalOtherPercent;
            
            // Apply scaling, ensuring minimum of 5% per color
            let adjustedTotal = 0;
            otherColors.forEach(color => {
                const newPercent = Math.max(5, Math.round(color.percent * scaleFactor));
                color.percent = newPercent;
                adjustedTotal += newPercent;
            });

            // Handle rounding errors by adjusting the largest non-changed color
            const totalAll = adjustedTotal + changedColor.percent;
            if (totalAll !== 100) {
                const largestOtherColor = otherColors.reduce((largest, color) => 
                    color.percent > largest.percent ? color : largest
                );
                largestOtherColor.percent += (100 - totalAll);
                largestOtherColor.percent = Math.max(5, largestOtherColor.percent);
            }
        }
    }

    /**
     * Update percentage displays in the UI
     */
    updatePercentageDisplays() {
        this.state.colors.forEach(color => {
            const colorItem = this.elements.colorList.querySelector(`[data-color-id="${color.id}"]`);
            if (colorItem) {
                const slider = colorItem.querySelector('.color-percent-slider');
                const display = colorItem.querySelector('.color-percent-value');
                
                if (slider) {
                    slider.value = color.percent;
                }
                if (display) {
                    display.textContent = `${color.percent}%`;
                }
            }
        });
    }

    /**
     * Handle color deletion
     */
    handleColorDelete(event) {
        const colorId = parseInt(event.target.dataset.colorId);
        
        // Don't allow deleting the last color
        if (this.state.colors.length <= 1) {
            this.showError('You must have at least one color.');
            return;
        }
        
        // Remove the color
        this.state.colors = this.state.colors.filter(c => c.id !== colorId);
        
        // Update order indices
        this.state.colors.forEach((color, index) => {
            color.order = index;
        });
        
        // Redistribute percentages
        this.recalculatePercentages();
        
        // Update the color count controls to reflect the new count
        if (this.elements.colorCount) {
            this.elements.colorCount.value = this.state.colors.length;
        }
        if (this.elements.colorCountValue) {
            this.elements.colorCountValue.textContent = this.state.colors.length;
        }

        // Update the display
        this.updateColorEditor();
        this.updateColorPreview();
        this.updateUI();
    }

    /**
     * Handle color item drag start
     */
    handleColorDragStart(event) {
        const colorItem = event.currentTarget;
        const colorId = parseInt(colorItem.dataset.colorId);
        
        colorItem.classList.add('dragging');
        event.dataTransfer.setData('text/plain', colorId.toString());
        event.dataTransfer.effectAllowed = 'move';
    }

    /**
     * Handle color item drag over
     */
    handleColorDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        
        const colorItem = event.currentTarget;
        const draggingItem = this.elements.colorList.querySelector('.dragging');
        
        if (colorItem !== draggingItem) {
            const rect = colorItem.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            if (event.clientY < midpoint) {
                colorItem.style.borderTop = '2px solid var(--color-primary)';
                colorItem.style.borderBottom = '';
            } else {
                colorItem.style.borderBottom = '2px solid var(--color-primary)';
                colorItem.style.borderTop = '';
            }
        }
    }

    /**
     * Handle color item drop
     */
    handleColorDrop(event) {
        event.preventDefault();
        
        const draggedColorId = parseInt(event.dataTransfer.getData('text/plain'));
        const targetItem = event.currentTarget;
        const targetColorId = parseInt(targetItem.dataset.colorId);
        
        if (draggedColorId !== targetColorId) {
            this.reorderColors(draggedColorId, targetColorId, event);
        }
        
        // Clear visual indicators
        this.clearDragIndicators();
    }

    /**
     * Handle color item drag end
     */
    handleColorDragEnd(event) {
        const colorItem = event.currentTarget;
        colorItem.classList.remove('dragging');
        colorItem.draggable = false; // Disable dragging after drag operation
        this.clearDragIndicators();
    }

    /**
     * Clear drag visual indicators
     */
    clearDragIndicators() {
        this.elements.colorList.querySelectorAll('.color-item').forEach(item => {
            item.style.borderTop = '';
            item.style.borderBottom = '';
            item.classList.remove('dragging');
        });
    }

    /**
     * Reorder colors based on drag and drop
     */
    reorderColors(draggedColorId, targetColorId, event) {
        const draggedIndex = this.state.colors.findIndex(c => c.id === draggedColorId);
        const targetIndex = this.state.colors.findIndex(c => c.id === targetColorId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        // Remove dragged color from array
        const [draggedColor] = this.state.colors.splice(draggedIndex, 1);
        
        // Determine insertion point based on drop position
        const targetItem = event.currentTarget;
        const rect = targetItem.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const dropAbove = event.clientY < midpoint;
        
        let insertIndex = targetIndex;
        if (draggedIndex < targetIndex && !dropAbove) {
            // Dragging down and dropping below target
            insertIndex = targetIndex;
        } else if (draggedIndex < targetIndex && dropAbove) {
            // Dragging down and dropping above target
            insertIndex = targetIndex;
        } else if (draggedIndex > targetIndex && dropAbove) {
            // Dragging up and dropping above target
            insertIndex = targetIndex;
        } else {
            // Dragging up and dropping below target
            insertIndex = targetIndex + 1;
        }
        
        // Insert at new position
        this.state.colors.splice(insertIndex, 0, draggedColor);
        
        // Update order property
        this.state.colors.forEach((color, index) => {
            color.order = index;
        });
        
        // Update display
        this.updateColorEditor();
        this.updateColorPreview();
    }

    /**
     * Update color preview canvas
     */
    updateColorPreview() {
        if (!this.elements.colorPreviewCanvas || !this.state.image) return;

        const canvas = this.elements.colorPreviewCanvas;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        const maxSize = 300;
        const aspectRatio = this.state.image.width / this.state.image.height;
        
        if (aspectRatio > 1) {
            canvas.width = maxSize;
            canvas.height = maxSize / aspectRatio;
        } else {
            canvas.height = maxSize;
            canvas.width = maxSize * aspectRatio;
        }
        
        // Draw quantized color preview
        if (this.state.colors && this.state.colors.length > 0) {
            this.drawQuantizedImage(canvas, ctx);
        } else {
            // Draw original image if no colors yet
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = this.state.image.src;
        }
    }

    /**
     * Draw quantized image with current color palette
     */
    drawQuantizedImage(canvas, ctx) {
        const img = new Image();
        img.onload = () => {
            // Draw original image first
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Quantize each pixel to the nearest color in our palette
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                
                // Skip transparent pixels
                if (a < 128) continue;
                
                // Find closest color in palette
                const closestColor = this.findClosestColor(r, g, b);
                if (closestColor) {
                    data[i] = closestColor.rgb.r;
                    data[i + 1] = closestColor.rgb.g;
                    data[i + 2] = closestColor.rgb.b;
                }
            }
            
            // Draw the quantized image
            ctx.putImageData(imageData, 0, 0);
        };
        img.src = this.state.image.src;
    }

    /**
     * Find the closest color in the current palette
     */
    findClosestColor(r, g, b) {
        if (!this.state.colors || this.state.colors.length === 0) return null;
        
        let minDistance = Infinity;
        let closestColor = null;
        
        this.state.colors.forEach(color => {
            const dr = r - color.rgb.r;
            const dg = g - color.rgb.g;
            const db = b - color.rgb.b;
            const distance = dr * dr + dg * dg + db * db; // Squared Euclidean distance
            
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = color;
            }
        });
        
        return closestColor;
    }

    /**
     * Drag and drop handlers
     */
    handleDragOver(event) {
        event.preventDefault();
        this.elements.uploadArea?.classList.add('drag-over');
    }

    handleDragLeave(event) {
        event.preventDefault();
        this.elements.uploadArea?.classList.remove('drag-over');
    }

    handleDrop(event) {
        event.preventDefault();
        this.elements.uploadArea?.classList.remove('drag-over');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.handleImageUpload({ target: { files } });
        }
    }

    /**
     * Color count adjustment
     */
    adjustColorCount(delta) {
        const currentCount = parseInt(this.elements.colorCount?.value || window.APP_CONSTANTS.DEFAULT_COLOR_COUNT);
        const newCount = Math.max(
            window.APP_CONSTANTS.MIN_COLOR_COUNT, 
            Math.min(window.APP_CONSTANTS.MAX_COLOR_COUNT, currentCount + delta)
        );
        
        if (this.elements.colorCount) {
            this.elements.colorCount.value = newCount;
            this.handleColorCountChange();
        }
    }

    /**
     * Handle color count changes
     */
    async handleColorCountChange() {
        const newCount = parseInt(this.elements.colorCount?.value || window.APP_CONSTANTS.DEFAULT_COLOR_COUNT);
        const currentCount = this.state.colors.length;
        
        if (this.elements.colorCountValue) {
            this.elements.colorCountValue.textContent = newCount;
        }
        
        // If no change in count, do nothing
        if (newCount === currentCount) {
            return;
        }
        
        try {
            this.showLoading('Updating colors...');
            
            if (newCount > currentCount) {
                // Adding colors - preserve existing ones and add new ones
                await this.addColors(newCount - currentCount);
            } else {
                // Removing colors - remove from the end, preserving custom colors
                this.removeColors(currentCount - newCount);
            }
            
            this.updateColorEditor();
            this.hideLoading();
            
        } catch (error) {
            this.hideLoading();
            console.error('Failed to update colors:', error);
            this.showError('Failed to update colors. Please try again.');
        }
    }

    /**
     * Add new colors while preserving existing ones
     */
    async addColors(countToAdd) {
        if (!this.state.image || !this.state.image.src) {
            // No image, just add default colors
            for (let i = 0; i < countToAdd; i++) {
                this.addDefaultColor();
            }
            return;
        }

        // Get new colors from image quantization
        const totalNeeded = this.state.colors.length + countToAdd;
        let newColors = [];

        try {
            if (window.ColorThief) {
                const tempImg = new Image();
                tempImg.crossOrigin = 'anonymous';
                
                const newColorsPromise = new Promise((resolve, reject) => {
                    tempImg.onload = () => {
                        try {
                            const colorThief = new window.ColorThief();
                            // Get more colors than we need to have options
                            const paletteRgb = colorThief.getPalette(tempImg, Math.min(totalNeeded + 5, 16));
                            
                            // Find colors that are different from existing ones
                            const existingHexColors = this.state.colors.map(c => c.hex.toLowerCase());
                            const candidateColors = paletteRgb
                                .map((rgb, index) => ({
                                    hex: window.ImageProcessor.rgbToHex(rgb[0], rgb[1], rgb[2]),
                                    rgb: { r: rgb[0], g: rgb[1], b: rgb[2] }
                                }))
                                .filter(color => !existingHexColors.includes(color.hex.toLowerCase()));

                            resolve(candidateColors.slice(0, countToAdd));
                        } catch (error) {
                            reject(error);
                        }
                    };
                    
                    tempImg.onerror = () => reject(new Error('Failed to load image'));
                    tempImg.src = this.state.image.src;
                });
                
                newColors = await newColorsPromise;
            }
        } catch (error) {
            console.warn('ColorThief failed, using fallback color generation:', error);
        }

        // Fill remaining slots with generated colors if needed
        while (newColors.length < countToAdd) {
            newColors.push(this.generateUniqueColor());
        }

        // Add the new colors to state
        const maxId = Math.max(0, ...this.state.colors.map(c => c.id));
        newColors.slice(0, countToAdd).forEach((color, index) => {
            const newColor = {
                id: maxId + index + 1,
                hex: color.hex,
                rgb: color.rgb,
                percent: 0, // Will be recalculated
                custom: false,
                height: window.APP_CONSTANTS.DEFAULT_MODEL_HEIGHT / (this.state.colors.length + countToAdd),
                order: this.state.colors.length + index
            };
            this.state.colors.push(newColor);
        });

        // Recalculate percentages
        this.recalculatePercentages();
    }

    /**
     * Remove colors from the end, but preserve custom colors
     */
    removeColors(countToRemove) {
        if (countToRemove >= this.state.colors.length) {
            // Don't remove all colors
            countToRemove = this.state.colors.length - 1;
        }

        // Sort by priority: non-custom colors first, then by order
        const sortedColors = [...this.state.colors].sort((a, b) => {
            if (a.custom && !b.custom) return 1;  // Custom colors have higher priority
            if (!a.custom && b.custom) return -1;
            return b.order - a.order; // Remove from the end
        });

        // Remove the lowest priority colors
        const colorsToRemove = sortedColors.slice(-countToRemove);
        const idsToRemove = new Set(colorsToRemove.map(c => c.id));
        
        this.state.colors = this.state.colors.filter(color => !idsToRemove.has(color.id));

        // Update order indices
        this.state.colors.forEach((color, index) => {
            color.order = index;
        });

        // Recalculate percentages
        this.recalculatePercentages();
    }

    /**
     * Generate a unique color that doesn't exist in current palette
     */
    generateUniqueColor() {
        const existingHexColors = this.state.colors.map(c => c.hex.toLowerCase());
        let attempts = 0;
        
        while (attempts < 50) { // Max 50 attempts
            const hue = Math.random() * 360;
            const saturation = 0.5 + Math.random() * 0.4; // 50-90%
            const lightness = 0.3 + Math.random() * 0.4;  // 30-70%
            
            const rgb = this.hslToRgb(hue / 360, saturation, lightness);
            const hex = window.ImageProcessor.rgbToHex(rgb.r, rgb.g, rgb.b);
            
            if (!existingHexColors.includes(hex.toLowerCase())) {
                return { hex, rgb };
            }
            attempts++;
        }
        
        // Fallback if we can't find a unique color
        return {
            hex: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
            rgb: { r: 128, g: 128, b: 128 }
        };
    }

    /**
     * Add a default color
     */
    addDefaultColor() {
        const maxId = Math.max(0, ...this.state.colors.map(c => c.id));
        const colorData = this.generateUniqueColor();
        
        const newColor = {
            id: maxId + 1,
            hex: colorData.hex,
            rgb: colorData.rgb,
            percent: 0, // Will be recalculated
            custom: false,
            height: window.APP_CONSTANTS.DEFAULT_MODEL_HEIGHT / (this.state.colors.length + 1),
            order: this.state.colors.length
        };
        
        this.state.colors.push(newColor);
        this.recalculatePercentages();
    }

    /**
     * Recalculate color percentages
     */
    recalculatePercentages() {
        const count = this.state.colors.length;
        if (count === 0) return;
        
        // Distribute percentages evenly, but preserve any custom percentages if possible
        const evenPercent = Math.floor(100 / count);
        const remainder = 100 - (evenPercent * count);
        
                 this.state.colors.forEach((color, index) => {
             color.percent = evenPercent + (index < remainder ? 1 : 0);
         });
     }

     /**
      * Re-analyze the image to extract fresh colors
      */
     async reanalyzeImage() {
         if (!this.state.image || !this.state.image.src) {
             this.showError('No image available to analyze. Please upload an image first.');
             return;
         }

         // Get current color count to maintain the same number
         const currentColorCount = this.state.colors.length;

         // Confirm with user if they have custom colors
         const hasCustomColors = this.state.colors.some(color => color.custom);
         if (hasCustomColors) {
             const confirmed = confirm(
                 'This will replace all your current colors with fresh colors from the image. ' +
                 'Your custom color changes will be lost. Are you sure you want to continue?'
             );
             if (!confirmed) {
                 return;
             }
         }

         try {
             this.showLoading('Re-analyzing image colors...');

             // Extract colors using ColorThief if available
             if (window.ColorThief) {
                 const tempImg = new Image();
                 tempImg.crossOrigin = 'anonymous';
                 
                 const extractColorsPromise = new Promise((resolve, reject) => {
                     tempImg.onload = () => {
                         try {
                             const colorThief = new window.ColorThief();
                             const paletteRgb = colorThief.getPalette(tempImg, currentColorCount);
                             
                             // Convert to our color format
                             const newColors = paletteRgb.map((rgb, index) => ({
                                 id: index,
                                 hex: window.ImageProcessor.rgbToHex(rgb[0], rgb[1], rgb[2]),
                                 rgb: { r: rgb[0], g: rgb[1], b: rgb[2] },
                                 percent: Math.round(100 / paletteRgb.length),
                                 custom: false,
                                 height: window.APP_CONSTANTS.DEFAULT_MODEL_HEIGHT / paletteRgb.length,
                                 order: index
                             }));
                             
                             resolve(newColors);
                         } catch (error) {
                             reject(error);
                         }
                     };
                     
                     tempImg.onerror = () => reject(new Error('Failed to load image for analysis'));
                     tempImg.src = this.state.image.src;
                 });
                 
                 this.state.colors = await extractColorsPromise;
                 
             } else {
                 // Fallback to simple extraction method
                 if (this.state.image.canvas && this.state.image.canvas.width > 0 && this.state.image.canvas.height > 0) {
                     const canvasContext = this.state.image.canvas.getContext('2d');
                     const pixelData = canvasContext.getImageData(0, 0, this.state.image.width, this.state.image.height);
                     this.state.colors = window.ImageProcessor.extractColors(pixelData, currentColorCount);
                 } else {
                     throw new Error('No image data available for analysis');
                 }
             }

             // Ensure proper percentage distribution
             this.recalculatePercentages();

             // Update the color count controls to reflect the extracted colors
             if (this.elements.colorCount) {
                 this.elements.colorCount.value = this.state.colors.length;
             }
             if (this.elements.colorCountValue) {
                 this.elements.colorCountValue.textContent = this.state.colors.length;
             }

             // Update the display
             this.updateColorEditor();
             this.updateColorPreview();
             
             this.hideLoading();
             
             console.log(`Re-analyzed image and extracted ${this.state.colors.length} fresh colors`);
             
         } catch (error) {
             this.hideLoading();
             console.error('Failed to re-analyze image:', error);
             this.showError(`Failed to re-analyze image: ${error.message}`);
         }
     }



    /**
     * Handle color changes (placeholder)
     */
    handleColorChange(colorData) {
        // TODO: Implement color change handling
        console.log('Color changed:', colorData);
    }

    /**
     * Handle step changes (placeholder)
     */
    handleStepChange(step) {
        this.changeStep(step);
    }

    /**
     * Handle export functionality
     */
    async handleExport(format) {
        try {
            if (!this.threeScene || !this.model3D) {
                this.showError('Please generate the 3D model first.');
                return;
            }

            this.showLoading(`Exporting ${format.toUpperCase()} file...`);
            
            const filename = this.state.image?.fileName ? 
                this.state.image.fileName.replace(/\.[^/.]+$/, "") : 
                'polyhue-model';

            switch (format) {
                case 'stl':
                    await this.exportSTL(filename);
                    break;
                case 'glb':
                    await this.exportGLB(filename);
                    break;
                case 'obj':
                    await this.exportOBJ(filename);
                    break;
                case 'png':
                    await this.exportPNG(filename);
                    break;
                case 'zip':
                    await this.exportZIP(filename);
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            
            this.hideLoading();
            
        } catch (error) {
            this.hideLoading();
            this.showError(`Failed to export ${format.toUpperCase()}: ${error.message}`);
        }
    }

    /**
     * Start over / reset application
     */
    startOver() {
        if (this.state.isDirty) {
            if (!confirm('Are you sure you want to start over? All changes will be lost.')) {
                return;
            }
        }

        // Reset state
        this.state = {
            image: null,
            colors: [],
            totalHeight: window.APP_CONSTANTS.DEFAULT_MODEL_HEIGHT,
            currentStep: 1,
            exportSettings: {
                format: 'stl',
                quality: 'medium',
                includeColors: true,
                optimize: true,
                scale: 1.0
            },
            isDirty: false,
            lastModified: new Date()
        };

        // Reset UI
        if (this.elements.imageInput) {
            this.elements.imageInput.value = '';
        }
        
        if (this.elements.uploadPreview) {
            this.elements.uploadPreview.hidden = true;
        }
        
        if (this.elements.uploadArea) {
            this.elements.uploadArea.style.display = '';
        }

        this.updateUI();
    }

    /**
     * Initialize step navigation
     */
    initializeStepNavigation() {
        // Set initial step
        this.state.currentStep = 1;
        this.updateUI();
    }

    /**
     * Initialize image upload functionality
     */
    initializeImageUpload() {
        // Set up file input change handler
        if (this.elements.changeImageBtn) {
            this.elements.changeImageBtn.addEventListener('click', () => {
                this.elements.imageInput?.click();
            });
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeydown(event) {
        // Only handle shortcuts when no input is focused
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.code) {
            case 'Digit1':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.changeStep(1);
                }
                break;
            case 'Digit2':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.changeStep(2);
                }
                break;
            case 'Digit3':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.changeStep(3);
                }
                break;
            case 'Escape':
                this.hideError();
                break;
        }
    }

    /**
     * Initialize Three.js 3D scene and model generation
     */
    async initialize3D() {
        if (!this.state.image || !this.state.colors || this.state.colors.length === 0) {
            this.showError('Please upload an image and configure colors first.');
            return;
        }

        try {
            this.showLoading('Generating 3D model...');

            // Initialize Three.js scene if not already done
            if (!this.threeScene) {
                await this.setupThreeJS();
            }

            // Generate 3D model from colors
            await this.generate3DModel();

            // Update layer configuration UI
            this.updateLayerConfiguration();

            this.hideLoading();

        } catch (error) {
            this.hideLoading();
            console.error('Failed to initialize 3D:', error);
            this.showError(`Failed to generate 3D model: ${error.message}`);
        }
    }

    /**
     * Set up Three.js scene, camera, renderer, and controls
     */
    async setupThreeJS() {
        if (!this.elements.threeViewport) {
            throw new Error('3D viewport element not found');
        }

        // Import Three.js modules
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        
        // Store THREE for later use
        this.THREE = THREE;

        // Scene
        this.threeScene = new THREE.Scene();
        this.threeScene.background = new THREE.Color(0xf0f0f0);

        // Camera
        const aspect = this.elements.threeViewport.clientWidth / this.elements.threeViewport.clientHeight;
        this.threeCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

        // Renderer
        this.threeRenderer = new THREE.WebGLRenderer({ antialias: true });
        this.threeRenderer.setSize(
            this.elements.threeViewport.clientWidth,
            this.elements.threeViewport.clientHeight
        );
        this.threeRenderer.setPixelRatio(window.devicePixelRatio);
        
        // Clear viewport and add renderer
        this.elements.threeViewport.innerHTML = '';
        this.elements.threeViewport.appendChild(this.threeRenderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.threeScene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        this.threeScene.add(directionalLight);

        // Controls
        this.orbitControls = new OrbitControls(this.threeCamera, this.threeRenderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.1;
        this.orbitControls.autoRotate = false;

        // Position camera
        this.resetCamera();

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            this.orbitControls.update();
            this.threeRenderer.render(this.threeScene, this.threeCamera);
        };
        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.threeCamera && this.threeRenderer && this.elements.threeViewport) {
                const width = this.elements.threeViewport.clientWidth;
                const height = this.elements.threeViewport.clientHeight;
                
                this.threeCamera.aspect = width / height;
                this.threeCamera.updateProjectionMatrix();
                this.threeRenderer.setSize(width, height);
            }
        });

        // Set up 3D control event listeners
        this.setup3DControls();

        console.log('Three.js scene initialized');
    }

    /**
     * Set up 3D viewport controls
     */
    setup3DControls() {
        if (this.elements.resetCameraBtn) {
            this.elements.resetCameraBtn.addEventListener('click', () => {
                this.resetCamera();
            });
        }

        if (this.elements.toggleWireframeBtn) {
            this.elements.toggleWireframeBtn.addEventListener('click', () => {
                this.toggleWireframe();
            });
        }

        if (this.elements.totalHeight) {
            this.elements.totalHeight.addEventListener('input', () => {
                this.updateTotalHeight();
            });
        }
    }

    /**
     * Generate 3D model from color data using height-mapped relief
     */
    async generate3DModel() {
        if (!this.threeScene || !this.state.image || !this.state.colors) return;

        // Remove existing model
        if (this.model3D) {
            this.threeScene.remove(this.model3D);
        }

        // Create model group
        this.model3D = new this.THREE.Group();

        const imageWidth = this.state.image.width;
        const imageHeight = this.state.image.height;
        const aspectRatio = imageWidth / imageHeight;
        
        // Scale model to reasonable size (max 10 units)
        const maxSize = 10;
        let modelWidth, modelHeight;
        if (aspectRatio > 1) {
            modelWidth = maxSize;
            modelHeight = maxSize / aspectRatio;
        } else {
            modelHeight = maxSize;
            modelWidth = maxSize * aspectRatio;
        }

        // Create pixel-to-color mapping
        const colorMap = await this.createColorMap(imageWidth, imageHeight);
        
        // Generate height-mapped geometry for each color layer
        await this.generateColorLayers(colorMap, modelWidth, modelHeight, imageWidth, imageHeight);

        // Center the model
        const box = new this.THREE.Box3().setFromObject(this.model3D);
        const center = box.getCenter(new this.THREE.Vector3());
        this.model3D.position.set(-center.x, -center.y, -center.z);

        // Add to scene
        this.threeScene.add(this.model3D);

        console.log(`Generated 3D relief model with ${this.state.colors.length} color layers`);
    }

    /**
     * Create a color mapping for each pixel in the image
     */
    async createColorMap(width, height) {
        // Get image data
        const canvas = this.state.image.canvas;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Create color map array
        const colorMap = new Array(width * height);

        // Process each pixel
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                // Skip transparent pixels
                if (a < 128) {
                    colorMap[y * width + x] = null;
                    continue;
                }

                // Find closest color in palette
                const closestColor = this.findClosestColor(r, g, b);
                colorMap[y * width + x] = closestColor;
            }
        }

        return colorMap;
    }

    /**
     * Generate 3D layers for proper multi-color printing
     */
    async generateColorLayers(colorMap, modelWidth, modelHeight, imageWidth, imageHeight) {
        const totalHeight = this.state.totalHeight || window.APP_CONSTANTS.DEFAULT_MODEL_HEIGHT;
        const scaleHeight = totalHeight / 50; // Scale to reasonable 3D units
        const minLayerThickness = scaleHeight * 0.2; // Minimum layer thickness for printability

        // Sort colors by their order (bottom to top)
        const sortedColors = [...this.state.colors].sort((a, b) => a.order - b.order);

        // Calculate cumulative heights for each color
        let cumulativeHeight = 0;
        const colorHeights = new Map();
        
        sortedColors.forEach(color => {
            const layerHeight = (color.height || totalHeight / this.state.colors.length) * scaleHeight;
            const previousHeight = cumulativeHeight;
            cumulativeHeight += layerHeight;
            colorHeights.set(color.id, { 
                bottom: previousHeight, 
                top: cumulativeHeight,
                height: layerHeight
            });
        });

        // Create geometry for each color layer
        for (let colorIndex = 0; colorIndex < sortedColors.length; colorIndex++) {
            const color = sortedColors[colorIndex];
            const heightInfo = colorHeights.get(color.id);
            
            // Create printable layer geometry (full base + color-specific areas)
            const geometry = this.createPrintableLayerGeometry(
                colorMap, 
                color, 
                heightInfo.bottom,
                heightInfo.top,
                minLayerThickness,
                modelWidth, 
                modelHeight, 
                imageWidth, 
                imageHeight
            );

            if (geometry) {
                // Create material with color
                const material = new this.THREE.MeshLambertMaterial({ 
                    color: color.hex,
                    transparent: false
                });

                // Create mesh
                const layerMesh = new this.THREE.Mesh(geometry, material);
                layerMesh.userData = { colorId: color.id, layerIndex: colorIndex };
                
                this.model3D.add(layerMesh);
            }
        }
    }

    /**
     * Create geometry for a printable color layer
     */
    createPrintableLayerGeometry(colorMap, color, bottomHeight, topHeight, minLayerThickness, modelWidth, modelHeight, imageWidth, imageHeight) {
        const vertices = [];
        const indices = [];
        const normals = [];
        const uvs = [];

        const pixelWidth = modelWidth / imageWidth;
        const pixelHeight = modelHeight / imageHeight;

        let vertexIndex = 0;

        // For the first layer (bottom), create a full base
        if (color.order === 0) {
            // First layer: create geometry from 0 to topHeight where this color appears
            for (let y = 0; y < imageHeight; y++) {
                for (let x = 0; x < imageWidth; x++) {
                    const pixelColor = colorMap[y * imageWidth + x];
                    
                    // Only create geometry where this color appears
                    if (pixelColor && pixelColor.id === color.id) {
                        const startX = (x - imageWidth / 2) * pixelWidth;
                        const startY = (y - imageHeight / 2) * pixelHeight;
                        const endX = startX + pixelWidth;
                        const endY = startY + pixelHeight;

                        this.addPixelBox(
                            vertices, indices, normals, uvs,
                            startX, startY, endX, endY, 
                            0, topHeight, vertexIndex
                        );
                        
                        vertexIndex += 8;
                    }
                }
            }
        } else {
            // Subsequent layers: thin base everywhere + full height where this color appears
            
            // 1. Create thin base layer covering entire model footprint
            this.addPixelBox(
                vertices, indices, normals, uvs,
                -modelWidth / 2, -modelHeight / 2, 
                modelWidth / 2, modelHeight / 2,
                bottomHeight, bottomHeight + minLayerThickness, vertexIndex
            );
            vertexIndex += 8;

            // 2. Add full height columns where this color appears
            for (let y = 0; y < imageHeight; y++) {
                for (let x = 0; x < imageWidth; x++) {
                    const pixelColor = colorMap[y * imageWidth + x];
                    
                    // Only create full-height geometry where this color appears
                    if (pixelColor && pixelColor.id === color.id) {
                        const startX = (x - imageWidth / 2) * pixelWidth;
                        const startY = (y - imageHeight / 2) * pixelHeight;
                        const endX = startX + pixelWidth;
                        const endY = startY + pixelHeight;

                        // Create column from thin base to full height
                        this.addPixelBox(
                            vertices, indices, normals, uvs,
                            startX, startY, endX, endY, 
                            bottomHeight + minLayerThickness, topHeight, vertexIndex
                        );
                        
                        vertexIndex += 8;
                    }
                }
            }
        }

        if (vertices.length === 0) return null;

        // Create geometry
        const geometry = new this.THREE.BufferGeometry();
        geometry.setAttribute('position', new this.THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new this.THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new this.THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);

        return geometry;
    }

    /**
     * Add a box geometry for a single pixel
     */
    addPixelBox(vertices, indices, normals, uvs, x1, y1, x2, y2, z1, z2, vertexOffset) {
        // Define the 8 vertices of the box
        const boxVertices = [
            x1, y1, z1,  // 0: bottom-left-front
            x2, y1, z1,  // 1: bottom-right-front
            x2, y2, z1,  // 2: bottom-right-back
            x1, y2, z1,  // 3: bottom-left-back
            x1, y1, z2,  // 4: top-left-front
            x2, y1, z2,  // 5: top-right-front
            x2, y2, z2,  // 6: top-right-back
            x1, y2, z2   // 7: top-left-back
        ];

        // Add vertices
        vertices.push(...boxVertices);

        // Define faces (12 triangles for 6 faces)
        const faces = [
            // Bottom face (z = z1)
            0, 1, 2,  0, 2, 3,
            // Top face (z = z2)
            4, 7, 6,  4, 6, 5,
            // Front face (y = y1)
            0, 4, 5,  0, 5, 1,
            // Back face (y = y2)
            2, 6, 7,  2, 7, 3,
            // Left face (x = x1)
            0, 3, 7,  0, 7, 4,
            // Right face (x = x2)
            1, 5, 6,  1, 6, 2
        ];

        // Add indices with vertex offset
        faces.forEach(index => {
            indices.push(vertexOffset + index);
        });

        // Add normals (simplified - each vertex gets the same normal)
        const boxNormals = [
            0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,  // bottom
            0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1     // top
        ];
        normals.push(...boxNormals);

        // Add UVs (simplified)
        const boxUVs = [
            0, 0,  1, 0,  1, 1,  0, 1,  // bottom
            0, 0,  1, 0,  1, 1,  0, 1   // top
        ];
        uvs.push(...boxUVs);
    }

    /**
     * Reset camera to default position
     */
    resetCamera() {
        if (!this.threeCamera || !this.orbitControls) return;

        this.threeCamera.position.set(15, 15, 15);
        this.threeCamera.lookAt(0, 0, 0);
        this.orbitControls.target.set(0, 0, 0);
        this.orbitControls.update();
    }

    /**
     * Toggle wireframe mode
     */
    toggleWireframe() {
        if (!this.model3D) return;

        this.model3D.children.forEach(mesh => {
            if (mesh.material) {
                mesh.material.wireframe = !mesh.material.wireframe;
            }
        });
    }

    /**
     * Update total height and regenerate model
     */
    updateTotalHeight() {
        const newHeight = parseFloat(this.elements.totalHeight.value);
        if (!isNaN(newHeight) && newHeight > 0) {
            this.state.totalHeight = newHeight;
            
            // Redistribute layer heights proportionally
            const totalOriginalHeight = this.state.colors.reduce((sum, color) => sum + (color.height || 1), 0);
            this.state.colors.forEach(color => {
                const proportion = (color.height || 1) / totalOriginalHeight;
                color.height = newHeight * proportion;
            });

            // Regenerate model
            this.generate3DModel();
            this.updateLayerConfiguration();
        }
    }

    /**
     * Update layer configuration UI
     */
    updateLayerConfiguration() {
        if (!this.elements.layerList || !this.state.colors) return;

        this.elements.layerList.innerHTML = '';

        this.state.colors.forEach((color, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            layerItem.innerHTML = `
                <div class="layer-info">
                    <div class="layer-color" style="background-color: ${color.hex}"></div>
                    <span class="layer-name">Layer ${index + 1}</span>
                </div>
                <div class="layer-height-control">
                    <label>Height (mm)</label>
                    <input type="number" class="layer-height-input" 
                           value="${(color.height || 2).toFixed(1)}" 
                           min="0.1" max="20" step="0.1"
                           data-color-id="${color.id}">
                </div>
            `;

            // Add event listener for height changes
            const heightInput = layerItem.querySelector('.layer-height-input');
            heightInput.addEventListener('input', (e) => {
                const newHeight = parseFloat(e.target.value);
                if (!isNaN(newHeight) && newHeight > 0) {
                    color.height = newHeight;
                    this.updateTotalHeightDisplay();
                    
                    // Debounce model regeneration
                    clearTimeout(this.regenerateTimeout);
                    this.regenerateTimeout = setTimeout(() => {
                        this.generate3DModel();
                    }, 500);
                }
            });

            this.elements.layerList.appendChild(layerItem);
        });

        this.updateTotalHeightDisplay();
    }

    /**
     * Update total height display
     */
    updateTotalHeightDisplay() {
        if (this.elements.totalHeight) {
            const totalHeight = this.state.colors.reduce((sum, color) => sum + (color.height || 1), 0);
            this.elements.totalHeight.value = totalHeight.toFixed(1);
        }
    }

    /**
     * Export model as STL
     */
    async exportSTL(filename) {
        const { STLExporter } = await import('three/examples/jsm/exporters/STLExporter.js');
        
        const exporter = new STLExporter();
        const stlString = exporter.parse(this.model3D);
        
        const blob = new Blob([stlString], { type: 'application/vnd.ms-pki.stl' });
        this.downloadBlob(blob, `${filename}.stl`);
    }

    /**
     * Export model as GLB
     */
    async exportGLB(filename) {
        const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
        
        const exporter = new GLTFExporter();
        
        return new Promise((resolve, reject) => {
            exporter.parse(
                this.model3D,
                (result) => {
                    const blob = new Blob([result], { type: 'model/gltf-binary' });
                    this.downloadBlob(blob, `${filename}.glb`);
                    resolve();
                },
                (error) => reject(error),
                { binary: true }
            );
        });
    }

    /**
     * Export model as OBJ
     */
    async exportOBJ(filename) {
        const { OBJExporter } = await import('three/examples/jsm/exporters/OBJExporter.js');
        
        const exporter = new OBJExporter();
        const objString = exporter.parse(this.model3D);
        
        const blob = new Blob([objString], { type: 'application/x-tgif' });
        this.downloadBlob(blob, `${filename}.obj`);
    }

    /**
     * Export preview as PNG
     */
    async exportPNG(filename) {
        if (!this.threeRenderer) {
            throw new Error('3D renderer not initialized');
        }

        this.threeRenderer.render(this.threeScene, this.threeCamera);
        const dataURL = this.threeRenderer.domElement.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = dataURL;
        link.click();
    }

    /**
     * Export all formats as ZIP
     */
    async exportZIP(filename) {
        // This would require a ZIP library like JSZip
        // For now, just export STL as the main format
        this.showError('ZIP export is not yet implemented. Please use individual export options.');
    }

    /**
     * Download blob as file
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'Loading...') {
        const messageEl = document.getElementById('loading-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
        
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.removeAttribute('hidden');
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
        }
        
        if (this.elements.errorToast) {
            this.elements.errorToast.hidden = false;
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideError();
            }, 5000);
        }

        console.error('PolyHue Error:', message);
    }

    /**
     * Hide error message
     */
    hideError() {
        if (this.elements.errorToast) {
            this.elements.errorToast.hidden = true;
        }
    }
}

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Loading overlay is visible by default, wait for external dependencies to load
        const dependencyResult = await waitForDependencies();
        
        if (dependencyResult.status === 'complete') {
            console.log('🎉 All dependencies loaded successfully');
        } else if (dependencyResult.status === 'partial') {
            console.warn('⚠️ Some optional features may not work due to missing dependencies:', dependencyResult.missing);
        } else if (dependencyResult.status === 'timeout') {
            console.warn('⚠️ App starting with limited functionality due to missing dependencies:', dependencyResult.missing);
        } else if (dependencyResult.status === 'error') {
            console.error('⚠️ Dependency check error:', dependencyResult.error);
        }
        
        // Create global app instance
        window.polyHueApp = new PolyHueApp();
        
        console.log('PolyHue application initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize PolyHue:', error);
        
        // Hide loading and show error
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.hidden = true;
        }
        
        // Show error message
        const errorToast = document.getElementById('error-toast');
        const errorMessage = document.getElementById('error-message');
        if (errorToast && errorMessage) {
            errorMessage.textContent = 'Failed to initialize application. Please check your internet connection and refresh the page.';
            errorToast.hidden = false;
        }
    }
});

/**
 * Wait for external dependencies to be available
 */
async function waitForDependencies() {
    const maxWaitTime = 8000; // 8 seconds
    const checkInterval = 100; // Check every 100ms
    const startTime = Date.now();
    
    return new Promise((resolve) => {
        const checkDependencies = () => {
            try {
                // Check if CRITICAL dependencies are loaded (required for app to function)
                const hasImageProcessor = typeof window.ImageProcessor !== 'undefined';
                const hasAppConstants = typeof window.APP_CONSTANTS !== 'undefined';
                
                // Check OPTIONAL dependencies (app can work without these in degraded mode)
                const hasColorThief = typeof ColorThief !== 'undefined' || 
                                    typeof window.ColorThief !== 'undefined';
                
                const hasChroma = typeof chroma !== 'undefined' || 
                                typeof window.chroma !== 'undefined';
                
                const criticalDependenciesLoaded = hasImageProcessor && hasAppConstants;
                const allDependenciesLoaded = criticalDependenciesLoaded && hasColorThief && hasChroma;
                
                console.log('Dependency check:', {
                    ImageProcessor: hasImageProcessor,
                    APP_CONSTANTS: hasAppConstants,
                    ColorThief: hasColorThief,
                    chroma: hasChroma,
                    criticalLoaded: criticalDependenciesLoaded,
                    allLoaded: allDependenciesLoaded
                });
                
                // If all dependencies are loaded, we're good to go
                if (allDependenciesLoaded) {
                    console.log('✅ All dependencies loaded successfully');
                    resolve({ status: 'complete', missing: [] });
                    return;
                }
                
                // If critical dependencies are loaded but we've waited long enough, proceed anyway
                if (criticalDependenciesLoaded && Date.now() - startTime > maxWaitTime) {
                    const missingOptional = [];
                    if (!hasColorThief) missingOptional.push('ColorThief');
                    if (!hasChroma) missingOptional.push('chroma');
                    
                    console.warn('⚠️ Proceeding with missing optional dependencies:', missingOptional);
                    resolve({ status: 'partial', missing: missingOptional });
                    return;
                }
                
                // If critical dependencies are still missing after timeout, continue anyway
                if (Date.now() - startTime > maxWaitTime) {
                    const missingCritical = [];
                    if (!hasImageProcessor) missingCritical.push('ImageProcessor');
                    if (!hasAppConstants) missingCritical.push('APP_CONSTANTS');
                    
                    console.warn('⚠️ Timeout reached, proceeding with missing dependencies:', missingCritical);
                    resolve({ status: 'timeout', missing: missingCritical });
                    return;
                }
                
                // Check again after interval
                setTimeout(checkDependencies, checkInterval);
                
            } catch (error) {
                console.error('Error checking dependencies:', error);
                // Don't reject, just resolve with error status
                resolve({ status: 'error', error: error.message });
            }
        };
        
        // Start checking after a brief delay to let scripts initialize
        setTimeout(checkDependencies, 200);
    });
}

/**
 * Make the main class available globally
 */
window.PolyHueApp = PolyHueApp; 
