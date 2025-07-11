/**
 * Filament Palette Component
 * 
 * Provides UI for:
 * - Displaying available filaments
 * - Selecting filaments for the current project
 * - Assigning filaments to color regions
 * - Drag-drop functionality
 * - Validation and warnings
 */

// Use global namespace instead of imports

class FilamentPalette {
    constructor() {
        this.state = window.PolyHue.stores;
        this.filamentManager = window.PolyHue.FilamentManager.getFilamentManager();
        this.initialized = false;
        
        // DOM elements
        this.paletteContainer = null;
        this.filamentLibrary = null;
        this.selectedFilaments = null;
        this.regionAssignments = null;
        
        // Drag and drop state
        this.draggedFilament = null;
        this.dropTarget = null;
        
        // Filter state
        this.currentFilters = {
            vendor: '',
            material: '',
            type: '',
            category: '',
            search: ''
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Wait for filament manager to be ready
            if (!this.filamentManager.initialized) {
                await new Promise(resolve => {
                    const checkInitialized = () => {
                        if (this.filamentManager.initialized) {
                            resolve();
                        } else {
                            setTimeout(checkInitialized, 100);
                        }
                    };
                    checkInitialized();
                });
            }
            
            this.setupDOM();
            this.setupEventListeners();
            this.updateUI();
            
            this.initialized = true;
            console.log('Filament palette initialized');
            
        } catch (error) {
            console.error('Failed to initialize filament palette:', error);
        }
    }
    
    setupDOM() {
        // Find the palette container or create it
        this.paletteContainer = document.getElementById('filament-palette');
        
        if (!this.paletteContainer) {
            console.warn('Filament palette container not found');
            return;
        }
        
        // Create the palette HTML
        this.paletteContainer.innerHTML = this.generatePaletteHTML();
        
        // Get DOM references
        this.filamentLibrary = document.getElementById('filament-library');
        this.selectedFilaments = document.getElementById('selected-filaments');
        this.regionAssignments = document.getElementById('region-assignments');
    }
    
