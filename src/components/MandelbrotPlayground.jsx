import React, { useState, useEffect, useCallback } from 'react';
import { Card, Tabs, Slider, Button, Table } from 'antd';

const MandelbrotPlayground = () => {
  const [zoom, setZoom] = useState(1);
  const [maxIterations, setMaxIterations] = useState(138);
  const [centerX, setCenterX] = useState(-0.5);
  const [centerY, setCenterY] = useState(0);
  const [imageData, setImageData] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState({ x: 0.2, y: 0 });
  const [iterationSteps, setIterationSteps] = useState([]);
  const [playgroundMode, setPlaygroundMode] = useState('explore');

  // Mandelbrot calculation for a single point
  const calculatePoint = useCallback((x0, y0, maxIter) => {
    let xi = 0;
    let yi = 0;
    let steps = [];
    let i = 0;

    while (i < maxIter && (xi * xi + yi * yi) <= 4) {
      steps.push({
        iteration: i,
        x: xi,
        y: yi,
        magnitude: Math.sqrt(xi * xi + yi * yi)
      });
      
      const tmp = xi * xi - yi * yi + x0;
      yi = 2 * xi * yi + y0;
      xi = tmp;
      i++;
    }

    return {
      steps,
      escaped: i < maxIter,
      finalIteration: i
    };
  }, []);

  // Main Mandelbrot set generation
  const generateMandelbrot = useCallback((width, height, maxIter) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    const imgData = ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const x0 = (x - width / 2) * (3.5 / width) / zoom + centerX;
        const y0 = (y - height / 2) * (2.0 / height) / zoom + centerY;
        
        const result = calculatePoint(x0, y0, maxIter);
        const idx = (y * width + x) * 4;
        const color = getColor(result.finalIteration, maxIter);
        
        imgData.data[idx] = color[0];     // R
        imgData.data[idx + 1] = color[1]; // G
        imgData.data[idx + 2] = color[2]; // B
        imgData.data[idx + 3] = 255;      // A (fully opaque)
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
  }, [calculatePoint, centerX, centerY, zoom]);

  const getColor = (iteration, maxIter) => {
    if (iteration === maxIter) return [0, 0, 0]; // Inside set color
    
    const percentage = (iteration * 100) / maxIter;
    
    if (percentage < 33) {
      const intensity = Math.floor((percentage / 33) * 255);
      return [255 - intensity, 255 - intensity, 255];
    } else if (percentage < 66) {
      const intensity = Math.floor(((percentage - 33) / 33) * 255);
      return [intensity, 0, 255 - intensity];
    } else {
      const intensity = Math.floor(((percentage - 66) / 34) * 255);
      return [255, intensity, 0];
    }
  };

  // Handle image click
  const handleImageClick = (event) => {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    const clickX = centerX + (x - width / 2) * (3.5 / width) / zoom;
    const clickY = centerY + (y - height / 2) * (2.0 / height) / zoom;

    if (playgroundMode === 'explore') {
      setCenterX(clickX);
      setCenterY(clickY);
      setZoom(zoom * 2);
    } else {
      setSelectedPoint({ x: clickX, y: clickY });
    }
  };

  // Reset view to initial state
  const resetView = () => {
    setCenterX(-0.5);
    setCenterY(0);
    setZoom(1);
  };

  useEffect(() => {
    const result = calculatePoint(selectedPoint.x, selectedPoint.y, maxIterations);
    setIterationSteps(result.steps);
  }, [selectedPoint, maxIterations, calculatePoint]);

  useEffect(() => {
    const newImageData = generateMandelbrot(800, 600, maxIterations);
    setImageData(newImageData);
  }, [generateMandelbrot, maxIterations]);

  const iterationColumns = [
    { title: 'Iteration', dataIndex: 'iteration', key: 'iteration' },
    { title: 'Value', dataIndex: 'value', key: 'value',
      render: (_, record) => `${record.x.toFixed(4)} + ${record.y.toFixed(4)}i`
    },
    { title: 'Magnitude', dataIndex: 'magnitude', key: 'magnitude',
      render: magnitude => magnitude.toFixed(4)
    },
  ];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Card title="Mandelbrot Set Playground" bordered={false} style={{ width: '100%', maxWidth: 960 }}>
        <Tabs activeKey={playgroundMode} onChange={setPlaygroundMode} centered>
          <Tabs.TabPane tab="Explore Mode" key="explore">
            <p style={{ textAlign: 'center', marginBottom: 16 }}>
              Click to zoom into any interesting area
            </p>
          </Tabs.TabPane>
          <Tabs.TabPane tab="Learning Mode" key="learn">
            <p style={{ textAlign: 'center', marginBottom: 16 }}>
              Click any point to see how its sequence behaves  
            </p>
          </Tabs.TabPane>
        </Tabs>

        <div style={{ position: 'relative' }}>
          <img 
            src={imageData}
            alt="Mandelbrot Set"
            onClick={handleImageClick}
            style={{ width: '100%', borderRadius: 4, cursor: 'pointer' }}
          />

          <div style={{ 
            position: 'absolute', 
            top: 16, 
            right: 16,
            backgroundColor: 'white',
            padding: 16,
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}>
            <p style={{ marginBottom: 8 }}>Current Zoom: {zoom}x</p>
            <Button type="primary" onClick={(e) => { e.stopPropagation(); resetView(); }}>
              Reset View  
            </Button>
          </div>
        </div>

        {playgroundMode === 'learn' && (
          <Card title="Point Analysis" bordered={false} style={{ marginTop: 24 }}>
            <p>Selected Point: ({selectedPoint.x.toFixed(3)}, {selectedPoint.y.toFixed(3)})</p>
            <Table
              columns={iterationColumns}
              dataSource={iterationSteps}
              pagination={false}
              style={{ marginTop: 16 }}
            />
          </Card>
        )}

        <h3 style={{ marginTop: 32 }}>Controls</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span>Max Iterations: {maxIterations}</span>
          <Slider
            value={maxIterations}
            onChange={setMaxIterations}
            min={50}
            max={1000}
            style={{ width: 300 }}
          />
        </div>
      </Card>

      <Card title="Quick Guide" bordered={false} style={{ width: '100%', maxWidth: 960, marginTop: 24 }}>
        <h4>What am I looking at?</h4>
        <p style={{ marginBottom: 16 }}>
          The Mandelbrot set is a mathematical object that shows which points produce bounded 
          sequences under iteration. Black regions represent points that stay bounded, while 
          colored regions show how quickly points escape to infinity.
        </p>

        <h4>How to use this playground:</h4>
        <ul style={{ marginBottom: 16 }}>
          <li><strong>Explore Mode:</strong> Click anywhere to zoom in and explore the fractal's infinite detail.</li>
          <li><strong>Learning Mode:</strong> Click points to see how their sequences behave step by step.</li>
          <li><strong>Max Iterations:</strong> Adjust to see more detail in the boundary regions.</li>
        </ul>

        <h4>Color Guide:</h4>
        <ul>
          <li><span style={{backgroundColor: 'black', width: 12, height: 12, display: 'inline-block', marginRight: 8}}></span> Inside Set (sequence stays bounded)</li>
          <li><span style={{backgroundColor: '#1890ff', width: 12, height: 12, display: 'inline-block', marginRight: 8}}></span> Outside Set - Escapes quickly</li>
          <li><span style={{backgroundColor: '#f5222d', width: 12, height: 12, display: 'inline-block', marginRight: 8}}></span> Outside Set - Escapes slowly</li>
        </ul>
      </Card>
    </div>
  );
};

export default MandelbrotPlayground;