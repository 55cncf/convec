import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/UI/Sidebar';
import { StatsPanel } from './components/UI/StatsPanel';
import { AIChat } from './components/UI/AIChat';
import { PlaybackControls } from './components/UI/PlaybackControls';
import { ColorLegend } from './components/UI/ColorLegend';
import { Scene3D } from './components/Simulation/Scene3D';
import { DEFAULT_PARAMS } from './constants';
import { SimulationParams, ComputedValues } from './types';
import { Settings, Flame, Activity, Bot } from 'lucide-react';

function App() {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isStatsOpen, setStatsOpen] = useState(true);
  const [isChatOpen, setChatOpen] = useState(false);
  
  // State
  const [isPlaying, setIsPlaying] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  
  // Visual Toggles
  const [showHeatMap, setShowHeatMap] = useState(true); 

  // Physics Engine / Live Calculations
  const computed = useMemo<ComputedValues>(() => {
    // 1. Calculate Prandtl Number (Pr)
    const kinematicViscosity = params.viscosityDynamic / params.density;
    const prandtl = kinematicViscosity / params.thermalDiffusivity;

    // 2. Calculate Rayleigh Number (Ra)
    const deltaT = Math.max(0, params.tempSurface - params.tempFluidInitial);
    // Characteristic length = Height for enclosure convection
    const rayleigh = (
      params.gravity * 
      params.expansionCoefficient * 
      deltaT * 
      Math.pow(params.containerHeight, 3)
    ) / (kinematicViscosity * params.thermalDiffusivity);

    // 3. Determine Flow Regime and Nusselt
    let nusselt = 1;
    let flowRegime: ComputedValues['flowRegime'] = 'Conductive';
    let fluidState: ComputedValues['fluidState'] = 'liquid';

    // Phase Change Check
    // We estimate average internal temp. If near bottom (hot surface) > boiling, we might get boiling.
    const estimatedInternalTemp = params.tempFluidInitial + (deltaT * 0.4);
    
    if (estimatedInternalTemp >= params.boilingPoint || params.tempSurface > params.boilingPoint) {
        fluidState = 'gas';
        flowRegime = 'Boiling / Phase Change';
        // Boiling dramatically increases heat transfer
        nusselt = 100 + (Math.max(estimatedInternalTemp, params.tempSurface) - params.boilingPoint) * 10; 
    } else {
        // Standard Liquid Convection
        if (rayleigh > 1708) {
            // Churchill-Bernstein or similar correlation for natural convection
            const numerator = 0.387 * Math.pow(Math.abs(rayleigh), 1/6);
            const denominator = Math.pow(1 + Math.pow(0.492 / prandtl, 9/16), 8/27);
            nusselt = Math.pow(0.825 + numerator / denominator, 2);
            flowRegime = rayleigh > 1e9 ? 'Turbulent Convection' : 'Laminar Convection';
        } else {
            nusselt = 1;
            flowRegime = 'Conductive';
        }
    }

    // 4. Heat Transfer Coefficient (h) = (k / L) * Nu
    const h = (params.thermalConductivityFluid / params.containerHeight) * nusselt;

    // 5. Heat Transfer Rate (q) = h * A * deltaT
    const q = h * params.surfaceAreaHot * deltaT;

    return {
      rayleigh,
      prandtl,
      nusselt,
      heatTransferCoeff: h,
      heatTransferRate: q,
      avgFluidTemp: estimatedInternalTemp,
      flowRegime,
      fluidState
    };
  }, [params]);

  const handleReset = () => {
      setParams(DEFAULT_PARAMS);
      setResetKey(prev => prev + 1);
      setIsPlaying(false);
      setTimeout(() => setIsPlaying(true), 100);
  };

  const handleSaveSimulation = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(params, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "thermosim_config.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLoadSimulation = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (e.target?.result) {
          const loadedParams = JSON.parse(e.target.result as string);
          // Basic validation to ensure it looks like params
          if (loadedParams.containerRadius && loadedParams.gravity) {
            setParams(prev => ({ ...prev, ...loadedParams }));
            // We don't force a full resetKey here to allow parameters to just update, 
            // but if the user wants to restart they can click reset.
            // However, resetting the Play state helps stability.
            setIsPlaying(false);
            setTimeout(() => setIsPlaying(true), 100);
          } else {
            alert("Invalid configuration file.");
          }
        }
      } catch (err) {
        console.error("Error parsing JSON:", err);
        alert("Failed to load file.");
      }
    };
    reader.readAsText(file);
    // Clear input so same file can be selected again
    event.target.value = ''; 
  };

  return (
    <div className="w-screen h-screen relative flex overflow-hidden bg-slate-900">
      {/* Sidebar Controls */}
      <Sidebar 
        params={params} 
        setParams={setParams} 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onSave={handleSaveSimulation}
        onLoad={handleLoadSimulation}
      />

      {/* Main Viewport */}
      <main className="flex-1 relative h-full">
        
        {/* Top Bar Controls */}
        <div className="absolute top-4 left-4 z-20 flex gap-2 flex-wrap max-w-[80vw]">
           {!isSidebarOpen && (
               <button 
                onClick={() => setSidebarOpen(true)}
                className="bg-slate-800 p-2 rounded-lg text-white border border-slate-700 hover:bg-slate-700 shadow-lg"
                title="Open Settings"
               >
                   <Settings size={20} />
               </button>
           )}
           
           <div className="bg-slate-900/80 backdrop-blur rounded-lg border border-slate-700 p-1 flex items-center gap-1 shadow-lg">
              <ToggleBtn 
                 active={showHeatMap} 
                 onClick={() => setShowHeatMap(!showHeatMap)} 
                 icon={<Flame size={16} />}
                 label="Heat Map"
              />
              <div className="w-px h-4 bg-slate-700 mx-1" />
              <ToggleBtn 
                 active={isStatsOpen} 
                 onClick={() => setStatsOpen(!isStatsOpen)} 
                 icon={<Activity size={16} />}
                 label="Live Data"
              />
              <div className="w-px h-4 bg-slate-700 mx-1" />
              <ToggleBtn 
                 active={isChatOpen} 
                 onClick={() => setChatOpen(!isChatOpen)} 
                 icon={<Bot size={16} />}
                 label="AI Lab Assistant"
              />
           </div>
        </div>

        {/* 3D Scene */}
        <Scene3D 
           params={params} 
           computed={computed}
           isPlaying={isPlaying}
           showHeatMap={showHeatMap}
           resetKey={resetKey}
        />

        {/* Playback Controls */}
        <PlaybackControls 
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onReset={handleReset}
        />

        {/* Live Data Overlay */}
        <StatsPanel 
            data={computed} 
            isOpen={isStatsOpen} 
            onClose={() => setStatsOpen(false)} 
        />
        
        {/* Color Heat Map Legend (Positioned under Stats Panel) */}
        <ColorLegend 
           minTemp={params.tempFluidInitial} 
           maxTemp={params.tempSurface} 
           isVisible={showHeatMap && isStatsOpen}
        />

        {/* AI Chat */}
        <AIChat 
            params={params}
            setParams={setParams}
            computed={computed}
            isOpen={isChatOpen} 
            onClose={() => setChatOpen(false)}
        />
      </main>
    </div>
  );
}

const ToggleBtn = ({active, onClick, icon, label}: {active: boolean, onClick: () => void, icon: React.ReactNode, label: string}) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
    >
        {icon}
        {label}
    </button>
)

export default App;