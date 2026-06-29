# AI Architect (Ollama)

## Overview

The AI Architect is an LLM-powered assistant that provides agronomy advice, system diagnostics, and actuator control. It runs entirely locally on the edge cluster via Ollama.

## Configuration

| Variable           | Default                  | Description             |
|--------------------|--------------------------|-------------------------|
| `OLLAMA_BASE_URL`  | `http://localhost:11434` | Ollama API endpoint     |
| `OLLAMA_MODEL`     | `llama3.1:8b`            | LLM model               |

## System Prompt

The AI is configured with a detailed system prompt that defines:
- Its role as Lead Systems Architect and Expert Agronomist
- The hardware BOM of the cluster
- Available tools and their syntax
- Edge-first philosophy (no cloud dependencies)
- PiNet-aware scripting conventions
- Permaculture principles

## Available Tools

The AI can request execution of these actuator commands through the WebSocket:
- `toggle_sentry_camera` — Start/stop camera feed
- `load_ai_model` — Load ML model onto Hailo-10H
- `control_pump` — Water pump on/off with auto shutoff
- `control_misters` — Mister system on/off with auto shutoff
- `control_fertilizer_line` — Dispense N, P, or K nutrients
- `toggle_permaculture_mode` — Enable/disable permaculture enforcement
- `control_lights` — LED grow lights on/off
- `control_fans` — Ventilation fans on/off

## Tool Confirmation

All tool execution requires user confirmation via the chat interface's tool confirmation bar (Allow/Deny buttons).

## Example Queries

- "Check soil health"
- "Irrigation schedule advice"
- "Explain the ADS1115 role"
- "How to calibrate sensors?"
- "Enable permaculture mode"
- "Toggle camera feed"
- "Load YOLOv8 model"
