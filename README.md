# AgriPulse FMIS

Farm Management Information System with sovereign edge computing control. Runs on a 3-node Raspberry Pi 5 cluster with Hailo-10H AI acceleration, real-time sensor monitoring, and AI-powered agronomy.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (HTML/CSS/JS)            │
│  Dashboard │ Fields │ Soil │ Plants │ Tasks │ Chat  │
└──────────────────────┬──────────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────┴──────────────────────────────┐
│              FastAPI Backend (Python)                │
│  Routes │ WebSocket Manager │ Sensor Manager        │
│  SQLAlchemy │ Ollama Service │ Actuator Control     │
└──────────┬───────────────────────────┬───────────────┘
           │                           │
    ┌──────┴──────┐           ┌────────┴────────┐
    │  SQLite/     │           │   Ollama        │
    │  PostgreSQL  │           │   (LLM)         │
    └─────────────┘           └─────────────────┘
```

## Quick Start

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run with simulated sensors (default)
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Or using the run script
chmod +x run.sh && ./run.sh
```

Open **http://127.0.0.1:8000** in your browser.

### Docker

```bash
docker-compose up --build
```

### Kubernetes

```bash
kubectl apply -k k8s/
```

## Pages

| Page     | Description                                      |
| -------- | ------------------------------------------------ |
| Dashboard| Farm selector, stats, field status, quick actions |
| Fields   | Field list/detail, crop cycles, soil & activity   |
| Soil     | Soil readings, NPK analysis, reading history      |
| Plants   | Plant health, disease risk, pest pressure         |
| Tasks    | Task management with priority, status, filtering  |
| Irrigation| Irrigation & fertilization logging and scheduling |
| Chat     | AI Architect — LLM-powered agronomy assistant     |
| BOM      | Bill of Materials — hardware inventory & status   |

## API

All endpoints are prefixed with `/api/v1`.

| Resource          | Endpoints                                                           |
| ----------------- | ------------------------------------------------------------------- |
| Farms             | `GET/POST /farms/`, `GET/PUT/DELETE /farms/{id}`                    |
| Fields            | `GET/POST /fields/`, `GET/PUT/DELETE /fields/{id}`                  |
| Crop Cycles       | `GET/POST /crop-cycles/`, `GET/PUT/DELETE /crop-cycles/{id}`        |
| Soil Readings     | `GET/POST /soil-readings/`, `GET /soil-readings/latest/{field_id}` |
| Plant Health      | `GET/POST /plant-health/`, `GET /plant-health/latest/{field_id}`    |
| Irrigation        | `GET/POST /irrigation/`, `POST /irrigation/schedule`                |
| Fertilization     | `GET/POST /fertilization/`                                          |
| Harvests          | `GET/POST /harvests/`, `PUT/DELETE /harvests/{id}`                  |
| Tasks             | `GET/POST /tasks/`, `PUT/DELETE /tasks/{id}`                        |
| Dashboard         | `GET /dashboard/summary`, `GET /dashboard/alerts`                   |
| Weather           | `GET /dashboard/weather/{field_id}` (Open-Meteo)                    |

### WebSocket

Connect to `ws://host:8000/ws`.

| Action      | Description                                  |
| ----------- | -------------------------------------------- |
| `subscribe` | Stream real-time sensor data every 2.5s      |
| `chat`      | Send chat messages to AI Architect           |
| `exec_tool` | Execute actuator commands (pump, lights, etc)|
| `get_nodes` | Request current node status snapshot         |

## Configuration

Set via environment variables or `.env` file:

| Variable           | Default                  | Description                          |
| ------------------ | ------------------------ | ------------------------------------ |
| `SENSOR_MODE`      | `simulated`              | `simulated` or `real`                |
| `DATABASE_URL`     | `sqlite:///./agripulse.db` | Database connection string          |
| `OLLAMA_BASE_URL`  | `http://localhost:11434` | Ollama API endpoint                  |
| `OLLAMA_MODEL`     | `llama3.1:8b`            | LLM model for AI Architect           |
| `HOST`             | `0.0.0.0`                | Server bind address                  |
| `PORT`             | `8000`                   | Server port                          |

## Hardware BOM

- 3x Raspberry Pi 5 (16GB)
- 1x AI HAT+ Hailo-10H (26 TOPS)
- 1x Sense HAT
- 1x NVMe HAT + 512GB SSD
- 3x Capacitive Soil Moisture Sensors
- 1x Industrial pH Probe + ADS1115 ADC
- 2x DS18B20 Temperature Sensors
- 1x Global Shutter Camera
- Actuators: pump, mister, solenoid valve, LED grow lights, fans, relay module
- IP65 vented enclosure

## License

MIT
