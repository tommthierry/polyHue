Absolutely, thanks for clarifying. Here’s the **full project documentation** for your streamlined PolyHue—written for clarity, detail, and “handoff-ready” usability. This will make your expectations unmistakable for any developer (or yourself in the future).
Let me know if you want a second version with visuals/wireframes or an even more concise “one-pager”!

---

# PolyHue – Simple Multi-Color Lithophane Generator

**Project Documentation**
*Version 1.0 – July 2025*

---

## 1. Overview

**PolyHue** is a browser-based tool that lets anyone convert a 2D image into a layered, multi-color lithophane 3D model, ready for 3D printing on FDM machines.
**Key features:**

* No login or backend—runs entirely in-browser
* Modern, clean, and minimal UI: Three intuitive steps
* Focus on color simplification and 3D stack creation
* Exports in standard 3D formats for slicing and printing

---

## 2. Target Users

* **Hobbyist Makers:** Want an easy tool to turn photos or designs into simple, multi-color 3D prints.
* **3D Printing Enthusiasts:** Need fast color reduction and layered modeling for AMS/MMU workflows.
* **Educators & Designers:** Looking for a low-barrier, visual way to create color-stacked models from any image.

---

## 3. Workflow (User Experience)

### Step 1: Image Upload

* User lands on a clean page with a single upload/drop zone.
* Supported formats: PNG, JPG/JPEG (single image).
* User uploads or drags & drops an image.
* Instant thumbnail preview displayed.
* Only one image at a time (previous upload is replaced if user uploads again).

### Step 2: Color Management

* The tool automatically reduces the image to **6 flat colors** (default), visually simplifying the image.
* User sees a visual preview with distinct color regions.
* User can adjust:

  * **Number of colors**: From 1 (all-black/white/flat) up to 10 max, with a slider or +/- buttons.
  * **Color details per region**:

    * Change hue (with a color picker per color).
    * Drag-and-drop to reorder colors (order determines vertical position in the model).
    * Delete colors (cannot delete last color).
    * Add colors (re-quantize up to max).
    * Adjust each color’s range (slider—controls “how much” of the image each color covers; total must sum to 100%).
* The preview updates instantly as settings change.
* The UI here is visual only: **no 3D, just 2D flat color preview**.

### Step 3: 3D Model Creation & Export

* After accepting color settings, user moves to the modeling phase.
* Each color corresponds to a **vertical layer** in the 3D model:

  * Color at position 0 = bottom, fills full model footprint.
  * Each color above forms a horizontal “slab” of configurable height.
* For each color:

  * User can set height (mm) with a slider or input box.
  * User can continue to reorder colors as needed.
* Live 3D preview (Three.js):

  * The model is shown as a stack of colored slabs/layers, matching user order and heights.
  * User can rotate, zoom, and inspect the model.
  * Any change (order, height) updates preview instantly.
* Export panel lets user download:

  * STL (geometry only)
  * GLB (geometry + per-layer color)
  * OBJ+MTL (optional, legacy color export)
  * PNG (flat color preview)
  * Option to download all as ZIP

---

## 4. Functional Requirements

### 4.1 Image Handling

* Accept only PNG/JPG files up to a max resolution (suggested: 4096px; auto-downscale/warn if exceeded).
* Only one image can be active at a time.
* Delete/replace previous image on new upload.
* Show error messages for unsupported types or sizes.

### 4.2 Color Quantization & Editing

* Automatic quantization on image load to 6 colors.
* Allow user to:

  * Increase/decrease number of colors (re-quantize each time).
  * See all detected colors as editable swatches.
  * Change a color’s hue using a color picker (overrides quantized color).
  * Drag and drop color swatches to change their order (affects model stack).
  * Delete/add colors (must always have at least 1, no more than 10).
  * Adjust how much of the image each color covers with a percentage slider—distribution must always total 100%.
* Image preview updates instantly with changes.

### 4.3 3D Model Generation

* After color config, each color becomes a Z-layer of the model.
* For each color:

  * User sets height in mm (number input or slider).
  * Default: heights evenly distributed to total model height (e.g., 12mm / 6 colors = 2mm each).
* Drag and drop order determines which color is on the bottom/top.
* The model is a stack of rectangles/pixels in the shape of the original image, with each pixel assigned the color/layer it belongs to.
* 3D preview updates live with all changes.

