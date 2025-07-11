/**
 * Filament Manager Component
 * 
 * Handles filament library management including:
 * - Loading default filaments
 * - Adding/editing/deleting filaments
 * - CSV/JSON import/export
 * - Auto-mapping regions to filaments
 * - State management integration
 */

// Use global namespace instead of imports

class FilamentManager {
    constructor() {
        this.state = window.PolyHue.stores;
        this.initialized = false;
        
        // DOM elements
        this.filamentModal = null;
        this.filamentForm = null;
        this.filamentList = null;
        this.importModal = null;
        this.exportModal = null;
        
        // Current editing state
        this.currentEditingFilament = null;
        this.isEditMode = false;
        
        this.init();
    }
    
    async init() {
        try {
                    // Load default filaments if none exist
        const currentFilaments = this.state.filaments.get('filaments') || [];
        if (currentFilaments.length === 0) {
            await this.loadDefaultFilaments();
        }
            
            // Setup DOM elements and event listeners
            this.setupDOM();
            this.setupEventListeners();
            
            // Update UI
            this.updateFilamentList();
            
            this.initialized = true;
            const filamentCount = this.state.filaments.get('filaments').length;
            console.log('Filament manager initialized with', filamentCount, 'filaments');
            
        } catch (error) {
            console.error('Failed to initialize filament manager:', error);
        }
    }
    
    async loadDefaultFilaments() {
        try {
            // Load default filaments into state
            this.state.filaments.set('filaments', [...window.PolyHue.Filaments.DEFAULT_FILAMENTS]);
            
            // Set some default selections for quick testing
            this.state.filaments.set('selectedFilaments', [
                'pla-white',
                'pla-black',
                'pla-red',
                'pla-green',
                'pla-blue',
                'pla-yellow'
            ]);
            
            console.log('Loaded', window.PolyHue.Filaments.DEFAULT_FILAMENTS.length, 'default filaments');
            
        } catch (error) {
            console.error('Failed to load default filaments:', error);
            throw error;
        }
    }
    
    setupDOM() {
        // Create filament modal if it doesn't exist
        if (!document.getElementById('filament-modal')) {
            this.createFilamentModal();
        }
        
        // Create import/export modals if they don't exist
        if (!document.getElementById('import-modal')) {
            this.createImportModal();
        }
        
        if (!document.getElementById('export-modal')) {
            this.createExportModal();
        }
        
        // Get DOM references
        this.filamentModal = document.getElementById('filament-modal');
        this.filamentForm = document.getElementById('filament-form');
        this.filamentList = document.getElementById('filament-list');
        this.importModal = document.getElementById('import-modal');
        this.exportModal = document.getElementById('export-modal');
    }
    
