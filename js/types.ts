/**
 * PolyHue - TypeScript Type Definitions
 * 
 * Comprehensive type definitions for the PolyHue application.
 * These types define the core data structures and interfaces
 * used throughout the application.
 */

// ================================================
// Core Data Models
// ================================================

/**
 * Represents a color region/layer in the image
 */
export interface ColorRegion {
    /** Unique identifier for this color region */
    id: number;
    
    /** HEX color value (e.g., "#ff0000") */
    hex: string;
    
    /** Percentage of image covered by this color (0-100) */
    percent: number;
    
    /** Whether this color has been manually modified by user */
    custom: boolean;
    
    /** Height of this layer in the 3D model (millimeters) */
    height: number;
    
    /** Display order in the UI (0 = first/bottom layer) */
    order: number;
    
    /** Whether this color region is currently visible/enabled */
    enabled: boolean;
}

/**
 * Image data and metadata
 */
export interface ImageData {
    /** Data URL or blob URL of the image */
    src: string;
    
    /** Original image width in pixels */
    width: number;
    
    /** Original image height in pixels */
    height: number;
    
    /** Original file reference */
    file: File;
    
    /** File name without extension */
    name: string;
    
    /** File size in bytes */
    size: number;
    
    /** Image format (png, jpeg, etc.) */
    format: string;
    
    /** Canvas element with the processed image */
    canvas?: HTMLCanvasElement;
    
    /** Image data for processing */
    imageData?: ImageData;
}

/**
 * Export format options
 */
export type ExportFormat = 'stl' | 'glb' | 'obj' | 'png' | 'zip';

/**
 * Export quality settings
 */
export type ExportQuality = 'low' | 'medium' | 'high';

/**
 * Application step numbers
 */
export type AppStep = 1 | 2 | 3;

/**
 * Export configuration
 */
export interface ExportSettings {
    /** Primary export format */
    format: ExportFormat;
    
    /** Quality level for mesh generation */
    quality: ExportQuality;
    
    /** Include colors in export (for supported formats) */
    includeColors: boolean;
    
    /** Optimize for file size vs quality */
    optimize: boolean;
    
    /** Scale factor for the model */
    scale: number;
}

/**
 * Complete application state
 */
export interface ProjectState {
    /** Currently loaded image data */
    image: ImageData | null;
    
    /** Array of color regions/layers */
    colors: ColorRegion[];
    
    /** Total height of the 3D model in millimeters */
    totalHeight: number;
    
    /** Current step in the workflow */
    currentStep: AppStep;
    
    /** Export configuration */
    exportSettings: ExportSettings;
    
    /** Whether the project has unsaved changes */
    isDirty: boolean;
    
    /** Timestamp when the project was last modified */
    lastModified: Date;
}

// ================================================
// UI Component Props and States
// ================================================

/**
 * Upload component state
 */
export interface UploadState {
    /** Whether drag-and-drop is currently active */
    isDragOver: boolean;
    
    /** Whether an upload is in progress */
    isUploading: boolean;
    
    /** Upload progress percentage (0-100) */
    progress: number;
    
    /** Error message if upload failed */
    error: string | null;
}

/**
 * Color quantization options
 */
export interface QuantizationOptions {
    /** Number of colors to extract */
    colorCount: number;
    
    /** Quantization algorithm to use */
    algorithm: 'kmeans' | 'mediancut' | 'octree';
    
    /** Quality vs speed trade-off (1-10) */
    quality: number;
    
    /** Whether to ignore white pixels */
    ignoreWhite: boolean;
    
    /** Maximum iterations for k-means */
    maxIterations: number;
}

/**
 * 3D viewport configuration
 */
export interface ViewportConfig {
    /** Whether to show wireframe mode */
    wireframe: boolean;
    
    /** Background color */
    backgroundColor: string;
    
    /** Camera position */
    cameraPosition: { x: number; y: number; z: number };
    
    /** Camera target/lookAt point */
    cameraTarget: { x: number; y: number; z: number };
    
    /** Whether to auto-rotate the model */
    autoRotate: boolean;
    
    /** Lighting setup */
    lighting: 'soft' | 'dramatic' | 'studio';
}

/**
 * Mesh generation options
 */
export interface MeshOptions {
    /** Resolution of the mesh (pixels per unit) */
    resolution: number;
    
    /** Whether to smooth the mesh */
    smoothing: boolean;
    
    /** Simplification level (0-1) */
    simplification: number;
    
    /** Whether to merge vertices */
    mergeVertices: boolean;
    
    /** Base thickness for thin layers */
    minLayerThickness: number;
}

// ================================================
// Event and Callback Types
// ================================================

/**
 * Generic event callback
 */
export type EventCallback<T = any> = (data: T) => void;

/**
 * Error callback
 */
export type ErrorCallback = (error: Error | string) => void;

/**
 * Progress callback
 */
export type ProgressCallback = (progress: number, message?: string) => void;

