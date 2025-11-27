import React from 'react';
import { ComputedValues } from '../../types';
import { Activity, Thermometer, Wind, Zap, X } from 'lucide-react';

interface StatsPanelProps {
  data: ComputedValues;
  isOpen: boolean;
  onClose: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ data, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 w-72 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl p-4 shadow-2xl z-10 max-h-[80vh] overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700 sticky top-0 bg-slate-900/95 -mx-2 px-2 py-1">
        <h3 className="font-bold text-white flex items-center gap-2">
            <Activity size={18} className="text-blue-400" />
            Live Data
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
            <StatRow 
                label="Rayleigh Number (Ra)" 
                value={data.rayleigh.toExponential(2)} 
                icon={<Wind size={14} className="text-green-400"/>}
                desc="Drive for convection vs diffusion"
            />
            <StatRow 
                label="Nusselt Number (Nu)" 
                value={data.nusselt.toFixed(2)} 
                icon={<Wind size={14} className="text-yellow-400"/>}
                desc="Convective vs Conductive heat transfer"
            />
             <StatRow 
                label="Prandtl Number (Pr)" 
                value={data.prandtl.toFixed(2)} 
                icon={<Wind size={14} className="text-purple-400"/>}
                desc="Momentum diffusivity / Thermal diffusivity"
            />
        </div>

        <div className="h-px bg-slate-700" />

        <div className="grid grid-cols-1 gap-2">
            <StatRow 
                label="Heat Transfer Rate (q)" 
                value={`${data.heatTransferRate.toFixed(2)} W`} 
                icon={<Zap size={14} className="text-red-400"/>}
            />
             <StatRow 
                label="Avg Fluid Temp" 
                value={`${data.avgFluidTemp.toFixed(1)} K`} 
                icon={<Thermometer size={14} className="text-blue-400"/>}
            />
        </div>

        <div className="mt-2 p-2 bg-slate-800 rounded border border-slate-600">
            <span className="text-xs text-slate-400 block mb-1">Current Regime</span>
            <span className={`text-sm font-bold ${
                data.flowRegime.includes('Turbulent') ? 'text-red-400' : 'text-green-400'
            }`}>
                {data.flowRegime}
            </span>
        </div>
      </div>
    </div>
  );
};

const StatRow: React.FC<{label: string, value: string, icon: React.ReactNode, desc?: string}> = ({label, value, icon, desc}) => (
    <div>
        <div className="flex justify-between items-center">
            <span className="text-xs text-slate-300 flex items-center gap-2">{icon} {label}</span>
            <span className="text-sm font-mono font-semibold text-white">{value}</span>
        </div>
        {desc && <div className="text-[10px] text-slate-500 italic mt-0.5">{desc}</div>}
    </div>
);