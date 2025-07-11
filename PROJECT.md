# Project Specification – PolyHue

**Open-Source, Web-Based Multi-Color Lithophane & Color 3D Print Generator**
*Version 1.1 – 11 July 2025*

---

## 1. Executive Summary

**PolyHue** is an open-source, browser-based application for converting 2D images into multi-color 3D printable models using filament painting (translucent stacking), or for AMS/multi-material color prints. The application enables both traditional color-blended lithophanes and “flat” color-mapped models for use with multi-extruder printers (Bambu AMS, Prusa MMU, etc).
PolyHue is 100% front-end (HTML5/CSS3/JS ES Modules, Three.js) and outputs STL for FDM, plus true-color GLB/OBJ/3MF for AMS/MMU or color visualization. MIT licensed, cross-platform, runs local or online, with modern, intuitive, and mobile-friendly UI.

---

## 2. Problem Statement & Project Goals

### Problem

* Closed, Windows-only, paid HueForge limits access.
* No open tool exists to create color-mapped 3D prints for AMS/MMU with max color selection, color region merging, or true color 3D export.
* High learning curve; current UI is not beginner friendly.

### Goals

| **Goal**                                     | **Success Metric**                                         |
| -------------------------------------------- | ---------------------------------------------------------- |
| Free, web-based, open-source alternative     | MIT-licensed, browser/device agnostic                      |
| Full HueForge feature parity                 | All major features, plus multi-color/AMS workflow          |
| “Max colors”/quantized export & region merge | User can pick ≤N colors and preview color-flattened result |
| Easy multi-color 3D export                   | GLB/3MF/OBJ with colors, for AMS/multi-material slicing    |
| Enhanced UX/UI                               | Beginner wizard, live preview, easy filament palette       |
| Maintainability/extensibility                | Modular, clean, no heavy dependencies                      |

---

## 3. Scope

**In Scope (MVP):**

* 2D image upload (PNG/JPG/SVG), cropping, basic edits.
* Filament library, palette selection, stack order.
* Live color blending simulation (traditional lithophane workflow).
* “Max colors” quantization: flatten image to ≤N regions/colors, merge similar colors, preview result, and assign filament.
* Multi-color 3D export: GLB (full color), OBJ+MTL, and experimental 3MF.
* Traditional STL & swap instruction export for single-extruder filament-painting workflow.
* All code runs client-side, browser-only.
* Modern, mobile-friendly UI with visual previews and clear workflow.
* No backend/server, no user login.

---

## 4. User Personas & Stakeholders

| **Persona**                   | **Goal**                                                      |
| ----------------------------- | ------------------------------------------------------------- |
| Hobbyist (single-extruder)    | Color lithophane with STL + swap table, easy color simulation |
| Multi-material user (AMS/MMU) | Flat-color print, max N colors, true-color export for slicing |
| Designer                      | Visualize, merge, and assign colors, preview before printing  |
| OSS developer                 | Self-host, extend, or integrate into other tools              |

---

## 5. Technical Overview & Assumptions

* Browser: ES6+, WebGL2, OffscreenCanvas support required.
* Targets: Desktop (Chrome, Firefox, Safari, Edge), iOS 15+, Android 13+.
* Images up to 4096px; all calculations local; Web Workers for heavy tasks.
* Filament/color library includes brand, hex, Transmission Distance (TD), editable/custom.
* 3D output: STL (geometry), GLB/OBJ/MTL/3MF (geometry + color, per-region or per-vertex).

### Implementation Architecture (HTML-First)

* **Single HTML file** with embedded CSS/JS or linked resources
* **Third-party libraries** loaded via CDN or local files:
  - Three.js (3D rendering, exporters)
  - jQuery (DOM manipulation, optional)
  - Additional utilities as needed
* **No build process** required - runs directly in browser
* **Modular ES6** code structure within script tags or separate JS files
* **Web Workers** for heavy computations (color quantization, mesh generation)

---

## 6. User Workflow

1. **Import Image:** User uploads PNG/JPEG (SVG converted), sets cropping, rotation, brightness, contrast, background removal as needed.

2. **Start Processing:** User clicks "Start" button to begin color quantization process.
   - Image is automatically processed to default 8 colors (user can adjust from 2-12 colors)
   - Algorithm creates distinct color regions using K-means or Median Cut clustering
   - User can see immediate preview of quantized color regions

3. **Color Organization & Configuration:**
   - **Drag & Drop Height Order:** User can drag and drop colors to organize them in the order of height for the 3D render (lowest to highest)
   - **Add Colors:** User can add additional colors to the palette (up to 12 total)
   - **Delete Colors:** User can remove colors from the palette
   - **Color Replacement:** User can click on any color to open color picker and replace it with a different color
   - **Auto-Edit Render:** Any changes to colors or height order automatically updates the 3D render in real-time

4. **Filament Assignment (Optional):**
   - User can assign specific filament types to each color for material reference
   - Filament database provides realistic color matching and printing properties

5. **3D Model Generation:**
   - Each color becomes a height layer in the 3D model
   - Height is determined by the order specified by the user (drag & drop sequence)
   - Model generates automatically as user makes changes

6. **WebGL 3D Preview:**
   - Interactive 3D view showing the final model with accurate colors and heights
   - Users can rotate, zoom, and inspect the model before export
   - Real-time updates as user modifies colors or height order

7. **Export Options:**
   - Multiple format support as listed in documentation
   - **Multi-Color Formats:** GLB (.glb), OBJ+MTL, 3MF (.3mf) with per-region colors
   - **Single-Color Formats:** STL with height mapping
   - **Documentation:** Layer height instructions, color swap tables
   - **Project Files:** JSON project file for later editing

### Key Features:
- **Real-time Processing:** All changes reflect immediately in the 3D preview
- **Intuitive Interface:** Drag & drop color organization, visual height mapping
- **Flexible Configuration:** Add/remove colors, change color values, adjust height order
- **Professional Export:** Multiple industry-standard formats for various 3D printing workflows

---

## 7. Functional Requirements

### 7.1 Image Import

* Accept PNG, JPEG (minimum), SVG (rasterized).
* File size/resolution warnings; auto-downscale if over 4096px.
* Editing: crop, rotate, flip, brightness, contrast, background removal.

### 7.2 Print Mode Selection

* User chooses:

  * “Color Lithophane (Filament Blending)”
  * “Multi-Color Flat Print (AMS/MMU)”
* UI adapts: exposes relevant controls for each.

### 7.3 Max Colors / Color Quantization

* User sets desired max number of colors (N).
* App analyzes image, clusters/merges similar colors into ≤N “regions” (using K-means, Median Cut, or similar algorithm).
* Merged color preview displayed: user can see effect before export.
* Each color region is assigned a filament color (auto-mapped to closest, user can override).
* Visual: Region map overlays on preview; palette shows mapping (e.g. “Region 2: Red → Polymaker Panchroma Red”).

### 7.4 Filament Palette and Assignment

* Built-in filament/color library: vendor, name, HEX, TD.
* Add/edit/delete filaments; import/export CSV/JSON.
* Drag-drop assign filaments to regions (color mode) or to stack order (lithophane).
* In color mode, warn if fewer filaments than regions (require at least as many, or auto-reduce regions).

### 7.5 Layer & Print Settings

* **Lithophane:** Layer height (e.g. 0.08mm), min/max thickness, blending algorithm.
* **Color/AMS:** Uniform model thickness (default 1.2–2.0mm); user can also select lithophane-like Z if desired (advanced).
* Optional: Toggle for dithering/halftone (future).

### 7.6 Preview

* Live color preview:

  * Lithophane mode: Simulates blended color appearance under backlight.
  * Multi-color mode: Region map with filament colors, accurate to print outcome.
* 3D geometry preview:

  * Both modes; shows mesh with assigned colors per region or per-vertex (for gradients/dithering).
* All previews update in real-time (<1s), mobile-friendly.

### 7.7 Export