### 4.4 Export

* Export the model as:

  * **STL**: For monochrome prints; Z heights as configured.
  * **GLB**: For full-color slicing (e.g., Bambu AMS, Prusa MMU); each layer has its assigned color.
  * **OBJ+MTL**: Legacy color file.
  * **PNG**: Flat color preview for sharing or reference.
  * **ZIP**: All above files as a bundle.
* Exports must work in standard slicers (PrusaSlicer, Bambu Studio).
* Exports are all local/browser-side—no server or user data collection.

---

## 5. Non-Functional Requirements

* **Performance**: All previews <1s; export <10s for large images.
* **Compatibility**: Chrome, Firefox, Safari, Edge on desktop and mobile.
* **Accessibility**: Keyboard navigation, readable labels, ARIA tags.
* **Security**: All processing stays in-browser; no uploads or cloud storage.
* **Maintainability**: Modular, ES6+ JavaScript; clear comments and code style.

---

## 6. UI & UX Guidelines

* **Minimal UI:**
  Step-by-step, “one thing at a time” (upload → colors → 3D/export).
* **Visual Feedback:**
  Every change is reflected instantly (image/3D preview).
* **Clear Controls:**
  Obvious buttons for Next/Back, clear labels for all inputs, tooltips for non-obvious functions.
* **Progress/Stepper:**
  Visual indicator of step 1/2/3; can’t skip ahead without completing previous.
* **Responsiveness:**
  Works on mobile and desktop; drag and drop for touch and mouse.
* **Error Handling:**
  Clear, non-intrusive error messages for file type/size or processing issues.

---

## 7. Data Structures

### Color Region

```js
{
  id: Number,          // Unique region index
  hex: String,         // HEX color value
  percent: Number,     // How much of image (0-100)
  custom: Boolean,     // Was user-edited
  height: Number       // mm, for stacking in model
}
```

### Project State

```js
{
  image: { src, width, height },
  colors: [ColorRegion],
  totalHeight: Number,       // Total model height (mm)
  exportSettings: { ... }    // STL, GLB, PNG, etc.
}
```

---

## 8. Algorithms & Implementation

* **Color Quantization**:
  Use K-means, Median Cut, or reliable JS library (e.g., [quantize.js](https://github.com/lokesh/color-thief)) for fast, in-browser palette reduction.
* **Color Assignment/Editing**:
  All colors adjustable post-quantization with live update.
* **3D Model Construction**:

  * For each pixel, assign Z based on the region/color it’s in and height config.
  * Use Three.js for rendering preview and exporting mesh in all formats.
* **Export**:
  Use Three.js’s STL and GLTF exporters; add OBJ+MTL as needed.
* **Preview/UX**:
  All image changes instantly re-render the color preview and (at 3D stage) the model.

---

## 9. Example User Flow

1. **Open PolyHue:**
   See “Upload image” screen.
2. **Upload an image:**
   File loads, user sees color-reduced preview.
3. **Adjust Colors:**
   Change number of colors, tweak hues, reorder layers, fine-tune percentages and color dominance.
4. **Go to 3D:**
   Assign heights per color, drag to change stack order, inspect 3D preview.
5. **Export:**
   Download model in chosen format(s) and go print!

---

## 10. Out of Scope (for this MVP)

* Multi-material slicing “swap tables”
* True “lithophane” (variable thickness, light blending)—this is a simple height stack, not continuous grayscale
* User accounts, project history, cloud saves
* Advanced filament palette libraries (could be added later)
* Dithering/gradient or alpha layers (MVP is flat per-region)

---

## 11. References & Inspiration

* [HueForge](https://shop.thehueforge.com/)
* [Color Thief/Quantize.js](https://github.com/lokesh/color-thief)
* [Three.js Exporters](https://threejs.org/docs/#manual/en/introduction/Creating-and-exporting-3D-models)
* [Prusa Knowledge: Color 3D Printing](https://help.prusa3d.com/guide/color-printing-mmu2s_1803)
* [Bambu Studio Color Docs](https://wiki.bambulab.com/en/software/studio/color/)

---

**End of Documentation**
If you want, I can add user stories, mockup sketches, UI texts, or turn this into a ready-to-go `PROJECT.md` file for your repo. Just tell me how you want it packaged or if you need deeper technical breakdowns!
