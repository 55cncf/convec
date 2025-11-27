import React from 'react';

interface ColorLegendProps {
  minTemp: number;
  maxTemp: number;
  isVisible: boolean;
}

export const ColorLegend: React.FC<ColorLegendProps> = ({ minTemp, maxTemp, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-[28rem] right-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-xl shadow-xl z-10 flex flex-col items-center w-72 transition-all duration-300">
      <div className="flex justify-between w-full text-xs font-mono font-bold mb-1">
          <span className="text-blue-400">{minTemp.toFixed(0)} K</span>
          <span className="text-slate-400">Temp Gradient</span>
          <span className="text-red-400">{maxTemp.toFixed(0)} K</span>
      </div>
      
      <div className="w-full h-4 rounded-full border border-slate-600 relative overflow-hidden">
         {/* Gradient matches the shader: Blue -> Cyan -> Green -> Yellow -> Red */}
         <div 
           className="absolute inset-0" 
           style={{
             background: 'linear-gradient(to right, #1a4dff 0%, #33ccff 25%, #33ff33 50%, #ffff33 75%, #ff331a 100%)'
           }} 
         />
      </div>
    </div>
  );
};
