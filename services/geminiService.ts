import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Message, Role } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are the Lead Systems Architect for "AgriPulse," an advanced edge-computing agricultural solution. Your expertise is highly specialized and configured for a specific Bill of Materials (BOM). You must provide answers ONLY within the context of this BOM.

**Core Hardware Configuration:**
- **Compute Nodes:** 3x Raspberry Pi 5 (16GB model).
- **AI Accelerator:** 1x Raspberry Pi AI HAT+ 2, featuring a Hailo-10H (40 TOPS) NPU. This is on the Sentry node.
- **Primary Storage:** 1x 512GB NVMe SSD (PCIe Gen 3) connected via an NVMe HAT to the Master node.
- **Enclosure:** The entire cluster is housed in a single IP65 Vented Polycarbonate Enclosure.
- **Thermal Management:** Each Raspberry Pi 5 is equipped with an official Active Cooler.

**Master Node Actuators:** The Master node directly controls: Water Pump, Mister System, LED Grow Lights, Ventilation Fans, and three distinct fertilizer lines (N, P, K).

**Sensor & Periphery Configuration:**
- **Vision:** The Sentry node uses a 120FPS Global Shutter Camera.
- **Environmental:** The Telemetry node uses a Raspberry Pi Sense HAT for basic temp/humidity/pressure.
- **Analog Sensors:** The Telemetry node interfaces with analog sensors (3x Capacitive Soil Moisture, 1x Industrial Soil pH Probe, 1x Ammonia/DAP Sensor) via an ADS1115 16-bit 4-Channel I2C ADC Module. It also uses 2x DS18B20 Waterproof Temperature Probes.

**Software & Network Architecture:**
- **Network Boot:** The system uses PiNet (LTSP) for diskless network booting of the two worker nodes (Sentry, Telemetry) from the Master node.
- **Storage Architecture:** The 512GB NVMe on the Master node hosts the shared PiNet OS images and serves as the central storage for logs and Minima blockchain data.
- **Blockchain:** Minima CLI/RPC is used for data integrity.

**Your Task:**
When a user asks you for implementation details, you MUST provide comprehensive, practical, and expert-level answers that reflect your specialized knowledge of the EXACT hardware and software stack listed above. Your responses must adhere to the following strict guidelines:

1.  **Reference Specific Hardware:** When discussing code or procedures, explicitly mention the components from the BOM (e.g., "To read from the soil pH probe, you'll need to use the ADS1115 ADC library...", or "Ensure the Global Shutter Camera's driver is loaded...").
2.  **Provide "PiNet-aware" Python Scripts:** All file I/O must correctly handle shared network paths originating from the Master node's NVMe drive (e.g., \`/srv/pinet/\`).
3.  **Detail Optimized AI Inference:** Explain AI inference loops that explicitly offload processing to the Hailo-10H NPU.
4.  **Differentiate Bash Commands:** Clearly state which commands run on the PiNet server (host) versus the client's \`ltsp-chroot\` environment.
5.  **Design Failover Logic:** Propose robust failover mechanisms within the context of the 3-node cluster.
6.  **Use Markdown for Code:** Enclose all code in standard Markdown blocks.
7.  **Include Error Handling:** All hardware communication code must include robust \`try...except\` blocks.
8.  **Maintain an "Edge-First" Philosophy:** Your solutions MUST NOT rely on any cloud services.

Your responsibilities now also include:
- Interpreting Ammonia (NH₃) sensor data as an indicator of Diammonium Phosphate (DAP) levels.
- Providing guidance on enabling or disabling "Permaculture Enforcement Mode," which adjusts system automation to follow permaculture principles (e.g., companion planting, biodiversity focus).

Engage with the user as a helpful, expert architect. Your initial message, which is already sent, should not be repeated.`;

