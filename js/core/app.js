/**
 * PolyHue Main Application
 * 
 * Core application initialization and workflow management
 */

class PolyHueApp {
    constructor() {
        this.initialized = false;
        this.currentStep = 1;
        this.totalSteps = 5;
        this.modules = new Map();
        this.eventHandlers = new Map();
        
        // Bind methods to maintain context
        this.init = this.init.bind(this);
        this.nextStep = this.nextStep.bind(this);
        this.previousStep = this.previousStep.bind(this);
        this.setStep = this.setStep.bind(this);
        this.handleError = this.handleError.bind(this);
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) return;

        try {
            console.log('Initializing PolyHue...');
            
            // Initialize state stores
            this.initializeStores();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize UI components
            this.initializeUI();
            
            // Set up workflow navigation
            this.setupWorkflowNavigation();
            
            // Initialize modules
            await this.initializeModules();
            
            // Set initial state
            this.setStep(1);
            
            this.initialized = true;
            console.log('PolyHue initialized successfully');
            
            // Dispatch ready event
            this.dispatchEvent('app:ready');
            
        } catch (error) {
            this.handleError('Initialization failed', error);
        }
    }

    /**
     * Initialize state stores with event listeners
     */
    initializeStores() {
        try {
            // Ensure stores are available
            if (!window.PolyHue || !window.PolyHue.stores) {
                throw new Error('PolyHue stores not initialized');
            }
            
            const { project, regions, filaments } = window.PolyHue.stores;
            
            // Subscribe to project changes
            project.subscribe('mode', (mode) => {
                try {
                    this.onModeChange(mode);
                } catch (error) {
                    console.error('Error in mode change handler:', error);
                }
            });
            
            project.subscribe('originalImage', (image) => {
                try {
                    this.onImageChange(image);
                } catch (error) {
                    console.error('Error in image change handler:', error);
                }
            });
            
            project.subscribe('isProcessing', (isProcessing) => {
                try {
                    this.onProcessingChange(isProcessing);
                } catch (error) {
                    console.error('Error in processing change handler:', error);
                }
            });
            
            // Subscribe to region changes
            regions.subscribe('regions', (regions) => {
                try {
                    this.onRegionsChange(regions);
                } catch (error) {
                    console.error('Error in regions change handler:', error);
                }
            });
            
            // Subscribe to filament changes
            filaments.subscribe('selectedFilaments', (filaments) => {
                try {
                    this.onFilamentsChange(filaments);
                } catch (error) {
                    console.error('Error in filaments change handler:', error);
                }
            });
        } catch (error) {
            console.error('Error initializing stores:', error);
            throw error;
        }
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Handle file drops anywhere on the page
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            
            if (imageFiles.length > 0) {
                this.handleImageUpload(imageFiles[0]);
            }
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'o':
                        e.preventDefault();
                        this.triggerImageUpload();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveProject();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportProject();
                        break;
                }
            }
        });
        
        // Handle browser resize
        window.addEventListener('resize', this.debounce(() => {
            this.onWindowResize();
        }, 250));
        
        // Handle browser close/refresh
        window.addEventListener('beforeunload', (e) => {
            const project = window.PolyHue.stores.project;
            if (project.get('originalImage') && !project.get('saved')) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Help button
        const helpButton = document.getElementById('help-button');
        if (helpButton) {
            helpButton.addEventListener('click', () => {
                this.showHelp();
            });
        }
        
        // Image upload area
        const uploadArea = document.getElementById('image-upload-area');
        const imageInput = document.getElementById('image-input');
        
        if (uploadArea && imageInput) {
            uploadArea.addEventListener('click', () => {
                imageInput.click();
            });
            
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleImageUpload(file);
                }
            });
        }
        
        // Image edit controls
        this.setupImageEditControls();
        
        // Mode selection
        this.setupModeSelection();
        
        // Color settings
        this.setupColorSettings();
        
        // Processing controls
        this.setupProcessingControls();
        
        // Color organization controls
        this.setupColorOrganization();
        
        // Export controls
        this.setupExportControls();
    }

    /**
     * Set up image edit controls
     */
    setupImageEditControls() {
        const brightnessSlider = document.getElementById('brightness-slider');
        const contrastSlider = document.getElementById('contrast-slider');
        const backgroundRemoval = document.getElementById('background-removal');
        
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', this.debounce((e) => {
                this.updateImageSetting('brightness', parseInt(e.target.value));
            }, 100));
        }
        
        if (contrastSlider) {
            contrastSlider.addEventListener('input', this.debounce((e) => {
                this.updateImageSetting('contrast', parseInt(e.target.value));
            }, 100));
        }
        
        if (backgroundRemoval) {
            backgroundRemoval.addEventListener('change', (e) => {
                this.updateImageSetting('backgroundRemoval', e.target.checked);
            });
        }
    }

    /**
     * Set up mode selection
     */
    setupModeSelection() {
        const modeRadios = document.querySelectorAll('input[name="print-mode"]');
        modeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.setMode(e.target.value);
                }
            });
        });
    }

    /**
     * Set up color settings
     */
    setupColorSettings() {
        const colorsSlider = document.getElementById('colors-slider');
        const colorsCount = document.getElementById('colors-count');
        
        if (colorsSlider) {
            colorsSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (colorsCount) {
                    colorsCount.textContent = value;
                }
                this.updateMaxColors(value);
            });
        }
        
        if (maxColorsSlider) {
            maxColorsSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (maxColorsValue) {
                    maxColorsValue.textContent = value;
                }
                this.updateMaxColors(value);
            });
        }
        
        const addFilamentBtn = document.getElementById('add-filament-btn');
        if (addFilamentBtn) {
            addFilamentBtn.addEventListener('click', () => {
                this.showFilamentDialog();
            });
        }
    }

    /**
     * Setup processing controls
     */
    setupProcessingControls() {
        // Start processing button
        const startProcessingBtn = document.getElementById('start-processing');
        if (startProcessingBtn) {
            startProcessingBtn.addEventListener('click', () => {
                this.startProcessing();
            });
        }
        
        // Colors slider
        const colorsSlider = document.getElementById('colors-slider');
        const colorsCount = document.getElementById('colors-count');
        if (colorsSlider && colorsCount) {
            colorsSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                colorsCount.textContent = value;
                this.updateMaxColors(parseInt(value));
            });
        }
    }

    /**
     * Set up color organization controls
     */
    setupColorOrganization() {
        const addColorBtn = document.getElementById('add-color-btn');
        const resetColorsBtn = document.getElementById('reset-colors-btn');
        const autoAssignBtn = document.getElementById('auto-assign-filaments');
        
        if (addColorBtn) {
            addColorBtn.addEventListener('click', () => {
                this.addColor();
            });
        }
        
        if (resetColorsBtn) {
            resetColorsBtn.addEventListener('click', () => {
                this.resetColors();
            });
        }
        
        if (autoAssignBtn) {
            autoAssignBtn.addEventListener('click', () => {
                this.autoAssignFilaments();
            });
        }
    }

    /**
     * Set up export controls
     */
    setupExportControls() {
        const exportAll = document.getElementById('export-all');
        const exportIndividual = document.getElementById('export-individual');
        
        if (exportAll) {
            exportAll.addEventListener('click', () => {
                this.exportAsZip();
            });
        }
        
        if (exportIndividual) {
            exportIndividual.addEventListener('click', () => {
                this.exportIndividually();
            });
        }
    }

    /**
     * Set up workflow navigation
     */
    setupWorkflowNavigation() {
        const nextBtn = document.getElementById('next-step');
        const prevBtn = document.getElementById('prev-step');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', this.nextStep);
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', this.previousStep);
        }
    }

    /**
     * Initialize modules
     */
    async initializeModules() {
        // Module loading will be implemented as we create them
        console.log('Initializing modules...');
        
        // Initialize preview module
        if (window.PolyHue.Preview) {
            this.modules.set('preview', new window.PolyHue.Preview());
            await this.modules.get('preview').init();
        }
        
        // Initialize image upload module
        if (window.PolyHue.ImageUpload) {
            this.modules.set('imageUpload', new window.PolyHue.ImageUpload());
            await this.modules.get('imageUpload').init();
        }
        
        // Initialize workflow module
        if (window.PolyHue.Workflow) {
            this.modules.set('workflow', new window.PolyHue.Workflow());
            await this.modules.get('workflow').init();
        }
        
        // Initialize color quantization module
        if (window.PolyHue.ColorQuantization) {
            this.modules.set('colorQuantization', new window.PolyHue.ColorQuantization());
            await this.modules.get('colorQuantization').init();
        }
        
        // Initialize filament manager
        if (window.PolyHue.FilamentManager) {
            this.modules.set('filamentManager', window.PolyHue.FilamentManager.getFilamentManager());
            await this.modules.get('filamentManager').init();
        }
        
        // Initialize filament palette
        if (window.PolyHue.FilamentPalette) {
            this.modules.set('filamentPalette', window.PolyHue.FilamentPalette.getFilamentPalette());
            await this.modules.get('filamentPalette').init();
        }
    }

    /**
     * Navigate to next step
     */
    nextStep() {
        if (this.currentStep < this.totalSteps) {
            // Validate current step before proceeding
            if (this.validateCurrentStep()) {
                this.setStep(this.currentStep + 1);
            }
        }
    }

    /**
     * Navigate to previous step
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.setStep(this.currentStep - 1);
        }
    }

    /**
     * Set current workflow step
     * @param {number} step - Step number (1-5)
     */
    setStep(step) {
        if (step < 1 || step > this.totalSteps) return;
        
        this.currentStep = step;
        
        // Update step indicators
        this.updateStepIndicators();
        
        // Show/hide step content
        this.updateStepContent();
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Dispatch step change event
        this.dispatchEvent('step:change', { step: this.currentStep });
    }

    /**
     * Update step indicators in UI
     */
    updateStepIndicators() {
        const indicators = document.querySelectorAll('.step-indicator');
        indicators.forEach((indicator, index) => {
            const stepNum = index + 1;
            const circle = indicator.querySelector('div');
            
            indicator.classList.remove('active', 'completed');
            
            if (stepNum < this.currentStep) {
                indicator.classList.add('completed');
                circle.classList.remove('bg-blue-500', 'bg-gray-300');
                circle.classList.add('bg-green-500');
            } else if (stepNum === this.currentStep) {
                indicator.classList.add('active');
                circle.classList.remove('bg-gray-300', 'bg-green-500');
                circle.classList.add('bg-blue-500');
            } else {
                circle.classList.remove('bg-blue-500', 'bg-green-500');
                circle.classList.add('bg-gray-300');
            }
        });
    }

    /**
     * Update step content visibility
     */
    updateStepContent() {
        const steps = ['import', 'process', 'colors', '3d', 'export'];
        
        steps.forEach((step, index) => {
            const element = document.getElementById(`step-${step}`);
            if (element) {
                element.style.display = (index + 1 === this.currentStep) ? 'block' : 'none';
            }
        });
        
        // Special handling for export panel
        const exportPanel = document.getElementById('export-panel');
        if (exportPanel) {
            exportPanel.style.display = (this.currentStep === 5) ? 'block' : 'none';
        }
    }

    /**
     * Update navigation button states
     */
    updateNavigationButtons() {
        const nextBtn = document.getElementById('next-step');
        const prevBtn = document.getElementById('prev-step');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentStep === 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentStep === this.totalSteps;
            nextBtn.textContent = this.currentStep === this.totalSteps ? 'Export' : 'Next';
        }
    }

    /**
     * Validate current step before proceeding
     * @returns {boolean} Whether current step is valid
     */
    validateCurrentStep() {
        const project = window.PolyHue.stores.project;
        
        switch (this.currentStep) {
            case 1: // Image import
                if (!project.get('originalImage')) {
                    this.showError('Please upload an image first');
                    return false;
                }
                break;
                
            case 2: // Processing
                if (!project.get('originalImage')) {
                    this.showError('Please upload an image first');
                    return false;
                }
                // Check if processing has been started
                if (!project.get('processed')) {
                    this.showError('Please click "Start Processing" to quantize colors');
                    return false;
                }
                break;
                
            case 3: // Color organization
                const regions = window.PolyHue.stores.regions.get('regions');
                if (regions.length === 0) {
                    this.showError('No color regions found. Please process your image first.');
                    return false;
                }
                break;
                
            case 4: // 3D View
                const colorOrder = project.get('colorOrder');
                if (!colorOrder || colorOrder.length === 0) {
                    this.showError('Please organize your colors first');
                    return false;
                }
                break;
                
            case 5: // Export
                // Export validation is handled by the export modules
                break;
        }
        
        return true;
    }

    /**
     * Handle image upload
     * @param {File} file - Image file
     */
    async handleImageUpload(file) {
        try {
            const project = window.PolyHue.stores.project;
            project.set('isProcessing', true);
            project.set('processingStep', 'Loading image...');
            
            // Convert file to ImageBitmap
            const bitmap = await window.PolyHue.Utils.fileToImageBitmap(file);
            
            // Resize if too large
            const maxSize = 4096;
            const resizedBitmap = await window.PolyHue.Utils.resizeImage(bitmap, maxSize, maxSize);
            
            // Store in project
            project.set('originalImage', resizedBitmap);
            project.set('modified', new Date().toISOString());
            
            // Show image edit controls
            const editControls = document.getElementById('image-edit-controls');
            if (editControls) {
                editControls.classList.remove('hidden');
            }
            
            // Update preview
            this.updatePreview();
            
            project.set('isProcessing', false);
            project.set('processingStep', null);
            
            this.dispatchEvent('image:uploaded', { bitmap: resizedBitmap });
            
        } catch (error) {
            this.handleError('Failed to upload image', error);
        }
    }

    /**
     * Set print mode
     * @param {string} mode - Print mode ('lithophane' or 'multicolor')
     */
    setMode(mode) {
        const project = window.PolyHue.stores.project;
        project.set('mode', mode);
        project.set('modified', new Date().toISOString());
        
        this.dispatchEvent('mode:changed', { mode });
    }

    /**
     * Update image setting
     * @param {string} setting - Setting name
     * @param {any} value - Setting value
     */
    updateImageSetting(setting, value) {
        const project = window.PolyHue.stores.project;
        const settings = project.get('imageSettings');
        
        project.set('imageSettings', {
            ...settings,
            [setting]: value
        });
        
        // Update preview
        this.updatePreview();
    }

    /**
     * Update max colors setting
     * @param {number} maxColors - Maximum number of colors
     */
    updateMaxColors(maxColors) {
        const project = window.PolyHue.stores.project;
        project.set('maxColors', maxColors);
        
        // Dispatch event for color quantization module
        this.dispatchEvent('maxcolors:changed', { maxColors });
    }

    /**
     * Start processing the image
     */
    async startProcessing() {
        try {
            const project = window.PolyHue.stores.project;
            const image = project.get('originalImage');
            
            if (!image) {
                this.showError('Please upload an image first');
                return;
            }
            
            // Show processing status
            const statusElement = document.getElementById('processing-status');
            const progressElement = document.getElementById('processing-progress');
            const buttonElement = document.getElementById('start-processing');
            
            if (statusElement) statusElement.classList.remove('hidden');
            if (buttonElement) buttonElement.disabled = true;
            
            // Get max colors from slider
            const maxColors = parseInt(document.getElementById('colors-slider')?.value || 8);
            
            // Update progress
            if (progressElement) progressElement.style.width = '25%';
            
            // Get or create color quantization module
            let colorQuantization = this.modules.get('colorQuantization');
            if (!colorQuantization) {
                // Create color quantization manager if it doesn't exist
                colorQuantization = new window.PolyHue.ColorQuantization();
                await colorQuantization.init();
                this.modules.set('colorQuantization', colorQuantization);
            }
            
            // Update progress
            if (progressElement) progressElement.style.width = '50%';
            
            // Quantize the image
            const result = await colorQuantization.quantizeImage({
                maxColors: maxColors,
                algorithm: 'kmeans'
            });
            
            // Update progress
            if (progressElement) progressElement.style.width = '75%';
            
            // Process the results
            this.processQuantizationResults(result);
            
            // Update progress
            if (progressElement) progressElement.style.width = '100%';
            
            // Mark as processed
            project.set('processed', true);
            project.set('maxColors', maxColors);
            
            // Hide processing status and enable button
            setTimeout(() => {
                if (statusElement) statusElement.classList.add('hidden');
                if (buttonElement) {
                    buttonElement.disabled = false;
                    buttonElement.textContent = 'Reprocess';
                }
                if (progressElement) progressElement.style.width = '0%';
            }, 1000);
            
            // Dispatch processing completed event
            this.dispatchEvent('processing:completed', { result });
            
            // Automatically move to next step after processing
            setTimeout(() => {
                this.nextStep();
            }, 1500);
            
        } catch (error) {
            this.handleError('Processing failed', error);
            
            // Reset UI state
            const statusElement = document.getElementById('processing-status');
            const buttonElement = document.getElementById('start-processing');
            
            if (statusElement) statusElement.classList.add('hidden');
            if (buttonElement) buttonElement.disabled = false;
        }
    }

    /**
     * Process quantization results
     * @param {Object} result - Quantization result
     */
    processQuantizationResults(result) {
        const regions = window.PolyHue.stores.regions;
        const project = window.PolyHue.stores.project;
        
        // Store the quantized regions
        regions.set('regions', result.regions || []);
        regions.set('palette', result.palette || []);
        
        // Create default color order (can be reordered by user)
        const colorOrder = result.palette.map((color, index) => ({
            id: `color-${index}`,
            color: color,
            height: index + 1, // Default height order
            index: index
        }));
        
        project.set('colorOrder', colorOrder);
        
        // Update the color organization UI
        this.updateColorOrganizationUI(result.palette);
        
        // Update preview
        this.updatePreview();
        
        console.log('Processing completed with', result.regions.length, 'regions');
    }

    /**
     * Update color organization UI with quantized colors
     * @param {Array} palette - Color palette from quantization
     */
    updateColorOrganizationUI(palette) {
        const colorHeightOrder = document.getElementById('color-height-order');
        if (!colorHeightOrder) return;
        
        // Clear existing content
        colorHeightOrder.innerHTML = '';
        
        // Create color items
        palette.forEach((color, index) => {
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border cursor-move';
            colorItem.setAttribute('data-color-id', `color-${index}`);
            colorItem.draggable = true;
            
            const colorSwatch = document.createElement('div');
            colorSwatch.className = 'w-8 h-8 rounded border-2 border-gray-300 flex-shrink-0';
            colorSwatch.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
            
            const colorInfo = document.createElement('div');
            colorInfo.className = 'flex-1';
            colorInfo.innerHTML = `
                <div class="font-medium">Color ${index + 1}</div>
                <div class="text-sm text-gray-500">Height: ${index + 1}</div>
            `;
            
            const colorPicker = document.createElement('button');
            colorPicker.className = 'text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600';
            colorPicker.textContent = 'Edit';
            colorPicker.addEventListener('click', () => {
                this.showColorPickerDialog(index, color);
            });
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
                this.deleteColor(index);
            });
            
            colorItem.appendChild(colorSwatch);
            colorItem.appendChild(colorInfo);
            colorItem.appendChild(colorPicker);
            colorItem.appendChild(deleteButton);
            
            colorHeightOrder.appendChild(colorItem);
        });
        
        // Add drag and drop functionality
        this.setupDragAndDrop();
    }

    /**
     * Set up drag and drop for color reordering
     */
    setupDragAndDrop() {
        const colorItems = document.querySelectorAll('.color-item');
        
        colorItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.colorId);
                item.classList.add('opacity-50');
            });
            
            item.addEventListener('dragend', (e) => {
                item.classList.remove('opacity-50');
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain');
                const draggedElement = document.querySelector(`[data-color-id="${draggedId}"]`);
                
                if (draggedElement && draggedElement !== item) {
                    const container = item.parentNode;
                    const afterElement = this.getDragAfterElement(container, e.clientY);
                    
                    if (afterElement == null) {
                        container.appendChild(draggedElement);
                    } else {
                        container.insertBefore(draggedElement, afterElement);
                    }
                    
                    this.updateColorOrder();
                }
            });
        });
    }

    /**
     * Get the element after which to insert the dragged element
     * @param {HTMLElement} container - Container element
     * @param {number} y - Y coordinate
     * @returns {HTMLElement|null} Element after which to insert
     */
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.color-item:not(.opacity-50)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * Update color order based on current DOM order
     */
    updateColorOrder() {
        const colorItems = document.querySelectorAll('.color-item');
        const project = window.PolyHue.stores.project;
        const currentOrder = project.get('colorOrder') || [];
        
        const newOrder = Array.from(colorItems).map((item, index) => {
            const colorId = item.dataset.colorId;
            const originalItem = currentOrder.find(c => c.id === colorId);
            
            if (originalItem) {
                return {
                    ...originalItem,
                    height: index + 1
                };
            }
            
            return null;
        }).filter(item => item !== null);
        
        project.set('colorOrder', newOrder);
        
        // Update height display
        colorItems.forEach((item, index) => {
            const heightDisplay = item.querySelector('.text-sm.text-gray-500');
            if (heightDisplay) {
                heightDisplay.textContent = `Height: ${index + 1}`;
            }
        });
        
        // Update preview
        this.updatePreview();
    }

    /**
     * Show color picker dialog
     * @param {number} index - Color index
     * @param {Object} color - Current color
     */
    showColorPickerDialog(index, color) {
        // Create a simple color picker (can be enhanced with a better UI)
        const newColor = prompt(`Enter new color for Color ${index + 1} (format: r,g,b):`, `${color.r},${color.g},${color.b}`);
        
        if (newColor) {
            const [r, g, b] = newColor.split(',').map(n => parseInt(n.trim()));
            
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                this.updateColorValue(index, { r, g, b });
            }
        }
    }

    /**
     * Update color value
     * @param {number} index - Color index
     * @param {Object} color - New color
     */
    updateColorValue(index, color) {
        const project = window.PolyHue.stores.project;
        const colorOrder = project.get('colorOrder') || [];
        
        if (colorOrder[index]) {
            colorOrder[index].color = color;
            project.set('colorOrder', colorOrder);
            
            // Update UI
            this.updateColorOrganizationUI(colorOrder.map(c => c.color));
            
            // Update preview
            this.updatePreview();
        }
    }

    /**
     * Delete color
     * @param {number} index - Color index
     */
    deleteColor(index) {
        const project = window.PolyHue.stores.project;
        const colorOrder = project.get('colorOrder') || [];
        
        if (colorOrder.length > 2) { // Keep at least 2 colors
            colorOrder.splice(index, 1);
            
            // Update heights
            colorOrder.forEach((item, i) => {
                item.height = i + 1;
            });
            
            project.set('colorOrder', colorOrder);
            
            // Update UI
            this.updateColorOrganizationUI(colorOrder.map(c => c.color));
            
            // Update preview
            this.updatePreview();
        } else {
            this.showError('You must have at least 2 colors');
        }
    }

    /**
     * Add a new color to the palette
     */
    addColor() {
        const project = window.PolyHue.stores.project;
        const colorOrder = project.get('colorOrder') || [];
        
        if (colorOrder.length >= 12) {
            this.showError('Maximum 12 colors allowed');
            return;
        }
        
        // Create a new color (default to white)
        const newColor = {
            id: `color-${colorOrder.length}`,
            color: { r: 255, g: 255, b: 255 },
            height: colorOrder.length + 1,
            index: colorOrder.length
        };
        
        colorOrder.push(newColor);
        project.set('colorOrder', colorOrder);
        
        // Update UI
        this.updateColorOrganizationUI(colorOrder.map(c => c.color));
        
        // Update preview
        this.updatePreview();
    }

    /**
     * Reset colors to original quantized palette
     */
    resetColors() {
        const regions = window.PolyHue.stores.regions;
        const project = window.PolyHue.stores.project;
        const originalPalette = regions.get('palette');
        
        if (originalPalette && originalPalette.length > 0) {
            // Recreate original color order
            const colorOrder = originalPalette.map((color, index) => ({
                id: `color-${index}`,
                color: color,
                height: index + 1,
                index: index
            }));
            
            project.set('colorOrder', colorOrder);
            
            // Update UI
            this.updateColorOrganizationUI(originalPalette);
            
            // Update preview
            this.updatePreview();
        } else {
            this.showError('No original palette found. Please process an image first.');
        }
    }

    /**
     * Auto-assign filaments to colors based on best color match
     */
    autoAssignFilaments() {
        const project = window.PolyHue.stores.project;
        const filaments = window.PolyHue.stores.filaments;
        const colorOrder = project.get('colorOrder') || [];
        const availableFilaments = filaments.get('filaments') || [];
        
        if (colorOrder.length === 0) {
            this.showError('No colors to assign filaments to');
            return;
        }
        
        if (availableFilaments.length === 0) {
            this.showError('No filaments available');
            return;
        }
        
        // Auto-assign based on color matching
        const assignments = colorOrder.map((colorItem, index) => {
            const bestMatch = this.findBestFilamentMatch(colorItem.color, availableFilaments);
            return {
                colorIndex: index,
                colorId: colorItem.id,
                filamentId: bestMatch.id,
                filament: bestMatch
            };
        });
        
        // Store assignments
        const regions = window.PolyHue.stores.regions;
        regions.set('assignments', assignments);
        
        // Update filament assignments UI
        this.updateFilamentAssignmentsUI(assignments);
        
        console.log('Auto-assigned filaments:', assignments);
    }

    /**
     * Find best filament match for a color
     * @param {Object} targetColor - Target color {r, g, b}
     * @param {Array} filaments - Available filaments
     * @returns {Object} Best matching filament
     */
    findBestFilamentMatch(targetColor, filaments) {
        let bestMatch = filaments[0];
        let bestDistance = Infinity;
        
        filaments.forEach(filament => {
            const filamentColor = this.hexToRgb(filament.hex);
            const distance = this.colorDistance(targetColor, filamentColor);
            
            if (distance < bestDistance) {
                bestDistance = distance;
                bestMatch = filament;
            }
        });
        
        return bestMatch;
    }

    /**
     * Calculate color distance (Euclidean distance in RGB space)
     * @param {Object} color1 - First color {r, g, b}
     * @param {Object} color2 - Second color {r, g, b}
     * @returns {number} Distance
     */
    colorDistance(color1, color2) {
        const dr = color1.r - color2.r;
        const dg = color1.g - color2.g;
        const db = color1.b - color2.b;
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    /**
     * Convert hex color to RGB
     * @param {string} hex - Hex color string
     * @returns {Object} RGB color {r, g, b}
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    /**
     * Update filament assignments UI
     * @param {Array} assignments - Filament assignments
     */
    updateFilamentAssignmentsUI(assignments) {
        const assignmentsContainer = document.getElementById('filament-assignments');
        if (!assignmentsContainer) return;
        
        assignmentsContainer.innerHTML = '';
        
        assignments.forEach((assignment, index) => {
            const assignmentItem = document.createElement('div');
            assignmentItem.className = 'flex items-center space-x-3 p-2 bg-gray-50 rounded';
            
            const colorSwatch = document.createElement('div');
            colorSwatch.className = 'w-6 h-6 rounded border border-gray-300 flex-shrink-0';
            colorSwatch.style.backgroundColor = assignment.filament.hex;
            
            const assignmentInfo = document.createElement('div');
            assignmentInfo.className = 'flex-1 text-sm';
            assignmentInfo.innerHTML = `
                <div class="font-medium">${assignment.filament.vendor} ${assignment.filament.name}</div>
                <div class="text-gray-500">Color ${index + 1}</div>
            `;
            
            const changeButton = document.createElement('button');
            changeButton.className = 'text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded';
            changeButton.textContent = 'Change';
            changeButton.addEventListener('click', () => {
                this.showFilamentSelectionDialog(assignment.colorIndex);
            });
            
            assignmentItem.appendChild(colorSwatch);
            assignmentItem.appendChild(assignmentInfo);
            assignmentItem.appendChild(changeButton);
            
            assignmentsContainer.appendChild(assignmentItem);
        });
    }

    /**
     * Show filament selection dialog
     * @param {number} colorIndex - Color index
     */
    showFilamentSelectionDialog(colorIndex) {
        // Simple implementation - can be enhanced with a proper dialog
        const filaments = window.PolyHue.stores.filaments.get('filaments') || [];
        const filamentNames = filaments.map(f => `${f.vendor} ${f.name}`);
        
        const selected = prompt(`Select filament for Color ${colorIndex + 1}:\n\n${filamentNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}\n\nEnter number (1-${filamentNames.length}):`);
        
        if (selected) {
            const index = parseInt(selected) - 1;
            if (index >= 0 && index < filaments.length) {
                this.assignFilamentToColor(colorIndex, filaments[index]);
            }
        }
    }

    /**
     * Assign filament to color
     * @param {number} colorIndex - Color index
     * @param {Object} filament - Filament object
     */
    assignFilamentToColor(colorIndex, filament) {
        const regions = window.PolyHue.stores.regions;
        const assignments = regions.get('assignments') || [];
        
        // Update or add assignment
        const existingIndex = assignments.findIndex(a => a.colorIndex === colorIndex);
        const assignment = {
            colorIndex: colorIndex,
            colorId: `color-${colorIndex}`,
            filamentId: filament.id,
            filament: filament
        };
        
        if (existingIndex >= 0) {
            assignments[existingIndex] = assignment;
        } else {
            assignments.push(assignment);
        }
        
        regions.set('assignments', assignments);
        
        // Update UI
        this.updateFilamentAssignmentsUI(assignments);
        
        console.log('Assigned filament to color:', assignment);
    }

    /**
     * Update preview
     */
    updatePreview() {
        const previewModule = this.modules.get('preview');
        if (previewModule) {
            previewModule.update();
        }
    }



    /**
     * Event handlers for state changes
     */
    onModeChange(mode) {
        console.log('Mode changed to:', mode);
        this.updatePreview();
    }

    onImageChange(image) {
        console.log('Image changed');
        this.updatePreview();
    }

    onProcessingChange(isProcessing) {
        // Update loading text and state
        const loadingElement = document.getElementById('preview-loading');
        const loadingText = loadingElement?.querySelector('p');
        
        if (isProcessing) {
            if (loadingText) {
                loadingText.innerHTML = `<div class="loading-spinner inline-block mr-2"></div>Processing...`;
            }
            if (loadingElement) {
                loadingElement.style.display = 'flex';
            }
        } else {
            const project = window.PolyHue.stores.project;
            const hasImage = project.get('originalImage');
            
            if (!hasImage && loadingText) {
                loadingText.textContent = 'Upload an image to begin';
            }
        }
    }

    onRegionsChange(regions) {
        console.log('Regions changed:', regions.length);
        this.updatePreview();
    }

    onFilamentsChange(filaments) {
        console.log('Filaments changed:', filaments.length);
        this.updatePreview();
    }

    onWindowResize() {
        // Handle responsive behavior
        this.updatePreview();
    }

    /**
     * Utility methods
     */
    debounce(func, wait) {
        return window.PolyHue.Utils.debounce(func, wait);
    }

    dispatchEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    showError(message) {
        // Simple error display - can be enhanced with a proper notification system
        alert(message);
    }

    handleError(message, error) {
        console.error(message, error);
        this.showError(message);
        
        // Reset processing state without setting error in project store to prevent circular calls
        const project = window.PolyHue.stores.project;
        project.set('isProcessing', false);
    }

    triggerImageUpload() {
        const imageInput = document.getElementById('image-input');
        if (imageInput) {
            imageInput.click();
        }
    }

    toggleTheme() {
        // Simple theme toggle - can be enhanced
        document.body.classList.toggle('dark');
    }

    showHelp() {
        // Show help dialog - can be enhanced
        alert('PolyHue Help\n\nUpload an image and follow the workflow steps to create your 3D print files.');
    }

    showFilamentDialog() {
        // Show custom filament dialog - will be implemented in filament module
        console.log('Show filament dialog');
    }

    saveProject() {
        const projectData = window.PolyHue.StateUtils.exportProject();
        const filename = `polyhue-project-${new Date().toISOString().split('T')[0]}.json`;
        window.PolyHue.Utils.downloadFile(projectData, filename, 'application/json');
    }

    exportAsZip() {
        // Export all selected formats as ZIP - will be implemented in export modules
        console.log('Export as ZIP');
    }

    exportIndividually() {
        // Export each format individually - will be implemented in export modules
        console.log('Export individually');
    }
}

// Initialize global PolyHue namespace
window.PolyHue = window.PolyHue || {};
window.PolyHue.App = PolyHueApp;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.PolyHue.app = new PolyHueApp();
    window.PolyHue.init = () => window.PolyHue.app.init();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PolyHueApp;
}