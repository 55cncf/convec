
import React from 'react';
import { SimulationParams } from '../../types';
import * as THREE from 'three';

interface ContainerProps {
  params: SimulationParams;
  showHeatMap: boolean;
  computedHeat: number;
}

export const Container: React.FC<ContainerProps> = ({ params, showHeatMap, computedHeat }) => {
  return (
    <group>
      {/* Glass Walls */}
      {params.containerOpacity > 0 && (
        <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[params.containerRadius, params.containerRadius, params.containerHeight, 32, 1, true]} />
            <meshPhysicalMaterial 
            color="#aaddff"
            opacity={params.containerOpacity} 
            transparent 
            roughness={0.1}
            metalness={0.1}
            side={THREE.DoubleSide}
            transmission={0.9} // Glass-like
            thickness={0.005}
            depthWrite={false} // Helps with particle transparency
            />
        </mesh>
      )}

      {/* Bottom Rim / Base Visual */}
      <mesh position={[0, -params.containerHeight / 2 - 0.002, 0]} rotation={[0, 0, 0]}>
         <cylinderGeometry args={[params.containerRadius + 0.005, params.containerRadius + 0.005, 0.005, 32]} />
         <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Hot Plate (Bottom Surface) */}
      <mesh position={[0, -params.containerHeight / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[params.containerRadius * 0.98, 32]} />
        <meshStandardMaterial 
          color={showHeatMap ? "#ef4444" : "#333"} 
          emissive="#ef4444"
          emissiveIntensity={Math.min(computedHeat / 100, 2)} 
        />
      </mesh>
    </group>
  );
};
