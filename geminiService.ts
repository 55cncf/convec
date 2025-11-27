import { GoogleGenAI, FunctionDeclaration, SchemaType, Type } from "@google/genai";
import { SimulationParams, ComputedValues } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Function Definition for the AI
const setParamsTool: FunctionDeclaration = {
  name: 'setSimulationParameters',
  description: 'Adjusts the physics simulation parameters to achieve a specific state (e.g., Laminar Flow, Turbulence, Boiling).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tempSurface: { type: Type.NUMBER, description: 'Surface temperature in Kelvin (273-1000).' },
      gravity: { type: Type.NUMBER, description: 'Gravitational acceleration in m/s^2.' },
      viscosityDynamic: { type: Type.NUMBER, description: 'Fluid viscosity in Pa.s (lower = runnier).' },
      particleCount: { type: Type.NUMBER, description: 'Number of particles.' },
      containerHeight: { type: Type.NUMBER, description: 'Height of the container in meters.' },
      thermalDiffusivity: { type: Type.NUMBER, description: 'How fast heat spreads (m^2/s).' },
      expansionCoefficient: { type: Type.NUMBER, description: 'Thermal expansion coefficient.' }
    },
    required: []
  }
};

export const generateTutorResponse = async (
  userMessage: string,
  currentParams: SimulationParams,
  computed: ComputedValues,
  chatHistory: { role: 'user' | 'model'; text: string }[]
) => {
  const modelId = "gemini-2.5-flash";

  const systemInstruction = `
    You are an expert Physics Tutor and Lab Assistant for "ThermoSim".
    
    Current State:
    - Ra: ${computed.rayleigh.toExponential(2)}
    - Nu: ${computed.nusselt.toFixed(2)}
    - Regime: ${computed.flowRegime}
    
    Capabilities:
    1. Explain physics concepts (Convection, Rayleigh #, etc.).
    2. CONTROL THE SIMULATION: If the user asks to "make it turbulent", "show laminar flow", "make it boil", or "simulate honey", CALL the 'setSimulationParameters' function with appropriate physical values.
    
    Guidelines for Parameters:
    - Laminar: Low Ra (< 10^5). High viscosity (~0.05), Low Delta T.
    - Turbulent: High Ra (> 10^9). Low viscosity (~0.0005), High Delta T, High Height.
    - Boiling: Surface Temp > Boiling Point (373K).
    - Conduction Only: Very Low Ra (< 1000). High Viscosity.

    If you call a function, add a short text explaining what you changed.
    Use LaTeX for math ($E=mc^2$).
  `;

  try {
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        tools: [{ functionDeclarations: [setParamsTool] }],
      },
      history: chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage({ message: userMessage });
    
    // Check for function calls
    const call = result.functionCalls?.[0];
    if (call) {
      return {
        text: result.text || "Adjusting parameters...",
        functionCall: {
          name: call.name,
          args: call.args
        }
      };
    }

    return { text: result.text || "" };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "I'm having trouble connecting to the physics database right now." };
  }
};
