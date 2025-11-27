import React from 'react';

interface ParameterInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}

export const ParameterInput: React.FC<ParameterInputProps> = ({
  label, value, onChange, min, max, step, unit
}) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-medium text-slate-300">{label}</label>
        <span className="text-xs text-blue-400 font-mono">{value.toFixed(step < 0.01 ? 4 : 2)} {unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={value} 
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <input 
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-16 bg-slate-800 border border-slate-700 rounded px-1 text-xs text-white"
        />
      </div>
    </div>
  );
};
