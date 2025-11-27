
export type FluidState = 'liquid' | 'gas';

export interface SimulationParams {
  // Dimensions
  containerRadius: number; // meters
  containerHeight: number; // meters (Characteristic Length L)
  surfaceAreaHot: number; // m^2
  containerOpacity: number; // 0-1
  
  // Temperatures
  tempSurface: number; // K (Ts)
  tempFluidInitial: number; // K (T_inf)
  boilingPoint: number; // K (Phase change temp)

  // Fluid Properties
  density: number; // kg/m^3 (rho)
  expansionCoefficient: number; // 1/K (beta)
  viscosityDynamic: number; // Pa.s (mu)
  thermalConductivityFluid: number; // W/(m.K) (k)
  thermalDiffusivity: number; // m^2/s (alpha)
  heatCapacity: number; // J/kg.K (Cp)

  // Environment
  gravity: number; // m/s^2 (g)
  pressure: number; // atm

  // Visualization
  particleCount: number;
  particleSize: number;
  densityEffect?: number;
}

export interface ComputedValues {
  rayleigh: number;
  prandtl: number;
  nusselt: number;
  heatTransferCoeff: number; // h
  heatTransferRate: number; // q (Power)
  avgFluidTemp: number;
  flowRegime: 'Conductive' | 'Laminar Convection' | 'Turbulent Convection' | 'Boiling / Phase Change';
  fluidState: FluidState;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}