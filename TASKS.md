Below is a **single-file task board**
Each line starts with an unchecked box `- [ ]`; the agent simply flips it to `- [x]` when done so progress is always visible at a glance.

> **Legend**
> **⤷** Dependency (must be checked first) • **(W)** runs in a Web Worker

---

## 1 Foundation Code

* [ ] **1.1 State store scaffolding** — create global `project`, `regions`, `filaments` stores (Pinia/Zustand)
* [ ] **1.2 UI shell** — Tailwind layout, dark/light toggle, stepper placeholder
* [ ] **1.3 Utility bundle** — UUID, color helpers (RGB ⇄ LAB, ΔE), file-to-ImageBitmap converter
* [ ] **1.4 Worker framework** — two-way message helper, timeout guard (W)

---

## 2 Image Pipeline

* [ ] **2.1 Image uploader component** — drag-drop + file dialog, accept PNG/JPG/SVG, auto-downscale >4096 px
* [ ] **2.2 Basic edit panel** — crop/rotate/flip via canvas, live preview
* [ ] **2.3 Brightness / contrast sliders** — real-time < 1 s; outsource >2 MP to worker (W)
* [ ] **2.4 Background removal toggle** — simple luminance or third-party lib, applies mask (W)

---

## 3 Workflow & Mode Selection

* [ ] **3.1 Mode selector** — “Lithophane” vs “Multi-color”
* [ ] **3.2 Wizard router** — Import → Mode → Palette → Preview → Export

---

## 4 Color Quantization & Region Map

* [ ] **4.1 Implement K-means & Median-Cut algorithms** (W) — input ImageBitmap + N → raw palette
* [ ] **4.2 Perceptual region merge (ΔE < 8)** — ensures ≤ N regions
* [ ] **4.3 Region overlay renderer** — draws colored mask on thumbnail; toggle on/off
* [ ] **4.4 Max-region guard** — hard cap 12; toast warning if exceeded

---

## 5 Filament Library & Assignment

* [ ] **5.1 Seed default filament JSON** — vendor, name, HEX, TD
* [ ] **5.2 Filament manager** — add/edit/delete, CSV/JSON import
* [ ] **5.3 Palette picker panel** — drag filaments onto region chips; validation if regions > filaments
* [ ] **5.4 Auto-map regions → nearest filament** — LAB ΔE; flag mismatches > 10

---

## 6 3D Mesh Generation

* [ ] **6.1 Height-map → lithophane geometry** — grayscale→Z, min/max thickness params
* [ ] **6.2 Flat-panel geometry for AMS** — uniform thickness; supports optional lithophane-style Z
* [ ] **6.3 Per-vertex color assignment** (multi-color mode) — adds `color` attribute
* [ ] **6.4 Swap-layer calculator** — generates Z-height table for filament painting

---

## 7 Live Preview

* [ ] **7.1 Three.js viewer integration** — orbit controls, responsive resize
* [ ] **7.2 Back-lit shader for lithophane** — adjustable light intensity
* [ ] **7.3 Region-click selection** — clicking mesh highlights region & focuses palette
* [ ] **7.4 Performance throttle** — ensure updates < 1 s on param change

---

## 8 Exporters

* [ ] **8.1 GLB exporter** — BufferGeometry + vertex colors; opens with colors in PrusaSlicer/Bambu
  ⤷ 6.3
* [ ] **8.2 OBJ + MTL exporter** — one material per region; always included with GLB
  ⤷ 6.3
* [ ] **8.3 STL exporter** — lithophane geometry only
  ⤷ 6.1
* [ ] **8.4 Swap-table TXT generator** — layer heights list
  ⤷ 6.4
* [ ] **8.5 3MF beta exporter** — feature-flagged; per-region color
  ⤷ 8.1
* [ ] **8.6 ZIP bundler** — packages selected files for download
  ⤷ 8.1 8.2 8.3 8.4 8.5
* [ ] **8.7 Export panel UI** — checkboxes, progress chips, “Download ZIP” button

---

## 9 Polish & Performance

* [ ] **9.1 ≤2 s preview render budget** — profile & optimise workers or Three.js
* [ ] **9.2 Mobile viewport tweaks** — touch rotation, one-hand palette assignment
* [ ] **9.3 Accessibility pass** — tabindex order, readable color names, ARIA on wizard steps

---

### Usage

1. Open this file.
2. Pick the first unchecked box with no unmet dependencies `⤷`.
3. Implement, manually tick `[x]`, push code.
4. Move to the next.