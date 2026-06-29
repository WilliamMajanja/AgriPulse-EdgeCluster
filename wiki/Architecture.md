# Architecture

## System Overview

AgriPulse FMIS follows a monolithic backend architecture with a REST + WebSocket API serving a vanilla JS frontend. No cloud services are required — everything runs on the edge cluster.

## Node Roles

### Master Node

- Runs the FastAPI backend server
- Hosts the SQLite/PostgreSQL database on NVMe SSD
- Controls actuators (pump, misters, lights, fans, fertilizer lines)
- Operates as PiNet server for network booting client nodes
- Minima blockchain node for data integrity logging

### Sentry Node

- Runs Hailo-10H NPU for AI inference
- Global shutter camera for crop monitoring
- Disease detection via YOLOv8 or other models
- Diskless boot from Master via PiNet (LTSP)

### Telemetry Node

- Sense HAT for environmental monitoring (temp, humidity, pressure)
- ADS1115 ADC for analog soil sensors (moisture, pH, ammonia)
- DS18B20 temperature probes
- Diskless boot from Master via PiNet

## Software Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Backend     | Python 3.12, FastAPI          |
| Database    | SQLAlchemy 2.0 + SQLite/PostgreSQL |
| LLM         | Ollama (llama3.1:8b)          |
| Frontend    | Vanilla HTML/CSS/JS           |
| WebSocket   | FastAPI WebSocket + WsClient  |
| Container   | Docker / Docker Compose       |
| Orchestration | Kubernetes (k8s/)            |

## Data Flow

```
Sensors (simulated or real)
    │
    ▼
SensorManager (reads every 2.5s)
    │
    ├──► In-memory state (latest readings)
    │
    ▼
WebSocket Manager ──stream──► Frontend Dashboard
    │
    ├──► REST API ──► Database CRUD
    │
    └──► Ollama Service ──► AI Architect Chat
```

## Network Topology

```
┌─────────────┐     PiNet (LTSP)     ┌─────────────┐
│  Sentry     │◄────────────────────►│             │
│  (diskless) │                      │   Master    │
└─────────────┘                      │  (NVMe SSR) │
                                     │             │
┌─────────────┐                      │  PiNet SSR  │
│  Telemetry  │◄────────────────────►│  FastAPI ☐  │
│  (diskless) │                      │  Ollama ☐   │
└─────────────┘                      └──────┬──────┘
                                            │
                                      [Switch]
                                            │
                                      [User Laptop]
                                      http://agripulse.local:8000
```
