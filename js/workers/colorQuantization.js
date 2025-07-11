/**
 * PolyHue Color Quantization Worker
 * 
 * Implements K-means and Median-Cut algorithms for color quantization
 * Runs in Web Worker for better performance
 */

// Worker message handler
self.onmessage = function(e) {
    const { type, data } = e.data;
    
    try {
        switch (type) {
            case 'quantize':
                const result = quantizeColors(data);
                self.postMessage({ type: 'result', data: result });
                break;
                
            case 'analyze':
                const analysis = analyzeColors(data);
                self.postMessage({ type: 'analysis', data: analysis });
                break;
                
            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error) {
        self.postMessage({ 
            type: 'error', 
            data: { message: error.message, stack: error.stack } 
        });
    }
};

/**
 * Main quantization function
 * @param {Object} data - Quantization parameters
 * @returns {Object} Quantization result
 */
function quantizeColors(data) {
    const { 
        imageData, 
        maxColors = 4, 
        algorithm = 'kmeans',
        mergeThreshold = 8 
    } = data;
    
    // Extract colors from image data
    const colors = extractColors(imageData);
    
    // Apply quantization algorithm
    let palette, assignments;
    
    if (algorithm === 'kmeans') {
        ({ palette, assignments } = kMeansQuantization(colors, maxColors));
    } else if (algorithm === 'median-cut') {
        ({ palette, assignments } = medianCutQuantization(colors, maxColors));
    } else {
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }
    
    // Merge similar colors if needed
    const mergedResult = mergeSimilarColors(palette, assignments, mergeThreshold);
    
    // Create regions
    const regions = createRegions(mergedResult.palette, mergedResult.assignments, imageData);
    
    // Create region map
    const regionMap = createRegionMap(mergedResult.assignments, imageData.width, imageData.height);
    
    return {
        regions,
        palette: mergedResult.palette,
        assignments: mergedResult.assignments,
        regionMap,
        originalColorCount: colors.length,
        finalColorCount: mergedResult.palette.length
    };
}

/**
 * Extract unique colors from image data
 * @param {ImageData} imageData - Image data
 * @returns {Array} Array of color objects
 */
function extractColors(imageData) {
    const colorMap = new Map();
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Skip transparent pixels
        if (a < 128) continue;
        
        const colorKey = `${r},${g},${b}`;
        
        if (colorMap.has(colorKey)) {
            colorMap.get(colorKey).count++;
        } else {
            colorMap.set(colorKey, {
                r, g, b,
                count: 1,
                lab: rgbToLab(r, g, b)
            });
        }
    }
    
    return Array.from(colorMap.values());
}

/**
 * K-means color quantization
 * @param {Array} colors - Array of color objects
 * @param {number} k - Number of clusters
 * @returns {Object} Palette and assignments
 */
function kMeansQuantization(colors, k) {
    if (colors.length <= k) {
        const palette = colors.map(c => ({ r: c.r, g: c.g, b: c.b }));
        const assignments = colors.map((_, i) => i);
        return { palette, assignments };
    }
    
    // Initialize centroids using k-means++
    let centroids = initializeCentroidsKMeansPlusPlus(colors, k);
    
    let assignments = new Array(colors.length);
    let prevAssignments = null;
    let iterations = 0;
    const maxIterations = 50;
    
    // K-means clustering
    while (iterations < maxIterations) {
        // Assign points to nearest centroid
        for (let i = 0; i < colors.length; i++) {
            let minDistance = Infinity;
            let bestCentroid = 0;
            
            for (let j = 0; j < centroids.length; j++) {
                const distance = colorDistance(colors[i], centroids[j]);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestCentroid = j;
                }
            }
            
            assignments[i] = bestCentroid;
        }
        
        // Check for convergence
        if (prevAssignments && arraysEqual(assignments, prevAssignments)) {
            break;
        }
        
        prevAssignments = [...assignments];
        
        // Update centroids
        const newCentroids = new Array(k);
        for (let i = 0; i < k; i++) {
            const clusterPoints = colors.filter((_, idx) => assignments[idx] === i);
            if (clusterPoints.length > 0) {
                newCentroids[i] = calculateCentroid(clusterPoints);
            } else {
                newCentroids[i] = centroids[i]; // Keep old centroid if no points
            }
        }
        
        centroids = newCentroids;
        iterations++;
    }
    
    return { palette: centroids, assignments };
}

