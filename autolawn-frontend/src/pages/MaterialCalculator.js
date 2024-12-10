// src/pages/MaterialCalculator.js
import React, { useState, useEffect } from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import Header from '../components/Header'; // Ensure correct path

// A small InfoTooltip component
const InfoTooltip = ({ text }) => (
  <div className="relative inline-block group">
    <FaInfoCircle className="ml-1 text-gray-400 cursor-pointer" />
    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-sm p-2 rounded shadow-lg w-48">
      {text}
    </div>
  </div>
);

const recurrenceSettings = {
  'Weekly': { intervalDays: 7, bufferDays: 4 },
  'Bi-weekly': { intervalDays: 14, bufferDays: 10 },
  'Monthly': { intervalDays: 30, bufferDays: 20 },
};

const MaterialCalculator = () => {
  const [material, setMaterial] = useState('mulch');
  const [shape, setShape] = useState('rectangle');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [radius, setRadius] = useState('');
  const [area, setArea] = useState('');
  const [depth, setDepth] = useState(3);
  const [costPerUnit, setCostPerUnit] = useState('');
  const [result, setResult] = useState(null);

  const calculate = () => {
    const areaNum = parseFloat(area);
    const costNum = parseFloat(costPerUnit);
    if (isNaN(areaNum) || areaNum <= 0) {
      setResult({ error: 'Please provide a valid area.' });
      return;
    }

    const depthFeet = depth / 12;
    const volumeCubicFeet = areaNum * depthFeet;
    const volumeCubicYards = volumeCubicFeet / 27;

    let unitsNeeded;
    let unitType;
    switch (material) {
      case 'mulch':
        unitsNeeded = Math.ceil(volumeCubicYards * (27 / 2)); 
        unitType = 'bags';
        break;
      case 'rock':
        unitsNeeded = (volumeCubicYards * 1.4).toFixed(2);
        unitType = 'tons';
        break;
      case 'topsoil':
      default:
        unitsNeeded = volumeCubicYards.toFixed(2);
        unitType = 'cubic yards';
        break;
    }

    let totalCost = null;
    if (!isNaN(costNum) && costNum > 0) {
      totalCost = (costNum * parseFloat(unitsNeeded)).toFixed(2);
    }

    setResult({
      volumeCubicYards: volumeCubicYards.toFixed(2),
      unitsNeeded,
      unitType,
      totalCost,
    });
  };

  useEffect(() => {
    calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material, area, depth, costPerUnit]);

  useEffect(() => {
    if (shape === 'rectangle') {
      const l = parseFloat(length);
      const w = parseFloat(width);
      if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0) {
        setArea((l * w).toFixed(2));
      } else {
        setArea('');
      }
    } else if (shape === 'circle') {
      const r = parseFloat(radius);
      if (!isNaN(r) && r > 0) {
        const a = Math.PI * r * r;
        setArea(a.toFixed(2));
      } else {
        setArea('');
      }
    }
  }, [shape, length, width, radius]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />
      <div className="flex flex-col justify-center items-center p-6 flex-grow">
        <div className="bg-gray-800 p-8 rounded shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-white mb-4 text-center">Material Calculator</h1>
          <p className="text-gray-300 mb-6 text-center">
            Estimate how much mulch, rock, or topsoil you need and approximate cost.
          </p>

          {/* Material Selection */}
          <div className="mb-4">
            <label className="block text-white mb-2 flex items-center">
              Material <InfoTooltip text="Select the type of material you're using (mulch, rock, topsoil)." />
            </label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded"
            >
              <option value="mulch">Mulch</option>
              <option value="rock">Rock/Gravel</option>
              <option value="topsoil">Topsoil</option>
            </select>
          </div>

          {/* Shape Selection */}
          <div className="mb-4">
            <label className="block text-white mb-2 flex items-center">
              Area Shape <InfoTooltip text="Choose the shape of the area. For rectangles, enter length & width. For circles, enter radius." />
            </label>
            <select
              value={shape}
              onChange={(e) => setShape(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded"
            >
              <option value="rectangle">Rectangle</option>
              <option value="circle">Circle</option>
            </select>
          </div>

          {shape === 'rectangle' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white mb-1">Length (ft)</label>
                <input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full bg-gray-700 text-white p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-white mb-1">Width (ft)</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full bg-gray-700 text-white p-2 rounded"
                />
              </div>
            </div>
          )}

          {shape === 'circle' && (
            <div className="mb-4">
              <label className="block text-white mb-1">Radius (ft)</label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded"
              />
            </div>
          )}

          {/* Computed area display */}
          <div className="mb-4">
            <label className="block text-white mb-1 flex items-center">
              Area (sq ft) <InfoTooltip text="Calculated from the chosen shape and dimensions." />
            </label>
            <input
              type="text"
              value={area}
              readOnly
              className="w-full bg-gray-700 text-white p-2 rounded opacity-75"
            />
          </div>

          {/* Depth Slider */}
          <div className="mb-4">
            <label className="block text-white mb-1 flex items-center">
              Depth (inches) <InfoTooltip text="Select the material depth in inches. The deeper the fill, the more material needed." />
            </label>
            <input
              type="range"
              min="1"
              max="12"
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <p className="text-gray-300 mt-1">{depth} inches</p>
          </div>

          {/* Cost per unit */}
          <div className="mb-4">
            <label className="block text-white mb-1 flex items-center">
              Cost per unit <InfoTooltip text="If mulch: cost per bag, rock: cost per ton, topsoil: cost per cubic yard. Optional if cost unknown." />
            </label>
            <input
              type="number"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded"
              placeholder="Optional"
            />
          </div>

          {/* Results */}
          {result && (
            <div className="mt-6 bg-gray-700 p-4 rounded">
              {result.error && <p className="text-red-400">{result.error}</p>}
              {!result.error && (
                <>
                  <h2 className="text-xl font-semibold text-white mb-2">Results</h2>
                  <p className="text-gray-300 mb-1">
                    Volume: {result.volumeCubicYards} cubic yards
                  </p>
                  <p className="text-gray-300 mb-1">
                    {result.unitsNeeded} {result.unitType} needed
                  </p>
                  {result.totalCost && (
                    <p className="text-gray-300">
                      Estimated Cost: ${result.totalCost}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialCalculator;
