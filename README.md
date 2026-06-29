# AgriPulse FMIS

<p align="center">
  <a href="https://github.com/WilliamMajanja/AgriPulse-EdgeCluster/blob/main/LICENSE"><img src="https://img.shields.io/github/license/WilliamMajanja/AgriPulse-EdgeCluster?style=flat-square&color=blue" alt="License"></a>
  <a href="https://github.com/WilliamMajanja/AgriPulse-EdgeCluster/stargazers"><img src="https://img.shields.io/github/stars/WilliamMajanja/AgriPulse-EdgeCluster?style=flat-square&logo=github" alt="Stars"></a>
  <a href="https://github.com/WilliamMajanja/AgriPulse-EdgeCluster/network/members"><img src="https://img.shields.io/github/forks/WilliamMajanja/AgriPulse-EdgeCluster?style=flat-square&logo=github" alt="Forks"></a>
  <a href="https://github.com/WilliamMajanja/AgriPulse-EdgeCluster/issues"><img src="https://img.shields.io/github/issues/WilliamMajanja/AgriPulse-EdgeCluster?style=flat-square&logo=github" alt="Issues"></a>
  <a href="https://github.com/WilliamMajanja/AgriPulse-EdgeCluster/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square&logo=github" alt="PRs Welcome"></a>
  <a href="https://github.com/WilliamMajanja/AgriPulse-EdgeCluster/commits/main"><img src="https://img.shields.io/github/last-commit/WilliamMajanja/AgriPulse-EdgeCluster?style=flat-square&logo=github" alt="Last Commit"></a>
  <a href="https://github.com/WilliamMajanja/AgriPulse-EdgeCluster"><img src="https://img.shields.io/github/repo-size/WilliamMajanja/AgriPulse-EdgeCluster?style=flat-square&logo=github" alt="Repo Size"></a>
</p>

> A Farm Management Information System with sovereign edge computing — built for a 3-node Raspberry Pi 5 cluster with Hailo-10H AI acceleration, real-time sensor telemetry, and on-device LLM-powered agronomy.

AgriPulse runs entirely on edge hardware: no cloud dependencies, no data leaving the farm. A FastAPI backend orchestrates sensor sampling, actuator control, and AI inference via a local Ollama model, while a lightweight HTML/CSS/JS frontend delivers a responsive dashboard accessible from any browser on the LAN.

<p align="center">
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"></a>
  <a href="https://www.sqlalchemy.org/"><img src="https://img.shields.io/badge/SQLAlchemy-2.x-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy"></a>
  <a href="https://ollama.com/"><img src="https://img.shields.io/badge/Ollama-llama3.1-000000?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama"></a>
  <a href="https://www.sqlite.org/"><img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"></a>
  <a href="https://kubernetes.io/"><img src="https://img.shields.io/badge/Kubernetes-Kustomize-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes"></a>
  <a href="https://www.raspberrypi.com/"><img src="https://img.shields.io/badge/Raspberry%20Pi-5-C51A4A?style=for-the-badge&logo=raspberrypi&logoColor=white" alt="Raspberry Pi"></a>
</p>

---

## Table of Contents