* **Lithophane Mode:**

  * STL (geometry, monochrome, variable thickness),
  * TXT swap table (heights, layer#),
  * PNG preview,
  * JSON project.
* **Multi-Color/AMS Mode:**

  * GLB (.glb): Geometry + per-region/per-vertex color, ready for color slicing in Prusa/Bambu.
  * OBJ+MTL: Each region as separate material, flat color (legacy, always generated if GLB done).
  * 3MF (.3mf, beta): Full color/region mapping for modern multi-material slicers.
  * All color files should open with assigned region colors in PrusaSlicer/Bambu Studio and allow color assignment for extruders/AMS slots.
* UI: Export tab with all format options, clear labeling of use case (e.g. “GLB (Color 3D, Recommended)”).
* Option: ZIP archive with all outputs for download.

### 7.8 Visual & User Experience

* UI guides user through workflow: import → mode select → quantize/assign → preview → export.
* All assignments visually represented: color palette, region map, model colors.
* Tooltips/help for every control.
* Easy region-color reassignment (e.g. click region on preview to pick filament).
* Progress bars/spinners for long tasks; error messages for invalid settings (e.g. more regions than filaments).
* Accessibility: Keyboard, ARIA, readable color names.

---

## 8. Algorithmic/Implementation Details

### 8.1 Color Quantization

* Quantize image to N colors/regions using K-means or Median Cut (browser JS, or Web Worker).
* For each region, store original color, area (pixel count), and average/representative color.
* Merge regions with perceptually similar colors (e.g. orange with red, blue with cyan) if N < #unique.
* Assign each region to the closest filament color (Euclidean or LAB distance); allow user override.

### 8.2 Color 3D Export

* Build 3D mesh (heightmap for lithophane, flat for AMS).
* For each color region:

  * Assign color (hex) as per assigned filament.
  * Export formats:

    * **GLB**: BufferGeometry with vertex colors (`geometry.setAttribute('color', ...)`); use [GLTFExporter](https://threejs.org/docs/#examples/en/exporters/GLTFExporter).
    * **OBJ/MTL**: Each region as separate mesh/material, assign flat color (Three.js OBJExporter).
    * **3MF (beta)**: Use community JS packages (e.g. @jscadui/3mf-export or three-3mf-exporter); wrap in Web Worker for performance.
* For lithophane mode, color export optional (enabled if user wants a “reference” color STL or AMS slicing).
* Validation: Exported files must show correct region colors in PrusaSlicer/Bambu Studio, allow for extruder slot assignment.

### 8.3 Preview & Region Mapping

* Overlay preview: Show quantized region map with filament color; click to select/edit assignment.
* On export, model colors must match assignments shown in preview.
* For dithering/gradient (future): use per-vertex color in GLB/PLY export.

### 8.4 Export UI

* Export tab:

  * Checkbox/select for each file format (GLB, OBJ+MTL, STL, 3MF beta).
  * Show which mode(s) support each (e.g. “GLB: Multi-color AMS / Color visualization”).
  * Download all as ZIP.
* Feature flag: 3MF export “beta”, hide behind toggle or advanced menu.

---

## 9. Data Models

**Filament:**

```js
{
  id: 'uuid',
  vendor: 'Polymaker',
  name: 'Translucent Red',
  hex: '#FF3322',
  td: 12.0
}
```

**Region:**

```js
{
  id: 2,
  avgColor: '#F06A2C', // quantized
  assignedFilament: 'uuid', // maps to filament
  pixelCount: 5000
}
```

**Project:**

```js
{
  mode: 'color'|'lithophane',
  maxColors: 4,
  regions: [...],
  filaments: [...],
  settings: { layerHeight, minThickness, ... },
  image: { src, width, height }
}
```

---

## 10. Non-Functional Requirements

* Performance: <2s for preview, <10s for large exports (4096px); use Web Workers.
* Code: Modular ES6+, clean, well-commented, ESLint/prettier, unit tests.
* Browser compatibility: Chrome, Firefox, Edge, Safari (desktop/mobile).
* Accessibility: WCAG 2.2 AA.
* Security: No data leaves browser.

---

## 11. Export Format Table

| Format  | Color Support             | Target Use                   | Library/Status                      |
| ------- | ------------------------- | ---------------------------- | ----------------------------------- |
| STL     | No (geometry only)        | Lithophane (single-extruder) | Core, always available              |
| TXT     | N/A (instructions)        | Swap-by-layer printing       | Core, always available              |
| GLB     | Full: per-vertex/region   | AMS/MMU, Color ref, Viz      | Three.js GLTFExporter, MVP required |
| OBJ/MTL | Per-region material color | Legacy/compat                | Three.js OBJExporter, free with GLB |
| 3MF (β) | Full: per-region          | AMS/MMU, advanced            | JS libs, behind feature flag        |
| PNG     | Color preview             | Visual ref/share             | Core, always available              |

---

## 12. Testing, QA, and Validation

* Unit tests: quantization, color region assignment, export logic.
* Integration: Test GLB/3MF/OBJ in PrusaSlicer 2.8+, Bambu Studio 1.9+.
* Manual: Export region maps, validate colors visually in slicers.
* Usability: 5 users must successfully complete both workflows (lithophane and color flatten/AMS) without written instructions.
* SUS >80.

---

## 13. Risks & Mitigations

| **Risk**                              | **Mitigation**                                   |
| ------------------------------------- | ------------------------------------------------ |
| Export files too large (many regions) | Hard cap region count (e.g. max 12); warn if big |
| Color assignment errors               | User override, clear preview                     |
| 3MF unstable in browser               | “Beta” feature flag, fallback to GLB/OBJ         |
| Non-matching colors in slicers        | Use standard sRGB; test all exporters            |

---

## 14. UI/UX Examples

**Export tab:**

```
Export Options
[✓] STL (Lithophane, for all FDM printers)
[✓] GLB (.glb, color 3D for AMS/MMU/multicolor)
[ ] OBJ + MTL (.obj/.mtl, legacy slicer color)
[ ] 3MF (.3mf, beta – full color for AMS/MMU)

[Export All as ZIP]    [Download individually]
```

**Region Preview:**

* Image overlay with color blocks, each block shows assigned filament swatch and name.
* Click region to reassign filament color.
* Tooltip: “Region 4: Orange (Merged: Red + Yellow), Assigned: Prusament Orange”

---

## 15. References

* [HueForge FAQ and Filament Painting](https://shop.thehueforge.com/pages/hueforge-faq)
* [Polymaker Wiki: HueForge Filament Data](https://wiki.polymaker.com/en/HueforgePainting)
* [Three.js Exporters: GLTF, OBJ](https://threejs.org/docs/)
* [JS 3MF Export: @jscadui/3mf-export](https://github.com/jscadui/jscadui)
* [Prusa Knowledge: Color 3D printing](https://help.prusa3d.com/guide/color-printing-mmu2s_1803)
* [Bambu Studio Multi-color Print Guides](https://wiki.bambulab.com/en/software/studio/color/)
