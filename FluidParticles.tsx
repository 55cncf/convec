import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SimulationParams, ComputedValues } from '../../types';

interface FluidSystemProps {
  params: SimulationParams;
  computed: ComputedValues;
  isPlaying: boolean;
  showHeatMap: boolean;
}

// Reusable color objects
const _c1 = new THREE.Color();
const _cBlue = new THREE.Color(0.1, 0.3, 1.0);   // Cold
const _cCyan = new THREE.Color(0.2, 0.8, 0.9);   // Cool
const _cGreen = new THREE.Color(0.2, 0.9, 0.3);  // Medium
const _cYellow = new THREE.Color(0.9, 0.9, 0.2); // Warm
const _cRed = new THREE.Color(1.0, 0.2, 0.1);    // Hot
const _cGlow = new THREE.Color(1.0, 1.0, 1.0);   // Conduction White Glow
const _cGas = new THREE.Color(0.95, 0.95, 1.0);  // Gas/Steam

export const FluidSystem: React.FC<FluidSystemProps> = ({ params, computed, isPlaying, showHeatMap }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Simulation State Ref for smooth parameter transitions
  const simState = useRef({
    tempSurface: params.tempSurface,
    tempFluidInitial: params.tempFluidInitial,
    gravity: params.gravity,
    viscosity: params.viscosityDynamic,
    expansion: params.expansionCoefficient,
    diffusivity: params.thermalDiffusivity,
    density: params.density,
    avgSystemTemp: params.tempFluidInitial,
  });

  // Initialize Particles
  const { positions, velocities, temperatures, colors, state, meta } = useMemo(() => {
    const count = params.particleCount;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const temp = new Float32Array(count);
    const cols = new Float32Array(count * 3);
    const st = new Uint8Array(count); // 0=liquid, 1=gas
    const m = new Float32Array(count); // mass/variance

    for (let i = 0; i < count; i++) {
        // Cylindrical distribution
        // Prevent r=0 exactly to avoid NaN issues later
        const r = Math.max(0.001, Math.sqrt(Math.random()) * params.containerRadius * 0.9);
        const theta = Math.random() * 2 * Math.PI;
        
        pos[i * 3] = r * Math.cos(theta);
        pos[i * 3 + 1] = (Math.random() - 0.5) * params.containerHeight;
        pos[i * 3 + 2] = r * Math.sin(theta);

        // Initial Temp
        temp[i] = params.tempFluidInitial;
        
        // Random variance (0.8 - 1.2) for stochastic behavior
        m[i] = 0.8 + Math.random() * 0.4;
    }

    return { 
        positions: pos, 
        velocities: vel, 
        temperatures: temp, 
        colors: cols,
        state: st,
        meta: m
    };
  }, [params.particleCount, params.containerRadius, params.containerHeight]);

  // Texture generation
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        // Softer glow texture
        const g = ctx.createRadialGradient(32,32,0, 32,32,32);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.4, 'rgba(255,255,255,0.4)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,64,64);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current || !isPlaying) return;

    const dt = Math.min(delta, 0.05); // Cap time step
    const s = simState.current;
    
    // --- 1. Smooth Parameter Interpolation ---
    const lerpRate = 0.05; 
    s.tempSurface = THREE.MathUtils.lerp(s.tempSurface, params.tempSurface, lerpRate);
    s.tempFluidInitial = THREE.MathUtils.lerp(s.tempFluidInitial, params.tempFluidInitial, lerpRate);
    s.gravity = THREE.MathUtils.lerp(s.gravity, params.gravity, lerpRate);
    s.viscosity = THREE.MathUtils.lerp(s.viscosity, params.viscosityDynamic, lerpRate);
    s.expansion = THREE.MathUtils.lerp(s.expansion, params.expansionCoefficient, lerpRate);
    s.diffusivity = THREE.MathUtils.lerp(s.diffusivity, params.thermalDiffusivity, lerpRate);
    s.density = THREE.MathUtils.lerp(s.density, params.density, lerpRate);

    // --- 2. Physics Constants ---
    const halfH = params.containerHeight / 2;
    const radius = params.containerRadius;
    
    // Density & Drag
    const densityFactor = params.densityEffect || 1.0;
    // Safety clamp for density to avoid divide by zero
    const safeDensity = Math.max(1, s.density);
    const inertiaFactor = Math.max(0.01, safeDensity * 0.001 * densityFactor); 

    // Stokes Drag Approximation
    const dragCoeff = (s.viscosity * 100) / inertiaFactor;
    // Clamp drag factor to prevent instability
    const dragFactor = Math.max(0.0, Math.min(0.999, 1.0 - (dragCoeff * dt)));

    // Thermal
    const thermalRate = s.diffusivity * 80000; 
    
    // Global Average Temp Calculation
    let sumT = 0;
    const count = params.particleCount;
    for(let k=0; k<count; k++) sumT += temperatures[k];
    const frameAvgT = sumT / count;
    s.avgSystemTemp = THREE.MathUtils.lerp(s.avgSystemTemp, frameAvgT, 0.1);
    const avgT = s.avgSystemTemp;

    const canConvect = computed.rayleigh > 1000;
    
    // Limit max velocity to prevent explosions
    const MAX_VELOCITY = 10.0;

    // --- 3. Main Particle Loop ---
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      let x = positions[idx];
      let y = positions[idx + 1];
      let z = positions[idx + 2];
      
      const r = Math.sqrt(x*x + z*z);
      
      // -- A. Thermal Physics --
      const distToSurface = (y + halfH); // 0 at bottom
      const distToWall = radius - r;
      
      // Heat Source (Bottom) - Conduction
      if (distToSurface < 0.02) {
        const contactFactor = Math.max(0, 1 - (distToSurface / 0.02));
        temperatures[i] = THREE.MathUtils.lerp(temperatures[i], s.tempSurface, thermalRate * 20 * contactFactor * dt);
      }
      
      // Cooling (Walls & Top)
      if (distToWall < 0.015 || (halfH - y) < 0.01) {
         temperatures[i] = THREE.MathUtils.lerp(temperatures[i], s.tempFluidInitial, thermalRate * 5 * dt);
      }
      
      // Bulk mixing (Convection thermal transfer)
      if (canConvect) {
          temperatures[i] = THREE.MathUtils.lerp(temperatures[i], avgT, thermalRate * 0.1 * dt);
      }

      // -- B. Forces --
      let fx = 0, fy = 0, fz = 0;

      // 1. Buoyancy (Boussinesq Approximation)
      // Force ~ g * beta * (T - T_avg)
      const tempDiff = temperatures[i] - avgT;
      const buoyancy = s.gravity * s.expansion * tempDiff * 250; // Tuned multiplier
      
      // Boiling Phase Change
      if (temperatures[i] > params.boilingPoint) {
          state[i] = 1; // Gas
          fy += s.gravity * 2.0; // Rapid rise
      } else {
          state[i] = 0; // Liquid
          fy += buoyancy;
      }

      // 2. Toroidal Circulation Heuristic (simulates pressure gradient)
      // Important: Guard against r ~= 0 which causes NaN in x/r divisions
      if (canConvect && r > 0.001) {
          const rNorm = r / radius; // 0..1
          const yNorm = (y + halfH) / params.containerHeight; // 0..1
          
          // Hot rising fluid spreads out at top
          if (tempDiff > 0 && yNorm > 0.8) {
              const spread = 2.0 * rNorm;
              fx += (x / r) * spread;
              fz += (z / r) * spread;
          }
          // Cold sinking fluid draws in at bottom
          if (tempDiff < 0 && yNorm < 0.2) {
              const suck = 2.0;
              fx -= (x / r) * suck;
              fz -= (z / r) * suck;
          }
      }

      // 3. Brownian Motion (Thermal Jitter)
      const jitter = (temperatures[i] / 500) * 0.05;
      fx += (Math.random() - 0.5) * jitter;
      fy += (Math.random() - 0.5) * jitter;
      fz += (Math.random() - 0.5) * jitter;

      // -- C. Integration (Euler) --
      velocities[idx] += fx * dt / inertiaFactor;
      velocities[idx+1] += fy * dt / inertiaFactor;
      velocities[idx+2] += fz * dt / inertiaFactor;
      
      // Apply Drag
      velocities[idx] *= dragFactor;
      velocities[idx+1] *= dragFactor;
      velocities[idx+2] *= dragFactor;

      // Velocity Clamp (Stability)
      velocities[idx] = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocities[idx]));
      velocities[idx+1] = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocities[idx+1]));
      velocities[idx+2] = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocities[idx+2]));

      // Update Position
      x += velocities[idx] * dt;
      y += velocities[idx+1] * dt;
      z += velocities[idx+2] * dt;

      // -- D. Boundary Constraints --
      
      // Floor
      if (y < -halfH) {
          y = -halfH + 0.001;
          velocities[idx+1] *= -0.4; // Bounce
          // Conduct heat rapidly on contact
          temperatures[i] = THREE.MathUtils.lerp(temperatures[i], s.tempSurface, 0.2);
      }
      // Ceiling
      if (y > halfH) {
          y = halfH - 0.001;
          velocities[idx+1] *= -0.4;
      }
      // Walls
      const newR = Math.sqrt(x*x + z*z);
      if (newR > radius) {
          const angle = Math.atan2(z, x);
          x = radius * Math.cos(angle);
          z = radius * Math.sin(angle);
          // Reflect velocity roughly
          velocities[idx] *= -0.5;
          velocities[idx+2] *= -0.5;
      }

      // --- Safety Check for NaN / Infinity ---
      // If the physics blew up, reset the particle to a safe random state
      if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
          const safeR = Math.random() * radius * 0.8;
          const safeTheta = Math.random() * 2 * Math.PI;
          x = safeR * Math.cos(safeTheta);
          y = (Math.random() - 0.5) * halfH;
          z = safeR * Math.sin(safeTheta);
          velocities[idx] = 0;
          velocities[idx+1] = 0;
          velocities[idx+2] = 0;
          temperatures[i] = s.tempFluidInitial;
      }

      positions[idx] = x;
      positions[idx+1] = y;
      positions[idx+2] = z;

      // -- E. Visualization Color --
      
      // Normalize Temp for Color Ramp
      // Clamp between T_inf and Ts
      let tNorm = (temperatures[i] - s.tempFluidInitial) / (Math.max(1, s.tempSurface - s.tempFluidInitial));
      tNorm = Math.max(0, Math.min(1, tNorm));

      // Check conduction proximity for visual glow (purely aesthetic)
      const isConducting = (y + halfH) < 0.015 && temperatures[i] > (s.tempFluidInitial + 5);

      if (state[i] === 1) {
          // Gas Bubble
          colors[idx] = _cGas.r;
          colors[idx+1] = _cGas.g;
          colors[idx+2] = _cGas.b;
      } else if (showHeatMap) {
         // Heat Map Gradient: Blue -> Cyan -> Green -> Yellow -> Red
         if (isConducting) {
             // White Glow for active conduction
             colors[idx] = _cGlow.r;
             colors[idx+1] = _cGlow.g;
             colors[idx+2] = _cGlow.b;
         } else {
             if (tNorm < 0.25) _c1.lerpColors(_cBlue, _cCyan, tNorm * 4);
             else if (tNorm < 0.5) _c1.lerpColors(_cCyan, _cGreen, (tNorm - 0.25) * 4);
             else if (tNorm < 0.75) _c1.lerpColors(_cGreen, _cYellow, (tNorm - 0.5) * 4);
             else _c1.lerpColors(_cYellow, _cRed, (tNorm - 0.75) * 4);
             
             colors[idx] = _c1.r;
             colors[idx+1] = _c1.g;
             colors[idx+2] = _c1.b;
         }
      } else {
          // Standard Watery Look
          const speed = Math.sqrt(velocities[idx]**2 + velocities[idx+1]**2 + velocities[idx+2]**2);
          const bright = Math.min(1, speed * 2);
          _c1.setRGB(0.1 + bright*0.2, 0.4 + bright*0.2, 0.8 + bright*0.2);
          
          if (isConducting) _c1.lerp(_cGlow, 0.5);

          colors[idx] = _c1.r;
          colors[idx+1] = _c1.g;
          colors[idx+2] = _c1.b;
      }
    }

    // Update Geometry
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} key={params.particleCount}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={params.particleSize}
        map={particleTexture}
        transparent
        opacity={showHeatMap ? 0.9 : 0.6}
        alphaTest={0.01}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};