/**
 * Median cut color quantization
 * @param {Array} colors - Array of color objects
 * @param {number} maxColors - Maximum number of colors
 * @returns {Object} Palette and assignments
 */
function medianCutQuantization(colors, maxColors) {
    if (colors.length <= maxColors) {
        const palette = colors.map(c => ({ r: c.r, g: c.g, b: c.b }));
        const assignments = colors.map((_, i) => i);
        return { palette, assignments };
    }
    
    // Create initial bucket with all colors
    let buckets = [{ colors: [...colors], range: calculateRange(colors) }];
    
    // Split buckets until we have enough colors
    while (buckets.length < maxColors) {
        // Find bucket with largest range
        let maxRange = -1;
        let maxBucketIndex = -1;
        
        for (let i = 0; i < buckets.length; i++) {
            const range = Math.max(buckets[i].range.r, buckets[i].range.g, buckets[i].range.b);
            if (range > maxRange) {
                maxRange = range;
                maxBucketIndex = i;
            }
        }
        
        if (maxBucketIndex === -1 || maxRange === 0) break;
        
        // Split the bucket
        const splitBuckets = splitBucket(buckets[maxBucketIndex]);
        buckets.splice(maxBucketIndex, 1, ...splitBuckets);
    }
    
    // Create palette from bucket representatives
    const palette = buckets.map(bucket => calculateCentroid(bucket.colors));
    
    // Assign each original color to nearest palette color
    const assignments = new Array(colors.length);
    for (let i = 0; i < colors.length; i++) {
        let minDistance = Infinity;
        let bestPalette = 0;
        
        for (let j = 0; j < palette.length; j++) {
            const distance = colorDistance(colors[i], palette[j]);
            if (distance < minDistance) {
                minDistance = distance;
                bestPalette = j;
            }
        }
        
        assignments[i] = bestPalette;
    }
    
    return { palette, assignments };
}

/**
 * Initialize centroids using k-means++ algorithm
 * @param {Array} colors - Array of color objects
 * @param {number} k - Number of centroids
 * @returns {Array} Initial centroids
 */
function initializeCentroidsKMeansPlusPlus(colors, k) {
    const centroids = [];
    
    // Choose first centroid randomly
    centroids.push({ ...colors[Math.floor(Math.random() * colors.length)] });
    
    // Choose remaining centroids
    for (let i = 1; i < k; i++) {
        const distances = colors.map(color => {
            let minDistance = Infinity;
            for (const centroid of centroids) {
                const distance = colorDistance(color, centroid);
                minDistance = Math.min(minDistance, distance);
            }
            return minDistance * minDistance; // Square the distance
        });
        
        const totalDistance = distances.reduce((sum, d) => sum + d, 0);
        const random = Math.random() * totalDistance;
        
        let sum = 0;
        for (let j = 0; j < distances.length; j++) {
            sum += distances[j];
            if (sum >= random) {
                centroids.push({ ...colors[j] });
                break;
            }
        }
    }
    
    return centroids;
}

/**
 * Calculate centroid of a group of colors
 * @param {Array} colors - Array of color objects
 * @returns {Object} Centroid color
 */
function calculateCentroid(colors) {
    let totalWeight = 0;
    let sumR = 0, sumG = 0, sumB = 0;
    
    for (const color of colors) {
        const weight = color.count || 1;
        sumR += color.r * weight;
        sumG += color.g * weight;
        sumB += color.b * weight;
        totalWeight += weight;
    }
    
    return {
        r: Math.round(sumR / totalWeight),
        g: Math.round(sumG / totalWeight),
        b: Math.round(sumB / totalWeight)
    };
}

/**
 * Calculate color range for median cut
 * @param {Array} colors - Array of color objects
 * @returns {Object} Color range
 */