- [Highlights](#highlights)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Option A — Run locally](#option-a--run-locally-simulated-sensors)
  - [Option B — Docker Compose](#option-b--docker-compose)
  - [Option C — Kubernetes](#option-c--kubernetes)
- [Configuration](#configuration)
- [Pages](#pages)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Hardware Bill of Materials](#hardware-bill-of-materials)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Highlights

| | Feature | Description |
|---|---------|-------------|
| **Edge** | Edge-native architecture | 3-node Raspberry Pi 5 cluster with a Hailo-10H NPU (26 TOPS) for on-device vision inference. |
| **Realtime** | Real-time telemetry | WebSocket streaming of sensor data (temperature, humidity, soil moisture, NPK, pH) at 2.5 s intervals. |
| **AI** | AI Agronomist | Chat with a local Llama 3.1 model via Ollama for crop planning, troubleshooting, and task tool-calling. |
| **AI** | AI Farm Onboarding | Describe your farm in plain language; the AI streams its reasoning, extracts a structured template (fields, crop cycles, tasks), and creates it in one transaction. |
| **Domain** | Full FMIS domain model | Farms, fields, crop cycles, soil & plant-health readings, irrigation, fertilization, harvests, and tasks. |
| **Control** | Actuator control | Pump, misters, lights, fans, and fertilizer lines, exposed via WebSocket tool calls. |
| **DevOps** | Deployment-ready | Docker Compose and Kubernetes (Kustomize) manifests included. |

---

## Tech Stack

<p align="center"><strong>Backend</strong></p>
<p align="center">
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"></a>
  <a href="https://www.sqlalchemy.org/"><img src="https://img.shields.io/badge/SQLAlchemy-2.x-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy"></a>
  <a href="https://docs.pydantic.dev/"><img src="https://img.shields.io/badge/Pydantic-2.x-E92063?style=for-the-badge&logo=pydantic&logoColor=white" alt="Pydantic"></a>
  <a href="https://www.uvicorn.org/"><img src="https://img.shields.io/badge/Uvicorn-ASGI-3D7E9A?style=for-the-badge" alt="Uvicorn"></a>
  <a href="https://www.python-httpx.org/"><img src="https://img.shields.io/badge/HTTPX-0.27%2B-E0234E?style=for-the-badge" alt="HTTPX"></a>
</p>

<p align="center"><strong>AI / LLM</strong></p>
<p align="center">
  <a href="https://ollama.com/"><img src="https://img.shields.io/badge/Ollama-local-000000?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama"></a>
  <a href="https://llama.meta.com/"><img src="https://img.shields.io/badge/Llama-3.1-7C3AED?style=for-the-badge" alt="Llama 3.1"></a>
</p>

<p align="center"><strong>Frontend</strong></p>
<p align="center">
  <a href="https://developer.mozilla.org/en-US/docs/Glossary/HTML5"><img src="https://img.shields.io/badge/HTML5-5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/CSS"><img src="https://img.shields.io/badge/CSS-3-1572B6?style=for-the-badge&logo=css&logoColor=white" alt="CSS"></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"></a>
</p>

<p align="center"><strong>Database</strong></p>
<p align="center">
  <a href="https://www.sqlite.org/"><img src="https://img.shields.io/badge/SQLite-default-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-optional-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"></a>
</p>

<p align="center"><strong>Deployment</strong></p>
<p align="center">
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"></a>
  <a href="https://kubernetes.io/"><img src="https://img.shields.io/badge/Kubernetes-Kustomize-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes"></a>
</p>

<p align="center"><strong>Edge Hardware</strong></p>
<p align="center">
  <a href="https://www.raspberrypi.com/"><img src="https://img.shields.io/badge/Raspberry%20Pi-5%20(16GB)-C51A4A?style=for-the-badge&logo=raspberrypi&logoColor=white" alt="Raspberry Pi 5"></a>
  <a href="https://hailo.ai/"><img src="https://img.shields.io/badge/Hailo-10H%20(26%20TOPS)-00A86B?style=for-the-badge" alt="Hailo-10H"></a>
</p>

The frontend ships as vanilla HTML/CSS/JS with **no build step and no framework**, and real-time communication flows over a single WebSocket (`/ws`) for telemetry, chat, onboarding, and tool calls.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (HTML / CSS / JS)                  │
│  Dashboard · Fields · Soil · Plants · Tasks · Irrigation     │
│  Chat · BOM · Setup (AI Onboarding)                          │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST + WebSocket
┌───────────────────────────┴─────────────────────────────────┐
│                FastAPI Backend (Python)                      │
│  Routes · WebSocket Manager · Sensor Manager                 │
│  SQLAlchemy ORM · Ollama Service · Onboarding Service        │
│  Actuator Control                                            │
└─────────────┬───────────────────────────────┬───────────────┘
              │                               │
      ┌───────┴────────┐            ┌─────────┴─────────┐
      │  SQLite /      │            │   Ollama (LLM)    │
      │  PostgreSQL    │            │   llama3.1:8b     │
      └────────────────┘            └───────────────────┘
              │
      ┌───────┴────────────────────────────────────────┐
      │  Edge Hardware (Raspberry Pi 5 cluster)         │
      │  Sensors · Actuators · Hailo NPU · Camera       │
      └─────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- **Python 3.12+**
- **Ollama** running locally with a pulled model (`ollama pull llama3.1:8b`) — *optional; the app falls back to a deterministic parser if Ollama is unreachable.*
- **pip**, and optionally **Docker** / **kubectl** for containerized deployment.

### Option A — Run locally (simulated sensors)

```bash
# 1. Install dependencies
pip install -r backend/requirements.txt

# 2. (Optional) Start Ollama and pull the model
ollama serve &
ollama pull llama3.1:8b

# 3. Launch the server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Or use the bundled launcher, which sources `.env` and prints startup diagnostics:

```bash
chmod +x run.sh && ./run.sh
```

Open **http://127.0.0.1:8000** in your browser.

### Option B — Docker Compose

Spins up the AgriPulse app alongside an Ollama container:

```bash
docker-compose up --build
```

The app is served on `http://localhost:8000`; Ollama listens on `http://localhost:11434`. Persistent volumes are created for both the database and Ollama models.

> **Note:** The first run will download the Llama 3.1 model inside the Ollama container — attach to it and run `ollama pull llama3.1:8b`, or pre-pull on the host.

### Option C — Kubernetes

Manifests are provided as a Kustomize bundle under `k8s/`:

```bash
kubectl apply -k k8s/
```

Includes `namespace`, `configmap`, `deployment`, `service`, `ingress`, and `storage` resources.

---

## Configuration

All settings are read from environment variables (or a `.env` file at the project root — copy `.env.example` to get started).

| Variable           | Default                    | Description                                              |
| ------------------ | -------------------------- | -------------------------------------------------------- |
| `SENSOR_MODE`      | `simulated`                | `simulated` (no hardware) or `real` (Raspberry Pi GPIO)  |
| `DATABASE_URL`     | `sqlite:///./agripulse.db` | SQLAlchemy connection string (SQLite or PostgreSQL)      |
| `OLLAMA_BASE_URL`  | `http://localhost:11434`   | Ollama API endpoint                                      |
| `OLLAMA_MODEL`     | `llama3.1:8b`             | LLM model identifier for the AI Architect & onboarding   |
| `HOST`             | `0.0.0.0`                  | Server bind address                                      |
| `PORT`             | `8000`                     | Server port                                              |

For PostgreSQL, set `DATABASE_URL=postgresql://user:password@localhost:5432/agripulse`.

---

## Pages

| Page        | Description                                                 |
| ----------- | ---------------------------------------------------------- |
| Dashboard   | Farm selector, live stats, field status, quick actions     |
| Fields      | Field list & detail, crop cycles, soil & activity timeline |
| Soil        | Soil readings, NPK analysis, reading history               |
| Plants      | Plant health, disease risk, pest pressure                  |
| Tasks       | Task management with priority, status, and filtering       |
| Irrigation  | Irrigation & fertilization logging and scheduling          |
| Chat        | AI Architect — LLM-powered agronomy assistant              |
| BOM         | Bill of Materials — hardware inventory & status            |
| Setup       | AI Farm Onboarding — describe your farm, review & confirm  |

---

## API Reference

All REST endpoints are prefixed with `/api/v1`.

| Resource        | Endpoints                                                              |
| --------------- | --------------------------------------------------------------------- |
| Farms           | `GET/POST /farms/`, `GET/PUT/DELETE /farms/{id}`                      |
| Onboarding      | `POST /farms/onboard/confirm` — create a farm from an AI template     |
| Fields          | `GET/POST /fields/`, `GET/PUT/DELETE /fields/{id}`                    |
| Crop Cycles     | `GET/POST /crop-cycles/`, `GET/PUT/DELETE /crop-cycles/{id}`          |
| Soil Readings   | `GET/POST /soil-readings/`, `GET /soil-readings/latest/{field_id}`    |
| Plant Health    | `GET/POST /plant-health/`, `GET /plant-health/latest/{field_id}`      |
| Irrigation      | `GET/POST /irrigation/`, `POST /irrigation/schedule`                  |
| Fertilization   | `GET/POST /fertilization/`                                            |
| Harvests        | `GET/POST /harvests/`, `PUT/DELETE /harvests/{id}`                    |
| Tasks           | `GET/POST /tasks/`, `PUT/DELETE /tasks/{id}`                          |
| Dashboard       | `GET /dashboard/summary`, `GET /dashboard/alerts`                     |
| Weather         | `GET /dashboard/weather/{field_id}` (Open-Meteo)                      |

### WebSocket

Connect to `ws://host:8000/ws` and send JSON frames with an `action` field:

| Action      | Payload                         | Description                                            |
| ----------- | ------------------------------- | ----------------------------------------------------- |
| `subscribe` | —                               | Stream real-time sensor data every 2.5 s              |
| `get_nodes` | —                               | Request a current node-status snapshot                |
| `chat`      | `{ "messages": [...] }`         | Send a conversation to the AI Architect               |
| `onboard`   | `{ "spec": "farm description" }`| Stream AI analysis of a farm spec → template          |
| `exec_tool` | `{ "name", "args" }`            | Execute an actuator command (pump, lights, fans, …)   |

Inbound message types: `data`, `alert`, `chat_response`, `onboard_thought`, `onboard_template`, `onboard_error`, `tool_result`.

---

## Project Structure

```
AgriPulse-EdgeCluster/
├── backend/
│   ├── main.py                # FastAPI app, WebSocket endpoint, actuator tools
│   ├── routes.py              # REST routers (farms, fields, tasks, onboarding, …)
│   ├── models.py              # SQLAlchemy ORM models & Pydantic schemas
│   ├── database.py            # Engine & session factory
│   ├── websocket_manager.py   # Connection manager & WS action dispatch
│   ├── onboarding_service.py  # AI farm-onboarding (Ollama streaming + fallback)
│   ├── ollama_service.py      # AI Architect chat service
│   ├── sensors.py             # Simulated & real sensor managers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── *.html                 # One page per view (no framework)
│   └── static/
│       ├── css/style.css
│       └── js/{api.js, app.js}
├── k8s/                       # Kubernetes manifests (Kustomize)
├── wiki/                      # Project documentation
├── docker-compose.yml
├── run.sh                     # Local launcher (sources .env)
└── .env.example
```

---

## Hardware Bill of Materials

- 3× Raspberry Pi 5 (16 GB)
- 1× AI HAT+ Hailo-10H (26 TOPS)
- 1× Sense HAT
- 1× NVMe HAT + 512 GB SSD
- 3× Capacitive Soil Moisture Sensors
- 1× Industrial pH Probe + ADS1115 ADC
- 2× DS18B20 Temperature Sensors
- 1× Global Shutter Camera
- Actuators: pump, mister, solenoid valve, LED grow lights, fans, relay module
- IP65 vented enclosure

See [`wiki/Hardware-BOM.md`](wiki/Hardware-BOM.md) for sourcing details.

---

## Documentation

In-depth guides live in the [`wiki/`](wiki/) directory:

- [Architecture](wiki/Architecture.md) — system design and data flow
- [API Reference](wiki/API-Reference.md) — detailed endpoint documentation
- [WebSocket Protocol](wiki/WebSocket-Protocol.md) — real-time messaging spec
- [Frontend Pages](wiki/Frontend-Pages.md) — UI tour
- [Onboarding](wiki/Onboarding.md) — the AI farm-onboarding workflow
- [AI Architect](wiki/AI-Architect.md) — the LLM agronomy assistant
- [Hardware BOM](wiki/Hardware-BOM.md) — component list & sourcing
- [Deployment Guide](wiki/Deployment-Guide.md) — local, Docker & Kubernetes
- [Kubernetes Deployment](wiki/Kubernetes-Deployment.md) — k8s specifics
- [Sensor System](wiki/Sensor-System.md) — real vs. simulated sensors
- [Troubleshooting](wiki/Troubleshooting.md) — common issues & fixes

---

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) for our community standards before opening a pull request.

---

## Security

Found a vulnerability? Please review [`SECURITY.md`](SECURITY.md) for responsible disclosure instructions — **do not** open a public issue for security-related problems.

---

## License

Released under the **MIT License**.
