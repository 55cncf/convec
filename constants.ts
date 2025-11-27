
import { SimulationParams } from './types';

// Default: Water at roughly 20 degrees C in a small beaker
export const DEFAULT_PARAMS: SimulationParams = {
  containerRadius: 0.1, // 10 cm radius
  containerHeight: 0.2, // 20 cm height
  surfaceAreaHot: 0.0314, // pi * r^2 roughly
  containerOpacity: 0.2,
  
  tempSurface: 350, // Kelvin (Hot plate, ~77C)
  tempFluidInitial: 293, // Kelvin (Room temp water, ~20C)
  boilingPoint: 373.15, // Kelvin (100C)

  density: 998, // kg/m^3
  expansionCoefficient: 0.000207, // 1/K (Water)
  viscosityDynamic: 0.001002, // Pa.s (Water)
  thermalConductivityFluid: 0.6, // W/(m.K)
  thermalDiffusivity: 1.43e-7, // m^2/s
  heatCapacity: 4184,

  gravity: 9.81,
  pressure: 1, // atm

  particleCount: 15000,
  particleSize: 0.015,
  densityEffect: 1,
};