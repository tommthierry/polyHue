/**
 * Default Filament Library
 * 
 * Contains popular 3D printing filaments with properties for lithophane and multi-color printing
 * 
 * Properties:
 * - id: unique identifier
 * - vendor: manufacturer/brand name
 * - name: filament name/color
 * - hex: color in hex format (#RRGGBB)
 * - td: transmission distance in mm (for lithophane mode)
 * - type: 'translucent' | 'opaque' | 'metallic' | 'glow'
 * - material: 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'WOOD' | 'METAL'
 * - category: 'basic' | 'premium' | 'specialty'
 */

const DEFAULT_FILAMENTS = [
    // Basic PLA Colors
    {
        id: 'pla-white',
        vendor: 'Generic',
        name: 'White PLA',
        hex: '#FFFFFF',
        td: 0.8,
        type: 'translucent',
        material: 'PLA',
        category: 'basic'
    },
    {
        id: 'pla-black',
        vendor: 'Generic',
        name: 'Black PLA',
        hex: '#000000',
        td: 0.1,
        type: 'opaque',
        material: 'PLA',
        category: 'basic'
    },
    {
        id: 'pla-red',
        vendor: 'Generic',
        name: 'Red PLA',
        hex: '#FF0000',
        td: 0.6,
        type: 'translucent',
        material: 'PLA',
        category: 'basic'
    },
    {
        id: 'pla-green',
        vendor: 'Generic',
        name: 'Green PLA',
        hex: '#00FF00',
        td: 0.6,
        type: 'translucent',
        material: 'PLA',
        category: 'basic'
    },
    {
        id: 'pla-blue',
        vendor: 'Generic',
        name: 'Blue PLA',
        hex: '#0000FF',
        td: 0.6,
        type: 'translucent',
        material: 'PLA',
        category: 'basic'
    },
    {
        id: 'pla-yellow',
        vendor: 'Generic',
        name: 'Yellow PLA',
        hex: '#FFFF00',
        td: 0.8,
        type: 'translucent',
        material: 'PLA',
        category: 'basic'
    },

    // Polymaker Colors
    {
        id: 'polymaker-red',
        vendor: 'Polymaker',
        name: 'PolyTerra Red',
        hex: '#CC2936',
        td: 0.5,
        type: 'translucent',
        material: 'PLA',
        category: 'premium'
    },
    {
        id: 'polymaker-orange',
        vendor: 'Polymaker',
        name: 'PolyTerra Orange',
        hex: '#FF6B35',
        td: 0.7,
        type: 'translucent',
        material: 'PLA',
        category: 'premium'
    },
    {
        id: 'polymaker-yellow',
        vendor: 'Polymaker',
        name: 'PolyTerra Yellow',
        hex: '#F7931E',
        td: 0.9,
        type: 'translucent',
        material: 'PLA',
        category: 'premium'
    },
    {
        id: 'polymaker-green',
        vendor: 'Polymaker',
        name: 'PolyTerra Green',
        hex: '#2E8B57',
        td: 0.6,
        type: 'translucent',
        material: 'PLA',
        category: 'premium'
    },
    {
        id: 'polymaker-blue',
        vendor: 'Polymaker',
        name: 'PolyTerra Blue',
        hex: '#1E90FF',
        td: 0.6,
        type: 'translucent',
        material: 'PLA',
        category: 'premium'
    },
    {
        id: 'polymaker-purple',
        vendor: 'Polymaker',
        name: 'PolyTerra Purple',
        hex: '#8A2BE2',
        td: 0.5,
        type: 'translucent',
        material: 'PLA',
        category: 'premium'
    },

    // Bambu Lab Colors
    {
        id: 'bambu-white',
        vendor: 'Bambu Lab',
        name: 'Basic White PLA',
        hex: '#F5F5F5',
        td: 0.9,
        type: 'translucent',
        material: 'PLA',
        category: 'premium'
    },
    {
        id: 'bambu-black',
        vendor: 'Bambu Lab',
        name: 'Basic Black PLA',
        hex: '#1C1C1C',
        td: 0.1,
        type: 'opaque',
        material: 'PLA',
        category: 'premium'
    },
    {
        id: 'bambu-red',
        vendor: 'Bambu Lab',
        name: 'Basic Red PLA',
        hex: '#E31E24',
        td: 0.6,
        type: 'translucent',
        material: 'PLA',
        category: 'premium'
    },
    {
        id: 'bambu-orange',
        vendor: 'Bambu Lab',
        name: 'Basic Orange PLA',
        hex: '#FF7F00',
        td: 0.7,
        type: 'translucent',
        material: 'PLA',
        category: 'premium'
    },
    {
        id: 'bambu-yellow',
        vendor: 'Bambu Lab',
        name: 'Basic Yellow PLA',
        hex: '#FFD700',
        td: 0.8,
        type: 'translucent',
        material: 'PLA',
        category: 'premium'
    },
    {
        id: 'bambu-green',
        vendor: 'Bambu Lab',
        name: 'Basic Green PLA',
        hex: '#32CD32',
        td: 0.6,
        type: 'translucent',
        material: 'PLA',
        category: 'premium'
    },
    {
        id: 'bambu-blue',
        vendor: 'Bambu Lab',
        name: 'Basic Blue PLA',
        hex: '#4169E1',
        td: 0.6,
        type: 'translucent',
        material: 'PLA',
        category: 'premium'
    },

    // Prusa Colors
    {
        id: 'prusa-prusament-orange',
        vendor: 'Prusa',
        name: 'Prusament Orange PLA',
        hex: '#FF6600',
        td: 0.7,
        type: 'translucent',
        material: 'PLA',
        category: 'premium'
    },
    {
        id: 'prusa-prusament-silver',
        vendor: 'Prusa',
        name: 'Prusament Silver PLA',
        hex: '#C0C0C0',
        td: 0.3,
        type: 'metallic',
        material: 'PLA',
        category: 'premium'
    },
    {
        id: 'prusa-prusament-gold',
        vendor: 'Prusa',
        name: 'Prusament Gold PLA',
        hex: '#FFD700',
        td: 0.4,
        type: 'metallic',
        material: 'PLA',
        category: 'premium'
    },

    // Specialty/Translucent Colors
    {
        id: 'translucent-clear',
        vendor: 'Generic',
        name: 'Clear Translucent',
        hex: '#FFFFFF',
        td: 2.0,
        type: 'translucent',
        material: 'PLA',
        category: 'specialty'
    },
    {
        id: 'translucent-natural',
        vendor: 'Generic',
        name: 'Natural Translucent',
        hex: '#F5F5DC',
        td: 1.8,
        type: 'translucent',
        material: 'PLA',
        category: 'specialty'
    },
    {
        id: 'translucent-red',
        vendor: 'Generic',
        name: 'Red Translucent',
        hex: '#FF4500',
        td: 1.2,
        type: 'translucent',
        material: 'PLA',
        category: 'specialty'
    },
    {
        id: 'translucent-blue',
        vendor: 'Generic',
        name: 'Blue Translucent',
        hex: '#1E90FF',
        td: 1.2,
        type: 'translucent',
        material: 'PLA',
        category: 'specialty'
    },
    {
        id: 'translucent-green',
        vendor: 'Generic',
        name: 'Green Translucent',
        hex: '#32CD32',
        td: 1.2,
        type: 'translucent',
        material: 'PLA',
        category: 'specialty'
    },

    // Glow in the Dark
    {
        id: 'glow-green',
        vendor: 'Generic',
        name: 'Glow Green PLA',
        hex: '#ADFF2F',
        td: 0.8,
        type: 'glow',
        material: 'PLA',
        category: 'specialty'
    },
    {
        id: 'glow-blue',
        vendor: 'Generic',
        name: 'Glow Blue PLA',
        hex: '#87CEEB',
        td: 0.8,
        type: 'glow',
        material: 'PLA',
        category: 'specialty'
    },

    // Wood Filaments
    {
        id: 'wood-natural',
        vendor: 'Generic',
        name: 'Wood Natural PLA',
        hex: '#D2691E',
        td: 0.4,
        type: 'opaque',
        material: 'WOOD',
        category: 'specialty'
    },
    {
        id: 'wood-dark',
        vendor: 'Generic',
        name: 'Wood Dark PLA',
        hex: '#8B4513',
        td: 0.3,
        type: 'opaque',
        material: 'WOOD',
        category: 'specialty'
    },

    // Metal Filaments
    {
        id: 'metal-copper',
        vendor: 'Generic',
        name: 'Copper PLA',
        hex: '#B87333',
        td: 0.2,
        type: 'metallic',
        material: 'METAL',
        category: 'specialty'
    },
    {
        id: 'metal-bronze',
        vendor: 'Generic',
        name: 'Bronze PLA',
        hex: '#CD7F32',
        td: 0.2,
        type: 'metallic',
        material: 'METAL',
        category: 'specialty'
    },
    {
        id: 'metal-steel',
        vendor: 'Generic',
        name: 'Steel PLA',
        hex: '#708090',
        td: 0.1,
        type: 'metallic',
        material: 'METAL',
        category: 'specialty'
    }
];

