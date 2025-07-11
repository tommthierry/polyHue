# PolyHue Development Guide

## Running the Application

### Quick Start
1. **For Local Development**: Open `index.html` directly in your browser
   - The app will work with reduced performance (main thread fallback for color processing)
   - Web Workers are disabled due to file:// protocol restrictions

### Recommended Setup (Better Performance)

1. **Install a local server**:
   ```bash
   # Using Python (built-in)
   python -m http.server 8000
   
   # Using Node.js
   npm install -g http-server
   npx http-server
   
   # Using PHP (if available)
   php -S localhost:8000
   ```

2. **Open in browser**: Navigate to `http://localhost:8000`

### Benefits of Local Server
- ✅ Web Workers enabled (faster color processing)
- ✅ No CORS restrictions
- ✅ Better debugging capabilities
- ✅ Production-like environment

## Common Issues

### 1. THREE.OrbitControls Error
**Fixed**: Updated Three.js imports and added namespace fixes.

### 2. Web Worker Security Error
**Fixed**: Added main thread fallback when workers are unavailable.

### 3. Tailwind CSS Production Warning
**Note**: Using CDN for development. For production, install locally:
```bash
npm install -D tailwindcss
npx tailwindcss init
```

## Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Internet Explorer: ❌ Not supported

## Development Dependencies
- Three.js r128 (3D graphics)
- Tailwind CSS (styling)
- jQuery (DOM manipulation)

## Architecture
```
js/
├── core/              # Core application logic
├── components/        # UI components
├── workers/          # Web Workers for background processing
├── data/             # Data management
└── exporters/        # Export functionality
```

## Performance Tips
1. Use local server for development
2. Enable Web Workers for large images
3. Use medium preview quality for better performance
4. Consider reducing max colors for faster processing

## Debugging
1. Open Developer Tools (F12)
2. Check Console for errors
3. Use Network tab to verify resource loading
4. Use Performance tab for profiling 