    createFilamentModal() {
        const modalHTML = `
            <div id="filament-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 id="filament-modal-title" class="text-lg font-semibold">Add Filament</h3>
                        <button id="close-filament-modal" class="text-gray-500 hover:text-gray-700">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <form id="filament-form" class="space-y-4">
                        <div>
                            <label for="filament-vendor" class="block text-sm font-medium text-gray-700">Vendor</label>
                            <input type="text" id="filament-vendor" name="vendor" required 
                                   class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        
                        <div>
                            <label for="filament-name" class="block text-sm font-medium text-gray-700">Name</label>
                            <input type="text" id="filament-name" name="name" required 
                                   class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        
                        <div>
                            <label for="filament-color" class="block text-sm font-medium text-gray-700">Color</label>
                            <div class="flex items-center space-x-2">
                                <input type="color" id="filament-color" name="color" required 
                                       class="w-12 h-10 border border-gray-300 rounded cursor-pointer">
                                <input type="text" id="filament-hex" name="hex" required 
                                       class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       placeholder="#FF0000">
                            </div>
                        </div>
                        
                        <div>
                            <label for="filament-td" class="block text-sm font-medium text-gray-700">
                                Transmission Distance (mm)
                                <span class="text-gray-500 text-xs">- How far light travels through the filament</span>
                            </label>
                            <input type="number" id="filament-td" name="td" required min="0" max="5" step="0.1" 
                                   class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="filament-material" class="block text-sm font-medium text-gray-700">Material</label>
                                <select id="filament-material" name="material" required 
                                        class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="PLA">PLA</option>
                                    <option value="PETG">PETG</option>
                                    <option value="ABS">ABS</option>
                                    <option value="TPU">TPU</option>
                                    <option value="WOOD">Wood</option>
                                    <option value="METAL">Metal</option>
                                </select>
                            </div>
                            
                            <div>
                                <label for="filament-type" class="block text-sm font-medium text-gray-700">Type</label>
                                <select id="filament-type" name="type" required 
                                        class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="translucent">Translucent</option>
                                    <option value="opaque">Opaque</option>
                                    <option value="metallic">Metallic</option>
                                    <option value="glow">Glow</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label for="filament-category" class="block text-sm font-medium text-gray-700">Category</label>
                            <select id="filament-category" name="category" required 
                                    class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="basic">Basic</option>
                                <option value="premium">Premium</option>
                                <option value="specialty">Specialty</option>
                            </select>
                        </div>
                        
                        <div class="flex justify-end space-x-2 pt-4">
                            <button type="button" id="cancel-filament" class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" id="save-filament" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    createImportModal() {
        const modalHTML = `
            <div id="import-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">Import Filaments</h3>
                        <button id="close-import-modal" class="text-gray-500 hover:text-gray-700">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label for="import-file" class="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                            <input type="file" id="import-file" accept=".csv,.json" 
                                   class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Import Mode</label>
                            <div class="space-y-2">
                                <label class="flex items-center">
                                    <input type="radio" name="import-mode" value="replace" class="mr-2">
                                    Replace all filaments
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="import-mode" value="merge" checked class="mr-2">
                                    Merge with existing filaments
                                </label>
                            </div>
                        </div>
                        
                        <div class="flex justify-end space-x-2 pt-4">
                            <button type="button" id="cancel-import" class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="button" id="confirm-import" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                                Import
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    createExportModal() {
        const modalHTML = `
            <div id="export-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">Export Filaments</h3>
                        <button id="close-export-modal" class="text-gray-500 hover:text-gray-700">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                            <div class="space-y-2">
                                <label class="flex items-center">
                                    <input type="radio" name="export-format" value="json" checked class="mr-2">
                                    JSON (recommended)
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="export-format" value="csv" class="mr-2">
                                    CSV (spreadsheet compatible)
                                </label>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Export Content</label>
                            <div class="space-y-2">
                                <label class="flex items-center">
                                    <input type="radio" name="export-content" value="all" checked class="mr-2">
                                    All filaments
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="export-content" value="selected" class="mr-2">
                                    Selected filaments only
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="export-content" value="custom" class="mr-2">
                                    Custom filaments only
                                </label>
                            </div>
                        </div>
                        
                        <div class="flex justify-end space-x-2 pt-4">
                            <button type="button" id="cancel-export" class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="button" id="confirm-export" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    setupEventListeners() {
        // Filament modal events
        document.getElementById('close-filament-modal')?.addEventListener('click', () => this.hideFilamentModal());
        document.getElementById('cancel-filament')?.addEventListener('click', () => this.hideFilamentModal());
        document.getElementById('filament-form')?.addEventListener('submit', (e) => this.handleFilamentFormSubmit(e));
        
        // Color picker synchronization
        document.getElementById('filament-color')?.addEventListener('input', (e) => {
            document.getElementById('filament-hex').value = e.target.value.toUpperCase();
        });
        document.getElementById('filament-hex')?.addEventListener('input', (e) => {
            const hex = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                document.getElementById('filament-color').value = hex;
            }
        });
        
        // Import modal events
        document.getElementById('close-import-modal')?.addEventListener('click', () => this.hideImportModal());
        document.getElementById('cancel-import')?.addEventListener('click', () => this.hideImportModal());
        document.getElementById('confirm-import')?.addEventListener('click', () => this.handleImport());
        
        // Export modal events
        document.getElementById('close-export-modal')?.addEventListener('click', () => this.hideExportModal());
        document.getElementById('cancel-export')?.addEventListener('click', () => this.hideExportModal());
        document.getElementById('confirm-export')?.addEventListener('click', () => this.handleExport());
        
        // Global events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideFilamentModal();
                this.hideImportModal();
                this.hideExportModal();
            }
        });
    }
    
    // Public API methods
    showAddFilamentModal() {
        this.isEditMode = false;
        this.currentEditingFilament = null;
        document.getElementById('filament-modal-title').textContent = 'Add Filament';
        document.getElementById('save-filament').textContent = 'Add';
        this.resetFilamentForm();
        this.showFilamentModal();
    }
    
    showEditFilamentModal(filamentId) {
        const filament = this.getFilamentById(filamentId);
        if (!filament) return;
        
        this.isEditMode = true;
        this.currentEditingFilament = filament;
        document.getElementById('filament-modal-title').textContent = 'Edit Filament';
        document.getElementById('save-filament').textContent = 'Save';
        this.populateFilamentForm(filament);
        this.showFilamentModal();
    }
    
    showImportModal() {
        this.importModal.classList.remove('hidden');
        this.importModal.classList.add('flex');
    }
    
    showExportModal() {
        this.exportModal.classList.remove('hidden');
        this.exportModal.classList.add('flex');
    }
    
    deleteFilament(filamentId) {
        if (confirm('Are you sure you want to delete this filament?')) {
            const currentFilaments = this.state.filaments.get('filaments');
            this.state.filaments.set('filaments', currentFilaments.filter(f => f.id !== filamentId));
            
            // Remove from selected if present
            const currentSelected = this.state.filaments.get('selectedFilaments');
            this.state.filaments.set('selectedFilaments', currentSelected.filter(id => id !== filamentId));
            
            // Update UI
            this.updateFilamentList();
            
            // Trigger events
            this.dispatchEvent('filament:deleted', { filamentId });
        }
    }
    
    // Helper methods
    showFilamentModal() {
        this.filamentModal.classList.remove('hidden');
        this.filamentModal.classList.add('flex');
    }
    
    hideFilamentModal() {
        this.filamentModal.classList.remove('flex');
        this.filamentModal.classList.add('hidden');
    }
    
    hideImportModal() {
        this.importModal.classList.remove('flex');
        this.importModal.classList.add('hidden');
    }
    
    hideExportModal() {
        this.exportModal.classList.remove('flex');
        this.exportModal.classList.add('hidden');
    }
    
    resetFilamentForm() {
        document.getElementById('filament-form').reset();
        document.getElementById('filament-hex').value = '#FF0000';
        document.getElementById('filament-color').value = '#FF0000';
        document.getElementById('filament-td').value = '0.8';
    }
    
    populateFilamentForm(filament) {
        document.getElementById('filament-vendor').value = filament.vendor;
        document.getElementById('filament-name').value = filament.name;
        document.getElementById('filament-hex').value = filament.hex;
        document.getElementById('filament-color').value = filament.hex;
        document.getElementById('filament-td').value = filament.td;
        document.getElementById('filament-material').value = filament.material;
        document.getElementById('filament-type').value = filament.type;
        document.getElementById('filament-category').value = filament.category;
    }
    
    handleFilamentFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const filament = {
            vendor: formData.get('vendor'),
            name: formData.get('name'),
            hex: formData.get('hex').toUpperCase(),
            td: parseFloat(formData.get('td')),
            material: formData.get('material'),
            type: formData.get('type'),
            category: formData.get('category')
        };
        
        if (this.isEditMode) {
            // Update existing filament
            filament.id = this.currentEditingFilament.id;
            const currentFilaments = this.state.filaments.get('filaments');
            const index = currentFilaments.findIndex(f => f.id === filament.id);
            if (index !== -1) {
                currentFilaments[index] = filament;
                this.state.filaments.set('filaments', currentFilaments);
            }
        } else {
            // Add new filament
            filament.id = window.PolyHue.Utils.generateShortId();
            const currentFilaments = this.state.filaments.get('filaments');
            currentFilaments.push(filament);
            this.state.filaments.set('filaments', currentFilaments);
        }
        
        this.updateFilamentList();
        this.hideFilamentModal();
        
        // Trigger events
        this.dispatchEvent('filament:' + (this.isEditMode ? 'updated' : 'added'), { filament });
    }
    
    handleImport() {
        const fileInput = document.getElementById('import-file');
        const importMode = document.querySelector('input[name="import-mode"]:checked').value;
        
        if (!fileInput.files.length) {
            alert('Please select a file to import');
            return;
        }
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                let importedFilaments = [];
                
                if (file.name.endsWith('.json')) {
                    importedFilaments = JSON.parse(e.target.result);
                } else if (file.name.endsWith('.csv')) {
                    importedFilaments = this.parseCSV(e.target.result);
                }
                
                // Validate imported data
                if (!Array.isArray(importedFilaments)) {
                    throw new Error('Invalid file format');
                }
                
                // Process import
                if (importMode === 'replace') {
                    this.state.filaments.set('filaments', importedFilaments);
                } else {
                    // Merge mode - avoid duplicates
                    const currentFilaments = this.state.filaments.get('filaments');
                    importedFilaments.forEach(filament => {
                        if (!currentFilaments.find(f => f.id === filament.id)) {
                            currentFilaments.push(filament);
                        }
                    });
                    this.state.filaments.set('filaments', currentFilaments);
                }
                
                this.updateFilamentList();
                this.hideImportModal();
                
                alert(`Successfully imported ${importedFilaments.length} filaments`);
                
            } catch (error) {
                alert('Error importing file: ' + error.message);
                console.error('Import error:', error);
            }
        };
        
        reader.readAsText(file);
    }
    
    handleExport() {
        const format = document.querySelector('input[name="export-format"]:checked').value;
        const content = document.querySelector('input[name="export-content"]:checked').value;
        
        let filamentsToExport = [];
        
        const currentFilaments = this.state.filaments.get('filaments');
        const selectedFilaments = this.state.filaments.get('selectedFilaments');
        
        switch (content) {
            case 'all':
                filamentsToExport = currentFilaments;
                break;
            case 'selected':
                filamentsToExport = currentFilaments.filter(f => selectedFilaments.includes(f.id));
                break;
            case 'custom':
                filamentsToExport = currentFilaments.filter(f => !window.PolyHue.Filaments.DEFAULT_FILAMENTS.find(df => df.id === f.id));
                break;
        }
        
        if (filamentsToExport.length === 0) {
            alert('No filaments to export');
            return;
        }
        
        let fileContent = '';
        let fileName = '';
        let mimeType = '';
        
        if (format === 'json') {
            fileContent = JSON.stringify(filamentsToExport, null, 2);
            fileName = `polyhue-filaments-${Date.now()}.json`;
            mimeType = 'application/json';
        } else {
            fileContent = this.generateCSV(filamentsToExport);
            fileName = `polyhue-filaments-${Date.now()}.csv`;
            mimeType = 'text/csv';
        }
        
        // Download file
        const blob = new Blob([fileContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        
        this.hideExportModal();
    }
    
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const filaments = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= headers.length) {
                const filament = {};
                headers.forEach((header, index) => {
                    filament[header] = values[index];
                });
                
                // Convert numeric values
                if (filament.td) filament.td = parseFloat(filament.td);
                
                filaments.push(filament);
            }
        }
        
        return filaments;
    }
    
    generateCSV(filaments) {
        const headers = ['id', 'vendor', 'name', 'hex', 'td', 'type', 'material', 'category'];
        const csvLines = [headers.join(',')];
        
        filaments.forEach(filament => {
            const values = headers.map(header => filament[header] || '');
            csvLines.push(values.join(','));
        });
        
        return csvLines.join('\n');
    }
    
        updateFilamentList() {
        // This method will be called by the UI components that display filaments
        // For now, just trigger an event
        this.dispatchEvent('filament:library-updated', { 
            filaments: this.state.filaments.get('filaments') 
        });
    }

    getFilamentById(id) {
        const filaments = this.state.filaments.get('filaments');
        return filaments.find(f => f.id === id);
    }

    getFilamentsByCategory(category) {
        const filaments = this.state.filaments.get('filaments');
        return filaments.filter(f => f.category === category);
    }

    getFilamentsByVendor(vendor) {
        const filaments = this.state.filaments.get('filaments');
        return filaments.filter(f => f.vendor === vendor);
    }
    
    // Auto-mapping functionality
    findClosestFilament(targetColor, excludeIds = []) {
        const targetLab = window.PolyHue.Utils.rgbToLab(window.PolyHue.Utils.hexToRgb(targetColor));
        let closestFilament = null;
        let minDistance = Infinity;
        
        const filaments = this.state.filaments.get('filaments');
        for (const filament of filaments) {
            if (excludeIds.includes(filament.id)) continue;
            
            const filamentLab = window.PolyHue.Utils.rgbToLab(window.PolyHue.Utils.hexToRgb(filament.hex));
            const distance = window.PolyHue.Utils.deltaE(targetLab, filamentLab);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestFilament = filament;
            }
        }
        
        return {
            filament: closestFilament,
            distance: minDistance
        };
    }
    
    autoMapRegionsToFilaments(regions) {
        const mappings = [];
        const usedFilaments = [];
        
        for (const region of regions) {
            const result = this.findClosestFilament(region.color, usedFilaments);
            
            if (result.filament) {
                mappings.push({
                    regionId: region.id,
                    filamentId: result.filament.id,
                    distance: result.distance,
                    isGoodMatch: result.distance < 10 // Delta E threshold
                });
                
                usedFilaments.push(result.filament.id);
            }
        }
        
        return mappings;
    }
    
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
}

// Export as singleton
let filamentManager = null;

function getFilamentManager() {
    if (!filamentManager) {
        filamentManager = new FilamentManager();
    }
    return filamentManager;
}

// Expose to global PolyHue object
window.PolyHue = window.PolyHue || {};
window.PolyHue.FilamentManager = {
    getFilamentManager,
    FilamentManager
};