    generatePaletteHTML() {
        return `
            <div class="filament-palette-container">
                <!-- Palette Header -->
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Filament Palette</h3>
                    <div class="flex space-x-2">
                        <button id="add-filament-btn" class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                            Add Filament
                        </button>
                        <button id="import-filaments-btn" class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                            Import
                        </button>
                        <button id="export-filaments-btn" class="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
                            Export
                        </button>
                    </div>
                </div>
                
                <!-- Filters -->
                <div class="filament-filters mb-4 p-3 bg-gray-50 rounded">
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <input type="text" id="filament-search" placeholder="Search filaments..." 
                               class="px-3 py-2 border border-gray-300 rounded text-sm">
                        <select id="filter-vendor" class="px-3 py-2 border border-gray-300 rounded text-sm">
                            <option value="">All Vendors</option>
                        </select>
                        <select id="filter-material" class="px-3 py-2 border border-gray-300 rounded text-sm">
                            <option value="">All Materials</option>
                        </select>
                        <select id="filter-type" class="px-3 py-2 border border-gray-300 rounded text-sm">
                            <option value="">All Types</option>
                        </select>
                        <select id="filter-category" class="px-3 py-2 border border-gray-300 rounded text-sm">
                            <option value="">All Categories</option>
                        </select>
                    </div>
                </div>
                
                <!-- Selected Filaments -->
                <div class="selected-filaments-section mb-6">
                    <h4 class="text-md font-medium mb-2">Selected Filaments</h4>
                    <div id="selected-filaments" class="selected-filaments-container min-h-16 p-3 border-2 border-dashed border-gray-300 rounded bg-gray-50">
                        <div class="text-gray-500 text-sm">Drag filaments here to add them to your palette</div>
                    </div>
                    <div class="mt-2 text-sm text-gray-600">
                        <span id="selected-count">0</span> filaments selected
                        <span id="region-validation" class="ml-4"></span>
                    </div>
                </div>
                
                <!-- Region Assignments (shown only when regions are available) -->
                <div id="region-assignments-section" class="region-assignments-section mb-6 hidden">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="text-md font-medium">Region Assignments</h4>
                        <button id="auto-assign-btn" class="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                            Auto-Assign
                        </button>
                    </div>
                    <div id="region-assignments" class="region-assignments-container"></div>
                </div>
                
                <!-- Filament Library -->
                <div class="filament-library-section">
                    <h4 class="text-md font-medium mb-2">Filament Library</h4>
                    <div id="filament-library" class="filament-library-container max-h-96 overflow-y-auto"></div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Button events
        document.getElementById('add-filament-btn')?.addEventListener('click', () => {
            this.filamentManager.showAddFilamentModal();
        });
        
        document.getElementById('import-filaments-btn')?.addEventListener('click', () => {
            this.filamentManager.showImportModal();
        });
        
        document.getElementById('export-filaments-btn')?.addEventListener('click', () => {
            this.filamentManager.showExportModal();
        });
        
        document.getElementById('auto-assign-btn')?.addEventListener('click', () => {
            this.autoAssignFilaments();
        });
        
        // Filter events
        document.getElementById('filament-search')?.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value;
            this.updateFilamentLibrary();
        });
        
        document.getElementById('filter-vendor')?.addEventListener('change', (e) => {
            this.currentFilters.vendor = e.target.value;
            this.updateFilamentLibrary();
        });
        
        document.getElementById('filter-material')?.addEventListener('change', (e) => {
            this.currentFilters.material = e.target.value;
            this.updateFilamentLibrary();
        });
        
        document.getElementById('filter-type')?.addEventListener('change', (e) => {
            this.currentFilters.type = e.target.value;
            this.updateFilamentLibrary();
        });
        
        document.getElementById('filter-category')?.addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.updateFilamentLibrary();
        });
        
        // Global events
        document.addEventListener('filament:library-updated', () => {
            this.updateFilamentLibrary();
            this.updateFilterOptions();
        });
        
        document.addEventListener('regions:updated', () => {
            this.updateRegionAssignments();
        });
        
        // Drag and drop events will be set up dynamically
    }
    
    updateUI() {
        this.updateFilterOptions();
        this.updateFilamentLibrary();
        this.updateSelectedFilaments();
        this.updateRegionAssignments();
    }
    
    updateFilterOptions() {
        const filaments = this.state.filaments.get('filaments');
        
        // Update vendor filter
        const vendors = [...new Set(filaments.map(f => f.vendor))].sort();
        this.updateSelectOptions('filter-vendor', vendors);
        
        // Update material filter
        const materials = [...new Set(filaments.map(f => f.material))].sort();
        this.updateSelectOptions('filter-material', materials);
        
        // Update type filter
        const types = [...new Set(filaments.map(f => f.type))].sort();
        this.updateSelectOptions('filter-type', types);
        
        // Update category filter
        const categories = [...new Set(filaments.map(f => f.category))].sort();
        this.updateSelectOptions('filter-category', categories);
    }
    
    updateSelectOptions(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        const firstOption = select.options[0];
        
        // Clear existing options except first
        select.innerHTML = '';
        select.appendChild(firstOption);
        
        // Add new options
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
        
        // Restore selection if still valid
        if (options.includes(currentValue)) {
            select.value = currentValue;
        }
    }
    
    updateFilamentLibrary() {
        if (!this.filamentLibrary) return;
        
        const filteredFilaments = this.getFilteredFilaments();
        
        this.filamentLibrary.innerHTML = '';
        
        if (filteredFilaments.length === 0) {
            this.filamentLibrary.innerHTML = '<div class="text-gray-500 text-sm p-4">No filaments found</div>';
            return;
        }
        
        filteredFilaments.forEach(filament => {
            const filamentElement = this.createFilamentElement(filament);
            this.filamentLibrary.appendChild(filamentElement);
        });
    }
    
    updateSelectedFilaments() {
        if (!this.selectedFilaments) return;
        
        const selectedIds = this.state.filaments.get('selectedFilaments') || [];
        const selectedFilaments = selectedIds.map(id => this.filamentManager.getFilamentById(id)).filter(Boolean);
        
        this.selectedFilaments.innerHTML = '';
        
        if (selectedFilaments.length === 0) {
            this.selectedFilaments.innerHTML = '<div class="text-gray-500 text-sm">Drag filaments here to add them to your palette</div>';
        } else {
            selectedFilaments.forEach(filament => {
                const filamentElement = this.createFilamentElement(filament, true);
                this.selectedFilaments.appendChild(filamentElement);
            });
        }
        
        // Update count and validation
        document.getElementById('selected-count').textContent = selectedFilaments.length;
        this.updateValidation();
    }
    
    updateRegionAssignments() {
        if (!this.regionAssignments) return;
        
        const regions = this.state.regions.get('regions') || [];
        const assignments = this.state.regions.get('assignments') || {};
        
        if (regions.length === 0) {
            document.getElementById('region-assignments-section').classList.add('hidden');
            return;
        }
        
        document.getElementById('region-assignments-section').classList.remove('hidden');
        
        this.regionAssignments.innerHTML = '';
        
        regions.forEach(region => {
            const assignedFilamentId = assignments[region.id];
            const assignedFilament = assignedFilamentId ? this.filamentManager.getFilamentById(assignedFilamentId) : null;
            
            const regionElement = this.createRegionAssignmentElement(region, assignedFilament);
            this.regionAssignments.appendChild(regionElement);
        });
    }
    
    createFilamentElement(filament, isSelected = false) {
        const element = document.createElement('div');
        element.className = `filament-item ${isSelected ? 'selected' : ''} flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50`;
        element.draggable = true;
        element.dataset.filamentId = filament.id;
        
        element.innerHTML = `
            <div class="filament-color w-6 h-6 rounded border mr-3" style="background-color: ${filament.hex}"></div>
            <div class="flex-1">
                <div class="font-medium text-sm">${filament.name}</div>
                <div class="text-xs text-gray-500">${filament.vendor} • ${filament.material} • TD: ${filament.td}mm</div>
            </div>
            <div class="flex space-x-1">
                ${isSelected ? `
                    <button class="remove-filament-btn p-1 text-red-600 hover:bg-red-50 rounded" data-filament-id="${filament.id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                ` : ''}
                <button class="edit-filament-btn p-1 text-blue-600 hover:bg-blue-50 rounded" data-filament-id="${filament.id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
            </div>
        `;
        
        // Add event listeners
        element.addEventListener('dragstart', (e) => this.handleDragStart(e, filament));
        element.addEventListener('dragend', (e) => this.handleDragEnd(e));
        
        // Edit button
        element.querySelector('.edit-filament-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.filamentManager.showEditFilamentModal(filament.id);
        });
        
        // Remove button (for selected filaments)
        element.querySelector('.remove-filament-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeFilamentFromSelection(filament.id);
        });
        
        // Click to select/deselect
        if (!isSelected) {
            element.addEventListener('click', () => {
                this.addFilamentToSelection(filament.id);
            });
        }
        
        return element;
    }
    
    createRegionAssignmentElement(region, assignedFilament) {
        const element = document.createElement('div');
        element.className = 'region-assignment flex items-center p-2 border rounded mb-2';
        element.dataset.regionId = region.id;
        
        element.innerHTML = `
            <div class="region-color w-6 h-6 rounded border mr-3" style="background-color: ${region.color}"></div>
            <div class="flex-1">
                <div class="font-medium text-sm">Region ${region.id}</div>
                <div class="text-xs text-gray-500">${region.pixelCount} pixels</div>
            </div>
            <div class="filament-assignment-area flex-1 ml-4">
                ${assignedFilament ? `
                    <div class="assigned-filament flex items-center p-2 bg-green-50 rounded">
                        <div class="filament-color w-4 h-4 rounded border mr-2" style="background-color: ${assignedFilament.hex}"></div>
                        <div class="text-sm">${assignedFilament.name}</div>
                        <button class="unassign-btn ml-2 p-1 text-red-600 hover:bg-red-50 rounded" data-region-id="${region.id}">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                ` : `
                    <div class="assignment-dropzone p-2 border-2 border-dashed border-gray-300 rounded text-center text-sm text-gray-500">
                        Drop filament here
                    </div>
                `}
            </div>
        `;
        
        // Add drop zone events
        const dropZone = element.querySelector('.assignment-dropzone, .assigned-filament');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            dropZone.addEventListener('drop', (e) => this.handleDrop(e, region.id));
        }
        
        // Unassign button
        element.querySelector('.unassign-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.unassignFilament(region.id);
        });
        
        return element;
    }
    
    getFilteredFilaments() {
        let filaments = this.state.filaments.get('filaments');
        
        // Apply filters
        if (this.currentFilters.vendor) {
            filaments = filaments.filter(f => f.vendor === this.currentFilters.vendor);
        }
        
        if (this.currentFilters.material) {
            filaments = filaments.filter(f => f.material === this.currentFilters.material);
        }
        
        if (this.currentFilters.type) {
            filaments = filaments.filter(f => f.type === this.currentFilters.type);
        }
        
        if (this.currentFilters.category) {
            filaments = filaments.filter(f => f.category === this.currentFilters.category);
        }
        
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filaments = filaments.filter(f => 
                f.name.toLowerCase().includes(searchTerm) ||
                f.vendor.toLowerCase().includes(searchTerm) ||
                f.material.toLowerCase().includes(searchTerm)
            );
        }
        
        return filaments;
    }
    
    // Drag and drop handlers
    handleDragStart(e, filament) {
        this.draggedFilament = filament;
        e.dataTransfer.setData('text/plain', filament.id);
        e.dataTransfer.effectAllowed = 'copy';
    }
    
    handleDragEnd(e) {
        this.draggedFilament = null;
        this.dropTarget = null;
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }
    
    handleDrop(e, regionId) {
        e.preventDefault();
        
        if (!this.draggedFilament) return;
        
        if (regionId) {
            // Assign to specific region
            this.assignFilamentToRegion(this.draggedFilament.id, regionId);
        } else {
            // Add to selected filaments
            this.addFilamentToSelection(this.draggedFilament.id);
        }
    }
    
        // Filament selection methods
    addFilamentToSelection(filamentId) {
        const currentSelected = this.state.filaments.get('selectedFilaments') || [];
        if (!currentSelected.includes(filamentId)) {
            currentSelected.push(filamentId);
            this.state.filaments.set('selectedFilaments', currentSelected);
            this.updateSelectedFilaments();
            this.dispatchEvent('filament:selection-changed');
        }
    }

    removeFilamentFromSelection(filamentId) {
        const currentSelected = this.state.filaments.get('selectedFilaments') || [];
        this.state.filaments.set('selectedFilaments', currentSelected.filter(id => id !== filamentId));
        this.updateSelectedFilaments();
        this.dispatchEvent('filament:selection-changed');
    }
    
        // Region assignment methods
    assignFilamentToRegion(filamentId, regionId) {
        const currentAssignments = this.state.regions.get('assignments') || {};
        currentAssignments[regionId] = filamentId;
        this.state.regions.set('assignments', currentAssignments);
        this.updateRegionAssignments();
        this.dispatchEvent('region:assignment-changed', { regionId, filamentId });
    }

    unassignFilament(regionId) {
        const currentAssignments = this.state.regions.get('assignments') || {};
        delete currentAssignments[regionId];
        this.state.regions.set('assignments', currentAssignments);
        this.updateRegionAssignments();
        this.dispatchEvent('region:assignment-changed', { regionId, filamentId: null });
    }
    
    autoAssignFilaments() {
        const regions = this.state.regions.get('regions') || [];
        const mappings = this.filamentManager.autoMapRegionsToFilaments(regions);
        
        // Apply mappings
        const currentAssignments = this.state.regions.get('assignments') || {};
        const currentSelected = this.state.filaments.get('selectedFilaments') || [];
        
        mappings.forEach(mapping => {
            currentAssignments[mapping.regionId] = mapping.filamentId;
            
            // Add filament to selection if not already selected
            if (!currentSelected.includes(mapping.filamentId)) {
                currentSelected.push(mapping.filamentId);
            }
        });
        
        this.state.regions.set('assignments', currentAssignments);
        this.state.filaments.set('selectedFilaments', currentSelected);
        
        this.updateSelectedFilaments();
        this.updateRegionAssignments();
        this.dispatchEvent('region:auto-assigned', { mappings });
        
        // Show results
        const goodMatches = mappings.filter(m => m.isGoodMatch).length;
        const totalMatches = mappings.length;
        
        if (goodMatches === totalMatches) {
            alert(`Auto-assigned ${totalMatches} regions with good color matches!`);
        } else {
            alert(`Auto-assigned ${totalMatches} regions (${goodMatches} good matches, ${totalMatches - goodMatches} approximate matches)`);
        }
    }
    
    updateValidation() {
        const selectedCount = (this.state.filaments.get('selectedFilaments') || []).length;
        const regionsCount = (this.state.regions.get('regions') || []).length;
        const validationElement = document.getElementById('region-validation');
        
        if (!validationElement) return;
        
        if (regionsCount === 0) {
            validationElement.textContent = '';
            return;
        }
        
        if (selectedCount < regionsCount) {
            validationElement.innerHTML = `<span class="text-red-600">⚠️ Need ${regionsCount - selectedCount} more filaments</span>`;
        } else if (selectedCount === regionsCount) {
            validationElement.innerHTML = `<span class="text-green-600">✓ Perfect match</span>`;
        } else {
            validationElement.innerHTML = `<span class="text-blue-600">✓ ${selectedCount - regionsCount} extra filaments</span>`;
        }
    }
    
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
}

// Export as singleton
let filamentPalette = null;

function getFilamentPalette() {
    if (!filamentPalette) {
        filamentPalette = new FilamentPalette();
    }
    return filamentPalette;
}

// Expose to global PolyHue object
window.PolyHue = window.PolyHue || {};
window.PolyHue.FilamentPalette = {
    getFilamentPalette,
    FilamentPalette
};