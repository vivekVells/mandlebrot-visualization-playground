import React, { useEffect, useRef, useState } from 'react';

const SimpleMandelbrotViz = () => {
  const canvasRef = useRef(null);
  const [width] = useState(800);  // Doubled the size
  const [height] = useState(600);
  const [maxIter, setMaxIter] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: -0.5, y: 0 });  // Default center point
  
  const calculatePoint = (x, y) => {
    // Convert pixel coordinates to complex plane coordinates with zoom and center
    const x0 = ((x / width) * 3.5 - 2.5) / zoom + center.x;
    const y0 = ((y / height) * 2.0 - 1.0) / zoom + center.y;
    
    let xi = 0;
    let yi = 0;
    let iter = 0;
    
    while (iter < maxIter && (xi * xi + yi * yi) <= 4) {
      const tmp = xi * xi - yi * yi + x0;
      yi = 2 * xi * yi + y0;
      xi = tmp;
      iter++;
    }
    
    return iter;
  };

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert click coordinates to complex plane coordinates
    const newCenterX = ((x / width) * 3.5 - 2.5) / zoom + center.x;
    const newCenterY = ((y / height) * 2.0 - 1.0) / zoom + center.y;
    
    setCenter({ x: newCenterX, y: newCenterY });
    setZoom(zoom * 2);  // Double zoom on click
  };

  const handleReset = () => {
    setZoom(1);
    setCenter({ x: -0.5, y: 0 });
    setMaxIter(50);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const iter = calculatePoint(x, y);
        const isInSet = iter === maxIter;
        const pixelIndex = (y * width + x) * 4;

        if (isInSet) {
          data[pixelIndex] = 0;
          data[pixelIndex + 1] = 0;
          data[pixelIndex + 2] = 0;
        } else {
          const hue = (iter * 10) % 360;
          const rgb = hslToRgb(hue/360, 0.7, 0.5);
          data[pixelIndex] = rgb[0];
          data[pixelIndex + 1] = rgb[1];
          data[pixelIndex + 2] = rgb[2];
        }
        data[pixelIndex + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [zoom, center, maxIter]);

  const hslToRgb = (h, s, l) => {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Simple Mandelbrot Set Visualization</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              onClick={handleCanvasClick}
              className="border border-gray-300 rounded-lg shadow-lg cursor-pointer"
              title="Click to zoom in at point"
            />
            <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded-lg shadow">
              <p className="text-sm mb-2">Current Zoom: {zoom}x</p>
              <button
                onClick={handleReset}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Reset View
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm text-center text-gray-600">
            Click anywhere on the image to zoom in at that point
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="font-bold text-lg mb-4">Controls</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Max Iterations: {maxIter}
                </label>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={maxIter}
                  onChange={(e) => setMaxIter(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="font-bold text-lg mb-4">Color Explanation</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-black mr-3 rounded"></div>
                <span>Inside Set (numbers stay small)</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-500 mr-3 rounded"></div>
                <span>Outside Set - Numbers grow quickly</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-red-500 mr-3 rounded"></div>
                <span>Outside Set - Numbers grow slowly</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="font-bold text-lg mb-4">Points Example</h3>
            <div className="space-y-2 text-sm">
              <p>Point (0.2, 0): Stays bounded (black)</p>
              <p>Point (2, 0): Grows beyond bound quickly (light color)</p>
              <p>Point (-0.5, 0.5): Grows beyond bound slowly (darker color)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMandelbrotViz;