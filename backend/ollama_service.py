from __future__ import annotations

import json
import os
from typing import Any

import httpx

SYSTEM_PROMPT = """You are the Lead Systems Architect and Expert Agronomist for "AgriPulse," an advanced edge-computing agricultural FMIS (Farm Management Information System). Your expertise spans both precision agriculture and distributed edge systems, configured specifically for the following Bill of Materials (BOM).

**Core Hardware Configuration:**
- **Compute Nodes:** 3x Raspberry Pi 5 (16GB model) — Master, Sentry, Telemetry.
- **AI Accelerator:** 1x Raspberry Pi AI HAT+ 2 with Hailo-10H (40 TOPS) NPU, attached to the Sentry node.
- **Primary Storage:** 1x 512GB NVMe SSD (PCIe Gen 3) via NVMe HAT on the Master node.
- **Enclosure:** IP65 Vented Polycarbonate Enclosure housing the entire cluster.
- **Thermal Management:** Official Active Cooler on each Raspberry Pi 5.

**Master Node Actuators (directly controlled):** Water Pump, Mister System, LED Grow Lights, Ventilation Fans, three individual fertilizer lines (N, P, K).

**Sensor & Periphery Configuration:**
- **Vision:** Sentry node — 120FPS Global Shutter Camera.
- **Environmental:** Telemetry node — Raspberry Pi Sense HAT (temp, humidity, pressure, IMU).
- **Analog Sensors:** Telemetry node — 3x Capacitive Soil Moisture, 1x Industrial Soil pH Probe, 1x Ammonia/DAP sensor via ADS1115 16-bit 4-Channel I2C ADC Module, plus 2x DS18B20 Waterproof Temperature Probes.

**Software & Network Architecture:**
- **Network Boot:** PiNet (LTSP) for diskless network boot of Sentry and Telemetry nodes from the Master node.
- **Storage:** 512GB NVMe on Master hosts shared PiNet OS images, logs, and Minima blockchain data.
- **Blockchain:** Minima CLI/RPC for immutable data integrity logging.

**Your Expertise Covers:**
- Soil health management (moisture, pH, NPK, ammonia/DAP interpretation)
- Crop disease detection via Hailo-10H NPU inference on the Sentry node camera feed
- Irrigation scheduling based on real-time sensor telemetry
- Nutrient management via the three fertilizer lines (N, P, K)
- Permaculture principles and "Permaculture Enforcement Mode" logic
- Edge-first cluster failover, high availability, and disaster recovery

**Response Guidelines:**
1. Always answer in **Markdown-formatted** responses.
2. Reference specific BOM hardware when giving advice or code.
3. Provide **PiNet-aware Python scripts** — all file I/O must reference shared network paths (e.g., `/srv/pinet/`).
4. **Differentiate bash commands** — clearly label commands for the PiNet server (host) vs. the `ltsp-chroot` client environment.
5. **Design failover logic** for the 3-node cluster — propose robust HA mechanisms using the edge-first philosophy.
6. **Edge-first philosophy** — solutions MUST NOT depend on any cloud services; everything runs locally on the cluster.
7. All hardware communication code must include robust `try...except` blocks.
8. Interpret ammonia (NH3) sensor data as an indicator of Diammonium Phosphate (DAP) levels.
9. When asked, provide guidance on enabling/disabling "Permaculture Enforcement Mode" to align automation with permaculture principles (companion planting, biodiversity focus, closed-loop nutrients).

Engage as a helpful, expert agronomist and edge-computing architect. Provide practical, production-ready solutions."""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "toggle_sentry_camera",
            "description": "Starts or stops the camera feed on the Sentry node for crop monitoring and disease detection.",
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {
                        "type": "string",
                        "description": "Desired camera state",
                        "enum": ["on", "off"],
                    },
                },
                "required": ["state"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "load_ai_model",
            "description": "Loads a specified AI model onto the Hailo-10H NPU on the Sentry node for edge inference.",
            "parameters": {
                "type": "object",
                "properties": {
                    "model_name": {
                        "type": "string",
                        "description": "Name of the AI model to load, e.g. 'yolov8n.hef' or 'resnet50.hef'",
                    },
                },
                "required": ["model_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "control_pump",
            "description": "Controls the main water pump for irrigation scheduling.",
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {
                        "type": "string",
                        "description": "Desired pump state",
                        "enum": ["on", "off"],
                    },
                    "duration_minutes": {
                        "type": "number",
                        "description": "Optional duration in minutes before auto shut-off",
                    },
                },
                "required": ["state"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "control_misters",
            "description": "Controls the mister/fogger system for humidity management or foliar feeding.",
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {
                        "type": "string",
                        "description": "Desired mister state",
                        "enum": ["on", "off"],
                    },
                    "duration_minutes": {
                        "type": "number",
                        "description": "Optional duration in minutes before auto shut-off",
                    },
                },
                "required": ["state"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "control_fertilizer_line",
            "description": "Activates a specific nutrient line (N, P, or K) to dispense a measured amount.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nutrient": {
                        "type": "string",
                        "description": "The nutrient line to activate",
                        "enum": ["N", "P", "K"],
                    },
                    "amount_ml": {
                        "type": "number",
                        "description": "Volume in milliliters to dispense",
                    },
                },
                "required": ["nutrient", "amount_ml"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "toggle_permaculture_mode",
            "description": "Enables or disables Permaculture Enforcement Mode, adjusting automation to follow permaculture principles.",
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {
                        "type": "boolean",
                        "description": "True to enable permaculture mode, false to disable",
                    },
                },
                "required": ["state"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "control_lights",
            "description": "Controls the LED grow lights for supplemental lighting schedules.",
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {
                        "type": "string",
                        "description": "Desired light state",
                        "enum": ["on", "off"],
                    },
                },
                "required": ["state"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "control_fans",
            "description": "Controls the ventilation fans for air circulation and thermal management inside the enclosure.",
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {
                        "type": "string",
                        "description": "Desired fan state",
                        "enum": ["on", "off"],
                    },
                },
                "required": ["state"],
            },
        },
    },
]

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")


