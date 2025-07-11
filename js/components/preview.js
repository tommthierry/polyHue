/**
 * PolyHue Preview Component
 * 
 * Handles image preview and 3D visualization
 */

class PreviewComponent {
    constructor() {
        this.canvas2D = null;
        this.context2D = null;
        this.canvas3D = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentMesh = null;
        this.isInitialized = false;
        this.is3DMode = false;
        
        this.init = this.init.bind(this);
        this.update = this.update.bind(this);
        this.toggle3D = this.toggle3D.bind(this);
        this.resize = this.resize.bind(this);
    }

    /**
     * Initialize the preview component
     */
    async init() {
        try {
            this.setup2DCanvas();
            this.setup3DCanvas();
            this.setupEventListeners();
            this.setupControls();
            
            this.isInitialized = true;
            console.log('Preview component initialized');
            
        } catch (error) {
            console.error('Failed to initialize preview component:', error);
        }
    }

    /**
     * Set up 2D canvas for image preview
     */
    setup2DCanvas() {
        this.canvas2D = document.getElementById('image-preview');
        if (this.canvas2D) {
            this.context2D = this.canvas2D.getContext('2d');
            this.context2D.imageSmoothingEnabled = true;
            this.context2D.imageSmoothingQuality = 'high';
        }
    }

    /**
     * Set up 3D canvas for Three.js
     */
    setup3DCanvas() {
        const container = document.getElementById('threejs-preview');
        if (!container) return;

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 5);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        container.appendChild(this.renderer.domElement);

        // Create controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;

        // Add lighting
        this.setupLighting();

