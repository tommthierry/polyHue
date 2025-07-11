/**
 * PolyHue State Management System
 * 
 * Provides reactive state management for the entire application
 * without external dependencies. Uses observer pattern for reactivity.
 */

class StateStore {
    constructor(initialState = {}) {
        this.state = { ...initialState };
        this.listeners = new Map();
        this.middlewares = [];
    }

    /**
     * Subscribe to state changes
     * @param {string} key - State key to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        
        this.listeners.get(key).add(callback);
        
        // Return unsubscribe function
        return () => {
            this.listeners.get(key)?.delete(callback);
        };
    }

    /**
     * Get current state value
     * @param {string} key - State key
     * @returns {any} State value
     */
    get(key) {
        return this.state[key];
    }

    /**
     * Set state value and notify listeners
     * @param {string} key - State key
     * @param {any} value - New value
     */
    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        
        // Run middlewares
        this.middlewares.forEach(middleware => {
            middleware(key, value, oldValue, this.state);
        });
        
        // Notify listeners
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                callback(value, oldValue, key);
            });
        }
    }

    /**
     * Update state using a function
     * @param {string} key - State key
     * @param {Function} updater - Function to update state
     */
    update(key, updater) {
        const currentValue = this.get(key);
        const newValue = updater(currentValue);
        this.set(key, newValue);
    }

    /**
     * Add middleware for state changes
     * @param {Function} middleware - Middleware function
     */
    use(middleware) {
        this.middlewares.push(middleware);
    }

    /**
     * Get entire state (for debugging)
     * @returns {Object} Complete state object
     */
    getState() {
        return { ...this.state };
    }
}

// Create global state stores
const projectStore = new StateStore({
    // Project metadata
    name: 'Untitled Project',
    mode: null, // 'lithophane' | 'multicolor'
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    
    // Image processing
    originalImage: null,
    processedImage: null,
    imageSettings: {
        brightness: 0,
        contrast: 0,
        backgroundRemoval: false,
        rotation: 0,
        cropArea: null
    },
    
    // Color quantization
    maxColors: 4,
    quantizationAlgorithm: 'kmeans', // 'kmeans' | 'median-cut'
    
    // Print settings
    printSettings: {
        layerHeight: 0.08,
        minThickness: 0.4,
        maxThickness: 3.0,
        uniformThickness: 1.5,
        modelWidth: 100,
        modelHeight: 100
    },
    
    // Export settings
    exportFormats: {
        stl: true,
        glb: true,
        obj: false,
        '3mf': false,
        txt: true,
        png: true,
        json: true
    },
    
    // Processing state
    isProcessing: false,
    processingStep: null,
    processingProgress: 0,
    error: null
});

const regionsStore = new StateStore({
    // Color regions from quantization
    regions: [],
    
    // Region overlay display
    showRegionOverlay: false,
    selectedRegion: null,
    
    // Color merging
    mergeThreshold: 8, // ΔE threshold for merging similar colors
    mergedRegions: [],
    
    // Region assignments
    assignments: new Map(), // regionId -> filamentId
    
    // Analysis data
    colorAnalysis: {
        dominantColors: [],
        colorDistribution: {},
        averageComplexity: 0
    }
});

const filamentsStore = new StateStore({
    // Available filaments
    filaments: [
        // Default filament library
        {
            id: 'poly-red',
            vendor: 'Polymaker',
            name: 'Translucent Red',
            hex: '#FF3322',
            td: 12.0,
            type: 'translucent',
            category: 'basic'
        },
        {
            id: 'poly-blue',
            vendor: 'Polymaker',
            name: 'Translucent Blue',
            hex: '#2233FF',
            td: 15.0,
            type: 'translucent',
            category: 'basic'
        },
        {
            id: 'poly-green',
            vendor: 'Polymaker',
            name: 'Translucent Green',
            hex: '#22FF33',
            td: 14.0,
            type: 'translucent',
            category: 'basic'
        },
        {
            id: 'poly-yellow',
            vendor: 'Polymaker',
            name: 'Translucent Yellow',
            hex: '#FFFF22',
            td: 8.0,
            type: 'translucent',
            category: 'basic'
        },
        {
            id: 'poly-orange',
            vendor: 'Polymaker',
            name: 'Translucent Orange',
            hex: '#FF8822',
            td: 10.0,
            type: 'translucent',
            category: 'basic'
        },
        {
            id: 'poly-purple',
            vendor: 'Polymaker',
            name: 'Translucent Purple',
            hex: '#8822FF',
            td: 13.0,
            type: 'translucent',
            category: 'basic'
        },
        {
            id: 'poly-white',
            vendor: 'Polymaker',
            name: 'Translucent White',
            hex: '#FFFFFF',
            td: 5.0,
            type: 'translucent',
            category: 'basic'
        },
        {
            id: 'poly-black',
            vendor: 'Polymaker',
            name: 'Translucent Black',
            hex: '#222222',
            td: 25.0,
            type: 'translucent',
            category: 'basic'
        }
    ],
    
    // Selected filaments for current project
    selectedFilaments: [],
    
    // Custom filaments added by user
    customFilaments: [],
    
    // Filament categories and filters
    categories: ['basic', 'premium', 'specialty', 'custom'],
    vendors: ['Polymaker', 'Prusament', 'Hatchbox', 'PETG', 'Custom'],
    
    // Auto-assignment settings
    autoAssignFilaments: true,
    assignmentMethod: 'lab-delta-e', // 'lab-delta-e' | 'rgb-distance' | 'hue-match'
    
    // Import/Export
    importedLibraries: [],
    lastImportDate: null
});

