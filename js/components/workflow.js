/**
 * PolyHue Workflow Component
 * 
 * Handles workflow navigation and mode selection
 */

class WorkflowComponent {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.stepValidation = new Map();
        
        this.init = this.init.bind(this);
        this.validateStep = this.validateStep.bind(this);
        this.nextStep = this.nextStep.bind(this);
        this.previousStep = this.previousStep.bind(this);
    }

    /**
     * Initialize workflow component
     */
    init() {
        this.setupStepValidation();
        this.setupEventListeners();
        console.log('Workflow component initialized');
    }

    /**
     * Set up step validation rules
     */
    setupStepValidation() {
        // Step 1: Image upload
        this.stepValidation.set(1, () => {
            const project = window.PolyHue.stores.project;
            return project.get('originalImage') !== null;
        });

        // Step 2: Mode selection  
        this.stepValidation.set(2, () => {
            const project = window.PolyHue.stores.project;
            return project.get('mode') !== null;
        });

        // Step 3: Palette configuration
        this.stepValidation.set(3, () => {
            const project = window.PolyHue.stores.project;
            const mode = project.get('mode');
            
            if (mode === 'multicolor') {
                const regions = window.PolyHue.stores.regions.get('regions');
                const filaments = window.PolyHue.stores.filaments.get('selectedFilaments');
                return regions.length > 0 && filaments.length >= regions.length;
            }
            
            return true; // Lithophane mode doesn't require region validation
        });

        // Step 4: Preview
        this.stepValidation.set(4, () => true); // Always valid if we reach this step

        // Step 5: Export
        this.stepValidation.set(5, () => true); // Always valid if we reach this step
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for mode changes to trigger validation
        document.addEventListener('mode:changed', () => {
            this.validateCurrentStep();
        });

        // Listen for image changes
        document.addEventListener('image:loaded', () => {
            this.validateCurrentStep();
        });

        // Listen for step changes from app
        document.addEventListener('step:change', (e) => {
            this.currentStep = e.detail.step;
            this.updateStepContent();
        });
    }

    /**
     * Validate current step
     * @returns {boolean} Whether current step is valid
     */
    validateCurrentStep() {
        return this.validateStep(this.currentStep);
    }

    /**
     * Validate specific step
     * @param {number} step - Step number to validate
     * @returns {boolean} Whether step is valid
     */
    validateStep(step) {
        const validator = this.stepValidation.get(step);
        return validator ? validator() : false;
    }

    /**
     * Move to next step
     */
    nextStep() {
        if (this.validateCurrentStep() && this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStepContent();
            this.dispatchStepChange();
        }
    }

    /**
     * Move to previous step
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepContent();
            this.dispatchStepChange();
        }
    }

    /**
     * Update step content visibility
     */
    updateStepContent() {
        const steps = ['import', 'mode', 'palette', 'preview', 'export'];
        
        steps.forEach((step, index) => {
            const element = document.getElementById(`step-${step}`);
            if (element) {
                element.style.display = (index + 1 === this.currentStep) ? 'block' : 'none';
            }
        });

        // Handle export panel
        const exportPanel = document.getElementById('export-panel');
        if (exportPanel) {
            exportPanel.style.display = (this.currentStep === 5) ? 'block' : 'none';
        }

        // Update mode-specific content
        this.updateModeSpecificContent();
    }

    /**
     * Update content based on selected mode
     */
    updateModeSpecificContent() {
        const project = window.PolyHue.stores.project;
        const mode = project.get('mode');
        
        if (this.currentStep === 3 && mode) {
            // Update palette step based on mode
            const paletteContent = document.getElementById('step-palette');
            if (paletteContent) {
                this.updatePaletteStepForMode(mode);
            }
        }
    }

    /**
     * Update palette step content for specific mode
     * @param {string} mode - Selected mode ('lithophane' or 'multicolor')
     */
    updatePaletteStepForMode(mode) {
        const colorRegions = document.getElementById('color-regions');
        const maxColorsContainer = document.querySelector('#max-colors-slider').parentElement;
        
        if (mode === 'multicolor') {
            // Show color quantization controls
            if (maxColorsContainer) {
                maxColorsContainer.style.display = 'block';
            }
            
            // Show/update color regions
            this.updateColorRegions();
        } else if (mode === 'lithophane') {
            // Hide color quantization for lithophane mode
            if (maxColorsContainer) {
                maxColorsContainer.style.display = 'none';
            }
            
            // Show filament stack order instead
            this.updateFilamentStack();
        }
    }

    /**
     * Update color regions display for multicolor mode
     */
    updateColorRegions() {
        const regions = window.PolyHue.stores.regions.get('regions');
        const colorRegionsContainer = document.getElementById('color-regions');
        
        if (!colorRegionsContainer) return;
        
        if (regions.length === 0) {
            colorRegionsContainer.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <p class="text-sm">Upload an image and adjust max colors to see color regions</p>
                </div>
            `;
        } else {
            colorRegionsContainer.innerHTML = regions.map((region, index) => `
                <div class="flex items-center space-x-3 p-3 border rounded-lg region-item" data-region-id="${region.id || index}">
                    <div class="w-8 h-8 rounded border-2 border-gray-300" style="background-color: ${region.avgColor || '#ccc'}"></div>
                    <div class="flex-1">
                        <div class="text-sm font-medium">Region ${index + 1}</div>
                        <div class="text-xs text-gray-500">${region.pixelCount || 0} pixels</div>
                    </div>
                    <button class="text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded assign-filament-btn">
                        Assign Filament
                    </button>
                </div>
            `).join('');
            
            // Add event listeners for filament assignment
            colorRegionsContainer.querySelectorAll('.assign-filament-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const regionItem = e.target.closest('.region-item');
                    const regionId = regionItem.dataset.regionId;
                    this.showFilamentSelectionDialog(regionId);
                });
            });
        }
    }

    /**
     * Update filament stack for lithophane mode
     */
    updateFilamentStack() {
        const colorRegionsContainer = document.getElementById('color-regions');
        
        if (!colorRegionsContainer) return;
        
        colorRegionsContainer.innerHTML = `
            <div class="space-y-3">
                <h4 class="font-medium text-gray-700">Filament Layer Order</h4>
                <p class="text-sm text-gray-500">Arrange filaments from bottom to top for optimal color blending</p>
                <div class="space-y-2" id="filament-stack">
                    <div class="p-3 border rounded-lg bg-gray-50">
                        <div class="text-sm text-gray-600">Drop filaments here to build your stack</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Show filament selection dialog
     * @param {string} regionId - Region ID to assign filament to
     */
    showFilamentSelectionDialog(regionId) {
        // Simple implementation - can be enhanced with a proper modal
        const filaments = window.PolyHue.stores.filaments.get('filaments');
        const filamentNames = filaments.map(f => `${f.vendor} ${f.name} (${f.hex})`);
        
        const selection = prompt('Select a filament:\n' + filamentNames.map((name, i) => `${i + 1}. ${name}`).join('\n'));
        
        if (selection) {
            const index = parseInt(selection) - 1;
            if (index >= 0 && index < filaments.length) {
                // Assign filament to region
                const regions = window.PolyHue.stores.regions;
                const assignments = regions.get('assignments') || new Map();
                assignments.set(regionId, filaments[index].id);
                regions.set('assignments', assignments);
                
                // Update display
                this.updateColorRegions();
            }
        }
    }

    /**
     * Dispatch step change event
     */
    dispatchStepChange() {
        const event = new CustomEvent('workflow:step-change', {
            detail: { step: this.currentStep }
        });
        document.dispatchEvent(event);
    }

    /**
     * Get validation message for current step
     * @returns {string} Validation message
     */
    getValidationMessage() {
        switch (this.currentStep) {
            case 1:
                return 'Please upload an image to continue';
            case 2:
                return 'Please select a print mode';
            case 3:
                const project = window.PolyHue.stores.project;
                const mode = project.get('mode');
                if (mode === 'multicolor') {
                    const regions = window.PolyHue.stores.regions.get('regions');
                    if (regions.length === 0) {
                        return 'No color regions found. Try adjusting the max colors setting.';
                    }
                    const filaments = window.PolyHue.stores.filaments.get('selectedFilaments');
                    if (filaments.length < regions.length) {
                        return `Please assign filaments to all ${regions.length} color regions`;
                    }
                }
                return '';
            default:
                return '';
        }
    }
}

// Export for global access
window.PolyHue = window.PolyHue || {};
window.PolyHue.Workflow = WorkflowComponent;

// Export for module systems  
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkflowComponent;
} 