        // Start render loop
        this.animate();
    }

    /**
     * Set up 3D scene lighting
     */
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 0, 2);
        this.scene.add(fillLight);

        // Backlight (for lithophane effect)
        const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
        backLight.position.set(0, 0, -5);
        this.scene.add(backLight);
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for image changes
        document.addEventListener('image:loaded', (e) => {
            this.onImageLoaded(e.detail);
        });

        document.addEventListener('image:cleared', () => {
            this.clearPreview();
        });

        // Listen for window resize
        window.addEventListener('resize', this.resize);
    }

    /**
     * Set up preview controls
     */
    setupControls() {
        const toggle3DButton = document.getElementById('toggle-3d');
        if (toggle3DButton) {
            toggle3DButton.addEventListener('click', this.toggle3D);
        }

        const toggleOverlayButton = document.getElementById('toggle-overlay');
        if (toggleOverlayButton) {
            toggleOverlayButton.addEventListener('click', () => {
                this.toggleRegionOverlay();
            });
        }
    }

    /**
     * Update preview based on current state
     */
    update() {
        if (!this.isInitialized) return;

        const project = window.PolyHue.stores.project;
        const image = project.get('originalImage');
        
        if (image) {
            if (this.is3DMode) {
                this.update3DPreview();
            } else {
                this.update2DPreview();
            }
        }
    }

    /**
     * Update 2D preview
     */
    update2DPreview() {
        const project = window.PolyHue.stores.project;
        const image = project.get('originalImage');
        const settings = project.get('imageSettings');
        
        if (!image || !this.canvas2D || !this.context2D) return;

        // Get container dimensions
        const container = this.canvas2D.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate canvas size maintaining aspect ratio
        const aspectRatio = image.width / image.height;
        let canvasWidth, canvasHeight;

        if (containerWidth / containerHeight > aspectRatio) {
            canvasHeight = containerHeight;
            canvasWidth = canvasHeight * aspectRatio;
        } else {
            canvasWidth = containerWidth;
            canvasHeight = canvasWidth / aspectRatio;
        }

        // Set canvas size
        this.canvas2D.width = canvasWidth;
        this.canvas2D.height = canvasHeight;

        // Clear canvas
        this.context2D.clearRect(0, 0, canvasWidth, canvasHeight);

        // Apply image processing
        const tempCanvas = document.createElement('canvas');
        const tempContext = tempCanvas.getContext('2d');
        tempCanvas.width = image.width;
        tempCanvas.height = image.height;

        // Draw original image
        tempContext.drawImage(image, 0, 0);

        // Apply brightness/contrast adjustments
        if (settings.brightness !== 0 || settings.contrast !== 0) {
            const imageData = tempContext.getImageData(0, 0, image.width, image.height);
            this.applyBrightnessContrast(imageData, settings.brightness, settings.contrast);
            tempContext.putImageData(imageData, 0, 0);
        }

        // Draw processed image to preview canvas
        this.context2D.drawImage(tempCanvas, 0, 0, canvasWidth, canvasHeight);

        // Show 2D canvas
        this.canvas2D.classList.remove('hidden');
        
        // Hide 3D canvas
        const threejsContainer = document.getElementById('threejs-preview');
        if (threejsContainer) {
            threejsContainer.classList.add('hidden');
        }
    }

    /**
     * Update 3D preview
     */
    update3DPreview() {
        const project = window.PolyHue.stores.project;
        const image = project.get('originalImage');
        const mode = project.get('mode');
        
        if (!image) return;

        // Create or update 3D mesh
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
        }

        // Create geometry based on mode
        if (mode === 'lithophane') {
            this.currentMesh = this.createLithophaneMesh(image);
        } else if (mode === 'multicolor') {
            this.currentMesh = this.createMulticolorMesh(image);
        } else {
            // Default flat preview
            this.currentMesh = this.createFlatMesh(image);
        }

        if (this.currentMesh) {
            this.scene.add(this.currentMesh);
        }

        // Show 3D canvas
        const threejsContainer = document.getElementById('threejs-preview');
        if (threejsContainer) {
            threejsContainer.classList.remove('hidden');
        }
        
        // Hide 2D canvas
        if (this.canvas2D) {
            this.canvas2D.classList.add('hidden');
        }
    }

    /**
     * Create flat mesh for preview
     * @param {ImageBitmap} image - Source image
     * @returns {THREE.Mesh} 3D mesh
     */
    createFlatMesh(image) {
        const geometry = new THREE.PlaneGeometry(4, 4 * (image.height / image.width));
        
        // Create texture from image
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.flipY = false;
        
        const material = new THREE.MeshLambertMaterial({
            map: texture,
            side: THREE.DoubleSide
        });
        
        return new THREE.Mesh(geometry, material);
    }

    /**
     * Create lithophane mesh (simplified for now)
     * @param {ImageBitmap} image - Source image
     * @returns {THREE.Mesh} 3D mesh
     */
    createLithophaneMesh(image) {
        // For now, create a simple flat mesh
        // Will be enhanced when we implement proper lithophane generation
        const mesh = this.createFlatMesh(image);
        
        // Add some basic thickness variation based on brightness
        const geometry = mesh.geometry;
        const positions = geometry.attributes.position.array;
        
        // This is a simplified implementation
        // Real lithophane generation will be more complex
        
        return mesh;
    }

    /**
     * Create multicolor mesh (simplified for now)
     * @param {ImageBitmap} image - Source image
     * @returns {THREE.Mesh} 3D mesh
     */
    createMulticolorMesh(image) {
        // For now, create a simple flat mesh
        // Will be enhanced when we implement color quantization
        return this.createFlatMesh(image);
    }

    /**
     * Apply brightness and contrast to image data
     * @param {ImageData} imageData - Image data to modify
     * @param {number} brightness - Brightness adjustment (-100 to 100)
     * @param {number} contrast - Contrast adjustment (-100 to 100)
     */
    applyBrightnessContrast(imageData, brightness, contrast) {
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
    }

    /**
     * Handle image loaded event
     * @param {Object} data - Event data
     */
    onImageLoaded(data) {
        console.log('Preview: Image loaded', data);
        this.update();
    }

    /**
     * Clear preview
     */
    clearPreview() {
        // Clear 2D canvas
        if (this.canvas2D && this.context2D) {
            this.context2D.clearRect(0, 0, this.canvas2D.width, this.canvas2D.height);
            this.canvas2D.classList.add('hidden');
        }

        // Clear 3D scene
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
            this.currentMesh = null;
        }

        // Hide 3D canvas
        const threejsContainer = document.getElementById('threejs-preview');
        if (threejsContainer) {
            threejsContainer.classList.add('hidden');
        }

        // Show loading state
        const loadingElement = document.getElementById('preview-loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
    }

    /**
     * Toggle between 2D and 3D preview
     */
    toggle3D() {
        this.is3DMode = !this.is3DMode;
        
        const button = document.getElementById('toggle-3d');
        if (button) {
            button.textContent = this.is3DMode ? '2D View' : '3D View';
        }
        
        this.update();
    }

    /**
     * Toggle region overlay
     */
    toggleRegionOverlay() {
        const overlay = document.getElementById('region-overlay');
        if (overlay) {
            overlay.classList.toggle('hidden');
        }
        
        const button = document.getElementById('toggle-overlay');
        if (button) {
            const isVisible = !overlay.classList.contains('hidden');
            button.textContent = isVisible ? 'Hide Regions' : 'Show Regions';
        }
    }

    /**
     * Handle window resize
     */
    resize() {
        if (this.renderer && this.camera) {
            const container = document.getElementById('threejs-preview');
            if (container) {
                const width = container.clientWidth;
                const height = container.clientHeight;
                
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(width, height);
            }
        }
        
        // Update 2D preview as well
        this.update();
    }

    /**
     * Animation loop for 3D rendering
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) {
            this.controls.update();
        }
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Export for global access
window.PolyHue = window.PolyHue || {};
window.PolyHue.Preview = PreviewComponent;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PreviewComponent;
} 