const tools: FunctionDeclaration[] = [
  {
    name: 'toggle_sentry_camera',
    description: 'Starts or stops the camera feed on the Sentry node.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        state: { type: Type.STRING, description: "The desired state of the camera, either 'on' or 'off'.", enum: ['on', 'off'], },
      },
      required: ['state'],
    },
  },
  {
    name: 'load_ai_model',
    description: 'Loads a specified AI model onto the Sentry node NPU.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        model_name: { type: Type.STRING, description: "The name of the AI model to load, e.g., 'YOLOv8' or 'ResNet50'.", },
      },
      required: ['model_name'],
    },
  },
  {
    name: 'control_pump',
    description: 'Controls the main water pump for irrigation.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            state: { type: Type.STRING, description: "The desired state, either 'on' or 'off'.", enum: ['on', 'off'] },
            duration_minutes: { type: Type.NUMBER, description: "Optional duration in minutes for how long the pump should run before automatically turning off." }
        },
        required: ['state']
    }
  },
  {
      name: 'control_misters',
      description: 'Controls the mister/fogger system to manage humidity or apply foliar treatments.',
      parameters: {
          type: Type.OBJECT,
          properties: {
              state: { type: Type.STRING, description: "The desired state, either 'on' or 'off'.", enum: ['on', 'off'] },
              duration_minutes: { type: Type.NUMBER, description: "Optional duration in minutes for how long the misters should run." }
          },
          required: ['state']
      }
  },
  {
      name: 'control_fertilizer_line',
      description: 'Activates a specific fertilizer line to dispense nutrients.',
      parameters: {
          type: Type.OBJECT,
          properties: {
              nutrient: { type: Type.STRING, description: "The nutrient line to activate.", enum: ['N', 'P', 'K'] },
              amount_ml: { type: Type.NUMBER, description: "The amount in milliliters (ml) to dispense." }
          },
          required: ['nutrient', 'amount_ml']
      }
  },
  {
      name: 'toggle_permaculture_mode',
      description: 'Enables or disables the Permaculture Enforcement mode on the telemetry node.',
      parameters: {
          type: Type.OBJECT,
          properties: {
              state: { type: Type.BOOLEAN, description: "The desired state, 'true' to enable or 'false' to disable." },
          },
          required: ['state']
      }
  },
  {
    name: 'control_lights',
    description: 'Controls the main LED grow lights.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            state: { type: Type.STRING, description: "The desired state, either 'on' or 'off'.", enum: ['on', 'off'] },
        },
        required: ['state']
    }
  },
  {
      name: 'control_fans',
      description: 'Controls the ventilation fans for air circulation.',
      parameters: {
          type: Type.OBJECT,
          properties: {
              state: { type: Type.STRING, description: "The desired state, either 'on' or 'off'.", enum: ['on', 'off'] },
          },
          required: ['state']
      }
  }
];


function formatMessagesForApi(messages: Message[]) {
  const formatted = [];
  for (const msg of messages) {
      if (msg._functionCall) {
          formatted.push({
              role: 'model',
              parts: [{ functionCall: msg._functionCall[0] }]
          });
      } else if (msg._functionResponse) {
          formatted.push({
              role: 'user',
              parts: [{ functionResponse: msg._functionResponse }]
          });
      } else if (msg.content) {
          formatted.push({
              role: msg.role === Role.USER ? 'user' : 'model',
              parts: [{ text: msg.content }],
          });
      }
  }
  return formatted.filter(Boolean); // Filter out any potential empty messages
}


export const getArchitectResponse = async (history: Message[]): Promise<{ text?: string | null; functionCalls?: any[] | null; }> => {
  try {
    const contents = formatMessagesForApi(history);
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: contents,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION
        },
        tools: [{ functionDeclarations: tools }],
    });

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      return { functionCalls };
    }

    if (response.text) {
        return { text: response.text };
    }
    
    return { text: "I don't have a response for that. Could you please rephrase?" };

  } catch (error) {
    console.error("Error fetching from Gemini API:", error);
    if (error instanceof Error) {
        return { text: `An error occurred while communicating with the AI model: ${error.message}`};
    }
    return { text: "An unknown error occurred while communicating with the AI model." };
  }
};