// State management utilities
const StateUtils = {
    /**
     * Generate unique ID for new items
     * @returns {string} Unique ID
     */
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Deep clone an object
     * @param {any} obj - Object to clone
     * @returns {any} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (obj instanceof Object) {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    },

    /**
     * Validate project state
     * @returns {Object} Validation result
     */
    validateProject() {
        const project = projectStore.getState();
        const regions = regionsStore.get('regions');
        const filaments = filamentsStore.get('selectedFilaments');
        
        const errors = [];
        const warnings = [];
        
        // Check required fields
        if (!project.originalImage) {
            errors.push('No image uploaded');
        }
        
        if (!project.mode) {
            errors.push('No print mode selected');
        }
        
        if (project.mode === 'multicolor' && regions.length === 0) {
            errors.push('No color regions found');
        }
        
        if (project.mode === 'multicolor' && filaments.length < regions.length) {
            warnings.push(`Need ${regions.length} filaments, only ${filaments.length} selected`);
        }
        
        // Check settings
        if (project.printSettings.layerHeight <= 0) {
            errors.push('Invalid layer height');
        }
        
        if (project.printSettings.minThickness >= project.printSettings.maxThickness) {
            errors.push('Invalid thickness range');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    },

    /**
     * Export project state to JSON
     * @returns {string} JSON string
     */
    exportProject() {
        const project = projectStore.getState();
        const regions = regionsStore.getState();
        const filaments = filamentsStore.getState();
        
        const exportData = {
            version: '1.0',
            exported: new Date().toISOString(),
            project: {
                ...project,
                // Don't export large binary data
                originalImage: null,
                processedImage: null
            },
            regions,
            filaments: {
                selectedFilaments: filaments.selectedFilaments,
                customFilaments: filaments.customFilaments
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    },

    /**
     * Import project from JSON
     * @param {string} jsonString - JSON project data
     * @returns {boolean} Success status
     */
    importProject(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            // Validate version compatibility
            if (!data.version || data.version !== '1.0') {
                console.warn('Project version mismatch');
            }
            
            // Import project data
            if (data.project) {
                Object.keys(data.project).forEach(key => {
                    if (key !== 'originalImage' && key !== 'processedImage') {
                        projectStore.set(key, data.project[key]);
                    }
                });
            }
            
            // Import regions
            if (data.regions) {
                Object.keys(data.regions).forEach(key => {
                    regionsStore.set(key, data.regions[key]);
                });
            }
            
            // Import filaments
            if (data.filaments) {
                if (data.filaments.selectedFilaments) {
                    filamentsStore.set('selectedFilaments', data.filaments.selectedFilaments);
                }
                if (data.filaments.customFilaments) {
                    filamentsStore.set('customFilaments', data.filaments.customFilaments);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Failed to import project:', error);
            return false;
        }
    }
};

// Add logging middleware for debugging
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    const loggingMiddleware = (key, value, oldValue, state) => {
        console.log(`[State] ${key}:`, value);
    };
    
    projectStore.use(loggingMiddleware);
    regionsStore.use(loggingMiddleware);
    filamentsStore.use(loggingMiddleware);
}

// Export for global access
window.PolyHue = window.PolyHue || {};
window.PolyHue.stores = {
    project: projectStore,
    regions: regionsStore,
    filaments: filamentsStore
};
window.PolyHue.StateUtils = StateUtils;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        projectStore,
        regionsStore,
        filamentsStore,
        StateUtils
    };
} 