function calculateRange(colors) {
    let minR = 255, maxR = 0;
    let minG = 255, maxG = 0;
    let minB = 255, maxB = 0;
    
    for (const color of colors) {
        minR = Math.min(minR, color.r);
        maxR = Math.max(maxR, color.r);
        minG = Math.min(minG, color.g);
        maxG = Math.max(maxG, color.g);
        minB = Math.min(minB, color.b);
        maxB = Math.max(maxB, color.b);
    }
    
    return {
        r: maxR - minR,
        g: maxG - minG,
        b: maxB - minB
    };
}

/**
 * Split bucket for median cut
 * @param {Object} bucket - Bucket to split
 * @returns {Array} Two new buckets
 */
function splitBucket(bucket) {
    const { colors, range } = bucket;
    
    // Find dimension with largest range
    let dimension = 'r';
    if (range.g > range.r && range.g > range.b) dimension = 'g';
    else if (range.b > range.r && range.b > range.g) dimension = 'b';
    
    // Sort colors by chosen dimension
    colors.sort((a, b) => a[dimension] - b[dimension]);
    
    // Split at median
    const median = Math.floor(colors.length / 2);
    const bucket1Colors = colors.slice(0, median);
    const bucket2Colors = colors.slice(median);
    
    return [
        { colors: bucket1Colors, range: calculateRange(bucket1Colors) },
        { colors: bucket2Colors, range: calculateRange(bucket2Colors) }
    ];
}

/**
 * Merge similar colors based on perceptual distance
 * @param {Array} palette - Color palette
 * @param {Array} assignments - Color assignments
 * @param {number} threshold - Merge threshold (Delta E)
 * @returns {Object} Merged result
 */
function mergeSimilarColors(palette, assignments, threshold) {
    if (threshold <= 0) return { palette, assignments };
    
    const mergeMap = new Array(palette.length);
    for (let i = 0; i < palette.length; i++) {
        mergeMap[i] = i;
    }
    
    // Find colors to merge
    for (let i = 0; i < palette.length; i++) {
        for (let j = i + 1; j < palette.length; j++) {
            const deltaE = colorDistanceLab(palette[i], palette[j]);
            if (deltaE < threshold) {
                // Merge j into i
                const rootI = findRoot(mergeMap, i);
                const rootJ = findRoot(mergeMap, j);
                if (rootI !== rootJ) {
                    mergeMap[rootJ] = rootI;
                }
            }
        }
    }
    
    // Create new palette
    const newPalette = [];
    const paletteMap = new Map();
    
    for (let i = 0; i < palette.length; i++) {
        const root = findRoot(mergeMap, i);
        if (!paletteMap.has(root)) {
            paletteMap.set(root, newPalette.length);
            newPalette.push(palette[root]);
        }
    }
    
    // Update assignments
    const newAssignments = assignments.map(assignment => {
        const root = findRoot(mergeMap, assignment);
        return paletteMap.get(root);
    });
    
    return { palette: newPalette, assignments: newAssignments };
}

/**
 * Find root for union-find
 * @param {Array} parent - Parent array
 * @param {number} i - Element index
 * @returns {number} Root index
 */
function findRoot(parent, i) {
    if (parent[i] !== i) {
        parent[i] = findRoot(parent, parent[i]);
    }
    return parent[i];
}

/**
 * Create regions from quantization result
 * @param {Array} palette - Color palette
 * @param {Array} assignments - Color assignments
 * @param {ImageData} imageData - Original image data
 * @returns {Array} Array of region objects
 */
function createRegions(palette, assignments, imageData) {
    const regionCounts = new Array(palette.length).fill(0);
    const data = imageData.data;
    
    // Count pixels per region
    let colorIndex = 0;
    for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a >= 128) { // Only count non-transparent pixels
            regionCounts[assignments[colorIndex]]++;
            colorIndex++;
        }
    }
    
    // Create region objects
    return palette.map((color, index) => ({
        id: `region_${index}`,
        avgColor: rgbToHex(color.r, color.g, color.b),
        pixelCount: regionCounts[index],
        percentage: (regionCounts[index] / (imageData.width * imageData.height)) * 100
    }));
}

