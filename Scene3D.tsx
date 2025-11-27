import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Environment } from '@react-three/drei';
import { FluidSystem } from './FluidParticles'; // Updated import
import { Container } from './CylinderContainer';
import { SimulationParams, ComputedValues } from '../../types';

interface Scene3DProps {
  params: SimulationParams;
  computed: ComputedValues;
  isPlaying: boolean;
  showHeatMap: boolean;
  resetKey?: number;
}

export const Scene3D: React.FC<Scene3DProps> = ({ 
  params, 
  computed, 
  isPlaying,
  showHeatMap, 
  resetKey = 0
}) => {
  return (
    <div className="w-full h-full bg-slate-900 relative">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0.5, 0.5, 0.8]} fov={45} />
        <OrbitControls 
          enablePan={true} 
          minDistance={0.2} 
          maxDistance={3}
          target={[0, 0, 0]}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
        <pointLight position={[-10, -5, -10]} intensity={0.5} color="#blue" />
        <Environment preset="studio" />

        {/* Scene Objects */}
        <group position={[0, 0, 0]}>
          <Container 
            params={params} 
            showHeatMap={showHeatMap}
            computedHeat={computed.heatTransferRate} 
          />
          {/* Key forces remount on reset or particle count change */}
          <FluidSystem 
            key={`${params.particleCount}-${resetKey}`}
            params={params} 
            computed={computed}
            isPlaying={isPlaying}
            showHeatMap={showHeatMap}
          />
        </group>

        {/* Helpers */}
        <Grid 
          position={[0, -params.containerHeight/2 - 0.05, 0]} 
          args={[10.5, 10.5]} 
          cellColor="#475569" 
          sectionColor="#64748b" 
          fadeDistance={3}
        />
      </Canvas>
    </div>
  );
};