def _format_messages(messages: list[dict]) -> list[dict]:
    """Convert the app's internal message history format to Ollama /api/chat message format."""
    formatted: list[dict] = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")

        if msg.get("tool_calls"):
            formatted.append({
                "role": "assistant",
                "content": content or "",
                "tool_calls": [
                    {
                        "type": "function",
                        "function": {
                            "name": tc.get("function", {}).get("name", ""),
                            "arguments": json.dumps(
                                tc.get("function", {}).get("arguments", tc.get("function", {}).get("args", {}))
                            ),
                        },
                    }
                    for tc in msg["tool_calls"]
                ],
            })
        elif msg.get("function_call"):
            fc_raw = msg["function_call"]
            fc_list = fc_raw if isinstance(fc_raw, list) else [fc_raw]
            formatted.append({
                "role": "assistant",
                "content": "",
                "tool_calls": [
                    {
                        "type": "function",
                        "function": {
                            "name": fc.get("name", ""),
                            "arguments": json.dumps(fc.get("args", fc.get("arguments", {}))),
                        },
                    }
                    for fc in fc_list
                ],
            })
        elif msg.get("function_response"):
            fr = msg["function_response"]
            formatted.append({
                "role": "tool",
                "content": json.dumps(fr.get("response", fr)),
                "name": fr.get("name", "unknown"),
            })
        elif role == "tool":
            formatted.append({
                "role": "tool",
                "content": content,
                "name": msg.get("name", "unknown"),
            })
        elif content:
            formatted.append({"role": role, "content": content})
    return formatted


async def get_architect_response(messages: list[dict]) -> dict[str, Any]:
    """Send messages to Ollama and return either a text response or parsed function calls."""
    url = f"{OLLAMA_BASE_URL}/api/chat"
    formatted = _format_messages(messages)

    payload = {
        "model": OLLAMA_MODEL,
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *formatted],
        "stream": False,
        "tools": TOOLS,
    }

    async with httpx.AsyncClient(timeout=120) as client:
        try:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            result = resp.json()

            message = result.get("message", {})
            tool_calls = message.get("tool_calls")

            if tool_calls and len(tool_calls) > 0:
                calls = []
                for tc in tool_calls:
                    func = tc.get("function", {})
                    name = func.get("name", "")
                    args_raw = func.get("arguments", "{}")
                    if isinstance(args_raw, str):
                        args = json.loads(args_raw)
                    else:
                        args = args_raw
                    calls.append({"name": name, "args": args})
                return {"functionCalls": calls}

            content = message.get("content", "")
            if content:
                return {"text": content}

            return {"text": "I don't have a response for that. Could you please rephrase?"}

        except httpx.HTTPStatusError as e:
            return {"text": f"Ollama API error: {e.response.status_code} - {e.response.text}"}
        except httpx.RequestError:
            return {
                "text": f"Cannot connect to Ollama at {OLLAMA_BASE_URL}. Is Ollama running? "
                f"Start it with 'ollama serve' or ensure OLLAMA_BASE_URL is correct."
            }
        except (json.JSONDecodeError, KeyError) as e:
            return {"text": f"Failed to parse Ollama response: {e}"}