/**
 * Create region map for visualization
 * @param {Array} assignments - Color assignments
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {ImageData} Region map image data
 */
function createRegionMap(assignments, width, height) {
    const regionMap = new ImageData(width, height);
    const data = regionMap.data;
    
    // Color palette for regions (using distinct colors)
    const regionColors = [
        [255, 0, 0],     // Red
        [0, 255, 0],     // Green
        [0, 0, 255],     // Blue
        [255, 255, 0],   // Yellow
        [255, 0, 255],   // Magenta
        [0, 255, 255],   // Cyan
        [255, 128, 0],   // Orange
        [128, 0, 255],   // Purple
        [255, 192, 203], // Pink
        [128, 128, 128], // Gray
        [139, 69, 19],   // Brown
        [0, 128, 0]      // Dark Green
    ];
    
    let assignmentIndex = 0;
    for (let i = 0; i < data.length; i += 4) {
        const regionIndex = assignments[assignmentIndex] || 0;
        const color = regionColors[regionIndex % regionColors.length];
        
        data[i] = color[0];     // R
        data[i + 1] = color[1]; // G
        data[i + 2] = color[2]; // B
        data[i + 3] = 255;      // A
        
        assignmentIndex++;
    }
    
    return regionMap;
}

/**
 * Analyze colors in image
 * @param {Object} data - Analysis parameters
 * @returns {Object} Color analysis result
 */
function analyzeColors(data) {
    const { imageData } = data;
    const colors = extractColors(imageData);
    
    // Calculate color distribution
    const totalPixels = colors.reduce((sum, color) => sum + color.count, 0);
    const colorDistribution = colors.map(color => ({
        color: rgbToHex(color.r, color.g, color.b),
        percentage: (color.count / totalPixels) * 100,
        count: color.count
    })).sort((a, b) => b.percentage - a.percentage);
    
    // Find dominant colors (top 10)
    const dominantColors = colorDistribution.slice(0, 10);
    
    // Calculate average complexity (number of unique colors)
    const complexity = colors.length;
    
    return {
        uniqueColors: colors.length,
        totalPixels,
        dominantColors,
        colorDistribution,
        averageComplexity: complexity / (imageData.width * imageData.height) * 1000 // Normalized
    };
}

// Helper functions

/**
 * Calculate color distance using RGB Euclidean distance
 * @param {Object} color1 - First color
 * @param {Object} color2 - Second color
 * @returns {number} Distance
 */
function colorDistance(color1, color2) {
    const dr = color1.r - color2.r;
    const dg = color1.g - color2.g;
    const db = color1.b - color2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Calculate perceptual color distance using LAB color space
 * @param {Object} color1 - First color
 * @param {Object} color2 - Second color
 * @returns {number} Delta E distance
 */
function colorDistanceLab(color1, color2) {
    const lab1 = rgbToLab(color1.r, color1.g, color1.b);
    const lab2 = rgbToLab(color2.r, color2.g, color2.b);
    
    const deltaL = lab1.l - lab2.l;
    const deltaA = lab1.a - lab2.a;
    const deltaB = lab1.b - lab2.b;
    
    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * Convert RGB to LAB color space
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {Object} LAB color
 */
function rgbToLab(r, g, b) {
    // Convert RGB to XYZ
    let [x, y, z] = rgbToXyz(r, g, b);
    
    // Convert XYZ to LAB
    const xn = 95.047;
    const yn = 100.000;
    const zn = 108.883;
    
    x = x / xn;
    y = y / yn;
    z = z / zn;
    
    const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
    const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
    const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
    
    const l = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const bLab = 200 * (fy - fz);
    
    return { l, a, b: bLab };
}

/**
 * Convert RGB to XYZ color space
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {Array} XYZ color
 */
function rgbToXyz(r, g, b) {
    r = r / 255;
    g = g / 255;
    b = b / 255;
    
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    
    const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
    const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
    const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
    
    return [x * 100, y * 100, z * 100];
}

/**
 * Convert RGB to hex
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color string
 */
function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}

/**
 * Check if two arrays are equal
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {boolean} Whether arrays are equal
 */
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
} 