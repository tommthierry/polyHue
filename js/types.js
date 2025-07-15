/**
 * PolyHue - Global Constants and Type Definitions
 * 
 * This file contains all application constants, type definitions (as comments),
 * and utility objects used throughout the PolyHue application.
 * 
 * All constants are defined as global variables for non-module usage.
 */

// Global Application Constants
window.APP_CONSTANTS = {
    // Image constraints
    MAX_IMAGE_SIZE: 4096, // pixels
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    MIN_IMAGE_SIZE: 32, // pixels
    
    // Color constraints
    MIN_COLORS: 1,
    MAX_COLORS: 10,
    DEFAULT_COLORS: 6,
    
    // Model constraints
    MIN_MODEL_HEIGHT: 0.5, // mm
    MAX_MODEL_HEIGHT: 50.0, // mm
    DEFAULT_MODEL_HEIGHT: 12.0, // mm
    MIN_LAYER_HEIGHT: 0.1, // mm
    
    // Performance settings
    PREVIEW_MAX_SIZE: 512, // pixels for preview generation
    QUANTIZATION_COLORS: 16, // initial quantization before user reduction
    
    // UI settings
    UPLOAD_TIMEOUT: 30000, // ms
    ANIMATION_DURATION: 300, // ms
    DEBOUNCE_DELAY: 500, // ms
};

// Export format definitions
window.EXPORT_EXTENSIONS = {
    stl: { extension: '.stl', mimeType: 'application/vnd.ms-pki.stl' },
    glb: { extension: '.glb', mimeType: 'model/gltf-binary' },
    obj: { extension: '.obj', mimeType: 'application/x-tgif' },
    mtl: { extension: '.mtl', mimeType: 'application/x-tgif' },
    png: { extension: '.png', mimeType: 'image/png' },
    zip: { extension: '.zip', mimeType: 'application/zip' }
};

// Supported image formats
window.SUPPORTED_FORMATS = {
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/jpg': ['.jpg']
};

// Add aliases to APP_CONSTANTS to maintain compatibility
window.APP_CONSTANTS.SUPPORTED_MIME_TYPES = Object.keys(window.SUPPORTED_FORMATS);
window.APP_CONSTANTS.MAX_IMAGE_WIDTH = window.APP_CONSTANTS.MAX_IMAGE_SIZE;
window.APP_CONSTANTS.MAX_IMAGE_HEIGHT = window.APP_CONSTANTS.MAX_IMAGE_SIZE;
window.APP_CONSTANTS.DEFAULT_COLOR_COUNT = window.APP_CONSTANTS.DEFAULT_COLORS;
window.APP_CONSTANTS.MIN_COLOR_COUNT = window.APP_CONSTANTS.MIN_COLORS;
window.APP_CONSTANTS.MAX_COLOR_COUNT = window.APP_CONSTANTS.MAX_COLORS;

// Color modes
window.COLOR_MODES = {
    LITHOPHANE: 'lithophane',
    COLOR: 'color'
};

// Export quality settings
window.EXPORT_QUALITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    ULTRA: 'ultra'
};

// Step identifiers
window.STEPS = {
    UPLOAD: 1,
    COLOR: 2,
    MODEL: 3
};

// Error codes
window.ERROR_CODES = {
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FORMAT: 'INVALID_FORMAT',
    IMAGE_TOO_SMALL: 'IMAGE_TOO_SMALL',
    IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
    PROCESSING_ERROR: 'PROCESSING_ERROR',
    EXPORT_ERROR: 'EXPORT_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    BROWSER_SUPPORT: 'BROWSER_SUPPORT'
};

/*
Type Definitions (as comments for reference):

interface ColorRegion {
    id: number;
    hex: string;
    percent: number;
    custom: boolean;
    height: number;
    order: number;
    pixels?: ImageData;
    bounds?: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
}

interface ImageData {
    src: string;
    width: number;
    height: number;
    aspectRatio: number;
    fileSize: number;
    format: string;
    canvas?: HTMLCanvasElement;
    data?: Uint8ClampedArray;
}

interface ProjectState {
    image: ImageData | null;
    colors: ColorRegion[];
    totalHeight: number;
    currentStep: number;
    exportSettings: ExportSettings;
    isDirty: boolean;
    lastModified: Date;
}

interface ExportSettings {
    format: string;
    quality: string;
    includeColors: boolean;
    optimize: boolean;
    scale: number;
    filename?: string;
    author?: string;
    description?: string;
}

interface ValidationResult {
    valid: boolean;
    error: string | null;
    warnings: string[];
    metadata: any;
}

interface ProcessingResult {
    success: boolean;
    data?: any;
    error?: string;
    warnings?: string[];
    processingTime?: number;
}

interface ColorQuantizationOptions {
    colorCount: number;
    quality: number;
    maxColors?: number;
    algorithm?: 'median-cut' | 'k-means' | 'octree';
}

interface ModelGenerationOptions {
    totalHeight: number;
    baseThickness: number;
    layerHeight: number;
    smoothing: boolean;
    optimization: boolean;
    units: 'mm' | 'inches';
}

interface ExportConfiguration {
    format: string;
    includeColors: boolean;
    compression: boolean;
    precision: number;
    units: string;
    metadata: {
        title?: string;
        author?: string;
        description?: string;
        created?: Date;
        software?: string;
    };
}

interface ThreeDModel {
    geometry: any; // Three.js geometry
    materials: any[]; // Three.js materials
    boundingBox: {
        min: { x: number; y: number; z: number };
        max: { x: number; y: number; z: number };
    };
    vertexCount: number;
    faceCount: number;
}

interface StepConfiguration {
    id: number;
    name: string;
    title: string;
    description: string;
    isComplete: boolean;
    isActive: boolean;
    canProceed: boolean;
    requiredData: string[];
}

interface UITheme {
    name: string;
    colors: {
        primary: string;
        secondary: string;
        background: string;
        surface: string;
        text: string;
        border: string;
    };
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    borderRadius: {
        sm: string;
        md: string;
        lg: string;
    };
    shadows: {
        sm: string;
        md: string;
        lg: string;
    };
}

interface ErrorContext {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
    userAgent?: string;
    url?: string;
    stack?: string;
}
*/ 