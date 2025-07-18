/**
 * PolyHue - Main Application Entry Point
 * 
 * This file bootstraps the PolyHue application, initializes all components,
 * manages global state, and coordinates the workflow between steps.
 */

// Dependencies loaded via script tags:
// - types.js provides window.APP_CONSTANTS, window.EXPORT_EXTENSIONS
// - window.ImageProcessor.js provides window.ImageProcessor

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
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDragLeave = this.handleDragLeave.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
        this.hideError = this.hideError.bind(this);
        this.reanalyzeImage = this.reanalyzeImage.bind(this);

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
        
        // Initialize micro-interactions after caching elements
        this.initializeMicroInteractions();
    }
    
    /**
     * Initialize delightful micro-interactions
     */
    initializeMicroInteractions() {
        // Add ripple effect to buttons
        this.addRippleEffect();
        
        // Add smooth scrolling to color list
        this.enhanceScrolling();
        
        // Add loading states to buttons
        this.enhanceButtonStates();
        
        // Add particle effects to upload area
        this.enhanceUploadArea();
        
        // Add color harmony animations
        this.addColorAnimations();
        
        // Add 3D hover effects
        this.add3DHoverEffects();
        
        // Add success celebrations
        this.setupSuccessAnimations();
    }
    
    /**
     * Add ripple effect to buttons
     */
    addRippleEffect() {
        const buttons = document.querySelectorAll('.btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const ripple = document.createElement('span');
                const rect = button.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    left: ${x}px;
                    top: ${y}px;
                    width: ${size}px;
                    height: ${size}px;
                    pointer-events: none;
                `;
                
                // Add ripple animation
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes ripple {
                        to {
                            transform: scale(4);
                            opacity: 0;
                        }
                    }
                `;
                if (!document.querySelector('#ripple-styles')) {
                    style.id = 'ripple-styles';
                    document.head.appendChild(style);
                }
                
                button.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }
    
    /**
     * Enhance scrolling with smooth momentum
     */
    enhanceScrolling() {
        const scrollableElements = document.querySelectorAll('.color-list, .layer-list');
        
        scrollableElements.forEach(element => {
            let isScrolling = false;
            
            element.addEventListener('scroll', () => {
                if (!isScrolling) {
                    isScrolling = true;
                    element.style.scrollBehavior = 'smooth';
                    
                    setTimeout(() => {
                        isScrolling = false;
                    }, 150);
                }
            });
            
            // Add scroll indicator
            const indicator = document.createElement('div');
            indicator.style.cssText = `
                position: absolute;
                right: 0;
                top: 0;
                width: 2px;
                background: var(--gradient-primary);
                border-radius: 1px;
                transition: opacity 0.3s ease;
                opacity: 0;
                z-index: 10;
                pointer-events: none;
            `;
            
            element.style.position = 'relative';
            element.appendChild(indicator);
            
            element.addEventListener('scroll', () => {
                const scrollPercent = element.scrollTop / (element.scrollHeight - element.clientHeight);
                const height = Math.max(20, element.clientHeight * 0.3);
                const top = scrollPercent * (element.clientHeight - height);
                
                indicator.style.height = `${height}px`;
                indicator.style.top = `${top}px`;
                indicator.style.opacity = element.scrollTop > 0 ? '0.7' : '0';
            });
        });
    }
    
    /**
     * Enhance button states with loading animations
     */
    enhanceButtonStates() {
        const enhanceButton = (button, loadingText) => {
            const originalText = button.textContent;
            
            const showLoading = () => {
                button.classList.add('loading');
                button.disabled = true;
                if (loadingText) {
                    button.setAttribute('data-original-text', originalText);
                    button.textContent = loadingText;
                }
            };
            
            const hideLoading = () => {
                button.classList.remove('loading');
                button.disabled = false;
                if (button.hasAttribute('data-original-text')) {
                    button.textContent = button.getAttribute('data-original-text');
                    button.removeAttribute('data-original-text');
                }
            };
            
            button._showLoading = showLoading;
            button._hideLoading = hideLoading;
        };
        
        // Enhance specific buttons
        if (this.elements.proceedToColorsBtn) {
            enhanceButton(this.elements.proceedToColorsBtn, 'Processing...');
        }
        if (this.elements.proceedTo3dBtn) {
            enhanceButton(this.elements.proceedTo3dBtn, 'Building 3D...');
        }
        if (this.elements.reanalyzeImageBtn) {
            enhanceButton(this.elements.reanalyzeImageBtn, 'Analyzing...');
        }
        
        // Enhance export buttons
        const exportButtons = [
            this.elements.exportStlBtn,
            this.elements.exportGlbBtn,
            this.elements.exportObjBtn,
            this.elements.exportPngBtn,
            this.elements.exportZipBtn
        ].filter(Boolean);
        
        exportButtons.forEach(button => {
            enhanceButton(button, 'Exporting...');
        });
    }
    
    /**
     * Enhance upload area with particle effects
     */
    enhanceUploadArea() {
        if (!this.elements.uploadArea) return;
        
        const createParticle = (x, y) => {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: var(--gradient-warm);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1;
                left: ${x}px;
                top: ${y}px;
                animation: float-particle 2s ease-out forwards;
            `;
            
            // Add particle animation
            if (!document.querySelector('#particle-styles')) {
                const style = document.createElement('style');
                style.id = 'particle-styles';
                style.textContent = `
                    @keyframes float-particle {
                        0% {
                            transform: translate(0, 0) scale(1);
                            opacity: 1;
                        }
                        100% {
                            transform: translate(${(Math.random() - 0.5) * 50}px, -30px) scale(0);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            this.elements.uploadArea.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 2000);
        };
        
        this.elements.uploadArea.addEventListener('dragover', (e) => {
            if (Math.random() < 0.1) { // 10% chance per dragover event
                const rect = this.elements.uploadArea.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                createParticle(x, y);
            }
        });
    }
    
    /**
     * Add color harmony animations
     */
    addColorAnimations() {
        const animateColorChange = (element, newColor) => {
            if (!element) return;
            
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: ${newColor};
                opacity: 0;
                transition: opacity 0.3s ease;
                border-radius: inherit;
                pointer-events: none;
            `;
            
            element.style.position = 'relative';
            element.appendChild(overlay);
            
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                
                setTimeout(() => {
                    element.style.backgroundColor = newColor;
                    overlay.remove();
                }, 300);
            });
        };
        
        // Store original function for color changes
        this._originalAnimateColorChange = animateColorChange;
    }
    
    /**
     * Add 3D hover effects
     */
    add3DHoverEffects() {
        const elements3D = document.querySelectorAll('.color-item, .layer-item, .btn');
        
        elements3D.forEach(element => {
            element.addEventListener('mousemove', (e) => {
                if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;
                
                element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(5px)`;
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = '';
            });
        });
    }
    
    /**
     * Setup success animations
     */
    setupSuccessAnimations() {
        this.celebrateSuccess = (message) => {
            // Create confetti effect
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
            
            for (let i = 0; i < 50; i++) {
                setTimeout(() => {
                    const confetti = document.createElement('div');
                    confetti.style.cssText = `
                        position: fixed;
                        width: 8px;
                        height: 8px;
                        background: ${colors[Math.floor(Math.random() * colors.length)]};
                        top: -10px;
                        left: ${Math.random() * 100}vw;
                        z-index: 10000;
                        border-radius: 50%;
                        pointer-events: none;
                        animation: confetti-fall 3s ease-out forwards;
                    `;
                    
                    // Add confetti animation
                    if (!document.querySelector('#confetti-styles')) {
                        const style = document.createElement('style');
                        style.id = 'confetti-styles';
                        style.textContent = `
                            @keyframes confetti-fall {
                                0% {
                                    transform: translateY(-10px) rotate(0deg);
                                    opacity: 1;
                                }
                                100% {
                                    transform: translateY(100vh) rotate(360deg);
                                    opacity: 0;
                                }
                            }
                        `;
                        document.head.appendChild(style);
                    }
                    
                    document.body.appendChild(confetti);
                    
                    setTimeout(() => {
                        confetti.remove();
                    }, 3000);
                }, i * 50);
            }
            
            // Show success message
            if (message) {
                this.showSuccessMessage(message);
            }
        };
    }
    
    /**
     * Show success message with animation
     */
    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: var(--space-6);
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: var(--gradient-secondary);
            color: white;
            padding: var(--space-4) var(--space-6);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-xl);
            z-index: 10000;
            font-weight: var(--font-weight-semibold);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });
        
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(-100px)';
            toast.style.opacity = '0';
            
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 3000);
    }
    
    /**
     * Enhanced step change with animations
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

        // Add loading animation for step transitions
        if (this.elements.proceedToColorsBtn && newStep === 2) {
            this.elements.proceedToColorsBtn._showLoading?.();
            setTimeout(() => {
                this.elements.proceedToColorsBtn._hideLoading?.();
            }, 1000);
        }
        
        if (this.elements.proceedTo3dBtn && newStep === 3) {
            this.elements.proceedTo3dBtn._showLoading?.();
            setTimeout(() => {
                this.elements.proceedTo3dBtn._hideLoading?.();
            }, 1500);
        }

        // Animate step transition
        const currentContent = document.querySelector('.step-content.active');
        if (currentContent) {
            currentContent.style.opacity = '0';
            currentContent.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                this.state.currentStep = newStep;
                this.updateUI();
                
                const newContent = document.querySelector('.step-content.active');
                if (newContent) {
                    newContent.style.opacity = '0';
                    newContent.style.transform = 'translateY(20px)';
                    
                    requestAnimationFrame(() => {
                        newContent.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                        newContent.style.opacity = '1';
                        newContent.style.transform = 'translateY(0)';
                    });
                }
                
                // Celebrate major milestones
                if (newStep === 3) {
                    setTimeout(() => {
                        this.celebrateSuccess('🎉 Ready to create your 3D model!');
                    }, 800);
                }
            }, 300);
        } else {
            this.state.currentStep = newStep;
            this.updateUI();
        }
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
                            
                            // Update UI and color preview
                            this.updateUI();
                            
                            this.hideLoading();
                                            } catch (colorError) {
                        console.error('ColorThief extraction failed:', colorError);
                        this.fallbackColorExtraction(imageData, window.APP_CONSTANTS.DEFAULT_COLOR_COUNT);
                    }
                    };
                    
                                    tempImg.onerror = () => {
                    console.warn('Failed to load image for ColorThief, using fallback');
                    this.fallbackColorExtraction(imageData, window.APP_CONSTANTS.DEFAULT_COLOR_COUNT);
                };
                    
                    tempImg.src = imageData.src;
                            } else {
                this.fallbackColorExtraction(imageData, this.state.colors?.length || window.APP_CONSTANTS.DEFAULT_COLOR_COUNT);
            }
            } catch (colorError) {
                console.error('Color extraction failed:', colorError);
                this.fallbackColorExtraction(imageData, window.APP_CONSTANTS.DEFAULT_COLOR_COUNT);
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
     * Handle drag over event for file upload
     */
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // Add visual feedback
        if (this.elements.uploadArea) {
            this.elements.uploadArea.classList.add('drag-over');
        }
    }

    /**
     * Handle drag leave event for file upload
     */
    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // Remove visual feedback only if leaving the upload area itself
        if (event.target === this.elements.uploadArea) {
            this.elements.uploadArea.classList.remove('drag-over');
        }
    }

    /**
     * Handle drop event for file upload
     */
    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // Remove visual feedback
        if (this.elements.uploadArea) {
            this.elements.uploadArea.classList.remove('drag-over');
        }
        
        // Get the dropped files
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            
            // Create a fake event object to pass to handleImageUpload
            const fakeEvent = {
                target: {
                    files: [file]
                }
            };
            
            // Process the dropped file using the existing image upload handler
            this.handleImageUpload(fakeEvent);
        }
    }

    /**
     * Re-analyze the current image to extract colors again
     */
    async reanalyzeImage() {
        if (!this.state.image) {
            this.showError('No image loaded to reanalyze');
            return;
        }

        try {
            this.showLoading('Reanalyzing image colors...');
            
            const imageData = this.state.image;
            
            // Extract colors using ColorThief if available
            if (window.ColorThief && imageData.canvas && imageData.canvas.width > 0 && imageData.canvas.height > 0) {
                // Ensure the canvas is ready by creating a small test image
                const tempImg = new Image();
                tempImg.crossOrigin = 'anonymous';
                
                tempImg.onload = () => {
                    try {
                        const colorThief = new window.ColorThief();
                        const colorCount = this.state.colors?.length || window.APP_CONSTANTS.DEFAULT_COLOR_COUNT;
                        const paletteRgb = colorThief.getPalette(tempImg, colorCount);
                        
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
                        
                        console.log(`Re-extracted ${this.state.colors.length} colors from image`);
                        this.state.isDirty = true;
                        this.state.lastModified = new Date();
                        
                        // Update UI
                        this.updateUI();
                        this.hideLoading();
                        
                    } catch (colorError) {
                        console.error('ColorThief reanalysis failed:', colorError);
                        this.fallbackColorExtraction(imageData, this.state.colors?.length || window.APP_CONSTANTS.DEFAULT_COLOR_COUNT);
                    }
                };
                
                tempImg.onerror = () => {
                    console.warn('Failed to load image for ColorThief reanalysis, using fallback');
                    this.fallbackColorExtraction(imageData, this.state.colors?.length || window.APP_CONSTANTS.DEFAULT_COLOR_COUNT);
                };
                
                tempImg.src = imageData.src;
                
            } else {
                this.fallbackColorExtraction(imageData, window.APP_CONSTANTS.DEFAULT_COLOR_COUNT);
            }
            
        } catch (error) {
            this.hideLoading();
            this.showError(`Failed to reanalyze image: ${error.message}`);
        }
    }

    /**
     * Fallback color extraction method
     */
    fallbackColorExtraction(imageData, colorCount = window.APP_CONSTANTS.DEFAULT_COLOR_COUNT) {
        try {
            console.warn('Using fallback color extraction');
            
            if (imageData.canvas && imageData.canvas.width > 0 && imageData.canvas.height > 0) {
                const canvasContext = imageData.canvas.getContext('2d');
                const pixelData = canvasContext.getImageData(0, 0, imageData.width, imageData.height);
                this.state.colors = window.ImageProcessor.extractColors(pixelData, colorCount);
            } else {
                // Generate default colors as last resort
                this.state.colors = this.generateDefaultColors(colorCount);
            }
            
            console.log(`Fallback: Generated ${this.state.colors.length} colors`);
            
            // Update UI and color preview
            this.updateUI();
            
            this.hideLoading();
            
        } catch (fallbackError) {
            console.error('Fallback color extraction failed:', fallbackError);
            this.state.colors = this.generateDefaultColors(colorCount);
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
     * Handle individual color changes
     */
    handleColorChange(colorId, newValue, property = 'hex') {
        try {
            const colorIndex = this.state.colors.findIndex(color => color.id === colorId);
            if (colorIndex === -1) {
                console.warn(`Color with id ${colorId} not found`);
                return;
            }

            // Update the specific property
            if (property === 'hex') {
                this.state.colors[colorIndex].hex = newValue;
                // Update RGB values based on new hex
                if (window.ImageProcessor && window.ImageProcessor.hexToRgb) {
                    this.state.colors[colorIndex].rgb = window.ImageProcessor.hexToRgb(newValue);
                }
            } else if (property === 'height') {
                this.state.colors[colorIndex].height = parseFloat(newValue);
            } else if (property === 'percent') {
                this.state.colors[colorIndex].percent = parseFloat(newValue);
            }

            // Mark as custom modification
            this.state.colors[colorIndex].custom = true;
            this.state.isDirty = true;
            this.state.lastModified = new Date();

            // Update the UI
            this.updateUI();
            
            // Update color preview canvas specifically
            this.updateColorPreviewCanvas();
            
            console.log(`Color ${colorId} ${property} updated to:`, newValue);
        } catch (error) {
            console.error('Error updating color:', error);
            this.showError(`Failed to update color: ${error.message}`);
        }
    }

    /**
     * Handle color count changes
     */
    handleColorCountChange(event) {
        try {
            const newCount = parseInt(event.target.value);
            if (isNaN(newCount) || newCount < 1 || newCount > 10) {
                console.warn('Invalid color count:', newCount);
                return;
            }

            // Update the color count display
            if (this.elements.colorCountValue) {
                this.elements.colorCountValue.textContent = newCount;
            }

                    // Re-extract colors with new count if image is available
        if (this.state.image) {
            this.extractColorsFromImage(newCount);
        } else {
            // Generate default colors if no image
            this.state.colors = this.generateDefaultColors(newCount);
            this.updateUI();
        }

            this.state.isDirty = true;
            this.state.lastModified = new Date();
            
            console.log(`Color count changed to: ${newCount}`);
        } catch (error) {
            console.error('Error changing color count:', error);
            this.showError(`Failed to change color count: ${error.message}`);
        }
    }

    /**
     * Adjust color count by a delta amount (+1 or -1)
     */
    adjustColorCount(delta) {
        try {
            const currentCount = this.state.colors?.length || window.APP_CONSTANTS.DEFAULT_COLOR_COUNT;
            const newCount = Math.max(1, Math.min(10, currentCount + delta));
            
            if (newCount === currentCount) {
                return; // No change needed
            }
            
            // Update the slider value
            if (this.elements.colorCount) {
                this.elements.colorCount.value = newCount;
            }
            
            // Update the display value
            if (this.elements.colorCountValue) {
                this.elements.colorCountValue.textContent = newCount;
            }
            
            // Re-extract colors with new count if image is available
            if (this.state.image) {
                this.extractColorsFromImage(newCount);
            } else {
                // Generate default colors if no image
                this.state.colors = this.generateDefaultColors(newCount);
                this.updateUI();
            }
            
            this.state.isDirty = true;
            this.state.lastModified = new Date();
            
            console.log(`Color count adjusted to: ${newCount}`);
        } catch (error) {
            console.error('Error adjusting color count:', error);
            this.showError(`Failed to adjust color count: ${error.message}`);
        }
    }

    /**
     * Update the UI based on current state
     */
    updateUI() {
        try {
            // Update step navigation
            this.updateStepNavigation();
            
            // Update step visibility
            this.updateStepVisibility();
            
            // Update image preview if available
            if (this.state.image) {
                this.updateImagePreview();
            }
            
            // Update color list if colors are available
            if (this.state.colors && this.state.colors.length > 0) {
                this.updateColorList();
            }
            
            // Update color count controls
            this.updateColorCountControls();
            
            // Update 3D model if available
            if (this.model3D) {
                this.update3DModel();
            }
            
            console.log('UI updated successfully');
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    /**
     * Update step navigation active state
     */
    updateStepNavigation() {
        if (!this.elements.progressSteps) return;
        
        this.elements.progressSteps.forEach((step, index) => {
            const stepNumber = index + 1;
            if (stepNumber === this.state.currentStep) {
                step.classList.add('active');
            } else if (stepNumber < this.state.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }

    /**
     * Update step content visibility
     */
    updateStepVisibility() {
        if (!this.elements.stepContents) return;
        
        this.elements.stepContents.forEach((stepContent, index) => {
            const stepNumber = index + 1;
            if (stepNumber === this.state.currentStep) {
                stepContent.classList.add('active');
            } else {
                stepContent.classList.remove('active');
            }
        });
    }

    /**
     * Update color list in the UI
     */
    updateColorList() {
        if (!this.elements.colorList || !this.state.colors) return;
        
        // Clear existing list
        this.elements.colorList.innerHTML = '';
        
        // Create color items
        this.state.colors.forEach((color, index) => {
            const colorItem = this.createColorItem(color, index);
            this.elements.colorList.appendChild(colorItem);
        });
        
        // Update color preview canvas
        this.updateColorPreviewCanvas();
    }

    /**
     * Update the color preview canvas with quantized image
     */
    updateColorPreviewCanvas() {
        if (!this.elements.colorPreviewCanvas || !this.state.image || !this.state.colors) return;
        
        try {
            const canvas = this.elements.colorPreviewCanvas;
            const ctx = canvas.getContext('2d');
            
            // Get original image dimensions
            const imageWidth = this.state.image.width;
            const imageHeight = this.state.image.height;
            
            // Calculate aspect ratio and canvas dimensions
            const maxCanvasSize = 300;
            const aspectRatio = imageWidth / imageHeight;
            let canvasWidth, canvasHeight;
            
            if (aspectRatio > 1) {
                canvasWidth = Math.min(maxCanvasSize, imageWidth);
                canvasHeight = canvasWidth / aspectRatio;
            } else {
                canvasHeight = Math.min(maxCanvasSize, imageHeight);
                canvasWidth = canvasHeight * aspectRatio;
            }
            
            // Set canvas size
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            canvas.style.width = canvasWidth + 'px';
            canvas.style.height = canvasHeight + 'px';
            
            // Create quantized image
            this.renderQuantizedImage(ctx, canvasWidth, canvasHeight, imageWidth, imageHeight);
            
        } catch (error) {
            console.error('Error updating color preview canvas:', error);
        }
    }

    /**
     * Render quantized image to canvas context
     */
    renderQuantizedImage(ctx, canvasWidth, canvasHeight, originalWidth, originalHeight) {
        if (!this.state.image.canvas) return;
        
        // Get original image data
        const originalCanvas = this.state.image.canvas;
        const originalCtx = originalCanvas.getContext('2d');
        const originalImageData = originalCtx.getImageData(0, 0, originalWidth, originalHeight);
        const originalData = originalImageData.data;
        
        // Create new image data for quantized version
        const quantizedImageData = ctx.createImageData(canvasWidth, canvasHeight);
        const quantizedData = quantizedImageData.data;
        
        // Scale factors
        const scaleX = originalWidth / canvasWidth;
        const scaleY = originalHeight / canvasHeight;
        
        // Process each pixel in the canvas
        for (let y = 0; y < canvasHeight; y++) {
            for (let x = 0; x < canvasWidth; x++) {
                // Map to original image coordinates
                const origX = Math.floor(x * scaleX);
                const origY = Math.floor(y * scaleY);
                const origIndex = (origY * originalWidth + origX) * 4;
                
                // Get original pixel color
                const r = originalData[origIndex];
                const g = originalData[origIndex + 1];
                const b = originalData[origIndex + 2];
                const a = originalData[origIndex + 3];
                
                // Find closest color in palette
                const closestColor = this.findClosestColor(r, g, b);
                
                // Set quantized pixel
                const canvasIndex = (y * canvasWidth + x) * 4;
                if (closestColor && a > 128) {
                    quantizedData[canvasIndex] = closestColor.rgb.r;
                    quantizedData[canvasIndex + 1] = closestColor.rgb.g;
                    quantizedData[canvasIndex + 2] = closestColor.rgb.b;
                    quantizedData[canvasIndex + 3] = 255;
                } else {
                    // Transparent or no color found
                    quantizedData[canvasIndex] = 255;
                    quantizedData[canvasIndex + 1] = 255;
                    quantizedData[canvasIndex + 2] = 255;
                    quantizedData[canvasIndex + 3] = 0;
                }
            }
        }
        
        // Render quantized image to canvas
        ctx.putImageData(quantizedImageData, 0, 0);
    }

    /**
     * Find the closest color in the palette to given RGB values
     */
    findClosestColor(r, g, b) {
        if (!this.state.colors || this.state.colors.length === 0) return null;
        
        let closestColor = null;
        let minDistance = Infinity;
        
        for (const color of this.state.colors) {
            if (!color.rgb) continue;
            
            // Calculate Euclidean distance in RGB space
            const dr = r - color.rgb.r;
            const dg = g - color.rgb.g;
            const db = b - color.rgb.b;
            const distance = Math.sqrt(dr * dr + dg * dg + db * db);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = color;
            }
        }
        
        return closestColor;
    }

    /**
     * Extract colors from the current image with specified count
     */
    async extractColorsFromImage(colorCount) {
        if (!this.state.image) {
            console.warn('No image available for color extraction');
            return;
        }

        try {
            // Extract colors using ColorThief if available
            if (window.ColorThief && this.state.image.canvas && this.state.image.canvas.width > 0 && this.state.image.canvas.height > 0) {
                // Ensure the canvas is ready by creating a small test image
                const tempImg = new Image();
                tempImg.crossOrigin = 'anonymous';
                
                tempImg.onload = () => {
                    try {
                        const colorThief = new window.ColorThief();
                        const paletteRgb = colorThief.getPalette(tempImg, colorCount);
                        
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
                        
                        // Update UI and color preview
                        this.updateUI();
                        
                    } catch (colorError) {
                        console.error('ColorThief extraction failed:', colorError);
                        this.fallbackColorExtraction(this.state.image, colorCount);
                    }
                };
                
                tempImg.onerror = () => {
                    console.warn('Failed to load image for ColorThief, using fallback');
                    this.fallbackColorExtraction(this.state.image, colorCount);
                };
                
                tempImg.src = this.state.image.src;
                
            } else {
                this.fallbackColorExtraction(this.state.image, colorCount);
            }
            
        } catch (error) {
            console.error('Color extraction failed:', error);
            this.fallbackColorExtraction(this.state.image, colorCount);
        }
    }

    /**
     * Create a color item element
     */
    createColorItem(color, index) {
        const item = document.createElement('div');
        item.className = 'color-item';
        item.dataset.colorId = color.id;
        item.dataset.colorOrder = color.order || index;
        item.draggable = true;
        
        item.innerHTML = `
            <div class="drag-handle">⋮⋮</div>
            <div class="color-swatch" style="background-color: ${color.hex}"></div>
            <div class="color-info">
                <div class="color-controls">
                    <label class="color-label">
                        Color ${index + 1}
                        <input type="color" class="color-picker" value="${color.hex}" data-color-id="${color.id}">
                    </label>
                    <div class="color-details">
                        <span class="color-hex">${color.hex.toUpperCase()}</span>
                        <span class="color-percent">${color.percent?.toFixed(1) || 0}%</span>
                    </div>
                </div>
                <div class="layer-height">
                    <label>
                        Height: <input type="number" class="height-input" value="${color.height?.toFixed(2) || 0}" 
                               min="0" max="50" step="0.1" data-color-id="${color.id}"> mm
                    </label>
                </div>
            </div>
            <div class="color-controls">
                <button type="button" class="color-delete" data-color-id="${color.id}" title="Remove color">×</button>
            </div>
        `;
        
        // Add event listeners
        const colorPicker = item.querySelector('.color-picker');
        const heightInput = item.querySelector('.height-input');
        const deleteBtn = item.querySelector('.color-delete');
        
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => {
                this.handleColorChange(color.id, e.target.value, 'hex');
            });
        }
        
        if (heightInput) {
            heightInput.addEventListener('change', (e) => {
                this.handleColorChange(color.id, e.target.value, 'height');
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.deleteColor(color.id);
            });
        }
        
        // Add drag and drop event listeners
        this.addDragAndDropListeners(item);
        
        return item;
    }

    /**
     * Add drag and drop event listeners to a color item
     */
    addDragAndDropListeners(item) {
        // Drag start
        item.addEventListener('dragstart', (e) => {
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', item.outerHTML);
            e.dataTransfer.setData('application/json', JSON.stringify({
                colorId: item.dataset.colorId,
                colorOrder: parseInt(item.dataset.colorOrder)
            }));
            
            // Add visual feedback
            setTimeout(() => {
                item.style.opacity = '0.5';
            }, 0);
        });

        // Drag end
        item.addEventListener('dragend', (e) => {
            item.classList.remove('dragging');
            item.style.opacity = '';
            
            // Clean up any drop indicators
            document.querySelectorAll('.color-item.drop-target').forEach(el => {
                el.classList.remove('drop-target');
            });
        });

        // Drag over (for drop targets)
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const draggingItem = document.querySelector('.color-item.dragging');
            if (draggingItem && draggingItem !== item) {
                item.classList.add('drop-target');
            }
        });

        // Drag leave
        item.addEventListener('dragleave', (e) => {
            if (!item.contains(e.relatedTarget)) {
                item.classList.remove('drop-target');
            }
        });

        // Drop
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('drop-target');
            
            const draggingItem = document.querySelector('.color-item.dragging');
            if (draggingItem && draggingItem !== item) {
                try {
                    const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
                    const targetOrder = parseInt(item.dataset.colorOrder);
                    const sourceOrder = dragData.colorOrder;
                    
                    // Reorder colors
                    this.reorderColors(dragData.colorId, targetOrder);
                } catch (error) {
                    console.error('Error handling drop:', error);
                }
            }
        });
    }

    /**
     * Reorder colors by moving a color to a new position
     */
    reorderColors(colorId, targetOrder) {
        try {
            // Find the color being moved
            const colorIndex = this.state.colors.findIndex(c => c.id.toString() === colorId.toString());
            if (colorIndex === -1) return;

            const movingColor = this.state.colors[colorIndex];
            const originalOrder = movingColor.order || colorIndex;

            // Remove the color from its current position
            this.state.colors.splice(colorIndex, 1);

            // Find the new insertion index based on target order
            let insertIndex = targetOrder;
            if (insertIndex > this.state.colors.length) {
                insertIndex = this.state.colors.length;
            }

            // Insert at new position
            this.state.colors.splice(insertIndex, 0, movingColor);

            // Update all color orders
            this.state.colors.forEach((color, index) => {
                color.order = index;
            });

            // Mark as modified
            this.state.isDirty = true;
            this.state.lastModified = new Date();

            // Update UI
            this.updateUI();

            console.log(`Reordered color ${colorId} from position ${originalOrder} to ${targetOrder}`);
        } catch (error) {
            console.error('Error reordering colors:', error);
            this.showError('Failed to reorder colors');
        }
    }

    /**
     * Delete a color from the palette
     */
    deleteColor(colorId) {
        try {
            // Don't allow deleting if only one color remains
            if (this.state.colors.length <= 1) {
                this.showError('Cannot delete the last color. At least one color is required.');
                return;
            }

            // Confirm deletion
            if (!confirm('Are you sure you want to delete this color?')) {
                return;
            }

            // Remove the color
            const colorIndex = this.state.colors.findIndex(c => c.id.toString() === colorId.toString());
            if (colorIndex === -1) return;

            this.state.colors.splice(colorIndex, 1);

            // Redistribute percentages among remaining colors
            const remainingCount = this.state.colors.length;
            if (remainingCount > 0) {
                const evenPercent = 100 / remainingCount;
                this.state.colors.forEach(color => {
                    color.percent = evenPercent;
                });
            }

            // Update orders
            this.state.colors.forEach((color, index) => {
                color.order = index;
            });

            // Mark as modified
            this.state.isDirty = true;
            this.state.lastModified = new Date();

            // Update UI
            this.updateUI();

            console.log(`Deleted color ${colorId}`);
        } catch (error) {
            console.error('Error deleting color:', error);
            this.showError('Failed to delete color');
        }
    }

    /**
     * Update color count controls
     */
    updateColorCountControls() {
        if (this.elements.colorCount && this.state.colors) {
            this.elements.colorCount.value = this.state.colors.length;
        }
        
        if (this.elements.colorCountValue && this.state.colors) {
            this.elements.colorCountValue.textContent = this.state.colors.length;
        }
    }

    /**
     * Update 3D model if it exists
     */
    update3DModel() {
        // Placeholder for 3D model updates
        // This will be implemented when the 3D functionality is needed
        console.log('3D model update requested');
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