/**
 * Get filaments by category
 * @param {string} category - 'basic' | 'premium' | 'specialty'
 * @returns {Array} Filtered filaments
 */
function getFilamentsByCategory(category) {
    return DEFAULT_FILAMENTS.filter(filament => filament.category === category);
}

/**
 * Get filaments by material
 * @param {string} material - 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'WOOD' | 'METAL'
 * @returns {Array} Filtered filaments
 */
function getFilamentsByMaterial(material) {
    return DEFAULT_FILAMENTS.filter(filament => filament.material === material);
}

/**
 * Get filaments by type
 * @param {string} type - 'translucent' | 'opaque' | 'metallic' | 'glow'
 * @returns {Array} Filtered filaments
 */
function getFilamentsByType(type) {
    return DEFAULT_FILAMENTS.filter(filament => filament.type === type);
}

/**
 * Get filament by ID
 * @param {string} id - Filament ID
 * @returns {Object|null} Filament object or null if not found
 */
function getFilamentById(id) {
    return DEFAULT_FILAMENTS.find(filament => filament.id === id) || null;
}

/**
 * Get all unique vendors
 * @returns {Array} Array of unique vendor names
 */
function getVendors() {
    return [...new Set(DEFAULT_FILAMENTS.map(filament => filament.vendor))];
}

/**
 * Get all unique materials
 * @returns {Array} Array of unique material names
 */
function getMaterials() {
    return [...new Set(DEFAULT_FILAMENTS.map(filament => filament.material))];
}

/**
 * Get all unique types
 * @returns {Array} Array of unique type names
 */
function getTypes() {
    return [...new Set(DEFAULT_FILAMENTS.map(filament => filament.type))];
}

// Export to global namespace
window.PolyHue = window.PolyHue || {};
window.PolyHue.Filaments = {
    DEFAULT_FILAMENTS,
    getFilamentsByCategory,
    getFilamentsByMaterial,
    getFilamentsByType,
    getFilamentById,
    getVendors,
    getMaterials,
    getTypes
};