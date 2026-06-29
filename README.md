# AgriPulse FMIS

> A Farm Management Information System with sovereign edge computing — built for a 3-node Raspberry Pi 5 cluster with Hailo-10H AI acceleration, real-time sensor telemetry, and on-device LLM-powered agronomy.

AgriPulse runs entirely on edge hardware: no cloud dependencies, no data leaving the farm. A FastAPI backend orchestrates sensor sampling, actuator control, and AI inference via a local Ollama model, while a lightweight HTML/CSS/JS frontend delivers a responsive dashboard accessible from any browser on the LAN.

---

## Highlights

- **Edge-native architecture** — 3-node Raspberry Pi 5 cluster with a Hailo-10H NPU (26 TOPS) for on-device vision inference.
- **Real-time telemetry** — WebSocket streaming of sensor data (temperature, humidity, soil moisture, NPK, pH) at 2.5 s intervals.
- **AI Agronomist** — Chat with a local Llama 3.1 model via Ollama for crop planning, troubleshooting, and task tool-calling.
- **AI Farm Onboarding** — Describe your farm in plain language; the AI streams its reasoning, extracts a structured template (fields, crop cycles, tasks), and creates it in one transaction.
- **Full FMIS domain model** — Farms, fields, crop cycles, soil & plant-health readings, irrigation, fertilization, harvests, and tasks.
- **Actuator control** — Pump, misters, lights, fans, and fertilizer lines, exposed via WebSocket tool calls.
- **Deployment-ready** — Docker Compose and Kubernetes (Kustomize) manifests included.

---

## Tech Stack

| Layer        | Technology                                                        |
| ------------ | ----------------------------------------------------------------- |
| Backend      | Python 3.12, FastAPI, Uvicorn, SQLAlchemy 2.x, Pydantic 2.x      |
| Frontend     | Vanilla HTML / CSS / JavaScript (no build step, no framework)     |
| Database     | SQLite (default) or PostgreSQL                                    |
| AI / LLM     | Ollama (`llama3.1:8b`), streaming via `/api/chat`                 |
| Realtime     | WebSocket (`/ws`) for telemetry, chat, onboarding, and tools      |
| Hardware     | Raspberry Pi 5, Hailo-10H AI HAT+, Sense HAT, ADS1115, soil probes |
| Deployment   | Docker Compose, Kubernetes (Kustomize)                            |

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