/**
 * File processing result
 */
export interface ProcessingResult<T> {
    /** Whether the operation succeeded */
    success: boolean;
    
    /** Result data if successful */
    data?: T;
    
    /** Error message if failed */
    error?: string;
    
    /** Processing time in milliseconds */
    duration?: number;
}

/**
 * Color quantization result
 */
export interface QuantizationResult {
    /** Extracted color palette */
    colors: ColorRegion[];
    
    /** Processed image canvas */
    canvas: HTMLCanvasElement;
    
    /** Statistics about the quantization */
    stats: {
        originalColors: number;
        finalColors: number;
        processingTime: number;
        compressionRatio: number;
    };
}

/**
 * Mesh generation result
 */
export interface MeshResult {
    /** Generated Three.js geometry */
    geometry: any; // THREE.BufferGeometry
    
    /** Material definitions */
    materials: any[]; // THREE.Material[]
    
    /** Mesh statistics */
    stats: {
        vertices: number;
        faces: number;
        layers: number;
        boundingBox: { width: number; height: number; depth: number };
    };
}

// ================================================
// Utility Types
// ================================================

/**
 * RGB color values (0-255)
 */
export interface RGB {
    r: number;
    g: number;
    b: number;
}

/**
 * HSL color values
 */
export interface HSL {
    h: number; // 0-360
    s: number; // 0-100
    l: number; // 0-100
}

/**
 * 2D point
 */
export interface Point2D {
    x: number;
    y: number;
}

/**
 * 3D point
 */
export interface Point3D extends Point2D {
    z: number;
}

/**
 * Bounding box
 */
export interface BoundingBox {
    min: Point3D;
    max: Point3D;
    width: number;
    height: number;
    depth: number;
}

/**
 * File validation result
 */
export interface ValidationResult {
    /** Whether the file is valid */
    valid: boolean;
    
    /** Error message if invalid */
    error?: string;
    
    /** Warnings (non-fatal issues) */
    warnings?: string[];
    
    /** File metadata */
    metadata?: {
        format: string;
        size: number;
        dimensions: { width: number; height: number };
    };
}

// ================================================
// Application Configuration
// ================================================

/**
 * Application configuration
 */
export interface AppConfig {
    /** Maximum allowed image dimensions */
    maxImageSize: { width: number; height: number };
    
    /** Maximum file size in bytes */
    maxFileSize: number;
    
    /** Supported image formats */
    supportedFormats: string[];
    
    /** Default quantization settings */
    defaultQuantization: QuantizationOptions;
    
    /** Default export settings */
    defaultExport: ExportSettings;
    
    /** Default viewport settings */
    defaultViewport: ViewportConfig;
    
    /** Performance settings */
    performance: {
        enableWebWorkers: boolean;
        maxConcurrentTasks: number;
        memoryLimit: number;
    };
}

// ================================================
// Web Worker Message Types
// ================================================

/**
 * Base worker message
 */
export interface WorkerMessage {
    /** Message type identifier */
    type: string;
    
    /** Unique message ID for tracking responses */
    id: string;
    
    /** Message payload */
    data?: any;
}

/**
 * Worker request message
 */
export interface WorkerRequest extends WorkerMessage {
    type: 'quantize' | 'mesh-generate' | 'export';
}

/**
 * Worker response message
 */
export interface WorkerResponse extends WorkerMessage {
    type: 'success' | 'error' | 'progress';
    
    /** Whether this is the final response */
    final?: boolean;
    
    /** Error details if type is 'error' */
    error?: string;
    
    /** Progress percentage if type is 'progress' */
    progress?: number;
}

// ================================================
// Constants and Enums
// ================================================

/**
 * Application constants
 */
export const APP_CONSTANTS = {
    /** Default number of colors for quantization */
    DEFAULT_COLOR_COUNT: 6,
    
    /** Minimum number of colors */
    MIN_COLOR_COUNT: 1,
    
    /** Maximum number of colors */
    MAX_COLOR_COUNT: 10,
    
    /** Default total model height in mm */
    DEFAULT_MODEL_HEIGHT: 12,
    
    /** Minimum layer height in mm */
    MIN_LAYER_HEIGHT: 0.1,
    
    /** Maximum layer height in mm */
    MAX_LAYER_HEIGHT: 50,
    
    /** File size limits */
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    
    /** Image dimension limits */
    MAX_IMAGE_WIDTH: 4096,
    MAX_IMAGE_HEIGHT: 4096,
    
    /** Supported MIME types */
    SUPPORTED_MIME_TYPES: ['image/png', 'image/jpeg', 'image/jpg'],
    
    /** File extensions */
    SUPPORTED_EXTENSIONS: ['.png', '.jpg', '.jpeg'],
} as const;

/**
 * Export file extensions
 */
export const EXPORT_EXTENSIONS = {
    stl: '.stl',
    glb: '.glb',
    obj: '.obj',
    png: '.png',
    zip: '.zip',
} as const; 