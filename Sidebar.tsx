import React, { useState, useRef } from 'react';
import { SimulationParams } from '../../types';
import { ParameterInput } from './ParameterInput';
import { X, ChevronDown, ChevronRight, Eye, Upload, Download } from 'lucide-react';

interface SidebarProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onLoad: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ params, setParams, isOpen, onClose, onSave, onLoad }) => {
  const [isFluidSectionOpen, setIsFluidSectionOpen] = useState(false);
  const [isVisSectionOpen, setIsVisSectionOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateParam = (key: keyof SimulationParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const triggerLoad = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 h-full w-80 bg-slate-900/95 backdrop-blur-md border-r border-slate-700 shadow-xl overflow-y-auto z-20 transition-all custom-scrollbar">
      <div className="sticky top-0 bg-slate-900/95 p-4 border-b border-slate-700 flex flex-col gap-3 z-10">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Parameters
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
            </button>
        </div>

        {/* Save/Load Controls */}
        <div className="flex gap-2">
            <button 
                onClick={onSave}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-xs text-white py-2 rounded border border-slate-600 transition"
            >
                <Download size={14} /> Save
            </button>
            <button 
                onClick={triggerLoad}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-xs text-white py-2 rounded border border-slate-600 transition"
            >
                <Upload size={14} /> Load
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json"
                onChange={onLoad}
            />
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Visualization Settings */}
        <section className="bg-slate-800/30 rounded-lg overflow-hidden border border-slate-800">
          <button 
            onClick={() => setIsVisSectionOpen(!isVisSectionOpen)}
            className="w-full flex justify-between items-center p-3 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                <Eye size={14} /> Visualization
            </h3>
            {isVisSectionOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          </button>
          
          {isVisSectionOpen && (
            <div className="p-3 space-y-1 bg-slate-900/50">
                <ParameterInput 
                    label="Container Opacity" value={params.containerOpacity} min={0} max={1} step={0.05} unit=""
                    onChange={(v) => updateParam('containerOpacity', v)} 
                />
                <ParameterInput 
                    label="Particle Count" value={params.particleCount} min={1000} max={50000} step={1000} unit="pts"
                    onChange={(v) => updateParam('particleCount', v)} 
                />
                 <ParameterInput 
                    label="Particle Size" value={params.particleSize} min={0.005} max={0.08} step={0.001} unit="m"
                    onChange={(v) => updateParam('particleSize', v)} 
                />
                 <ParameterInput 
                    label="Fluid Density Effect" value={params.densityEffect || 1} min={0.1} max={10} step={0.1} unit="x"
                    onChange={(v) => updateParam('densityEffect', v)} 
                />
            </div>
          )}
        </section>

        {/* Geometry */}
        <section>
          <h3 className="text-sm font-bold text-blue-400 mb-3 uppercase tracking-wider">Container</h3>
          
          <ParameterInput 
            label="Height (L)" value={params.containerHeight} min={0.05} max={2.0} step={0.01} unit="m"
            onChange={(v) => updateParam('containerHeight', v)} 
          />
          <ParameterInput 
            label="Radius" value={params.containerRadius} min={0.01} max={1.0} step={0.01} unit="m"
            onChange={(v) => updateParam('containerRadius', v)} 
            />
          <ParameterInput 
             label="Hot Surface Area" value={params.surfaceAreaHot} min={0.001} max={1.0} step={0.001} unit="m²"
             onChange={(v) => updateParam('surfaceAreaHot', v)} 
           />
        </section>

        {/* Temperatures */}
        <section>
          <h3 className="text-sm font-bold text-red-400 mb-3 uppercase tracking-wider">Temperatures</h3>
          <ParameterInput 
            label="Surface Temp (Ts)" value={params.tempSurface} min={200} max={1200} step={5} unit="K"
            onChange={(v) => updateParam('tempSurface', v)} 
          />
          <ParameterInput 
            label="Initial Fluid Temp (T∞)" value={params.tempFluidInitial} min={200} max={500} step={5} unit="K"
            onChange={(v) => updateParam('tempFluidInitial', v)} 
          />
          <ParameterInput 
            label="Boiling Point" value={params.boilingPoint} min={100} max={800} step={5} unit="K"
            onChange={(v) => updateParam('boilingPoint', v)} 
          />
        </section>

        {/* Fluid Properties - Collapsible */}
        <section className="bg-slate-800/30 rounded-lg overflow-hidden border border-slate-800">
          <button 
            onClick={() => setIsFluidSectionOpen(!isFluidSectionOpen)}
            className="w-full flex justify-between items-center p-3 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider">Fluid Properties</h3>
            {isFluidSectionOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          </button>
          
          {isFluidSectionOpen && (
            <div className="p-3 space-y-1 bg-slate-900/50">
                <ParameterInput 
                    label="Density (ρ)" value={params.density} min={1} max={5000} step={10} unit="kg/m³"
                    onChange={(v) => updateParam('density', v)} 
                />
                <ParameterInput 
                    label="Expansion Coeff (β)" value={params.expansionCoefficient} min={0.00001} max={0.1} step={0.00001} unit="1/K"
                    onChange={(v) => updateParam('expansionCoefficient', v)} 
                />
                <ParameterInput 
                    label="Dynamic Viscosity (μ)" value={params.viscosityDynamic} min={0.00001} max={10.0} step={0.00001} unit="Pa·s"
                    onChange={(v) => updateParam('viscosityDynamic', v)} 
                />
                <ParameterInput 
                    label="Thermal Cond. (k)" value={params.thermalConductivityFluid} min={0.01} max={50} step={0.01} unit="W/(m·K)"
                    onChange={(v) => updateParam('thermalConductivityFluid', v)} 
                />
                <ParameterInput 
                    label="Thermal Diffusivity (α)" value={params.thermalDiffusivity} min={1e-9} max={1e-3} step={1e-8} unit="m²/s"
                    onChange={(v) => updateParam('thermalDiffusivity', v)} 
                />
                <ParameterInput 
                    label="Heat Capacity (Cp)" value={params.heatCapacity} min={100} max={10000} step={100} unit="J/(kg·K)"
                    onChange={(v) => updateParam('heatCapacity', v)} 
                />
            </div>
          )}
        </section>
        
        {/* Environment */}
        <section>
           <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wider">Environment</h3>
           <ParameterInput 
            label="Gravity (g)" value={params.gravity} min={0} max={50} step={0.1} unit="m/s²"
            onChange={(v) => updateParam('gravity', v)} 
          />
           <ParameterInput 
            label="Pressure (P)" value={params.pressure} min={0.1} max={20} step={0.1} unit="atm"
            onChange={(v) => updateParam('pressure', v)} 
          />
        </section>
      </div>
    </div>
  );
};